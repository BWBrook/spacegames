import type { Stage } from '../../core/stage';
import { FIELDS, MINES_RULES, preview } from './state';
import type { FieldId, MinesState } from './types';

const FONT = '"Space Mono", monospace';
const money = (value: number) => `$${Math.round(value).toLocaleString('en-GB')}`;
const tenths = (value: number) => (value / 10).toFixed(1);

const FIELD_LABEL: Record<FieldId, string> = {
  sellOre: 'SELL ORE',
  sellMines: 'SELL MINES',
  food: 'FOOD, A HEAD',
  buyMines: 'BUY MINES',
};

export function renderMines(stage: Stage, title: string, state: MinesState) {
  const g = stage.ctx;
  stage.clear('#0a0507');
  g.save();
  g.textBaseline = 'alphabetic';
  const sceneBottom = Math.min(360, stage.height * 0.42);
  drawScene(g, stage, state, sceneBottom);
  drawTopBar(g, stage, title, state);
  drawMarket(g, stage, state);
  const panelTop = sceneBottom + 16;
  drawColony(g, 40, panelTop, state);
  drawOrders(g, stage.width / 2 + 10, panelTop, stage.width / 2 - 50, state);
  if (state.phase === 'report') drawReport(g, stage, state);
  if (state.phase === 'debrief') drawDebrief(g, stage, state);
  g.textAlign = 'center';
  g.fillStyle = '#e8d4d8';
  g.font = `14px ${FONT}`;
  g.fillText(state.statusMessage, stage.width / 2, stage.height - 22);
  g.restore();
}

function drawScene(g: CanvasRenderingContext2D, stage: Stage, state: MinesState, bottom: number) {
  const c = state.colony;
  const sky = g.createLinearGradient(0, 56, 0, bottom);
  sky.addColorStop(0, '#1b0d1e');
  sky.addColorStop(1, '#5a2a26');
  g.fillStyle = sky;
  g.fillRect(0, 56, stage.width, bottom - 56);
  g.fillStyle = 'rgba(255, 210, 170, 0.8)';
  g.beginPath();
  g.arc(stage.width * 0.6, 118, 34, 0, Math.PI * 2);
  g.fill();

  const ground = bottom - 70;
  g.fillStyle = '#3b1a16';
  g.fillRect(0, ground, stage.width, bottom - ground);

  // One headframe per mine, one dome per dozen people, an ore heap by volume.
  const mineCount = Math.min(18, c.mines);
  for (let i = 0; i < mineCount; i += 1) {
    const x = 70 + i * 46;
    g.strokeStyle = '#c9a07a';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(x - 12, ground);
    g.lineTo(x, ground - 52);
    g.lineTo(x + 12, ground);
    g.stroke();
    g.beginPath();
    g.arc(x, ground - 52, 7, 0, Math.PI * 2);
    g.stroke();
  }

  const glow = Math.max(0.15, Math.min(1, (c.satisfaction - 5) / 8));
  const domes = Math.min(14, Math.ceil(c.people / 12));
  for (let i = 0; i < domes; i += 1) {
    const x = stage.width * 0.52 + i * 44;
    if (x > stage.width - 40) break;
    g.fillStyle = '#8a8fa6';
    g.beginPath();
    g.arc(x, ground, 18, Math.PI, 0);
    g.fill();
    g.fillStyle = `rgba(255, 214, 120, ${glow})`;
    g.fillRect(x - 3, ground - 9, 6, 6);
  }

  const heap = Math.min(60, Math.sqrt(c.ore) * 1.1);
  if (heap > 2) {
    const hx = stage.width * 0.43;
    g.fillStyle = '#6d6570';
    g.beginPath();
    g.moveTo(hx - heap * 1.4, ground);
    g.lineTo(hx, ground - heap);
    g.lineTo(hx + heap * 1.4, ground);
    g.closePath();
    g.fill();
  }
}

