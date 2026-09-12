import type { GridPosition } from './state';

export type EvilAlienPhase = 'hunt' | 'drop' | 'debrief';

export type EvilAlienOutcome = 'destroyed' | 'out-of-bombs' | 'captured';

export interface ShotRecord {
  position: GridPosition;
  compass: string;
  range: string | null;
  hit: boolean;
}

/** Inclusive bounds still possible for Elron on each axis, derived from every shot so far. */
export interface AxisBounds {
  min: number;
  max: number;
}

export interface SearchBounds {
  x: AxisBounds;
  y: AxisBounds;
  d: AxisBounds;
}

export interface HuntDebrief {
  outcome: EvilAlienOutcome;
  bombsUsed: number;
  capture: number;
  score: number;
  headline: string;
  summary: string;
}

export interface EvilAlienState {
  phase: EvilAlienPhase;
  elapsed: number;
  phaseElapsed: number;
  target: GridPosition;
  cursor: GridPosition;
  bombsUsed: number;
  shots: ShotRecord[];
  bounds: SearchBounds;
  capture: number;
  statusMessage: string;
  debrief: HuntDebrief | null;
  rng: () => number;
}
