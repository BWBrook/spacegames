export type ValleyPhase = 'briefing' | 'flight' | 'ended' | 'debrief';

export interface TrailPoint {
  distance: number;
  x: number;
}

export interface ValleyDebrief {
  escaped: boolean;
  width: number;
  rows: number;
  closestShave: number;
  score: number;
  headline: string;
  summary: string;
}

export interface ValleyState {
  phase: ValleyPhase;
  elapsed: number;
  phaseElapsed: number;
  width: number;
  /** Left wall column for each row, from the listing's random walk. */
  walls: number[];
  distance: number;
  shipX: number;
  lateral: number;
  closestShave: number;
  trail: TrailPoint[];
  statusMessage: string;
  debrief: ValleyDebrief | null;
  rng: () => number;
}