function drawTopBar(g: CanvasRenderingContext2D, stage: Stage, title: string, state: MinesState) {
  g.fillStyle = 'rgba(12, 6, 10, 0.9)';
  g.fillRect(0, 0, stage.width, 56);
  g.fillStyle = '#ffb7a0';
  g.font = `600 20px ${FONT}`;
  g.textAlign = 'left';
  g.fillText(title, 24, 35);
  g.font = `12px ${FONT}`;
  g.fillStyle = '#a07a80';
  g.fillText('YEAR IN OFFICE', 260, 22);
  g.font = `600 18px ${FONT}`;
  g.fillStyle = '#ffe9e2';
  g.fillText(`${state.colony.year} / ${MINES_RULES.years}`, 260, 44);
}

function drawMarket(g: CanvasRenderingContext2D, stage: Stage, state: MinesState) {
  const x = stage.width - 330;
  const y = 72;
  g.fillStyle = 'rgba(12, 6, 10, 0.75)';
  g.fillRect(x, y, 300, 108);
  g.textAlign = 'left';
  g.fillStyle = '#a07a80';
  g.font = `12px ${FONT}`;
  g.fillText('INTERGALACTIC TRADERS', x + 14, y + 22);
  g.fillStyle = '#ffe9e2';
  g.font = `600 16px ${FONT}`;
  g.fillText(`Ore ${money(state.market.orePrice)} a ton`, x + 14, y + 48);
  g.fillText(`Mines ${money(state.market.minePrice)} each`, x + 14, y + 72);

  // Ore price history against the full range the listing can roll, 7 to 18.
  const history = state.priceHistory;
  const sx = x + 14;
  const sy = y + 96;
  const sw = 272;
  g.strokeStyle = 'rgba(255, 183, 160, 0.25)';
  g.beginPath();
  g.moveTo(sx, sy);
  g.lineTo(sx + sw, sy);
  g.stroke();
  history.forEach((price, index) => {
    const px = sx + (index / (MINES_RULES.years - 1)) * sw;
    const py = sy - ((price - 7) / 11) * 16;
    g.fillStyle = index === history.length - 1 ? '#ffd166' : 'rgba(255, 183, 160, 0.6)';
    g.fillRect(px - 2, py - 2, 4, 4);
  });
}

function stat(g: CanvasRenderingContext2D, x: number, y: number, label: string, value: string, colour = '#ffe9e2') {
  g.textAlign = 'left';
  g.fillStyle = '#a07a80';
  g.font = `12px ${FONT}`;
  g.fillText(label, x, y);
  g.fillStyle = colour;
  g.font = `600 18px ${FONT}`;
  g.fillText(value, x + 170, y);
}

function drawColony(g: CanvasRenderingContext2D, x: number, y: number, state: MinesState) {
  const c = state.colony;
  g.textAlign = 'left';
  g.fillStyle = '#ffb7a0';
  g.font = `600 14px ${FONT}`;
  g.fillText('THE COLONY', x, y + 8);
  stat(g, x, y + 40, 'PEOPLE', String(c.people));
  stat(g, x, y + 68, 'MINES', `${c.mines}  (${(c.people / Math.max(1, c.mines)).toFixed(1)} a mine)`);
  stat(g, x, y + 96, 'MONEY', money(c.money));
  stat(g, x, y + 124, 'ORE IN STORE', `${c.ore.toLocaleString('en-GB')} t`);
  stat(g, x, y + 152, 'EACH MINE MAKES', `${c.production} t a year`);
  stat(g, x, y + 180, 'SATISFACTION', tenths(c.satisfaction));

  // Revolt below 0.6; decline below 0.9; growth above 1.1.
  const barX = x;
  const barY = y + 200;
  const barW = 420;
  const zones: Array<[number, number, string]> = [
    [0, 6, 'rgba(255, 92, 92, 0.55)'],
    [6, 9, 'rgba(255, 176, 90, 0.45)'],
    [9, 12, 'rgba(200, 200, 210, 0.3)'],
    [12, 16, 'rgba(125, 255, 179, 0.45)'],
  ];
  const toX = (value: number) => barX + (Math.max(0, Math.min(16, value)) / 16) * barW;
  zones.forEach(([from, to, colour]) => {
    g.fillStyle = colour;
    g.fillRect(toX(from), barY, toX(to) - toX(from), 10);
  });
  g.fillStyle = '#ffffff';
  g.fillRect(toX(c.satisfaction) - 2, barY - 4, 4, 18);
  g.fillStyle = '#a07a80';
  g.font = `11px ${FONT}`;
  g.fillText('revolt', toX(0.2), barY + 26);
  g.fillText('decline', toX(6.4), barY + 26);
  g.fillText('steady', toX(9.6), barY + 26);
  g.fillText('growth', toX(12.4), barY + 26);
}

