import { statementSeconds } from '../../core/bbcTiming';

export const TOUCHDOWN_RULES = {
  startHeight: 100,
  startFuel: 100,
  /** Lines 540-550: each tick a held key moves the thrust by 4. */
  thrustStep: 4,
  maxThrust: 100,
  /** Line 690: safe when the sum of the last two velocities is under 8, an average under 4. */
  safeSum: 8,
} as const;

/**
 * Lines 60-170 run flat out, redrawing the craft twice and four bars each
 * pass. About eighty statement-equivalents, counting the triangle fills,
 * puts a tick at a tenth of a second on a BBC.
 */
export const TICK_SECONDS = statementSeconds(80);

/**
 * INKEY with a negative argument scans one key directly. In the BBC's key
 * table -51 is D and -66 is A, so line 540 raises the thrust on D and line
 * 550 lowers it on A: the reverse of what the intro tells the player.
 */
export const LISTING_KEYS = { thrustUp: 'D', thrustDown: 'A' } as const;

export interface Craft {
  height: number;
  velocity: number;
  fuel: number;
  thrust: number;
  gravity: number;
}

/** Lines 250-270. BBC RND(n) is a whole number from 1 to n. */
export function launchCraft(rng: () => number = Math.random): Craft {
  const rnd = (n: number) => Math.floor(rng() * n) + 1;
  return {
    height: TOUCHDOWN_RULES.startHeight,
    velocity: 5 + rnd(10),
    fuel: TOUCHDOWN_RULES.startFuel,
    thrust: 0,
    gravity: (rnd(40) + 40) / 100,
  };
}

export type TickResult =
  | { kind: 'flying' }
  | { kind: 'landed'; sum: number }
  | { kind: 'lost' };

/** One pass of lines 110-170. Thrust is capped by the fuel left, so the fuel never quite runs out. */
export function tick(craft: Craft, up: boolean, down: boolean): TickResult {
  if (up) craft.thrust = Math.min(TOUCHDOWN_RULES.maxThrust, craft.thrust + TOUCHDOWN_RULES.thrustStep);
  if (down) craft.thrust = Math.max(0, craft.thrust - TOUCHDOWN_RULES.thrustStep);
  if (craft.thrust > craft.fuel) craft.thrust = craft.fuel;
  const next = craft.velocity - craft.thrust / 20 + craft.gravity;
  craft.fuel -= craft.thrust / 10;
  const height = craft.height - (craft.velocity + next) / 10;
  if (height < 0) return { kind: 'landed', sum: craft.velocity + next };
  craft.height = height;
  craft.velocity = next;
  if (craft.height > TOUCHDOWN_RULES.startHeight) return { kind: 'lost' };
  return { kind: 'flying' };
}

/** Line 680: INT((V+V1)*5)/10, the average of the last two velocities cut to one decimal. */
export function touchdownSpeed(sum: number) {
  return Math.floor(sum * 5) / 10;
}

export function isSafe(sum: number) {
  return sum < TOUCHDOWN_RULES.safeSum;
}

import type { Grade, Landing, TestDebrief, TestState } from './types';

export const TEST = {
  landings: 3,
  landedHold: 1.6,
} as const;

export function createTestState(rng: () => number = Math.random): TestState {
  const craft = launchCraft(rng);
  return {
    phase: 'briefing',
    elapsed: 0,
    phaseElapsed: 0,
    attempt: 1,
    craft,
    entry: craft.velocity,
    previousHeight: craft.height,
    tickTimer: 0,
    ticks: 0,
    remark: 'Take her down when you are ready.',
    landings: [],
    debrief: null,
    rng,
  };
}

export function resetTest(state: TestState) {
  Object.assign(state, createTestState(state.rng), { elapsed: state.elapsed });
}

export function beginFlight(state: TestState) {
  if (state.phase !== 'briefing') return;
  state.phase = 'flight';
  state.phaseElapsed = 0;
  state.tickTimer = 0;
  state.ticks = 0;
  state.previousHeight = state.craft.height;
  state.remark = 'Watch your height and your speed.';
}

