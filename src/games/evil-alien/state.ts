export const EVIL_ALIEN_RULES = {
  gridSize: 10,
  bombs: 4,
} as const;

export interface GridPosition {
  x: number;
  y: number;
  d: number;
}

export function randomPosition(rng: () => number = Math.random): GridPosition {
  const roll = () => Math.floor(rng() * EVIL_ALIEN_RULES.gridSize);
  return { x: roll(), y: roll(), d: roll() };
}

export function isHit(target: GridPosition, shot: GridPosition) {
  return target.x === shot.x && target.y === shot.y && target.d === shot.d;
}

/** Compass word exactly as 03EA.bas prints it: NORTH/SOUTH first, then EAST/WEST, no separator. */
export function compassWord(target: GridPosition, shot: GridPosition) {
  let word = '';
  if (shot.y > target.y) word += 'NORTH';
  if (shot.y < target.y) word += 'SOUTH';
  if (shot.x > target.x) word += 'EAST';
  if (shot.x < target.x) word += 'WEST';
  return word;
}

export function rangeWord(target: GridPosition, shot: GridPosition) {
  if (shot.d > target.d) return 'TOO FAR';
  if (shot.d < target.d) return 'NOT FAR ENOUGH';
  return null;
}

import type { EvilAlienState, HuntDebrief, SearchBounds, ShotRecord } from './types';

export const HUNT_CONSTANTS = {
  dropDuration: 1.4,
  /** Seconds for the capture gauge to fill with no bombs dropped. Each drop speeds it up. */
  baseCaptureSeconds: 90,
  captureRampPerBomb: 0.45,
} as const;

const FULL_AXIS = () => ({ min: 0, max: EVIL_ALIEN_RULES.gridSize - 1 });

export function freshBounds(): SearchBounds {
  return { x: FULL_AXIS(), y: FULL_AXIS(), d: FULL_AXIS() };
}

export function createEvilAlienState(rng: () => number = Math.random): EvilAlienState {
  return {
    phase: 'hunt',
    elapsed: 0,
    phaseElapsed: 0,
    target: randomPosition(rng),
    cursor: { x: 4, y: 4, d: 4 },
    bombsUsed: 0,
    shots: [],
    bounds: freshBounds(),
    capture: 0,
    statusMessage: 'Elron is cloaked somewhere in this sector. Pick a cell and depth, then drop a bomb.',
    debrief: null,
    rng,
  };
}

export function resetHunt(state: EvilAlienState) {
  Object.assign(state, createEvilAlienState(state.rng), { elapsed: state.elapsed });
}

export function moveCursor(state: EvilAlienState, dx: number, dy: number, dd: number) {
  const max = EVIL_ALIEN_RULES.gridSize - 1;
  const clamp = (v: number) => Math.min(max, Math.max(0, v));
  state.cursor = { x: clamp(state.cursor.x + dx), y: clamp(state.cursor.y + dy), d: clamp(state.cursor.d + dd) };
}

export function beginDrop(state: EvilAlienState) {
  if (state.phase !== 'hunt') return;
  state.phase = 'drop';
  state.phaseElapsed = 0;
  state.statusMessage = `Bomb ${state.bombsUsed + 1} away. Descending to distance ${state.cursor.d}.`;
}

export function captureRate(state: EvilAlienState) {
  return (1 + state.bombsUsed * HUNT_CONSTANTS.captureRampPerBomb) / HUNT_CONSTANTS.baseCaptureSeconds;
}

export function advanceCapture(state: EvilAlienState, dt: number) {
  state.capture = Math.min(1, state.capture + captureRate(state) * dt);
  if (state.capture >= 1) finishHunt(state, 'captured');
}

/** Called when the drop animation completes. Applies the BASIC feedback and updates the search bounds. */
export function detonate(state: EvilAlienState) {
  const shot: ShotRecord = {
    position: { ...state.cursor },
    compass: compassWord(state.target, state.cursor),
    range: rangeWord(state.target, state.cursor),
    hit: isHit(state.target, state.cursor),
  };
  state.shots.push(shot);
  state.bombsUsed += 1;
  narrowBounds(state.bounds, shot);

  if (shot.hit) {
    finishHunt(state, 'destroyed');
    return shot;
  }
  if (state.bombsUsed >= EVIL_ALIEN_RULES.bombs) {
    finishHunt(state, 'out-of-bombs');
    return shot;
  }
  state.phase = 'hunt';
  state.phaseElapsed = 0;
  state.statusMessage = `Shot was ${shot.compass || 'on the cell'}${shot.range ? `, ${shot.range.toLowerCase()}` : ''}. Scanner updated.`;
  return shot;
}

function narrowBounds(bounds: SearchBounds, shot: ShotRecord) {
  const { x, y, d } = shot.position;
  if (shot.compass.includes('NORTH')) bounds.y.max = Math.min(bounds.y.max, y - 1);
  else if (shot.compass.includes('SOUTH')) bounds.y.min = Math.max(bounds.y.min, y + 1);
  else bounds.y = { min: y, max: y };
  if (shot.compass.includes('EAST')) bounds.x.max = Math.min(bounds.x.max, x - 1);
  else if (shot.compass.includes('WEST')) bounds.x.min = Math.max(bounds.x.min, x + 1);
  else bounds.x = { min: x, max: x };
  if (shot.range === 'TOO FAR') bounds.d.max = Math.min(bounds.d.max, d - 1);
  else if (shot.range === 'NOT FAR ENOUGH') bounds.d.min = Math.max(bounds.d.min, d + 1);
  else bounds.d = { min: d, max: d };
}

function finishHunt(state: EvilAlienState, outcome: HuntDebrief['outcome']) {
  const bombsLeft = EVIL_ALIEN_RULES.bombs - state.bombsUsed;
  const score = outcome === 'destroyed'
    ? 1000 + bombsLeft * 500 + Math.round((1 - state.capture) * 1000)
    : 0;
  const copy: Record<HuntDebrief['outcome'], [string, string]> = {
    destroyed: ['*BOOM* YOU GOT HIM!', bombsLeft > 0
      ? `Elron destroyed with ${bombsLeft} bomb${bombsLeft === 1 ? '' : 's'} to spare.`
      : 'Elron destroyed with the last bomb in the rack.'],
    'out-of-bombs': ['YOUR TIME HAS RUN OUT!!', 'Four craters in empty space. Elron slips away laughing.'],
    captured: ['ELRON HAS YOU', 'You lingered too long. His boarding party is already aboard.'],
  };
  const [headline, summary] = copy[outcome];
  state.debrief = { outcome, bombsUsed: state.bombsUsed, capture: state.capture, score, headline, summary };
  state.phase = 'debrief';
  state.phaseElapsed = 0;
  state.statusMessage = headline;
}
