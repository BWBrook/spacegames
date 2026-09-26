import type { Craft } from './state';

export type TestPhase = 'briefing' | 'flight' | 'landed' | 'debrief';

export type Grade = 'Feather-light' | 'Smooth' | 'Safe' | 'Crashed' | 'Lost in space';

export interface Landing {
  gravity: number;
  entry: number;
  grade: Grade;
  speed: number | null;
  fuel: number;
  score: number;
}

export interface TestDebrief {
  passed: boolean;
  safe: number;
  landings: number;
  score: number;
  verdict: string;
}

export interface TestState {
  phase: TestPhase;
  elapsed: number;
  phaseElapsed: number;
  attempt: number;
  craft: Craft;
  /** The speed this landing began at, kept for the log. */
  entry: number;
  previousHeight: number;
  tickTimer: number;
  ticks: number;
  remark: string;
  landings: Landing[];
  debrief: TestDebrief | null;
  rng: () => number;
}
