export type TripPhase = 'plan' | 'voyage' | 'arrival' | 'debrief';

export type TripVerdict = 'on-time' | 'not-close' | 'died';

export interface Mission {
  target: number;
  /** Top speed this mission's engines can reach, as a fraction of light speed. */
  engineCap: number;
}

export interface MissionResult {
  mission: Mission;
  speed: number;
  distance: number;
  earthYears: number;
  shipYears: number;
  verdict: TripVerdict;
  score: number;
}

export interface TripDebrief {
  onTime: number;
  died: number;
  missions: number;
  score: number;
  headline: string;
  summary: string;
}

export interface TripState {
  phase: TripPhase;
  elapsed: number;
  phaseElapsed: number;
  missions: Mission[];
  index: number;
  speed: number;
  distance: number;
  results: MissionResult[];
  statusMessage: string;
  debrief: TripDebrief | null;
  rng: () => number;
}
