import { emptyLoopSeconds } from '../../core/bbcTiming';

export const RESCUE_RULES = {
  /** Line 290: six to ten checks for trouble on the way. */
  minChecks: 6,
  checkSpan: 5,
  /** Line 300: IF RND(1)>.5 THEN nothing happens. */
  eventChance: 0.5,
  /** Line 810: more than 25 must be left to open the door. */
  doorEnergy: 25,
} as const;

/** Line 430: FOR J=1 TO 2000 between checks, the long sleep of the voyage. */
export const CHECK_PAUSE = emptyLoopSeconds(2000);

export interface Mission {
  distance: number;
  energy: number;
  timeLimit: number;
}

/** Lines 70-90. The limit is set so that about a fifth of the energy in the engines just makes it. */
export function rollMission(rng: () => number = Math.random): Mission {
  const distance = Math.floor(rng() * 800 + 101);
  const energy = Math.floor(rng() * 400 + 401);
  return { distance, energy, timeLimit: Math.floor(distance / Math.sqrt(energy / 5) + 0.5) };
}

/** Line 230: only whole units of speed count, so engine energy pays off in perfect squares. */
export function velocityFor(engines: number) {
  return Math.floor(Math.sqrt(engines));
}

export type Hazard = 'storm' | 'breakdown' | 'engine' | 'xray';

export const HAZARD_TEXT: Record<Hazard, string> = {
  storm: 'ASTEROID STORM - SHIELDS DAMAGED',
  breakdown: 'COMPUTER BREAKDOWN - DELAY IN REPAIRING',
  engine: 'ENGINE TROUBLE - MUST SLOW DOWN',
  xray: 'X-RAY DAMAGE - LIFE SUPPORT DAMAGED',
};

export interface HazardRoll {
  hazard: Hazard | null;
  amount: number;
}

/** Lines 300-420: half the checks bring one of four troubles, each equally likely. */
export function rollHazard(rng: () => number = Math.random): HazardRoll {
  if (rng() > RESCUE_RULES.eventChance) return { hazard: null, amount: 0 };
  const hazards: Hazard[] = ['storm', 'breakdown', 'engine', 'xray'];
  const hazard = hazards[Math.floor(rng() * 4)] ?? 'storm';
  if (hazard === 'storm' || hazard === 'xray') return { hazard, amount: 20 + Math.floor(rng() * 40 + 1) };
  if (hazard === 'breakdown') return { hazard, amount: Math.floor(rng() * 20 + 1) };
  return { hazard, amount: 0.5 };
}

export type Band = 'LOW' | 'MEDIUM' | 'HIGH';

/** Lines 540-610: a value of 5 to 14, shown only as a band. */
export function rollCondition(rng: () => number = Math.random) {
  const value = Math.floor(rng() * 10 + 5);
  const band: Band = value < 8 ? 'LOW' : value < 12 ? 'MEDIUM' : 'HIGH';
  return { value, band };
}

export const BAND_VALUES: Record<Band, number[]> = {
  LOW: [5, 6, 7],
  MEDIUM: [8, 9, 10, 11],
  HIGH: [12, 13, 14],
};

import type { Allocation, Failure, MissionResult, Odds, RescueDebrief, RescueState } from './types';

export const CAMPAIGN = {
  missions: 3,
  checkSeconds: 1.3,
  descentSeconds: 2.4,
  oddsSamples: 3000,
} as const;

/** A small seeded generator, so the odds shown do not flicker as the plan changes. */
export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const oddsCache = new Map<string, Odds>();

