import { centiseconds, statementSeconds } from '../../core/bbcTiming';

export const VALLEY_RULES = {
  /** Line 30: M=200 rows to survive. */
  rows: 200,
  /** Line 70 starts the left wall 10 spaces in; line 110 keeps it within 0-20. */
  startLeft: 10,
  minLeft: 0,
  maxLeft: 20,
  screenColumns: 40,
} as const;

/** Line 60: the typed width is halved and floored. */
export function halfWidth(width: number) {
  return Math.floor(width / 2);
}

/** Lines 100-110: drift of -1, 0 or +1, re-rolled until the left wall stays in bounds. */
export function rollDrift(left: number, rng: () => number = Math.random) {
  for (;;) {
    const drift = Math.floor(rng() * 3 - 1);
    const next = left + drift;
    if (next >= VALLEY_RULES.minLeft && next <= VALLEY_RULES.maxLeft) return drift;
  }
}

/**
 * The listing runs flat out, so a row takes as long as BBC BASIC needs to
 * execute it: about thirty statements, plus two for every space printed in
 * the GOSUB 1000 loops, then an INKEY$(1) that waits a centisecond if no key
 * is waiting. This puts a width-15 valley at roughly nine rows a second.
 */
const ROW_STATEMENTS = 30;

export function rowSeconds(spaces: number, keyWaiting: boolean) {
  return statementSeconds(ROW_STATEMENTS + 2 * spaces) + (keyWaiting ? 0 : centiseconds(1));
}

/** The BBC's default auto-repeat, as best established: half a second, then every 8 centiseconds. */
export const AUTO_REPEAT = {
  delay: centiseconds(50),
  period: centiseconds(8),
  bufferSize: 31,
} as const;

/** Lines 150-230: spaces, the left wall, spaces, the ship, spaces, the right wall. */
export function valleyRow(left: number, gapLeft: number, gapRight: number) {
  return `${' '.repeat(left)}I${' '.repeat(Math.max(0, gapLeft))}*${' '.repeat(Math.max(0, gapRight))}I`;
}

/**
 * How that row lands on a 40-column MODE 7 screen. A row longer than the
 * screen wraps onto the next line, and one exactly the width of the screen
 * leaves a blank line after it, because the cursor has already wrapped when
 * PRINT's newline arrives.
 */
export function screenLines(row: string) {
  const width = VALLEY_RULES.screenColumns;
  if (row.length < width) return [row];
  const lines: string[] = [];
  for (let start = 0; start < row.length; start += width) lines.push(row.slice(start, start + width));
  if (row.length % width === 0) lines.push('');
  return lines;
}

import type { ValleyDebrief, ValleyState } from './types';

export const FLIGHT = {
  lookahead: 6,
  minWidth: 6,
  maxWidth: 20,
  defaultWidth: 15,
  startRowsPerSecond: 9,
  endRowsPerSecond: 14,
  /** Steering outruns the fastest drift, so skill can always recover. */
  steerFactor: 1.3,
  steerResponse: 18,
  endedHold: 1.2,
  trailLength: 40,
} as const;

export function generateWalls(rng: () => number, rows: number) {
  const walls: number[] = [VALLEY_RULES.startLeft];
  for (let r = 1; r <= rows; r += 1) {
    const left = walls[r - 1] ?? VALLEY_RULES.startLeft;
    walls.push(left + rollDrift(left, rng));
  }
  return walls;
}

export function wallAt(state: ValleyState, distance: number) {
  const row = Math.max(0, Math.floor(distance));
  const t = distance - row;
  const a = state.walls[row] ?? VALLEY_RULES.startLeft;
  const b = state.walls[row + 1] ?? a;
  return a + (b - a) * t;
}

/**
 * The listing crashes you when either gap drops below one space, so the ship
 * may sit from two columns right of the left wall to two left of the right.
 * The drawn walls are at that boundary, so what you see is what kills you.
 */
