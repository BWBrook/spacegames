import type { Asteroid, Verdict } from './state';

export type BeltPhase = 'approach' | 'impact' | 'debrief';

export interface Rock {
  dx: number;
  dy: number;
  radius: number;
  spin: number;
}

export interface BeltAsteroid extends Asteroid {
  /** Screen position across the field, 0 to 1. */
  lane: number;
  rocks: Rock[];
}

export interface BeltShot {
  stars: number;
  strength: number | null;
  verdict: Verdict;
  reaction: number | null;
}

export interface BeltDebrief {
  hits: number;
  asteroids: number;
  undercounts: number;
  overcounts: number;
  crashes: number;
  bestStreak: number;
  averageReaction: number | null;
  byStars: Array<{ stars: number; attempts: number; hits: number }>;
  score: number;
  headline: string;
  summary: string;
}

export interface BeltState {
  phase: BeltPhase;
  elapsed: number;
  phaseElapsed: number;
  round: number;
  hits: number;
  streak: number;
  bestStreak: number;
  hullHits: number;
  asteroid: BeltAsteroid;
  strength: number | null;
  verdict: Verdict | null;
  history: BeltShot[];
  statusMessage: string;
  debrief: BeltDebrief | null;
  rng: () => number;
}
