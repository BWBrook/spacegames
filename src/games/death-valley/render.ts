import type { Stage } from '../../core/stage';
import { FLIGHT, VALLEY_RULES, halfWidth, rowsPerSecond, safeBounds } from './state';
import type { ValleyState } from './types';

const FONT = '"Space Mono", monospace';
const ROW_HEIGHT = 62;

interface Frame {
  colW: number;
  x0: number;
  shipY: number;
}

function frame(stage: Stage): Frame {
  const colW = (stage.width - 160) / 44;
  return { colW, x0: 80, shipY: stage.height * 0.76 };
}

const toX = (f: Frame, column: number) => f.x0 + column * f.colW;

export function renderValley(stage: Stage, title: string, state: ValleyState) {
  const g = stage.ctx;
  stage.clear('#020104');
  g.save();
  g.textBaseline = 'alphabetic';
  const f = frame(stage);
  const shake = state.phase === 'ended' && !state.debrief?.escaped
    ? Math.max(0, 1 - state.phaseElapsed / 0.6) * 12
    : 0;
  if (shake) g.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
  if (state.phase === 'briefing') drawBriefing(g, stage, state);
  else {
    drawValley(g, stage, f, state);
    drawTrail(g, f, state);
    drawShip(g, f, state);
    drawProgress(g, stage, state);
  }
  if (state.phase === 'debrief' && state.debrief) drawDebrief(g, stage, state);
  drawTopBar(g, stage, title, state);
  drawStatus(g, stage, state);
  g.restore();
}

function drawValley(g: CanvasRenderingContext2D, stage: Stage, f: Frame, state: ValleyState) {
  const behind = 5;
  const from = Math.max(0, state.distance - behind);
  const to = state.distance + FLIGHT.lookahead + 1;
  const step = 0.1;
  const edgeBand = 26;
  for (let d = from; d < to; d += step) {
    const yTop = f.shipY - (d + step - state.distance) * ROW_HEIGHT;
    const height = step * ROW_HEIGHT + 1;
    const a = safeBounds(state, d);
    const b = safeBounds(state, d + step);
    const leftEdge = toX(f, Math.min(a.min, b.min));
    const rightEdge = toX(f, Math.max(a.max, b.max));
    // Strata: a slow per-row variation so the rock does not read as flat slabs.
    const row = Math.floor(d);
    const strata = 0.82 + 0.18 * Math.sin(row * 1.7 + Math.sin(row * 0.37) * 3);
    const deep = `rgb(${Math.round(58 * strata)}, ${Math.round(28 * strata)}, ${Math.round(22 * strata)})`;
    const face = `rgb(${Math.round(150 * strata)}, ${Math.round(78 * strata)}, ${Math.round(52 * strata)})`;
    g.fillStyle = deep;
    g.fillRect(0, yTop, Math.max(0, leftEdge - edgeBand), height);
    g.fillRect(rightEdge + edgeBand, yTop, stage.width - rightEdge - edgeBand, height);
    g.fillStyle = face;
    g.fillRect(Math.max(0, leftEdge - edgeBand), yTop, Math.min(edgeBand, leftEdge), height);
    g.fillRect(rightEdge, yTop, edgeBand, height);
    g.fillStyle = 'rgba(255, 170, 110, 0.9)';
    g.fillRect(leftEdge - 2, yTop, 2, height);
    g.fillRect(rightEdge, yTop, 2, height);
  }

  // Headlights: lit close in, falling smoothly to dark a few rows ahead. The
  // listing showed no valley ahead at all, only where you had been.
  const litTop = f.shipY - (FLIGHT.lookahead - 3) * ROW_HEIGHT;
  const darkTop = f.shipY - FLIGHT.lookahead * ROW_HEIGHT;
  const fade = g.createLinearGradient(0, darkTop, 0, litTop);
  fade.addColorStop(0, 'rgba(2, 1, 4, 1)');
  fade.addColorStop(1, 'rgba(2, 1, 4, 0)');
  g.fillStyle = fade;
  g.fillRect(0, darkTop, stage.width, litTop - darkTop);
  g.fillStyle = 'rgb(2, 1, 4)';
  g.fillRect(0, 0, stage.width, darkTop);
}