export function safeBounds(state: ValleyState, distance: number) {
  const w = halfWidth(state.width);
  const left = wallAt(state, distance);
  return { min: left + 1.5, max: left + 2 * w + 0.5 };
}

export function rowsPerSecond(state: ValleyState) {
  const progress = Math.min(1, state.distance / VALLEY_RULES.rows);
  return FLIGHT.startRowsPerSecond + (FLIGHT.endRowsPerSecond - FLIGHT.startRowsPerSecond) * progress;
}

export function createValleyState(rng: () => number = Math.random): ValleyState {
  return {
    phase: 'briefing',
    elapsed: 0,
    phaseElapsed: 0,
    width: FLIGHT.defaultWidth,
    walls: generateWalls(rng, VALLEY_RULES.rows + FLIGHT.lookahead + 4),
    distance: 0,
    shipX: 0,
    lateral: 0,
    closestShave: Infinity,
    trail: [],
    statusMessage: 'Choose how wide a valley to fly.',
    debrief: null,
    rng,
  };
}

export function resetRun(state: ValleyState) {
  Object.assign(state, createValleyState(state.rng), { elapsed: state.elapsed, width: state.width });
}

export function adjustWidth(state: ValleyState, delta: number) {
  if (state.phase !== 'briefing') return;
  state.width = Math.min(FLIGHT.maxWidth, Math.max(FLIGHT.minWidth, state.width + delta));
}

export function beginFlight(state: ValleyState) {
  if (state.phase !== 'briefing') return;
  const w = halfWidth(state.width);
  state.distance = 0;
  state.shipX = VALLEY_RULES.startLeft + 1 + w;
  state.lateral = 0;
  state.closestShave = Infinity;
  state.trail = [];
  state.phase = 'flight';
  state.phaseElapsed = 0;
  state.statusMessage = 'Steel every nerve.';
}

export function stepFlight(state: ValleyState, dt: number, steer: -1 | 0 | 1) {
  if (state.phase !== 'flight') return;
  const speed = rowsPerSecond(state);
  const target = steer * speed * FLIGHT.steerFactor;
  state.lateral += (target - state.lateral) * Math.min(1, FLIGHT.steerResponse * dt);
  state.shipX += state.lateral * dt;
  state.distance += speed * dt;

  state.trail.push({ distance: state.distance, x: state.shipX });
  if (state.trail.length > FLIGHT.trailLength) state.trail.shift();

  const bounds = safeBounds(state, state.distance);
  const clearance = Math.min(state.shipX - bounds.min, bounds.max - state.shipX);
  state.closestShave = Math.min(state.closestShave, clearance);
  if (clearance < 0) {
    finish(state, false);
    return;
  }
  if (state.distance >= VALLEY_RULES.rows) finish(state, true);
}

function finish(state: ValleyState, escaped: boolean) {
  const w = halfWidth(state.width);
  const rows = Math.min(VALLEY_RULES.rows, Math.floor(state.distance));
  const multiplier = Math.max(1, 12 - w);
  const debrief: ValleyDebrief = {
    escaped,
    width: state.width,
    rows,
    closestShave: Math.max(0, state.closestShave),
    score: rows * multiplier + (escaped ? 300 * multiplier : 0),
    headline: escaped ? 'WELL DONE-YOU MADE IT THROUGH DEATH VALLEY' : 'YOU CRASHED INTO THE WALL AND DISINTEGRATED',
    summary: escaped
      ? state.width <= 8
        ? 'Through at width eight. The Dissectitrons will not follow you in there.'
        : 'Clear of the valley. Try it narrower.'
      : `Down after ${rows} of ${VALLEY_RULES.rows}.`,
  };
  state.debrief = debrief;
  state.phase = 'ended';
  state.phaseElapsed = 0;
  state.statusMessage = debrief.headline;
}

export function settle(state: ValleyState) {
  if (state.phase !== 'ended') return;
  state.phase = 'debrief';
  state.phaseElapsed = 0;
}
