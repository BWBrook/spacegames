export const MOONLANDER_RULES = {
  gravity: 5,
  maxBurn: 30,
  startHeight: 500,
  startVelocity: 50,
  startFuel: 120,
} as const;

export type LandingVerdict = 'good' | 'injuries' | 'crashed';

/** Thresholds from lines 230-250 of 05ML.bas, on the interpolated touchdown speed. */
export function verdictFor(touchdownVelocity: number): LandingVerdict {
  if (touchdownVelocity > 5) return 'crashed';
  if (touchdownVelocity > 1) return 'injuries';
  return 'good';
}

export const VERDICT_TEXT: Record<LandingVerdict, string> = {
  crashed: 'YOU CRASHED-ALL DEAD',
  injuries: 'OK-BUT SOME INJURIES',
  good: 'GOOD LANDING.',
};

/**
 * Line 220: V1 = V + (5-B)*H/V, a linear step back to the moment height hit
 * zero. The original would divide by zero if velocity were zero there, which
 * it cannot be on the path that reaches this line; we guard anyway.
 */
export function touchdownVelocity(velocity: number, burn: number, height: number) {
  if (velocity === 0) return 0;
  return velocity + (MOONLANDER_RULES.gravity - burn) * height / velocity;
}

export function clampBurn(input: number, fuel: number) {
  let burn = input;
  if (burn < 0) burn = 0;
  if (burn > MOONLANDER_RULES.maxBurn) burn = MOONLANDER_RULES.maxBurn;
  if (burn > fuel) burn = fuel;
  return burn;
}

export interface FlightSnapshot {
  time: number;
  height: number;
  velocity: number;
  fuel: number;
}

export type TurnResult =
  | { landed: false; next: FlightSnapshot; burn: number }
  | { landed: true; burn: number; touchdown: number; verdict: LandingVerdict };

/** One pass of lines 120-210, including the exact-arrival branch at line 170. */
export function applyTurn(current: FlightSnapshot, burnInput: number): TurnResult {
  const burn = clampBurn(burnInput, current.fuel);
  const newVelocity = current.velocity - burn + MOONLANDER_RULES.gravity;
  const fuel = current.fuel - burn;
  const fall = (newVelocity + current.velocity) / 2;

  if (fall === current.height) {
    const touchdown = touchdownVelocity(current.velocity, burn, current.height);
    return { landed: true, burn, touchdown, verdict: verdictFor(touchdown) };
  }

  const height = current.height - fall;
  if (height < 0) {
    const touchdown = touchdownVelocity(newVelocity, burn, height);
    return { landed: true, burn, touchdown, verdict: verdictFor(touchdown) };
  }

  return {
    landed: false,
    burn,
    next: { time: current.time + 1, height, velocity: newVelocity, fuel },
  };
}

export function startSnapshot(): FlightSnapshot {
  return {
    time: 0,
    height: MOONLANDER_RULES.startHeight,
    velocity: MOONLANDER_RULES.startVelocity,
    fuel: MOONLANDER_RULES.startFuel,
  };
}



import type { MoonlanderDebrief, MoonlanderState } from './types';

export const FLIGHT_CONSTANTS = {
  /** One turn of the listing reads as one second here. */
  throttleRate: 45,
  touchdownHold: 1.1,
  projectionHorizon: 60,
  projectionStep: 0.05,
} as const;

export function createMoonlanderState(): MoonlanderState {
  return {
    phase: 'descent',
    elapsed: 0,
    phaseElapsed: 0,
    height: MOONLANDER_RULES.startHeight,
    velocity: MOONLANDER_RULES.startVelocity,
    fuel: MOONLANDER_RULES.startFuel,
    throttle: 0,
    burn: 0,
    peakHeight: MOONLANDER_RULES.startHeight,
    statusMessage: 'Descent burn is yours to spend. A throttle of 5 holds your speed.',
    debrief: null,
  };
}

export function resetFlight(state: MoonlanderState) {
  Object.assign(state, createMoonlanderState(), { elapsed: state.elapsed });
}

