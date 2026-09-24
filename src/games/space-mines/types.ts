export type MinesPhase = 'decide' | 'report' | 'debrief';

export type Ending = 'survived' | 'revolt' | 'overworked' | 'depopulated';

export type FieldId = 'sellOre' | 'sellMines' | 'food' | 'buyMines';

export interface Colony {
  year: number;
  people: number;
  mines: number;
  money: number;
  ore: number;
  /** In tenths, so 10 is the listing's 1.0 and the thresholds compare exactly. */
  satisfaction: number;
  production: number;
}

export interface Market {
  orePrice: number;
  minePrice: number;
}

export interface Plan {
  sellOre: number;
  sellMines: number;
  /** Dollars a head, the unit the listing's thresholds are really in. */
  food: number;
  buyMines: number;
}

export interface YearReport {
  year: number;
  income: number;
  spending: number;
  satisfactionChange: number;
  productionChange: number;
  peopleChange: number;
  leak: boolean;
  glut: boolean;
  ending: Ending | null;
}

export interface MinesDebrief {
  ending: Ending;
  headline: string;
  summary: string;
  people: number;
  mines: number;
  money: number;
  yearsServed: number;
  score: number;
  rank: string;
}

export interface MinesState {
  phase: MinesPhase;
  elapsed: number;
  phaseElapsed: number;
  colony: Colony;
  market: Market;
  priceHistory: number[];
  plan: Plan;
  field: number;
  typing: string | null;
  report: YearReport | null;
  debrief: MinesDebrief | null;
  statusMessage: string;
  rng: () => number;
}
