import { centiseconds, emptyLoopSeconds } from '../../core/bbcTiming';

export const BUG_EYES_RULES = {
  bugs: 10,
  positions: 4,
} as const;

/**
 * Line 50's lurk and line 190's hit flash are empty FOR loops, read at BBC
 * speed by the shared timing module. The window needs no interpretation:
 * INKEY$(1) waits one centisecond and is polled 150 times.
 */
export const RETRO_TIMING = {
  lurkIterationsMin: 200,
  lurkIterationsSpan: 300,
  windowSeconds: centiseconds(150),
  flashSeconds: emptyLoopSeconds(300),
} as const;

/** Row and column of each "OO" in the original, from the GOSUBs at lines 240-340. */
export const RETRO_POSITIONS = [
  { row: 5, column: 1 },
  { row: 1, column: 9 },
  { row: 5, column: 18 },
  { row: 10, column: 7 },
] as const;

export function retroLurkSeconds(rng: () => number = Math.random) {
  const iterations = Math.floor(rng() * RETRO_TIMING.lurkIterationsSpan) + RETRO_TIMING.lurkIterationsMin;
  return emptyLoopSeconds(iterations);
}

export function randomPosition(rng: () => number = Math.random) {
  return Math.floor(rng() * BUG_EYES_RULES.positions) + 1;
}

/** The original accepts the first keypress only, and any non-matching key misses. */
export function isBlast(position: number, key: string) {
  return Number.parseInt(key, 10) === position;
}

import type { BugEyesDebrief, BugEyesState, ShotResult } from './types';

export const HUNT_CONSTANTS = {
  /** Misses at one outcrop before that bug reaches you. */
  caughtAt: 3,
  lurkMin: 0.6,
  lurkSpan: 1.2,
  windowStart: 1.5,
  windowEnd: 0.9,
  resolveSeconds: 0.9,
} as const;

export function windowForBug(index: number) {
  const span = HUNT_CONSTANTS.windowStart - HUNT_CONSTANTS.windowEnd;
  const ramp = index / Math.max(1, BUG_EYES_RULES.bugs - 1);
  return HUNT_CONSTANTS.windowStart - span * Math.min(1, ramp);
}

export function createBugEyesState(rng: () => number = Math.random): BugEyesState {
  const state: BugEyesState = {
    phase: 'lurk',
    elapsed: 0,
    phaseElapsed: 0,
    bugIndex: 0,
    blasted: 0,
    stations: Array.from({ length: BUG_EYES_RULES.positions }, (_, i) => ({ key: i + 1, advance: 0 })),
    activeStation: null,
    lurkDuration: 0,
    windowDuration: HUNT_CONSTANTS.windowStart,
    jumpyKey: null,
    lastResult: null,
    history: [],
    statusMessage: 'Watch the outcrops. Blast the eyes with 1 to 4 the moment they show.',
    debrief: null,
    rng,
  };
  armBug(state);
  return state;
}

export function resetHunt(state: BugEyesState) {
  Object.assign(state, createBugEyesState(state.rng), { elapsed: state.elapsed });
}

function armBug(state: BugEyesState) {
  state.phase = 'lurk';
  state.phaseElapsed = 0;
  state.activeStation = randomPosition(state.rng) - 1;
  state.lurkDuration = HUNT_CONSTANTS.lurkMin + state.rng() * HUNT_CONSTANTS.lurkSpan;
  state.windowDuration = windowForBug(state.bugIndex);
  state.jumpyKey = null;
}

export function exposeBug(state: BugEyesState) {
  state.phase = 'exposed';
  state.phaseElapsed = 0;
  state.statusMessage = 'Eyes up. Which rock?';
  if (state.jumpyKey !== null) applyResult(state, 'jumpy', null);
}

/** A key struck while the bug is still hidden, mirroring the original's buffer quirk. */
export function registerJumpyPress(state: BugEyesState, key: number) {
  state.jumpyKey ??= key;
}

export function pressKey(state: BugEyesState, key: number) {
  if (state.phase === 'lurk') return registerJumpyPress(state, key);
  if (state.phase !== 'exposed' || state.activeStation === null) return;
  const correct = key === state.stations[state.activeStation]?.key;
  applyResult(state, correct ? 'hit' : 'wrong', state.phaseElapsed);
}

export function timeOut(state: BugEyesState) {
  applyResult(state, 'slow', null);
}

function applyResult(state: BugEyesState, result: ShotResult, reaction: number | null) {
  const stationIndex = state.activeStation ?? 0;
  const station = state.stations[stationIndex];
  state.lastResult = result;
  state.history.push({ station: stationIndex, result, reaction });
  state.phase = 'resolve';
  state.phaseElapsed = 0;

  if (result === 'hit') {
    state.blasted += 1;
    if (station && station.advance > 0) station.advance -= 1;
    state.statusMessage = `Blasted in ${((reaction ?? 0) * 1000).toFixed(0)} ms. It slithers back.`;
    return;
  }
  if (station) station.advance += 1;
  state.statusMessage = result === 'wrong'
    ? 'Wrong rock. That one edges closer.'
    : result === 'jumpy'
      ? 'You fired at a shadow. The bug takes the ground you gave it.'
      : 'Too slow. It slips forward while you hesitate.';
  if (station && station.advance >= HUNT_CONSTANTS.caughtAt) finish(state, 'caught');
}

export function continueAfterResolve(state: BugEyesState) {
  if (state.phase !== 'resolve') return;
  state.bugIndex += 1;
  if (state.bugIndex >= BUG_EYES_RULES.bugs) {
    finish(state, 'escaped');
    return;
  }
  armBug(state);
}

function finish(state: BugEyesState, outcome: BugEyesDebrief['outcome']) {
  const reactions = state.history
    .map(record => record.reaction)
    .filter((value): value is number => value !== null);
  const best = reactions.length ? Math.min(...reactions) : null;
  const average = reactions.length
    ? reactions.reduce((sum, value) => sum + value, 0) / reactions.length
    : null;
  const speedBonus = state.history.reduce((sum, record) => {
    if (record.result !== 'hit' || record.reaction === null) return sum;
    return sum + Math.round(Math.max(0, 1 - record.reaction / HUNT_CONSTANTS.windowStart) * 120);
  }, 0);
  const escapeBonus = outcome === 'escaped' ? 500 : 0;
  state.debrief = {
    outcome,
    blasted: state.blasted,
    bugsFaced: state.history.length,
    bestReaction: best,
    averageReaction: average,
    score: state.blasted * 100 + speedBonus + escapeBonus,
    headline: outcome === 'escaped'
      ? `YOU BLASTED ${state.blasted}/${BUG_EYES_RULES.bugs} BUGS`
      : 'THE BUGS HAVE YOU',
    summary: outcome === 'escaped'
      ? state.blasted === BUG_EYES_RULES.bugs
        ? 'Not one of them got near you. The way out is clear.'
        : 'You hold the ground, web-free, with the survivors still circling.'
      : 'One of them reached you. The sticky extrusions do the rest.',
  };
  state.phase = 'debrief';
  state.phaseElapsed = 0;
  state.statusMessage = state.debrief.headline;
}