function drawTrail(g: CanvasRenderingContext2D, f: Frame, state: ValleyState) {
  // A nod to the asterisks the listing leaves scrolling up the screen.
  state.trail.forEach((point, index) => {
    const age = state.trail.length - index;
    const y = f.shipY + (state.distance - point.distance) * ROW_HEIGHT;
    g.fillStyle = `rgba(160, 220, 255, ${Math.max(0, 0.5 - age / 80)})`;
    g.fillRect(toX(f, point.x) - 1.5, y, 3, 3);
  });
}

function drawShip(g: CanvasRenderingContext2D, f: Frame, state: ValleyState) {
  const x = toX(f, state.shipX);
  const y = f.shipY;
  if (state.phase === 'ended' && !state.debrief?.escaped) {
    const burst = Math.min(1, state.phaseElapsed / 0.9);
    g.fillStyle = `rgba(255, 200, 140, ${1 - burst})`;
    g.beginPath();
    g.arc(x, y, 10 + burst * 70, 0, Math.PI * 2);
    g.fill();
    return;
  }
  const bank = Math.max(-1, Math.min(1, state.lateral / 12));
  g.save();
  g.translate(x, y);
  g.rotate(bank * 0.35);
  g.scale(1.4, 1.4);
  const flame = 0.7 + 0.3 * Math.sin(state.elapsed * 40);
  g.fillStyle = `rgba(120, 200, 255, ${flame})`;
  g.beginPath();
  g.moveTo(-5, 10);
  g.lineTo(5, 10);
  g.lineTo(0, 22 + flame * 8);
  g.closePath();
  g.fill();
  g.fillStyle = '#e8f4ff';
  g.beginPath();
  g.moveTo(0, -16);
  g.lineTo(9, 10);
  g.lineTo(0, 5);
  g.lineTo(-9, 10);
  g.closePath();
  g.fill();
  g.restore();
}

function drawProgress(g: CanvasRenderingContext2D, stage: Stage, state: ValleyState) {
  const width = Math.min(520, stage.width - 200);
  const x = (stage.width - width) / 2;
  const y = 72;
  const progress = Math.min(1, state.distance / VALLEY_RULES.rows);
  g.fillStyle = 'rgba(255,255,255,0.08)';
  g.fillRect(x, y, width, 6);
  g.fillStyle = '#ff9a5a';
  g.fillRect(x, y, width * progress, 6);
}

function drawTopBar(g: CanvasRenderingContext2D, stage: Stage, title: string, state: ValleyState) {
  g.fillStyle = 'rgba(8, 4, 4, 0.88)';
  g.fillRect(0, 0, stage.width, 56);
  g.fillStyle = '#ffb07a';
  g.font = `600 20px ${FONT}`;
  g.textAlign = 'left';
  g.fillText(title, 24, 35);
  if (state.phase === 'briefing') return;
  const cells: Array<[string, string]> = [
    ['WIDTH', String(state.width)],
    ['ROWS', `${Math.min(VALLEY_RULES.rows, Math.floor(state.distance))} / ${VALLEY_RULES.rows}`],
    ['SPEED', `${rowsPerSecond(state).toFixed(1)}/s`],
  ];
  cells.forEach(([label, value], index) => {
    const x = 250 + index * 140;
    g.font = `12px ${FONT}`;
    g.fillStyle = '#9a6a4c';
    g.fillText(label, x, 22);
    g.font = `600 18px ${FONT}`;
    g.fillStyle = '#ffe8d8';
    g.fillText(value, x, 44);
  });
}

