import type { Band, Hazard, Mission } from './state';

export type RescuePhase = 'allocate' | 'voyage' | 'landing' | 'descent' | 'report' | 'debrief';

export type Failure = 'blown-up' | 'dead' | 'engines' | 'late' | 'crater' | 'star' | 'door';

export interface Allocation {
  engines: number;
  life: number;
  shields: number;
}

export interface VoyageEvent {
  check: number;
  hazard: Hazard | null;
  amount: number;
}

export interface Voyage {
  rng: () => number;
  checks: number;
  checked: number;
  timer: number;
  velocity: number;
  distance: number;
  shields: number;
  life: number;
  log: VoyageEvent[];
}

export interface Orbit {
  gravity: { value: number; band: Band };
  atmosphere: { value: number; band: Band };
  surplus: number;
}

export interface MissionResult {
  mission: Mission;
  rescued: boolean;
  failures: Failure[];
  eta: number | null;
  leftover: number | null;
  score: number;
}

export interface RescueDebrief {
  rescues: number;
  missions: number;
  score: number;
  rank: string;
  summary: string;
}

export interface Odds {
  shields: number;
  life: number;
  onTime: number;
  orbit: number;
}

export interface RescueState {
  phase: RescuePhase;
  elapsed: number;
  phaseElapsed: number;
  missions: Mission[];
  seeds: number[];
  index: number;
  alloc: Allocation;
  landing: { boosters: number; heat: number };
  field: number;
  typing: string | null;
  voyage: Voyage | null;
  orbit: Orbit | null;
  results: MissionResult[];
  debrief: RescueDebrief | null;
  statusMessage: string;
  rng: () => number;
}
