import type { IntergalacticState, LaunchDebrief } from './types';

export const INTERGALACTIC_CONSTANTS = {
  maxAttempts: 8,
  minAngle: 0,
  maxAngle: 90,
  minSpeed: 0,
  maxSpeed: 40_000,
  angleTolerance: 2,
  speedTolerance: 100,
  flightDuration: 4.4,
} as const;

export function createIntergalacticState(seed = Date.now()): IntergalacticState {
  const rng = mulberry32(seed >>> 0);
  return rollNewContract(rng);
}

export function targetAngle(height: number) {
  return Math.atan(height / 3) * 180 / Math.PI;
}

export function targetSpeed(height: number) {
  return 3000 * Math.sqrt(height + 1 / height);
}

export function beginLaunch(state: IntergalacticState) {
  state.phase = 'flight';
  state.phaseElapsed = 0;
  state.launchAngle = state.angle;
  state.launchSpeed = state.speed;
  state.signalCursor = randomRange(state.rng, 0.18, 0.82);
  state.signalDirection = state.rng() > 0.5 ? 1 : -1;
  state.signalLock = 0.44;
  state.statusMessage = 'Launch committed. Ride the signal gate for clean exclusive coverage.';
  state.debrief = null;
}

export function resolveLaunch(state: IntergalacticState) {
  const angleError = state.launchAngle - state.idealAngle;
  const speedError = state.launchSpeed - state.idealSpeed;
  const feedback = buildFeedback(angleError, speedError);
  const success = feedback.length === 0;
  const fired = !success && state.attempt >= state.maxAttempts;
  const outcome = success ? 'success' : fired ? 'fired' : 'miss';
  const bonus = success ? Math.floor(1000 / state.attempt) : 0;
  const angleScore = Math.max(0, 1 - Math.abs(angleError) / 12);
  const speedScore = Math.max(0, 1 - Math.abs(speedError) / 6000);
  const solutionScore = (angleScore + speedScore) / 2;
  const score = success
    ? Math.round(500 + bonus * 2 + state.signalLock * 500)
    : Math.round(solutionScore * 300 + state.signalLock * 120);

  state.phase = 'debrief';
  state.phaseElapsed = 0;
  state.feedback = feedback;
  state.debrief = {
    outcome,
    attempt: state.attempt,
    angleError,
    speedError,
    signalLock: state.signalLock,
    bonus,
    score,
    feedback,
    summary: buildSummary(outcome, state),
  };
  state.rivalCoverage = clamp01(state.rivalCoverage + (success ? 0.08 : 0.13));
  state.statusMessage = success
    ? 'NCTV wins the broadcast rights. The satellite is on station.'
    : fired
      ? 'The board has seen enough. New Century TV loses the feed.'
      : 'Telemetry says adjust and relaunch before the rivals catch up.';
}

export function continueFromDebrief(state: IntergalacticState) {
  if (!state.debrief || state.debrief.outcome === 'success' || state.debrief.outcome === 'fired') {
    const next = rollNewContract(state.rng);
    Object.assign(state, next);
    return;
  }
  state.attempt += 1;
  state.phase = 'aim';
  state.phaseElapsed = 0;
  state.debrief = null;
  state.statusMessage = 'Use the launch report: fix angle, fix speed, then try again.';
}

export function adjustAngle(state: IntergalacticState, delta: number) {
  state.angle = clamp(state.angle + delta, INTERGALACTIC_CONSTANTS.minAngle, INTERGALACTIC_CONSTANTS.maxAngle);
}

export function adjustSpeed(state: IntergalacticState, delta: number) {
  state.speed = clamp(state.speed + delta, INTERGALACTIC_CONSTANTS.minSpeed, INTERGALACTIC_CONSTANTS.maxSpeed);
}

export function adjustLaunchTrim(state: IntergalacticState, angleDelta: number, speedDelta: number) {
  state.launchAngle = clamp(state.launchAngle + angleDelta, INTERGALACTIC_CONSTANTS.minAngle, INTERGALACTIC_CONSTANTS.maxAngle);
  state.launchSpeed = clamp(state.launchSpeed + speedDelta, INTERGALACTIC_CONSTANTS.minSpeed, INTERGALACTIC_CONSTANTS.maxSpeed);
}

export function rewardSignalTiming(state: IntergalacticState) {
  const centered = 1 - Math.min(1, Math.abs(state.signalCursor - 0.5) / 0.5);
  const delta = centered > 0.72 ? 0.18 : centered > 0.42 ? 0.06 : -0.08;
  state.signalLock = clamp01(state.signalLock + delta);
  state.statusMessage = delta > 0
    ? 'Broadcast lock tightened. NCTV signal is punching through.'
    : 'Off-centre correction. Static blooms across the live feed.';
}

export function buildFeedback(angleError: number, speedError: number) {
  const feedback: string[] = [];
  if (angleError < -INTERGALACTIC_CONSTANTS.angleTolerance) feedback.push('TOO SHALLOW');
  if (angleError > INTERGALACTIC_CONSTANTS.angleTolerance) feedback.push('TOO STEEP');
  if (speedError < -INTERGALACTIC_CONSTANTS.speedTolerance) feedback.push('TOO SLOW');
  if (speedError > INTERGALACTIC_CONSTANTS.speedTolerance) feedback.push('TOO FAST');
  return feedback;
}

export function clamp01(value: number) {
  return clamp(value, 0, 1);
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function rollNewContract(rng: () => number): IntergalacticState {
  const targetHeight = Math.floor(rng() * 100 + 1);
  const idealAngle = targetAngle(targetHeight);
  const idealSpeed = targetSpeed(targetHeight);
  const telemetryAngle = clamp(idealAngle + randomRange(rng, -3.2, 3.2), 0, 90);
  const telemetrySpeed = clamp(idealSpeed + randomRange(rng, -850, 850), 0, 40_000);
  return {
    phase: 'aim',
    elapsed: 0,
    phaseElapsed: 0,
    targetHeight,
    idealAngle,
    idealSpeed,
    telemetryAngle,
    telemetrySpeed,
    angle: clamp(telemetryAngle + randomRange(rng, -8, 8), 0, 90),
    speed: clamp(telemetrySpeed + randomRange(rng, -5000, 5000), 0, 40_000),
    launchAngle: telemetryAngle,
    launchSpeed: telemetrySpeed,
    attempt: 1,
    maxAttempts: INTERGALACTIC_CONSTANTS.maxAttempts,
    signalCursor: 0.5,
    signalDirection: 1,
    signalLock: 0.44,
    rivalCoverage: 0.12,
    statusMessage: 'Tune angle and speed, then launch New Century TV into orbit.',
    feedback: [],
    debrief: null,
    rng,
  };
}

function buildSummary(outcome: LaunchDebrief['outcome'], state: IntergalacticState) {
  if (outcome === 'success') {
    if (state.signalLock > 0.82) return 'A glittering insertion and a clean galaxy-wide signal.';
    if (state.signalLock > 0.58) return 'Orbital height is right; the feed is stable enough for opening ceremony rights.';
    return 'The satellite is up, but the director wants less static next time.';
  }
  if (outcome === 'fired') return "Eight launches, no orbit. NCTV's rivals buy the highlights package.";
  const parts = state.feedback.length ? state.feedback.join(', ') : 'near miss';
  return `Launch report: ${parts}. Adjust before attempt ${state.attempt + 1}.`;
}

function randomRange(rng: () => number, min: number, max: number) {
  return min + (max - min) * rng();
}

function mulberry32(seed: number) {
  return () => {
    let t = seed += 0x6d2b79f5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
