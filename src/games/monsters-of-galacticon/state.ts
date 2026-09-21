export const GALACTICON_RULES = {
  crew: 5,
  encounters: 8,
  slots: 4,
  /** Line 330: IF RND(1)>.4 THEN skip, so a roll at or under 0.4 costs a member. */
  angerChance: 0.4,
} as const;

export const MONSTER_NAMES = ['SULFACIDOR', 'FLAMGONDAR', 'BALNOLOTIN', 'GOLANDOR'] as const;

export const WEAPONS = ['R', 'S', 'T'] as const;
export type Weapon = (typeof WEAPONS)[number];

export const WEAPON_NAMES: Record<Weapon, string> = {
  R: 'Ray gun',
  S: 'Sword laser',
  T: 'Trypton blaster',
};

export type Outcome = 'kill' | 'noeffect' | 'eaten';

export const OUTCOME_TEXT: Record<Outcome, string[]> = {
  kill: ["YOU'VE KILLED IT"],
  noeffect: ['NO EFFECT'],
  eaten: ["NO USE. IT'S EATEN ONE", 'OF YOUR GROUP'],
};

/**
 * Lines 230-240: W = ASC(R$)-81+R, then W = W+3*(W>3)+3*(W>6). BBC BASIC gives
 * -1 for a true comparison, so the second line folds W back into 1..3, making
 * this a rotation. Read with +1 for true, as a Sinclair machine would, two of
 * the four monsters become unkillable, so -1 is plainly the intended reading.
 */
export function resolveWeapon(weapon: Weapon, slot: number): Outcome {
  let w = weapon.charCodeAt(0) - 81 + slot;
  w = w + 3 * (w > 3 ? -1 : 0) + 3 * (w > 6 ? -1 : 0);
  if (w === 2) return 'kill';
  if (w === 3) return 'noeffect';
  return 'eaten';
}

/**
 * The rotation means one observation fixes a whole row: the weapon after the
 * killing one does nothing, and the one after that gets a crew member eaten.
 * Used only to reveal the full table in the debrief, after a run has ended.
 */
export function inferRow(weapon: Weapon, outcome: Outcome): Record<Weapon, Outcome> {
  const shift = outcome === 'kill' ? 0 : outcome === 'noeffect' ? 2 : 1;
  const killIndex = (WEAPONS.indexOf(weapon) + shift) % 3;
  const row = {} as Record<Weapon, Outcome>;
  WEAPONS.forEach((w, index) => {
    const step = (index - killIndex + 3) % 3;
    row[w] = step === 0 ? 'kill' : step === 1 ? 'noeffect' : 'eaten';
  });
  return row;
}

/** Lines 90-150: four swaps of a random pair, which is a biased shuffle. Kept as written. */
export function shuffleNames(rng: () => number = Math.random) {
  const names = [...MONSTER_NAMES];
  for (let i = 0; i < GALACTICON_RULES.slots; i += 1) {
    const a = Math.floor(rng() * GALACTICON_RULES.slots);
    const b = Math.floor(rng() * GALACTICON_RULES.slots);
    const swap = names[a]!;
    names[a] = names[b]!;
    names[b] = swap;
  }
  return names;
}

export function randomSlot(rng: () => number = Math.random) {
  return Math.floor(rng() * GALACTICON_RULES.slots) + 1;
}

export function parseWeapon(key: string): Weapon | null {
  // The BBC Micro powered up with CAPS LOCK on, so INPUT delivered capitals.
  const upper = key.toUpperCase();
  return (WEAPONS as readonly string[]).includes(upper) ? (upper as Weapon) : null;
}

import type { GalacticonDebrief, GalacticonState } from './types';

export const CREW_NAMES = ['VANCE', 'OKONKWO', 'REYES', 'TAKAHASHI', 'BRENNER'] as const;

export const ENCOUNTER_TIMING = {
  approach: 1.1,
  resolve: 2.0,
} as const;

export function createGalacticonState(rng: () => number = Math.random): GalacticonState {
  const state: GalacticonState = {
    phase: 'approach',
    elapsed: 0,
    phaseElapsed: 0,
    names: shuffleNames(rng),
    encounter: 1,
    slot: randomSlot(rng),
    crew: CREW_NAMES.map(name => ({ name, alive: true })),
    kills: 0,
    journal: {},
    history: [],
    lastWeapon: null,
    lastOutcome: null,
    lastAngered: false,
    lostMember: null,
    statusMessage: 'Something is coming through the rocks.',
    rng,
    debrief: null,
  };
  return state;
}