export function adjustThrottle(state: MoonlanderState, delta: number) {
  state.throttle = Math.min(MOONLANDER_RULES.maxBurn, Math.max(0, state.throttle + delta));
}

export function stepFlight(state: MoonlanderState, dt: number) {
  if (state.phase !== 'descent') return;
  const burn = state.fuel > 0 ? Math.min(state.throttle, state.fuel / dt) : 0;
  state.burn = burn;
  state.fuel = Math.max(0, state.fuel - burn * dt);

  const acceleration = MOONLANDER_RULES.gravity - burn;
  const startHeight = state.height;
  const startVelocity = state.velocity;
  state.velocity = startVelocity + acceleration * dt;
  state.height = startHeight - (startVelocity + state.velocity) / 2 * dt;
  state.peakHeight = Math.max(state.peakHeight, state.height);

  if (state.height > 0) {
    state.statusMessage = state.fuel > 0
      ? describe(state)
      : 'Tanks dry. Nothing left but the fall.';
    return;
  }

  // Exact for constant acceleration over the part of the step actually flown.
  const touchdown = Math.sqrt(Math.max(0, startVelocity * startVelocity + 2 * acceleration * startHeight));
  finishFlight(state, touchdown);
}

function describe(state: MoonlanderState) {
  const projected = projectTouchdown(state);
  if (projected === null) return 'Climbing. That fuel is not coming back.';
  const verdict = verdictFor(projected);
  if (verdict === 'good') return 'On this throttle you set down gently.';
  if (verdict === 'injuries') return 'Hard on this throttle. Some of them get hurt.';
  return 'Far too fast on this throttle.';
}

/**
 * Impact speed if the current throttle is held until the tanks run dry, then
 * free fall. Simulated forward rather than solved, so fuel exhaustion, hovering
 * and climbing all fall out of the same loop. Null means no touchdown in range.
 */
export function projectTouchdown(state: MoonlanderState): number | null {
  const { projectionStep: dt, projectionHorizon } = FLIGHT_CONSTANTS;
  let height = state.height;
  let velocity = state.velocity;
  let fuel = state.fuel;
  for (let t = 0; t < projectionHorizon; t += dt) {
    const burn = fuel > 0 ? Math.min(state.throttle, fuel / dt) : 0;
    fuel = Math.max(0, fuel - burn * dt);
    const acceleration = MOONLANDER_RULES.gravity - burn;
    const startHeight = height;
    const startVelocity = velocity;
    velocity = startVelocity + acceleration * dt;
    height = startHeight - (startVelocity + velocity) / 2 * dt;
    if (height <= 0) {
      return Math.sqrt(Math.max(0, startVelocity * startVelocity + 2 * acceleration * startHeight));
    }
  }
  return null;
}

function finishFlight(state: MoonlanderState, touchdown: number) {
  const verdict = verdictFor(touchdown);
  const base = verdict === 'good' ? 1200 : verdict === 'injuries' ? 450 : 0;
  const fuelBonus = verdict === 'crashed' ? 0 : Math.round(state.fuel * 8);
  const precision = verdict === 'good' ? Math.round((1 - Math.min(1, touchdown)) * 400) : 0;
  const summary: Record<typeof verdict, string> = {
    good: 'The legs take it without a complaint. The team is down safe.',
    injuries: 'The module holds, but that landing was felt in every seat.',
    crashed: 'The module comes apart on impact. Nobody walks away.',
  };
  state.debrief = {
    verdict,
    headline: VERDICT_TEXT[verdict],
    summary: summary[verdict],
    touchdownVelocity: touchdown,
    fuelLeft: state.fuel,
    elapsed: state.elapsed,
    score: base + fuelBonus + precision,
  };
  state.height = 0;
  state.velocity = touchdown;
  state.phase = 'touchdown';
  state.phaseElapsed = 0;
  state.statusMessage = VERDICT_TEXT[verdict];
}

export function settleTouchdown(state: MoonlanderState) {
  if (state.phase !== 'touchdown') return;
  state.phase = 'debrief';
  state.phaseElapsed = 0;
}