function drawOrders(g: CanvasRenderingContext2D, x: number, y: number, width: number, state: MinesState) {
  const c = state.colony;
  const m = state.market;
  const p = preview(state);
  g.textAlign = 'left';
  g.fillStyle = '#ffb7a0';
  g.font = `600 14px ${FONT}`;
  g.fillText("THIS YEAR'S ORDERS", x, y + 8);
  g.fillStyle = '#a07a80';
  g.font = `11px ${FONT}`;
  g.fillText('Up/Down choose · type or Left/Right to change · Shift for big steps', x + 180, y + 8);

  const lines: Record<FieldId, [string, string]> = {
    sellOre: [`${state.plan.sellOre.toLocaleString('en-GB')} t`, `of ${c.ore.toLocaleString('en-GB')} · ${money(state.plan.sellOre * m.orePrice)}`],
    sellMines: [String(state.plan.sellMines), `of ${c.mines} · ${money(state.plan.sellMines * m.minePrice)}`],
    food: [money(state.plan.food), `x ${c.people} people · ${money(state.plan.food * c.people)}`],
    buyMines: [String(state.plan.buyMines), money(state.plan.buyMines * m.minePrice)],
  };
  FIELDS.forEach((id, index) => {
    const rowY = y + 38 + index * 34;
    const active = state.phase === 'decide' && state.field === index;
    if (active) {
      g.fillStyle = 'rgba(255, 183, 160, 0.12)';
      g.fillRect(x - 8, rowY - 20, width, 30);
    }
    g.fillStyle = active ? '#ffd166' : '#a07a80';
    g.font = `12px ${FONT}`;
    g.fillText(FIELD_LABEL[id], x, rowY);
    const [value, detail] = lines[id];
    const shown = active && state.typing !== null ? `${state.typing}_` : value;
    g.fillStyle = '#ffe9e2';
    g.font = `600 17px ${FONT}`;
    g.fillText(shown, x + 150, rowY);
    g.fillStyle = '#a07a80';
    g.font = `12px ${FONT}`;
    g.fillText(detail, x + 280, rowY);
  });

  const foodNote = p.foodEffect > 0
    ? ['Over $120 a head: satisfaction rises', '#7dffb3']
    : p.foodEffect < 0
      ? ['Under $80 a head: satisfaction falls', '#ff8f8f']
      : ['$80 to $120 a head: satisfaction holds', '#d8c8cc'];
  const after = p.satisfactionAfter;
  const trend = after < MINES_RULES.revoltBelow * 10
    ? ['They will revolt', '#ff5c5c']
    : after > MINES_RULES.growthAbove * 10
      ? ['The colony will grow and the mines improve', '#7dffb3']
      : after < MINES_RULES.declineBelow * 10
        ? ['The colony will shrink and the mines decline', '#ffb07a']
        : ['The colony will hold steady', '#d8c8cc'];
  const notes: Array<[string, string]> = [
    [`Money left after these orders: ${money(p.cash)}`, p.valid ? '#ffe9e2' : '#ff5c5c'],
    [foodNote[0]!, foodNote[1]!],
    [
      p.minesAfter > 0
        ? `${p.peoplePerMine.toFixed(1)} people a mine${p.overworked ? ': fewer than ten, they will walk out' : ''}`
        : 'No mines at all: no ore next year',
      p.overworked ? '#ff5c5c' : '#d8c8cc',
    ],
    [`Satisfaction ${tenths(after)}: ${trend[0]}`, trend[1]!],
  ];
  notes.forEach(([text, colour], index) => {
    g.fillStyle = colour;
    g.font = `13px ${FONT}`;
    g.fillText(text, x, y + 190 + index * 22);
  });
}

