import { centiseconds, emptyLoopSeconds } from '../../core/bbcTiming';

export const ASTEROID_RULES = {
  asteroids: 10,
  maxStars: 9,
  perRow: 3,
} as const;

/** Line 190 waits INKEY(120), line 290 pauses FOR I=1 TO 1500 and then line 305 flushes the keyboard. */
export const RETRO_TIMING = {
  windowSeconds: centiseconds(120),
  pauseSeconds: emptyLoopSeconds(1500),
} as const;

export interface Asteroid {
  /** TAB column, 1-18. */
  column: number;
  /** Blank lines above the asteroid, 1-12. */
  row: number;
  stars: number;
}

/** Lines 50-70, in the order the listing draws them. */
export function rollAsteroid(rng: () => number = Math.random): Asteroid {
  const column = Math.floor(rng() * 18) + 1;
  const row = Math.floor(rng() * 12) + 1;
  const stars = Math.floor(rng() * 9) + 1;
  return { column, row, stars };
}

/** Lines 110-160 start a new row on the 1st, 4th and 7th star, so rows of three. */
export function starRows(stars: number) {
  const rows: number[] = [];
  for (let left = stars; left > 0; left -= ASTEROID_RULES.perRow) {
    rows.push(Math.min(ASTEROID_RULES.perRow, left));
  }
  return rows;
}

export type Verdict = 'destroyed' | 'weak' | 'strong' | 'crashed';

export const VERDICT_TEXT: Record<Verdict, string> = {
  destroyed: 'YOU DESTROYED IT',
  weak: 'NOT STRONG ENOUGH',
  strong: 'TOO STRONG',
  crashed: 'CRASHED INTO ASTEROID',
};

/**
 * What INKEY would have returned for a browser key, before line 190 subtracts
 * 48. Null means the BBC would not have delivered this key to INKEY at all.
 * Letters arrive in capitals because the BBC powered up with CAPS LOCK on.
 */
export function inkeyCode(key: string): number | null {
  if (key === 'Enter') return 13;
  if (key.length !== 1) return null;
  return key.toUpperCase().charCodeAt(0);
}

/** INKEY(n) returns -1 when no key arrives in time. */
export const INKEY_TIMEOUT = -1;

/**
 * Lines 200-280 exactly as written. Only Q=0 reaches the crash message, so it
 * is the 0 key that crashes you, while a timeout, which returns -1-48 = -49,
 * falls through to NOT STRONG ENOUGH. Line 200 reads as if written for a key
 * read that returned 0 when nothing was pressed, as VAL(INKEY$) does; the BBC
 * conversion's INKEY(120)-48 returns -49 instead, which broke it.
 */
export function judgeListing(code: number, stars: number): Verdict {
  const q = code - 48;
  if (q === 0) return 'crashed';
  if (q === stars) return 'destroyed';
  return q < stars ? 'weak' : 'strong';
}

/** The evident intent, used by the reimagined lane: too slow means you hit it. */
export function judgeShot(strength: number | null, stars: number): Verdict {
  if (strength === null) return 'crashed';
  if (strength === stars) return 'destroyed';
  return strength < stars ? 'weak' : 'strong';
}

import type { BeltAsteroid, BeltDebrief, BeltState, Rock } from './types';

export const BELT_TIMING = {
  /** The original's INKEY(120), kept exactly. */
  window: RETRO_TIMING.windowSeconds,
  impact: 1.1,
} as const;

/**
 * Keeps the listing's rows of three, the grouping that makes nine countable in
 * 1.2 seconds, with enough jitter that it reads as rubble rather than a grid.
 */
function buildRocks(stars: number, rng: () => number): Rock[] {
  const rocks: Rock[] = [];
  starRows(stars).forEach((count, rowIndex) => {
    for (let col = 0; col < count; col += 1) {
      rocks.push({
        dx: (col - 1) * 30 + (rng() - 0.5) * 8,
        dy: (rowIndex - 1) * 30 + (rng() - 0.5) * 8,
        radius: 10 + rng() * 4,
        spin: rng() * Math.PI * 2,
      });
    }
  });
  return rocks;
}

function rollBeltAsteroid(rng: () => number): BeltAsteroid {
  const base = rollAsteroid(rng);
  return {
    ...base,
    lane: 0.22 + ((base.column - 1) / 17) * 0.56,
    rocks: buildRocks(base.stars, rng),
  };
}