/** Chances from simulating the voyage many times with the same seed. */
export function voyageOdds(mission: Mission, alloc: Allocation, seed: number): Odds {
  const key = `${seed}:${alloc.engines}:${alloc.life}:${alloc.shields}`;
  const cached = oddsCache.get(key);
  if (cached) return cached;
  const rng = seeded(seed);
  let shields = 0;
  let life = 0;
  let onTime = 0;
  let orbit = 0;
  const v0 = velocityFor(alloc.engines);
  for (let i = 0; i < CAMPAIGN.oddsSamples; i += 1) {
    let s = alloc.shields;
    let l = alloc.life;
    let v = v0;
    let d = mission.distance;
    const checks = Math.floor(rng() * RESCUE_RULES.checkSpan + RESCUE_RULES.minChecks);
    for (let c = 0; c < checks; c += 1) {
      const roll = rollHazard(rng);
      if (roll.hazard === 'storm') s -= roll.amount;
      if (roll.hazard === 'xray') l -= roll.amount;
      if (roll.hazard === 'engine') v -= roll.amount;
      if (roll.hazard === 'breakdown') d += roll.amount;
    }
    const okShields = s >= 0;
    const okLife = l > 0;
    const okTime = v > 0 && Math.floor(d / v) <= mission.timeLimit;
    if (okShields) shields += 1;
    if (okLife) life += 1;
    if (okTime) onTime += 1;
    if (okShields && okLife && okTime) orbit += 1;
  }
  const n = CAMPAIGN.oddsSamples;
  const odds = { shields: shields / n, life: life / n, onTime: onTime / n, orbit: orbit / n };
  if (oddsCache.size > 2000) oddsCache.clear();
  oddsCache.set(key, odds);
  return odds;
}

/** Exact, since the band tells you the possible values and each is equally likely. */
export function coverChance(band: Band, energy: number) {
  const values = BAND_VALUES[band];
  return values.filter(value => energy >= value * 10).length / values.length;
}

export function createRescueState(rng: () => number = Math.random): RescueState {
  const missions = Array.from({ length: CAMPAIGN.missions }, () => rollMission(rng));
  const state: RescueState = {
    phase: 'allocate',
    elapsed: 0,
    phaseElapsed: 0,
    missions,
    seeds: missions.map(() => Math.floor(rng() * 2 ** 31)),
    index: 0,
    alloc: { engines: 0, life: 0, shields: 0 },
    landing: { boosters: 0, heat: 0 },
    field: 0,
    typing: null,
    voyage: null,
    orbit: null,
    results: [],
    debrief: null,
    statusMessage: '',
    rng,
  };
  prepareMission(state);
  return state;
}

export function resetRun(state: RescueState) {
  Object.assign(state, createRescueState(state.rng), { elapsed: state.elapsed });
}

export function currentMission(state: RescueState) {
  return state.missions[state.index] ?? state.missions[0]!;
}

function prepareMission(state: RescueState) {
  const m = currentMission(state);
  const speed = Math.ceil(m.distance / m.timeLimit);
  state.alloc = { engines: speed * speed, life: 60, shields: 60 };
  state.field = 0;
  state.typing = null;
  state.voyage = null;
  state.orbit = null;
  state.phase = 'allocate';
  state.phaseElapsed = 0;
  state.statusMessage = `Mission ${state.index + 1} of ${CAMPAIGN.missions}. Enter launches.`;
}

export function reserve(state: RescueState) {
  const m = currentMission(state);
  return m.energy - state.alloc.engines - state.alloc.life - state.alloc.shields;
}

/** Engine energy moves between perfect squares, one unit of speed at a time. */
export function stepEngines(state: RescueState, direction: 1 | -1) {
  const v = Math.max(1, velocityFor(state.alloc.engines) + direction);
  state.alloc.engines = v * v;
}

export function launch(state: RescueState) {
  if (state.phase !== 'allocate') return;
  if (state.alloc.engines < 1) {
    state.statusMessage = 'The engines need at least one unit.';
    return;
  }
  if (reserve(state) < 0) {
    state.statusMessage = 'That is more energy than the ship carries.';
    return;
  }
  const rng = seeded(state.seeds[state.index]! ^ 0x9e3779b9);
  const m = currentMission(state);
  state.voyage = {
    rng,
    checks: Math.floor(rng() * RESCUE_RULES.checkSpan + RESCUE_RULES.minChecks),
    checked: 0,
    timer: 0,
    velocity: velocityFor(state.alloc.engines),
    distance: m.distance,
    shields: state.alloc.shields,
    life: state.alloc.life,
    log: [],
  };
  state.phase = 'voyage';
  state.phaseElapsed = 0;
  state.statusMessage = 'Asleep. The ship flies itself.';
}

