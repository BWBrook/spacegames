export const MINES_RULES = {
  years: 10,
  /** Lines 420-430: over $120 a head raises satisfaction by 0.1, under $80 cuts it by 0.2. */
  generousPerHead: 120,
  meanPerHead: 80,
  /** Line 490. */
  revoltBelow: 0.6,
  /** Lines 500-540: above 1.1 the colony grows, below 0.9 it declines. */
  growthAbove: 1.1,
  declineBelow: 0.9,
  /** Line 520: fewer than ten people a mine and they are overworked. */
  peoplePerMine: 10,
  /** Line 550. */
  minimumPeople: 30,
  /** Line 560: IF RND(1)>.01 THEN skip, so a leak one year in a hundred. */
  leakChance: 0.01,
  /** Line 590: at 150 tons a mine the market gluts. */
  glutAt: 150,
} as const;

/** Lines 10-50. Line 40 rolls a food price, FP, that nothing ever reads. */
export function foundColony(rng: () => number = Math.random) {
  const mines = Math.floor(rng() * 3 + 5);
  const people = Math.floor(rng() * 60 + 40);
  const money = Math.floor(rng() * 50 + 10) * people;
  Math.floor(rng() * 40 + 80);
  const production = Math.floor(rng() * 40 + 80);
  return { mines, people, money, production };
}

/** Lines 90-100, rolled afresh every year. */
export function rollMarket(rng: () => number = Math.random) {
  return {
    minePrice: Math.floor(rng() * 2000 + 2000),
    orePrice: Math.floor(rng() * 12 + 7),
  };
}

export function rollSmallChange(rng: () => number, span: number) {
  return Math.floor(rng() * span + 1);
}

import type { Ending, FieldId, MinesDebrief, MinesState, Plan } from './types';

export const FIELDS: FieldId[] = ['sellOre', 'sellMines', 'food', 'buyMines'];

export const FIELD_STEP: Record<FieldId, number> = { sellOre: 10, sellMines: 1, food: 5, buyMines: 1 };

export function createMinesState(rng: () => number = Math.random): MinesState {
  const founded = foundColony(rng);
  const state: MinesState = {
    phase: 'decide',
    elapsed: 0,
    phaseElapsed: 0,
    colony: { year: 1, people: founded.people, mines: founded.mines, money: founded.money, ore: 0, satisfaction: 10, production: founded.production },
    market: { orePrice: 0, minePrice: 0 },
    priceHistory: [],
    plan: { sellOre: 0, sellMines: 0, food: 100, buyMines: 0 },
    field: 0,
    typing: null,
    report: null,
    debrief: null,
    statusMessage: '',
    rng,
  };
  beginYear(state, 100);
  return state;
}

export function resetRun(state: MinesState) {
  Object.assign(state, createMinesState(state.rng), { elapsed: state.elapsed });
}

function beginYear(state: MinesState, food: number) {
  state.market = rollMarket(state.rng);
  state.priceHistory.push(state.market.orePrice);
  const c = state.colony;
  c.ore += c.production * c.mines;
  state.plan = { sellOre: c.ore, sellMines: 0, food, buyMines: 0 };
  state.field = 0;
  state.typing = null;
  state.phase = 'decide';
  state.phaseElapsed = 0;
  state.statusMessage = `Year ${c.year} of ${MINES_RULES.years}. Enter confirms the year's orders.`;
}

export function fieldLimit(state: MinesState, id: FieldId) {
  const c = state.colony;
  if (id === 'sellOre') return c.ore;
  if (id === 'sellMines') return c.mines;
  if (id === 'food') return 999;
  return 99;
}

export function setField(state: MinesState, id: FieldId, value: number) {
  state.plan[id] = Math.max(0, Math.min(fieldLimit(state, id), Math.round(value)));
}

export interface Preview {
  income: number;
  spending: number;
  cash: number;
  minesAfter: number;
  peoplePerMine: number;
  foodEffect: number;
  satisfactionAfter: number;
  overworked: boolean;
  valid: boolean;
}

