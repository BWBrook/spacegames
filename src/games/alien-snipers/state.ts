export const SNIPER_RULES = {
  targets: 10,
  minDifficulty: 1,
  maxDifficulty: 10,
} as const;

export interface SniperTarget {
  /** The false radar reading the listing prints. */
  letter: string;
  /** The code number, 1 to the chosen difficulty. */
  shift: number;
  /** The true location, letter shifted forward by shift. */
  answer: string;
}

/**
 * Line 140: FOR I=1 TO 200+D*50 around INKEY$(1), which waits one centisecond
 * each pass. Harder settings are given more time, not less.
 */
export function windowSeconds(difficulty: number) {
  return (200 + difficulty * 50) / 100;
}

/**
 * Line 90 draws the letter from A to CHR$(90-D), so the shifted answer can
 * never run past Z and the listing needs no wraparound. The side effect is
 * that the late alphabet stops appearing as difficulty rises.
 */
export function rollTarget(difficulty: number, rng: () => number = Math.random): SniperTarget {
  const code = Math.floor(rng() * (26 - difficulty)) + 65;
  const shift = Math.floor(rng() * difficulty) + 1;
  return {
    letter: String.fromCharCode(code),
    shift,
    answer: String.fromCharCode(code + shift),
  };
}

export function highestLetter(difficulty: number) {
  return String.fromCharCode(90 - difficulty);
}

export function clampDifficulty(value: number) {
  return Math.min(SNIPER_RULES.maxDifficulty, Math.max(SNIPER_RULES.minDifficulty, Math.round(value)));
}

/** The BBC powered up with CAPS LOCK on, so INKEY$ delivered capitals. */
export function normaliseKey(key: string) {
  return key.length === 1 ? key.toUpperCase() : '';
}

export function isHit(target: SniperTarget, key: string) {
  return normaliseKey(key) === target.answer;
}

export function letterIndex(letter: string) {
  return letter.charCodeAt(0) - 65;
}

import type { ShotResult, SniperDebrief, SniperState } from './types';

export const SNIPER_TIMING = {
  report: 1.5,
} as const;

export function createSniperState(rng: () => number = Math.random): SniperState {
  return {
    phase: 'briefing',
    elapsed: 0,
    phaseElapsed: 0,
    difficulty: 3,
    round: 0,
    hits: 0,
    streak: 0,
    bestStreak: 0,
    target: { letter: 'A', shift: 1, answer: 'B' },
    typed: null,
    lastResult: null,
    history: [],
    statusMessage: 'Choose how far the code will ask you to count, then open fire.',
    debrief: null,
    rng,
  };
}

export function resetRun(state: SniperState) {
  Object.assign(state, createSniperState(state.rng), { elapsed: state.elapsed });
}

export function adjustDifficulty(state: SniperState, delta: number) {
  if (state.phase !== 'briefing') return;
  state.difficulty = clampDifficulty(state.difficulty + delta);
}

export function beginRun(state: SniperState) {
  if (state.phase !== 'briefing') return;
  state.round = 0;
  state.hits = 0;
  state.streak = 0;
  state.bestStreak = 0;
  state.history = [];
  nextTarget(state);
}

export function nextTarget(state: SniperState) {
  if (state.round >= SNIPER_RULES.targets) {
    finish(state);
    return;
  }
  state.round += 1;
  state.target = rollTarget(state.difficulty, state.rng);
  state.typed = null;
  state.lastResult = null;
  state.phase = 'target';
  state.phaseElapsed = 0;
  state.statusMessage = `Radar says ${state.target.letter}. Count ${state.target.shift} on.`;
}

export function fire(state: SniperState, key: string) {
  if (state.phase !== 'target') return;
  const typed = normaliseKey(key);
  if (!/^[A-Z]$/.test(typed)) return;
  record(state, typed, isHit(state.target, typed) ? 'hit' : 'wrong', state.phaseElapsed);
}

export function timeOut(state: SniperState) {
  record(state, null, 'slow', null);
}

function record(state: SniperState, typed: string | null, result: ShotResult, reaction: number | null) {
  state.typed = typed;
  state.lastResult = result;
  state.history.push({ target: state.target, typed, result, reaction });
  if (result === 'hit') {
    state.hits += 1;
    state.streak += 1;
    state.bestStreak = Math.max(state.bestStreak, state.streak);
    state.statusMessage = `Hit. ${state.target.letter} plus ${state.target.shift} is ${state.target.answer}.`;
  } else {
    state.streak = 0;
    state.statusMessage = result === 'slow'
      ? `Too slow. It was ${state.target.answer}.`
      : `Missed. You fired at ${typed}; it was ${state.target.answer}.`;
  }
  state.phase = 'report';
  state.phaseElapsed = 0;
}

export function continueAfterReport(state: SniperState) {
  if (state.phase !== 'report') return;
  nextTarget(state);
}

function finish(state: SniperState) {
  const reactions = state.history
    .map(record => record.reaction)
    .filter((value): value is number => value !== null);
  const shifts = new Map<number, { attempts: number; hits: number }>();
  for (const shot of state.history) {
    const entry = shifts.get(shot.target.shift) ?? { attempts: 0, hits: 0 };
    entry.attempts += 1;
    if (shot.result === 'hit') entry.hits += 1;
    shifts.set(shot.target.shift, entry);
  }
  const speedBonus = reactions.reduce((sum, reaction) => {
    const window = windowSeconds(state.difficulty);
    return sum + Math.round(Math.max(0, 1 - reaction / window) * 40);
  }, 0);
  const headline = `YOU HIT ${state.hits}/${SNIPER_RULES.targets}`;
  state.debrief = {
    hits: state.hits,
    targets: SNIPER_RULES.targets,
    difficulty: state.difficulty,
    bestStreak: state.bestStreak,
    bestReaction: reactions.length ? Math.min(...reactions) : null,
    averageReaction: reactions.length
      ? reactions.reduce((sum, value) => sum + value, 0) / reactions.length
      : null,
    byShift: [...shifts.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([shift, entry]) => ({ shift, ...entry })),
    score: state.hits * 100 * state.difficulty + speedBonus + state.bestStreak * 50,
    headline,
    summary: state.hits === SNIPER_RULES.targets
      ? 'Every sniper accounted for. The cruiser is clear.'
      : state.hits >= 7
        ? 'Enough of them down to break out of the forbidden zone.'
        : 'Too many still out there. The hyperspace motor will have to wait.',
  };
  state.phase = 'debrief';
  state.phaseElapsed = 0;
  state.statusMessage = headline;
}
