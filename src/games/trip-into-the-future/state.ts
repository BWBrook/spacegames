export const TRIP_RULES = {
  minTarget: 25,
  targetSpan: 100,
  /** Lines 180-190: within 5 years is on time. */
  tolerance: 5,
  /** Line 170: more than 50 years aboard and you die of old age. */
  lifespan: 50,
} as const;

/** Line 30: T = INT(RND(1)*100+25), so 25 to 124 years. */
export function rollTarget(rng: () => number = Math.random) {
  return Math.floor(rng() * TRIP_RULES.targetSpan + TRIP_RULES.minTarget);
}

export function lorentz(speed: number) {
  return 1 / Math.sqrt(1 - speed * speed);
}

export type ListingVerdict = 'died' | 'on-time' | 'not-close' | 'silent';

export type ListingOutcome =
  | { kind: 'error'; message: string }
  | { kind: 'trip'; took: number; arrived: number; verdict: ListingVerdict };

/**
 * Lines 120-190 as written. T1 = D/V is printed as the years you took and
 * T2 = T1/SQR(1-V*V) as the years that passed on Earth. The two are correctly
 * related by the dilation factor, but D/V is the time on Earth, not aboard,
 * unless D is the distance measured from the moving ship. Both ends of the
 * range the prompt offers divide by zero: V=0 at line 120, V=1 at line 130.
 */
export function listingTrip(target: number, speed: number, distance: number): ListingOutcome {
  if (speed === 0) return { kind: 'error', message: 'Division by zero at line 120' };
  const took = distance / speed;
  const root = Math.sqrt(1 - speed * speed);
  if (root === 0) return { kind: 'error', message: 'Division by zero at line 130' };
  const arrived = took / root;
  const miss = Math.abs(target - arrived);
  // Line 170 checks death first; lines 180 and 190 then leave exactly 5 unanswered.
  const verdict: ListingVerdict = took > TRIP_RULES.lifespan
    ? 'died'
    : miss < TRIP_RULES.tolerance
      ? 'on-time'
      : miss > TRIP_RULES.tolerance ? 'not-close' : 'silent';
  return { kind: 'trip', took, arrived, verdict };
}

export const LISTING_TEXT: Record<Exclude<ListingVerdict, 'silent'>, string> = {
  died: 'YOU DIED ON THE WAY',
  'on-time': 'YOU ARRIVED ON TIME',
  'not-close': 'NOT EVEN CLOSE',
};

/** Special relativity with the distance measured from Earth, as light years to anywhere normally are. */
export function relativisticTrip(speed: number, distance: number) {
  const earthYears = distance / speed;
  return { earthYears, shipYears: earthYears / lorentz(speed) };
}

import type { Mission, MissionResult, TripDebrief, TripState, TripVerdict } from './types';

export const VOYAGE = {
  missions: 5,
  startingAge: 30,
  maxDistance: 300,
  voyageSeconds: 5,
  arrivalHold: 0.6,
} as const;

const round3 = (value: number) => Math.round(value * 1000) / 1000;

/**
 * Engines are generous when no dilation is needed and only just fast enough
 * when it is, so the speed choice matters. Without a cap the answer to every
 * mission would be to fly as close to light speed as the dial allows.
 */
function engineCapFor(target: number, rng: () => number) {
  const needed = target / TRIP_RULES.lifespan;
  if (needed <= 1) return round3(0.4 + rng() * 0.5);
  const floor = Math.sqrt(1 - 1 / (needed * needed));
  return Math.min(0.995, round3(floor + 0.03 + rng() * 0.05));
}

export function rollMissions(rng: () => number = Math.random): Mission[] {
  return Array.from({ length: VOYAGE.missions }, () => rollTarget(rng))
    .sort((a, b) => a - b)
    .map(target => ({ target, engineCap: engineCapFor(target, rng) }));
}

export function createTripState(rng: () => number = Math.random): TripState {
  const missions = rollMissions(rng);
  return {
    phase: 'plan',
    elapsed: 0,
    phaseElapsed: 0,
    missions,
    index: 0,
    speed: round3((missions[0]?.engineCap ?? 0.5) / 2),
    distance: 10,
    results: [],
    statusMessage: 'Set a speed and a distance, then launch.',
    debrief: null,
    rng,
  };
}

