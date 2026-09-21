import type { LandingVerdict } from './state';

export type MoonlanderPhase = 'descent' | 'touchdown' | 'debrief';

export interface MoonlanderDebrief {
  verdict: LandingVerdict;
  headline: string;
  summary: string;
  touchdownVelocity: number;
  fuelLeft: number;
  elapsed: number;
  score: number;
}

export interface MoonlanderState {
  phase: MoonlanderPhase;
  elapsed: number;
  phaseElapsed: number;
  height: number;
  velocity: number;
  fuel: number;
  throttle: number;
  /** Throttle actually delivered last step, which is zero once the tanks are dry. */
  burn: number;
  peakHeight: number;
  statusMessage: string;
  debrief: MoonlanderDebrief | null;
}
