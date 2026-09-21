import type { Outcome, Weapon } from './state';

export type GalacticonPhase = 'approach' | 'choose' | 'resolve' | 'debrief';

export interface CrewMember {
  name: string;
  alive: boolean;
}

export interface EncounterRecord {
  name: string;
  weapon: Weapon;
  outcome: Outcome;
  angered: boolean;
}

export interface GalacticonDebrief {
  survived: boolean;
  headline: string;
  summary: string;
  kills: number;
  crewLeft: number;
  encountersFaced: number;
  score: number;
  rank: string;
  /** The answers, revealed only once the run is over. */
  answers: Array<{ name: string; kills: Weapon }>;
}

export interface GalacticonState {
  phase: GalacticonPhase;
  elapsed: number;
  phaseElapsed: number;
  names: string[];
  encounter: number;
  slot: number;
  crew: CrewMember[];
  kills: number;
  journal: Record<string, Partial<Record<Weapon, Outcome>>>;
  history: EncounterRecord[];
  lastWeapon: Weapon | null;
  lastOutcome: Outcome | null;
  lastAngered: boolean;
  lostMember: string | null;
  statusMessage: string;
  debrief: GalacticonDebrief | null;
  rng: () => number;
}