export function preview(state: MinesState, plan: Plan = state.plan): Preview {
  const c = state.colony;
  const m = state.market;
  const income = plan.sellOre * m.orePrice + plan.sellMines * m.minePrice;
  const spending = plan.food * c.people + plan.buyMines * m.minePrice;
  const minesAfter = c.mines - plan.sellMines + plan.buyMines;
  const peoplePerMine = minesAfter > 0 ? c.people / minesAfter : Infinity;
  const foodEffect = plan.food > MINES_RULES.generousPerHead ? 1 : plan.food < MINES_RULES.meanPerHead ? -2 : 0;
  const cash = c.money + income - spending;
  return {
    income,
    spending,
    cash,
    minesAfter,
    peoplePerMine,
    foodEffect,
    satisfactionAfter: c.satisfaction + foodEffect,
    overworked: peoplePerMine < MINES_RULES.peoplePerMine,
    valid: cash >= 0,
  };
}

/** The listing's end of year, with line 500 working as intended and no way to divide by zero. */
export function commitYear(state: MinesState) {
  if (state.phase !== 'decide') return;
  const p = preview(state);
  if (!p.valid) {
    state.statusMessage = 'Those orders cost more than the colony has.';
    return;
  }
  const c = state.colony;
  const before = { people: c.people, production: c.production, satisfaction: c.satisfaction };
  c.ore -= state.plan.sellOre;
  c.mines = p.minesAfter;
  c.money = p.cash;
  c.satisfaction = p.satisfactionAfter;
  const grow = c.satisfaction > MINES_RULES.growthAbove * 10;
  const shrink = c.satisfaction < MINES_RULES.declineBelow * 10;

  let ending: Ending | null = null;
  let leak = false;
  let glut = false;
  if (c.satisfaction < MINES_RULES.revoltBelow * 10) ending = 'revolt';
  else {
    if (grow) c.production += rollSmallChange(state.rng, 20);
    if (shrink) c.production = Math.max(0, c.production - rollSmallChange(state.rng, 20));
    if (c.mines > 0 && c.people / c.mines < MINES_RULES.peoplePerMine) ending = 'overworked';
    else {
      if (grow) c.people += rollSmallChange(state.rng, 10);
      if (shrink) c.people -= rollSmallChange(state.rng, 10);
      if (c.people < MINES_RULES.minimumPeople) ending = 'depopulated';
      else {
        if (state.rng() <= MINES_RULES.leakChance) {
          leak = true;
          c.people = Math.floor(c.people / 2);
        }
        if (c.production >= MINES_RULES.glutAt) {
          glut = true;
          c.production = Math.floor(c.production / 2);
        }
        if (c.year >= MINES_RULES.years) ending = 'survived';
      }
    }
  }
  state.report = {
    year: c.year,
    income: p.income,
    spending: p.spending,
    satisfactionChange: c.satisfaction - before.satisfaction,
    productionChange: c.production - before.production,
    peopleChange: c.people - before.people,
    leak,
    glut,
    ending,
  };
  state.phase = 'report';
  state.phaseElapsed = 0;
  state.statusMessage = 'Press Enter to continue.';
}

export function continueFromReport(state: MinesState) {
  if (state.phase !== 'report' || !state.report) return;
  if (state.report.ending) {
    finish(state, state.report.ending);
    return;
  }
  state.colony.year += 1;
  beginYear(state, state.plan.food);
}

const ENDING_TEXT: Record<Ending, [string, string]> = {
  survived: ['YOU SURVIVED YOUR TERM OF OFFICE', 'Ten years, and Astron is still standing.'],
  revolt: ['THE PEOPLE REVOLTED', 'Too many lean years. They have chosen a new leader.'],
  overworked: ["YOU'VE OVERWORKED EVERYONE", 'Fewer than ten people to a mine, and they walked out.'],
  depopulated: ['NOT ENOUGH PEOPLE LEFT', 'The colony is too small to keep the mines open.'],
};

function finish(state: MinesState, ending: Ending) {
  const c = state.colony;
  const [headline, summary] = ENDING_TEXT[ending];
  const survived = ending === 'survived';
  const rank = !survived
    ? 'Removed from office'
    : c.people >= 110 ? 'Founder of Astron' : c.people >= 85 ? 'Builder' : c.people >= 60 ? 'Steady hand' : 'Caretaker';
  const debrief: MinesDebrief = {
    ending,
    headline,
    summary,
    people: c.people,
    mines: c.mines,
    money: c.money,
    yearsServed: ending === 'survived' ? MINES_RULES.years : c.year,
    score: survived ? c.people * 20 + c.mines * 100 + Math.round(c.money / 50) : 0,
    rank,
  };
  state.debrief = debrief;
  state.phase = 'debrief';
  state.phaseElapsed = 0;
  state.statusMessage = headline;
}