function drawBriefing(g: CanvasRenderingContext2D, stage: Stage, state: ValleyState) {
  const cx = stage.width / 2;
  const top = stage.height * 0.24;
  g.textAlign = 'center';
  g.fillStyle = '#ffe8d8';
  g.font = `600 26px ${FONT}`;
  g.fillText('One way out, and it is Death Valley', cx, top);
  g.fillStyle = '#d9a888';
  g.font = `15px ${FONT}`;
  g.fillText('Fly your Speed Dart the length of the ravine without touching the walls.', cx, top + 34);
  g.fillText('Try 15 first and work your way down. 8 is quite difficult.', cx, top + 58);

  g.fillStyle = '#9a6a4c';
  g.font = `12px ${FONT}`;
  g.fillText('WIDTH', cx, top + 108);
  g.fillStyle = '#ffe8d8';
  g.font = `600 54px ${FONT}`;
  g.fillText(String(state.width), cx, top + 168);
  const w = halfWidth(state.width);
  g.fillStyle = '#d9a888';
  g.font = `14px ${FONT}`;
  g.fillText(`${2 * w - 1} columns of clear air between the walls`, cx, top + 200);

  const columns = Math.max(1, 2 * w - 1);
  const cell = 16;
  const barX = cx - (columns * cell) / 2;
  for (let i = 0; i < columns; i += 1) {
    g.fillStyle = i === Math.floor(columns / 2) ? '#e8f4ff' : 'rgba(255, 176, 122, 0.25)';
    g.fillRect(barX + i * cell + 2, top + 222, cell - 4, 14);
  }
  g.fillStyle = '#ff9a5a';
  g.fillRect(barX - 10, top + 216, 6, 26);
  g.fillRect(barX + columns * cell + 4, top + 216, 6, 26);

  g.fillStyle = '#9a6a4c';
  g.font = `12px ${FONT}`;
  g.fillText('Left and Right choose · Enter to fly · steer with Q and P, or the arrows', cx, top + 278);
}

function drawDebrief(g: CanvasRenderingContext2D, stage: Stage, state: ValleyState) {
  const d = state.debrief!;
  const w = Math.min(680, stage.width - 80);
  const h = 250;
  const x = (stage.width - w) / 2;
  const y = (stage.height - h) / 2;
  g.fillStyle = 'rgba(6, 3, 3, 0.95)';
  g.fillRect(x, y, w, h);
  g.strokeStyle = d.escaped ? '#7dffb3' : '#ff5c5c';
  g.lineWidth = 2;
  g.strokeRect(x, y, w, h);
  g.textAlign = 'center';
  g.fillStyle = '#9a6a4c';
  g.font = `12px ${FONT}`;
  g.fillText('FLIGHT RECORDER', stage.width / 2, y + 28);
  g.fillStyle = d.escaped ? '#7dffb3' : '#ff8f8f';
  g.font = `600 19px ${FONT}`;
  g.fillText(d.headline, stage.width / 2, y + 68);
  g.fillStyle = '#ffe8d8';
  g.font = `15px ${FONT}`;
  g.fillText(d.summary, stage.width / 2, y + 104);
  g.fillStyle = '#ffb07a';
  g.fillText(
    `Width ${d.width} · ${d.rows} rows · closest shave ${d.closestShave.toFixed(2)} columns · score ${d.score}`,
    stage.width / 2,
    y + 144,
  );
  g.fillStyle = '#9a6a4c';
  g.font = `13px ${FONT}`;
  g.fillText('Press Enter to choose a width and fly again.', stage.width / 2, y + h - 24);
}

function drawStatus(g: CanvasRenderingContext2D, stage: Stage, state: ValleyState) {
  if (state.phase === 'briefing' || state.phase === 'debrief') return;
  g.textAlign = 'center';
  g.fillStyle = '#ffe8d8';
  g.font = `15px ${FONT}`;
  g.fillText(state.statusMessage, stage.width / 2, stage.height - 40);
}