export function resetRun(state: TripState) {
  Object.assign(state, createTripState(state.rng), { elapsed: state.elapsed });
}

export function currentMission(state: TripState) {
  return state.missions[state.index] ?? { target: 25, engineCap: 0.5 };
}

export function adjustSpeed(state: TripState, delta: number) {
  if (state.phase !== 'plan') return;
  state.speed = Math.min(currentMission(state).engineCap, Math.max(0.01, state.speed + delta));
}

export function adjustDistance(state: TripState, delta: number) {
  if (state.phase !== 'plan') return;
  state.distance = Math.min(VOYAGE.maxDistance, Math.max(0, state.distance + delta));
}

export function judge(target: number, speed: number, distance: number) {
  const { earthYears, shipYears } = relativisticTrip(speed, distance);
  const verdict: TripVerdict = shipYears > TRIP_RULES.lifespan
    ? 'died'
    : Math.abs(target - earthYears) <= TRIP_RULES.tolerance ? 'on-time' : 'not-close';
  return { earthYears, shipYears, verdict };
}

export function launch(state: TripState) {
  if (state.phase !== 'plan') return;
  const mission = currentMission(state);
  const { earthYears, shipYears, verdict } = judge(mission.target, state.speed, state.distance);
  const miss = Math.abs(mission.target - earthYears);
  const score = verdict === 'on-time'
    ? 100 + Math.round(100 * (1 - Math.min(1, miss / TRIP_RULES.tolerance)))
    : 0;
  state.results.push({ mission, speed: state.speed, distance: state.distance, earthYears, shipYears, verdict, score });
  state.phase = 'voyage';
  state.phaseElapsed = 0;
  state.statusMessage = 'Under way.';
}

export function lastResult(state: TripState): MissionResult | null {
  return state.results[state.results.length - 1] ?? null;
}

/** Fraction of the voyage animation at which the traveller dies, or 1 if they survive. */
export function survivalFraction(result: MissionResult) {
  return result.verdict === 'died' ? TRIP_RULES.lifespan / result.shipYears : 1;
}

export function endVoyage(state: TripState) {
  if (state.phase !== 'voyage') return;
  const result = lastResult(state);
  if (!result) return;
  const gamma = lorentz(result.speed);
  const needed = result.mission.target / TRIP_RULES.lifespan;
  state.statusMessage = result.verdict === 'on-time'
    ? `Earth aged ${result.earthYears.toFixed(1)} years while you aged ${result.shipYears.toFixed(1)}.`
    : result.verdict === 'died'
      ? `Each year aboard was only ${gamma.toFixed(2)} on Earth. Surviving needed at least ${needed.toFixed(2)}.`
      : `Earth time is distance over speed: ${result.distance.toFixed(1)} / ${result.speed.toFixed(3)} is ${result.earthYears.toFixed(1)} years.`;
  state.phase = 'arrival';
  state.phaseElapsed = 0;
}

export function nextMission(state: TripState) {
  if (state.phase !== 'arrival') return;
  if (state.index >= state.missions.length - 1) {
    finish(state);
    return;
  }
  state.index += 1;
  state.speed = round3(currentMission(state).engineCap / 2);
  state.phase = 'plan';
  state.phaseElapsed = 0;
  state.statusMessage = 'Set a speed and a distance, then launch.';
}

function finish(state: TripState) {
  const onTime = state.results.filter(result => result.verdict === 'on-time').length;
  const died = state.results.filter(result => result.verdict === 'died').length;
  const debrief: TripDebrief = {
    onTime,
    died,
    missions: state.missions.length,
    score: state.results.reduce((sum, result) => sum + result.score, 0),
    headline: `ON TIME ${onTime} OF ${state.missions.length}`,
    summary: died === 0
      ? onTime === state.missions.length
        ? 'Every trip home on schedule, and you lived through all of them.'
        : 'You survived every trip, though not every calendar agreed with you.'
      : `You did not survive ${died === 1 ? 'one of the trips' : `${died} of the trips`}. Faster would have kept you younger.`,
  };
  state.debrief = debrief;
  state.phase = 'debrief';
  state.phaseElapsed = 0;
  state.statusMessage = debrief.headline;
}