function panel(g: CanvasRenderingContext2D, stage: Stage, height: number, border: string) {
  const w = Math.min(640, stage.width - 80);
  const x = (stage.width - w) / 2;
  const y = (stage.height - height) / 2;
  g.fillStyle = 'rgba(10, 5, 8, 0.96)';
  g.fillRect(x, y, w, height);
  g.strokeStyle = border;
  g.lineWidth = 2;
  g.strokeRect(x, y, w, height);
  return { x, y, w };
}

function drawReport(g: CanvasRenderingContext2D, stage: Stage, state: MinesState) {
  const r = state.report!;
  const { x, y, w } = panel(g, stage, 300, r.ending && r.ending !== 'survived' ? '#ff5c5c' : '#ffb7a0');
  g.textAlign = 'center';
  g.fillStyle = '#a07a80';
  g.font = `12px ${FONT}`;
  g.fillText(`END OF YEAR ${r.year}`, x + w / 2, y + 28);
  const signed = (v: number, unit = '') => (v === 0 ? 'no change' : `${v > 0 ? '+' : ''}${v}${unit}`);
  const rows: Array<[string, string]> = [
    ['Traders paid', money(r.income)],
    ['Spent on food and mines', money(r.spending)],
    ['Satisfaction', signed(r.satisfactionChange / 10)],
    ['Each mine makes', signed(r.productionChange, ' t')],
    ['People', signed(r.peopleChange)],
  ];
  rows.forEach(([label, value], index) => {
    g.textAlign = 'left';
    g.fillStyle = '#d8c8cc';
    g.font = `14px ${FONT}`;
    g.fillText(label, x + 60, y + 66 + index * 26);
    g.textAlign = 'right';
    g.fillStyle = '#ffe9e2';
    g.fillText(value, x + w - 60, y + 66 + index * 26);
  });
  g.textAlign = 'center';
  let line = y + 212;
  if (r.leak) {
    g.fillStyle = '#ff8f8f';
    g.fillText('RADIOACTIVE LEAK....MANY DIE', x + w / 2, line);
    line += 22;
  }
  if (r.glut) {
    g.fillStyle = '#ffd166';
    g.fillText('MARKET GLUT - PRICE DROPS: traders take half as much from each mine', x + w / 2, line);
    line += 22;
  }
  if (r.ending && r.ending !== 'survived') {
    g.fillStyle = '#ff5c5c';
    g.font = `600 16px ${FONT}`;
    g.fillText('Your term is over.', x + w / 2, line);
  }
}

function drawDebrief(g: CanvasRenderingContext2D, stage: Stage, state: MinesState) {
  const d = state.debrief!;
  const { x, y, w } = panel(g, stage, 260, d.ending === 'survived' ? '#7dffb3' : '#ff5c5c');
  g.textAlign = 'center';
  g.fillStyle = '#a07a80';
  g.font = `12px ${FONT}`;
  g.fillText('HISTORY OF ASTRON', x + w / 2, y + 28);
  g.fillStyle = d.ending === 'survived' ? '#7dffb3' : '#ff8f8f';
  g.font = `600 22px ${FONT}`;
  g.fillText(d.headline, x + w / 2, y + 68);
  g.fillStyle = '#ffe9e2';
  g.font = `15px ${FONT}`;
  g.fillText(d.summary, x + w / 2, y + 102);
  g.fillStyle = '#ffb7a0';
  g.fillText(`${d.people} people · ${d.mines} mines · ${money(d.money)} · ${d.yearsServed} years`, x + w / 2, y + 138);
  g.fillStyle = '#ffd166';
  g.font = `600 15px ${FONT}`;
  g.fillText(`${d.rank} · score ${d.score}`, x + w / 2, y + 170);
  g.fillStyle = '#a07a80';
  g.font = `13px ${FONT}`;
  g.fillText('Press Enter to stand for office again.', x + w / 2, y + 226);
}
