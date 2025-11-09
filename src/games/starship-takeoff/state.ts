import { STARSHIP_CONSTANTS } from './constants';
import { buildEventSchedule } from './events';
import { mulberry32, randomRange } from './rng';
import type { StarshipState, GamePhase, Telemetry } from './types';

export function createStarshipState(seed = Date.now()): StarshipState {
  const rng = mulberry32(seed >>> 0);
  const telemetry = rollTelemetry(rng);
  const optimalForce = telemetry.trueGravity * telemetry.trueWind;
  const events = buildEventSchedule(rng);

  return {
    config: STARSHIP_CONSTANTS,
    phase: 'prep',
    elapsed: 0,
    phaseElapsed: 0,
    rng,
    telemetry,
    controls: {
      baseThrust: 0.55,
      vectorBias: 0,
      fuelMix: 0,
    },
    commit: {
      cursor: 0.5,
      direction: 1,
      score: 0.5,
      resolved: false,
    },
    ascent: {
      altitude: 0,
      velocity: 0,
      heat: 12,
      integrity: 100,
      thrust: 0.55,
      lastThrust: 0.55,
      targetAltitude: STARSHIP_CONSTANTS.ascentTargetAltitude,
      events,
    },
    debrief: null,
    optimalForce,
    statusMessage: 'Balance boosters, vector, and fuel mix before ignition.',
    exhaust: [],
    debris: [],
  };
}

export function transitionPhase(state: StarshipState, next: GamePhase) {
  state.phase = next;
  state.phaseElapsed = 0;
}

export function rollTelemetry(rng: () => number): Telemetry {
  const [gMin, gMax] = STARSHIP_CONSTANTS.gravityRange;
  const [wMin, wMax] = STARSHIP_CONSTANTS.windRange;
  const trueGravity = randomRange(rng, gMin, gMax);
  const trueWind = randomRange(rng, wMin, wMax);
  return {
    trueGravity,
    trueWind,
    displayGravity: trueGravity + randomRange(rng, -STARSHIP_CONSTANTS.telemetryNoise, STARSHIP_CONSTANTS.telemetryNoise),
    displayWind: trueWind + randomRange(rng, -STARSHIP_CONSTANTS.telemetryNoise, STARSHIP_CONSTANTS.telemetryNoise),
    noise: STARSHIP_CONSTANTS.telemetryNoise,
  };
}

export function refreshTelemetry(state: StarshipState, dt: number) {
  const drift = state.config.telemetryDrift * dt;
  const gDelta = state.telemetry.trueGravity - state.telemetry.displayGravity;
  const wDelta = state.telemetry.trueWind - state.telemetry.displayWind;
  state.telemetry.displayGravity += gDelta * drift + randomRange(state.rng, -0.2, 0.2);
  state.telemetry.displayWind += wDelta * drift + randomRange(state.rng, -0.2, 0.2);
}

export function computeBaseThrust(state: StarshipState) {
  const [min, max] = state.config.baseThrustRange;
  return min + state.controls.baseThrust * (max - min);
}

export function computeOptimality(state: StarshipState, actual: number) {
  const diff = Math.abs(actual - state.optimalForce);
  const tolerance = state.optimalForce || 1;
  const accuracy = Math.max(0, 1 - diff / (tolerance * 1.25));
  return accuracy;
}

export function resetForRetry(state: StarshipState) {
  const telemetry = rollTelemetry(state.rng);
  state.telemetry = telemetry;
  state.optimalForce = telemetry.trueGravity * telemetry.trueWind;
  state.controls.baseThrust = 0.55;
  state.controls.vectorBias = 0;
  state.controls.fuelMix = 0;
  state.commit.cursor = 0.5;
  state.commit.direction = 1;
  state.commit.score = 0.5;
  state.commit.resolved = false;
  state.ascent.altitude = 0;
  state.ascent.velocity = 0;
  state.ascent.heat = 12;
  state.ascent.integrity = 100;
  state.ascent.thrust = 0.55;
  state.ascent.lastThrust = 0.55;
  state.ascent.events = buildEventSchedule(state.rng);
  state.debrief = null;
  state.statusMessage = 'Balance boosters, vector, and fuel mix before ignition.';
  transitionPhase(state, 'prep');
}
