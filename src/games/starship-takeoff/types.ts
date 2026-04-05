import type { StarshipConfig } from './constants';

export type GamePhase = 'prep' | 'commit' | 'ascent' | 'debrief';

export interface Telemetry {
  trueGravity: number;
  trueWind: number;
  displayGravity: number;
  displayWind: number;
  noise: number;
}

export interface Controls {
  baseThrust: number; // 0..1
  vectorBias: number; // -1..1
  fuelMix: number; // -1..1
}

export interface CommitState {
  cursor: number; // 0..1
  direction: 1 | -1;
  score: number;
  resolved: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
  alpha: number;
}

export interface StarshipEvent {
  id: string;
  title: string;
  detail: string;
  duration: number;
  apply(state: StarshipState): void;
  onResolve?(state: StarshipState): void;
}

export interface EventInstance {
  id: string;
  title: string;
  detail: string;
  triggerTime: number;
  status: 'upcoming' | 'active' | 'resolved';
  event: StarshipEvent;
  startedAt?: number;
}

export interface AscentState {
  altitude: number;
  velocity: number;
  heat: number;
  peakHeat: number;
  integrity: number;
  thrust: number; // 0..1
  targetAltitude: number;
  lastThrust: number;
  burnIntegral: number;
  burnTime: number;
  events: EventInstance[];
}

export interface DebriefState {
  outcome: 'success' | 'failure';
  accuracy: number;
  summary: string;
  rewards: number;
}

export interface StarshipState {
  config: StarshipConfig;
  phase: GamePhase;
  elapsed: number;
  phaseElapsed: number;
  rng: () => number;
  telemetry: Telemetry;
  controls: Controls;
  commit: CommitState;
  ascent: AscentState;
  debrief: DebriefState | null;
  optimalForce: number;
  statusMessage: string;
  exhaust: Particle[];
  debris: Particle[];
}