export function stepVoyage(state: RescueState, dt: number) {
  const v = state.voyage;
  if (state.phase !== 'voyage' || !v) return;
  v.timer += dt;
  if (v.timer < CAMPAIGN.checkSeconds) return;
  v.timer = 0;
  if (v.checked < v.checks) {
    const roll = rollHazard(v.rng);
    v.checked += 1;
    v.log.push({ check: v.checked, hazard: roll.hazard, amount: roll.amount });
    if (roll.hazard === 'storm') v.shields -= roll.amount;
    if (roll.hazard === 'xray') v.life -= roll.amount;
    if (roll.hazard === 'engine') v.velocity -= roll.amount;
    if (roll.hazard === 'breakdown') v.distance += roll.amount;
    return;
  }
  arrive(state);
}

function arrive(state: RescueState) {
  const v = state.voyage!;
  const m = currentMission(state);
  const failures: Failure[] = [];
  if (v.shields < 0) failures.push('blown-up');
  if (v.life <= 0) failures.push('dead');
  if (v.velocity <= 0) failures.push('engines');
  const eta = v.velocity > 0 ? Math.floor(v.distance / v.velocity) : null;
  if (eta !== null && eta > m.timeLimit) failures.push('late');
  if (failures.length) {
    record(state, { mission: m, rescued: false, failures, eta, leftover: null, score: 0 });
    return;
  }
  state.orbit = {
    gravity: rollCondition(v.rng),
    atmosphere: rollCondition(v.rng),
    surplus: reserve(state),
  };
  const top = (band: keyof typeof BAND_VALUES) => (BAND_VALUES[band].at(-1) ?? 14) * 10;
  state.landing = { boosters: top(state.orbit.gravity.band), heat: top(state.orbit.atmosphere.band) };
  state.field = 0;
  state.typing = null;
  state.phase = 'landing';
  state.phaseElapsed = 0;
  state.statusMessage = 'In orbit. Enter commits the landing.';
}

export function landingLeftover(state: RescueState) {
  return (state.orbit?.surplus ?? 0) - state.landing.boosters - state.landing.heat;
}

export function commitLanding(state: RescueState) {
  if (state.phase !== 'landing' || !state.orbit) return;
  if (landingLeftover(state) < 0) {
    state.statusMessage = 'That is more energy than you have left.';
    return;
  }
  state.phase = 'descent';
  state.phaseElapsed = 0;
  state.statusMessage = 'Descending.';
}

export function landingFailure(state: RescueState): Failure | null {
  const o = state.orbit!;
  if (state.landing.boosters < o.gravity.value * 10) return 'crater';
  if (state.landing.heat < o.atmosphere.value * 10) return 'star';
  if (landingLeftover(state) <= RESCUE_RULES.doorEnergy) return 'door';
  return null;
}

export function finishDescent(state: RescueState) {
  if (state.phase !== 'descent') return;
  const failure = landingFailure(state);
  const leftover = landingLeftover(state);
  const eta = state.voyage && state.voyage.velocity > 0 ? Math.floor(state.voyage.distance / state.voyage.velocity) : null;
  record(state, {
    mission: currentMission(state),
    rescued: failure === null,
    failures: failure ? [failure] : [],
    eta,
    leftover,
    score: failure === null ? 1000 + (leftover - RESCUE_RULES.doorEnergy) * 2 : 0,
  });
}

function record(state: RescueState, result: MissionResult) {
  state.results.push(result);
  state.phase = 'report';
  state.phaseElapsed = 0;
  state.statusMessage = 'Press Enter to continue.';
}

export function continueFromReport(state: RescueState) {
  if (state.phase !== 'report') return;
  if (state.index >= CAMPAIGN.missions - 1) {
    finish(state);
    return;
  }
  state.index += 1;
  prepareMission(state);
}

const RANKS = ['Grounded', 'Lieutenant Commander', 'Captain', 'Space Admiral'];

function finish(state: RescueState) {
  const rescues = state.results.filter(result => result.rescued).length;
  const debrief: RescueDebrief = {
    rescues,
    missions: CAMPAIGN.missions,
    score: state.results.reduce((sum, result) => sum + result.score, 0),
    rank: RANKS[rescues] ?? RANKS[0]!,
    summary: rescues === CAMPAIGN.missions
      ? 'Three planets supplied. The promotion is yours.'
      : rescues === 0
        ? 'Not one delivery. The medical supplies are still in the hold.'
        : `${rescues} of ${CAMPAIGN.missions} planets supplied.`,
  };
  state.debrief = debrief;
  state.phase = 'debrief';
  state.phaseElapsed = 0;
  state.statusMessage = debrief.rank;
}
