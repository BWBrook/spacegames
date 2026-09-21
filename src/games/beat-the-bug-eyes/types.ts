export type BugEyesPhase = 'lurk' | 'exposed' | 'resolve' | 'debrief';

export type BugEyesOutcome = 'escaped' | 'caught';

export type ShotResult = 'hit' | 'slow' | 'wrong' | 'jumpy';

export interface BugStation {
  /** Keyboard key 1-4, and the position id the original would have rolled. */
  key: number;
  /** 0 to CAUGHT_AT: how far this bug has crept toward the player. */
  advance: number;
}

export interface BugRecord {
  station: number;
  result: ShotResult;
  reaction: number | null;
}

export interface BugEyesDebrief {
  outcome: BugEyesOutcome;
  blasted: number;
  bugsFaced: number;
  bestReaction: number | null;
  averageReaction: number | null;
  score: number;
  headline: string;
  summary: string;
}

export interface BugEyesState {
  phase: BugEyesPhase;
  elapsed: number;
  phaseElapsed: number;
  bugIndex: number;
  blasted: number;
  stations: BugStation[];
  activeStation: number | null;
  lurkDuration: number;
  windowDuration: number;
  /** A key pressed before the eyes showed; the original's keyboard buffer quirk. */
  jumpyKey: number | null;
  lastResult: ShotResult | null;
  history: BugRecord[];
  statusMessage: string;
  debrief: BugEyesDebrief | null;
  rng: () => number;
}