/**
 * What Captain Flash says. The first rule is the one the listing never
 * teaches: thrust spent near the top is thrust you will not have near the
 * bottom, because it can never exceed the fuel that is left.
 */
export function captainSays(state: TestState): string {
  const c = state.craft;
  if (c.velocity < 0) return 'You are climbing. Ease off, or you will be lost in space.';
  if (c.height > 60 && c.thrust > 16 && state.ticks < 30) return 'Let her fall a little. Thrust now is thrust you will not have later.';
  if (c.height < 35 && c.velocity > 9) return 'Too fast! More thrust, now!';
  if (c.fuel < 25) return 'Fuel is low, and your thrust can never be more than the fuel that is left.';
  if (c.height < 15 && c.velocity < 4) return 'Steady... gently now.';
  if (c.height < 50 && c.velocity > 6) return 'Start braking.';
  return 'Watch your height and your speed.';
}

export function gradeFor(sum: number): Grade {
  const speed = touchdownSpeed(sum);
  if (!isSafe(sum)) return 'Crashed';
  if (speed < 1) return 'Feather-light';
  if (speed < 2) return 'Smooth';
  return 'Safe';
}

export function stepTest(state: TestState, dt: number, up: boolean, down: boolean) {
  if (state.phase !== 'flight') return;
  state.tickTimer += dt;
  while (state.phase === 'flight' && state.tickTimer >= TICK_SECONDS) {
    state.tickTimer -= TICK_SECONDS;
    state.ticks += 1;
    state.previousHeight = state.craft.height;
    const result = tick(state.craft, up, down);
    if (result.kind === 'landed') {
      const grade = gradeFor(result.sum);
      const speed = touchdownSpeed(result.sum);
      recordLanding(state, grade, speed);
      return;
    }
    if (result.kind === 'lost') {
      recordLanding(state, 'Lost in space', null);
      return;
    }
    state.remark = captainSays(state);
  }
}

function recordLanding(state: TestState, grade: Grade, speed: number | null) {
  const c = state.craft;
  const safe = grade !== 'Crashed' && grade !== 'Lost in space';
  const landing: Landing = {
    gravity: c.gravity,
    entry: state.entry,
    grade,
    speed,
    fuel: c.fuel,
    score: safe && speed !== null ? 100 + Math.round((4 - speed) * 40) + Math.round(c.fuel) : 0,
  };
  state.landings.push(landing);
  if (grade === 'Crashed') c.height = 0;
  state.remark = grade === 'Lost in space'
    ? 'Lost in space. That is a fail.'
    : grade === 'Crashed'
      ? 'A new crater on the Moon. That is a fail.'
      : grade === 'Feather-light'
        ? 'I barely felt that. Beautiful.'
        : grade === 'Smooth' ? 'Nicely done.' : 'Down in one piece. It will do.';
  state.phase = 'landed';
  state.phaseElapsed = 0;
}

export function nextLanding(state: TestState) {
  if (state.phase !== 'landed') return;
  if (state.attempt >= TEST.landings) {
    finish(state);
    return;
  }
  state.attempt += 1;
  state.craft = launchCraft(state.rng);
  state.entry = state.craft.velocity;
  state.previousHeight = state.craft.height;
  state.phase = 'briefing';
  state.phaseElapsed = 0;
  state.remark = 'Again. Different conditions this time.';
}

function finish(state: TestState) {
  const safe = state.landings.filter(l => l.grade !== 'Crashed' && l.grade !== 'Lost in space').length;
  const passed = safe === TEST.landings;
  const light = state.landings.filter(l => l.grade === 'Feather-light').length;
  const debrief: TestDebrief = {
    passed,
    safe,
    landings: TEST.landings,
    score: state.landings.reduce((sum, l) => sum + l.score, 0),
    verdict: passed
      ? light === TEST.landings
        ? 'Three feather-light landings. I have nothing to teach you.'
        : 'You pass. Advanced Spacecraft Handling, Part III.'
      : `${safe} of ${TEST.landings} safe. Book another test.`,
  };
  state.debrief = debrief;
  state.phase = 'debrief';
  state.phaseElapsed = 0;
  state.remark = debrief.verdict;
}