export function createBeltState(rng: () => number = Math.random): BeltState {
  const state: BeltState = {
    phase: 'approach',
    elapsed: 0,
    phaseElapsed: 0,
    round: 1,
    hits: 0,
    streak: 0,
    bestStreak: 0,
    hullHits: 0,
    asteroid: rollBeltAsteroid(rng),
    strength: null,
    verdict: null,
    history: [],
    statusMessage: 'Count the rocks. Fire with the same number.',
    debrief: null,
    rng,
  };
  return state;
}

export function resetRun(state: BeltState) {
  Object.assign(state, createBeltState(state.rng), { elapsed: state.elapsed });
}

export function fire(state: BeltState, strength: number | null) {
  if (state.phase !== 'approach') return;
  const verdict = judgeShot(strength, state.asteroid.stars);
  const reaction = strength === null ? null : state.phaseElapsed;
  state.strength = strength;
  state.verdict = verdict;
  state.history.push({ stars: state.asteroid.stars, strength, verdict, reaction });

  if (verdict === 'destroyed') {
    state.hits += 1;
    state.streak += 1;
    state.bestStreak = Math.max(state.bestStreak, state.streak);
    state.statusMessage = `Destroyed. ${state.asteroid.stars} rocks, ${strength} to break them.`;
  } else {
    state.streak = 0;
    state.hullHits += 1;
    const count = state.asteroid.stars;
    state.statusMessage = verdict === 'weak'
      ? `Not strong enough. There were ${count}.`
      : verdict === 'strong'
        ? `Too strong. It shattered, and the pieces still hit. There were ${count}.`
        : `Crashed into it. There were ${count}.`;
  }
  state.phase = 'impact';
  state.phaseElapsed = 0;
}

export function nextAsteroid(state: BeltState) {
  if (state.phase !== 'impact') return;
  if (state.round >= ASTEROID_RULES.asteroids) {
    finish(state);
    return;
  }
  state.round += 1;
  state.asteroid = rollBeltAsteroid(state.rng);
  state.strength = null;
  state.verdict = null;
  state.phase = 'approach';
  state.phaseElapsed = 0;
  state.statusMessage = 'Count the rocks. Fire with the same number.';
}

function finish(state: BeltState) {
  const reactions = state.history
    .map(shot => shot.reaction)
    .filter((value): value is number => value !== null);
  const counts = new Map<number, { attempts: number; hits: number }>();
  for (const shot of state.history) {
    const entry = counts.get(shot.stars) ?? { attempts: 0, hits: 0 };
    entry.attempts += 1;
    if (shot.verdict === 'destroyed') entry.hits += 1;
    counts.set(shot.stars, entry);
  }
  const speedBonus = state.history.reduce((sum, shot) => {
    if (shot.verdict !== 'destroyed' || shot.reaction === null) return sum;
    return sum + Math.round(Math.max(0, 1 - shot.reaction / BELT_TIMING.window) * 60);
  }, 0);
  const headline = `YOU HIT ${state.hits} OUT OF ${ASTEROID_RULES.asteroids}`;
  const debrief: BeltDebrief = {
    hits: state.hits,
    asteroids: ASTEROID_RULES.asteroids,
    undercounts: state.history.filter(shot => shot.verdict === 'weak').length,
    overcounts: state.history.filter(shot => shot.verdict === 'strong').length,
    crashes: state.history.filter(shot => shot.verdict === 'crashed').length,
    bestStreak: state.bestStreak,
    averageReaction: reactions.length ? reactions.reduce((a, b) => a + b, 0) / reactions.length : null,
    byStars: [...counts.entries()].sort((a, b) => a[0] - b[0]).map(([stars, e]) => ({ stars, ...e })),
    score: state.hits * 100 + speedBonus + state.bestStreak * 40,
    headline,
    summary: state.hits === ASTEROID_RULES.asteroids
      ? 'Clean through the belt without a scratch.'
      : state.hits >= 7
        ? 'Through the belt, with some new dents in the hull.'
        : 'Through the belt, but only just holding together.',
  };
  state.debrief = debrief;
  state.phase = 'debrief';
  state.phaseElapsed = 0;
  state.statusMessage = headline;
}
