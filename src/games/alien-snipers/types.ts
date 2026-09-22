import type { SniperTarget } from './state';

export type SniperPhase = 'briefing' | 'target' | 'report' | 'debrief';

export type ShotResult = 'hit' | 'wrong' | 'slow';

export interface ShotRecord {
  target: SniperTarget;
  typed: string | null;
  result: ShotResult;
  reaction: number | null;
}

export interface SniperDebrief {
  hits: number;
  targets: number;
  difficulty: number;
  bestStreak: number;
  bestReaction: number | null;
  averageReaction: number | null;
  /** Accuracy split by how far the code number asked you to count. */
  byShift: Array<{ shift: number; attempts: number; hits: number }>;
  score: number;
  headline: string;
  summary: string;
}

export interface SniperState {
  phase: SniperPhase;
  elapsed: number;
  phaseElapsed: number;
  difficulty: number;
  round: number;
  hits: number;
  streak: number;
  bestStreak: number;
  target: SniperTarget;
  typed: string | null;
  lastResult: ShotResult | null;
  history: ShotRecord[];
  statusMessage: string;
  debrief: SniperDebrief | null;
  rng: () => number;
}
