export type IntergalacticPhase = 'aim' | 'flight' | 'debrief';

export type IntergalacticOutcome = 'success' | 'miss' | 'fired';

export interface LaunchDebrief {
  outcome: IntergalacticOutcome;
  attempt: number;
  angleError: number;
  speedError: number;
  signalLock: number;
  bonus: number;
  score: number;
  feedback: string[];
  summary: string;
}

export interface IntergalacticState {
  phase: IntergalacticPhase;
  elapsed: number;
  phaseElapsed: number;
  targetHeight: number;
  idealAngle: number;
  idealSpeed: number;
  telemetryAngle: number;
  telemetrySpeed: number;
  angle: number;
  speed: number;
  launchAngle: number;
  launchSpeed: number;
  attempt: number;
  maxAttempts: number;
  signalCursor: number;
  signalDirection: 1 | -1;
  signalLock: number;
  rivalCoverage: number;
  statusMessage: string;
  feedback: string[];
  debrief: LaunchDebrief | null;
  rng: () => number;
}