export function resetRun(state: GalacticonState) {
  Object.assign(state, createGalacticonState(state.rng), { elapsed: state.elapsed });
}

export function currentName(state: GalacticonState) {
  return state.names[state.slot - 1] ?? MONSTER_NAMES[0];
}

export function beginChoice(state: GalacticonState) {
  if (state.phase !== 'approach') return;
  state.phase = 'choose';
  state.phaseElapsed = 0;
  state.statusMessage = `It's a ${currentName(state)}. Which weapon?`;
}

export function chooseWeapon(state: GalacticonState, weapon: Weapon) {
  if (state.phase !== 'choose') return;
  const name = currentName(state);
  const outcome = resolveWeapon(weapon, state.slot);
  const angered = outcome === 'noeffect' && state.rng() <= GALACTICON_RULES.angerChance;

  state.lastWeapon = weapon;
  state.lastOutcome = outcome;
  state.lastAngered = angered;
  state.lostMember = null;
  state.journal[name] = { ...state.journal[name], [weapon]: outcome };
  state.history.push({ name, weapon, outcome, angered });

  if (outcome === 'kill') {
    state.kills += 1;
    state.statusMessage = `The ${name} drops. The ${WEAPON_NAMES[weapon].toLowerCase()} was the answer.`;
  } else if (outcome === 'noeffect') {
    state.statusMessage = angered
      ? `No effect, and you angered it. It takes one of yours.`
      : `No effect. The ${WEAPON_NAMES[weapon].toLowerCase()} does nothing to a ${name}.`;
  } else {
    state.statusMessage = `No use at all. The ${name} eats one of your group.`;
  }

  if (outcome === 'eaten' || angered) loseMember(state);
  state.phase = 'resolve';
  state.phaseElapsed = 0;
  if (state.crew.every(member => !member.alive)) finish(state, false);
}

function loseMember(state: GalacticonState) {
  const living = state.crew.filter(member => member.alive);
  const victim = living[living.length - 1];
  if (!victim) return;
  victim.alive = false;
  state.lostMember = victim.name;
}

export function advanceEncounter(state: GalacticonState) {
  if (state.phase !== 'resolve') return;
  if (state.encounter >= GALACTICON_RULES.encounters) {
    finish(state, true);
    return;
  }
  state.encounter += 1;
  state.slot = randomSlot(state.rng);
  state.phase = 'approach';
  state.phaseElapsed = 0;
  state.lastWeapon = null;
  state.lastOutcome = null;
  state.lastAngered = false;
  state.lostMember = null;
  state.statusMessage = 'Something is coming through the rocks.';
}

function finish(state: GalacticonState, survived: boolean) {
  const crewLeft = state.crew.filter(member => member.alive).length;
  const probesWasted = state.history.filter(record => record.outcome !== 'kill').length;
  const score = survived
    ? state.kills * 100 + crewLeft * 200 + Math.max(0, 300 - probesWasted * 60)
    : state.kills * 100;
  const rank = !survived
    ? 'Lost with all hands'
    : crewLeft === GALACTICON_RULES.crew
      ? 'Conqueror of Galacticon'
      : crewLeft >= 3
        ? 'Expedition leader'
        : 'Sole survivors';
  const answers = MONSTER_NAMES.map(name => {
    const slot = state.names.indexOf(name) + 1;
    return { name, kills: WEAPONS.find(w => resolveWeapon(w, slot) === 'kill') ?? 'R' };
  });
  state.debrief = {
    survived,
    headline: survived ? 'YOU HAVE SURVIVED TO CONQUER GALACTICON' : "YOU'RE ALL DEAD",
    summary: survived
      ? crewLeft === GALACTICON_RULES.crew
        ? 'Eight monsters met, not one of your group lost.'
        : `Eight monsters met. ${crewLeft} of you walk back to the ship.`
      : 'The last of your group is gone. Galacticon keeps you.',
    kills: state.kills,
    crewLeft,
    encountersFaced: state.history.length,
    score,
    rank,
    answers,
  };
  state.phase = 'debrief';
  state.phaseElapsed = 0;
  state.statusMessage = state.debrief.headline;
}
