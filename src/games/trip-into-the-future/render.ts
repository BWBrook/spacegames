import type { Stage } from '../../core/stage';
import { LISTING_TEXT, TRIP_RULES, VOYAGE, currentMission, lastResult, lorentz, survivalFraction } from './state';
import type { TripState, TripVerdict } from './types';

const FONT = '"Space Mono", monospace';
const VERDICT_COLOUR: Record<TripVerdict, string> = {
  'on-time': '#7dffb3',
  'not-close': '#ffd166',
  died: '#ff6b6b',
};

export function renderTrip(stage: Stage, title: string, state: TripState) {
  const g = stage.ctx;
  stage.clear('#03030b');
  g.save();
  g.textBaseline = 'alphabetic';
  drawStars(g, stage, state);
  drawTopBar(g, stage, title, state);
  if (state.phase === 'plan') drawPlan(g, stage, state);
  else if (state.phase === 'debrief') drawDebrief(g, stage, state);
  else drawVoyage(g, stage, state);
  drawStatus(g, stage, state);
  g.restore();
}

function drawStars(g: CanvasRenderingContext2D, stage: Stage, state: TripState) {
  const warp = state.phase === 'voyage' ? lorentz(lastResult(state)?.speed ?? 0) : 1;
  for (let i = 0; i < 110; i += 1) {
    const x = ((i * 811) % 1000) / 1000 * stage.width;
    const y = ((i * 367) % 1000) / 1000 * stage.height;
    const tint = (i * 53) % 3;
    g.fillStyle = tint === 0 ? 'rgba(170, 190, 255, 0.55)' : tint === 1 ? 'rgba(255, 210, 190, 0.4)' : 'rgba(220, 230, 255, 0.45)';
    const stretch = state.phase === 'voyage' ? Math.min(40, warp * 3) : 2;
    g.fillRect(x, y, stretch, 2);
  }
}

function drawTopBar(g: CanvasRenderingContext2D, stage: Stage, title: string, state: TripState) {
  g.fillStyle = 'rgba(6, 5, 18, 0.88)';
  g.fillRect(0, 0, stage.width, 56);
  g.fillStyle = '#b9b3ff';
  g.font = `600 20px ${FONT}`;
  g.textAlign = 'left';
  g.fillText(title, 24, 35);
  if (state.phase === 'debrief') return;
  const score = state.results.reduce((sum, result) => sum + result.score, 0);
  const cells: Array<[string, string]> = [
    ['MISSION', `${state.index + 1} / ${state.missions.length}`],
    ['ON TIME', String(state.results.filter(r => r.verdict === 'on-time').length)],
    ['SCORE', String(score)],
  ];
  cells.forEach(([label, value], index) => {
    const x = 330 + index * 130;
    g.font = `12px ${FONT}`;
    g.fillStyle = '#7a74b5';
    g.fillText(label, x, 22);
    g.font = `600 18px ${FONT}`;
    g.fillStyle = '#eceaff';
    g.fillText(value, x, 44);
  });
}

function drawPlan(g: CanvasRenderingContext2D, stage: Stage, state: TripState) {
  const mission = currentMission(state);
  const gamma = lorentz(state.speed);
  const left = 64;
  const top = 110;

  g.textAlign = 'left';
  g.fillStyle = '#7a74b5';
  g.font = `12px ${FONT}`;
  g.fillText('ORDERS', left, top);
  g.fillStyle = '#eceaff';
  g.font = `600 26px ${FONT}`;
  g.fillText(`Return ${mission.target} years into Earth's future.`, left, top + 34);
  g.fillStyle = '#b9b3ff';
  g.font = `15px ${FONT}`;
  g.fillText(`You set out aged ${VOYAGE.startingAge} and will not live past ${VOYAGE.startingAge + TRIP_RULES.lifespan}.`, left, top + 64);
  g.fillText(`Engines this mission reach ${mission.engineCap.toFixed(3)} of light speed.`, left, top + 88);

  const dialTop = top + 150;
  drawDial(g, left, dialTop, 'SPEED', `${state.speed.toFixed(3)} c`, state.speed / mission.engineCap, 'Up / Down');
  drawDial(g, left, dialTop + 118, 'DISTANCE', `${state.distance.toFixed(1)} ly`, state.distance / VOYAGE.maxDistance, 'Left / Right');

  g.fillStyle = '#7a74b5';
  g.font = `12px ${FONT}`;
  g.fillText('TIME DILATION AT THIS SPEED', left, dialTop + 262);
  g.fillStyle = '#ffd166';
  g.font = `600 22px ${FONT}`;
  g.fillText(`1 year aboard = ${gamma.toFixed(2)} years on Earth`, left, dialTop + 292);

  drawGammaCurve(g, stage, state);
}

function drawDial(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  value: string,
  fraction: number,
  keys: string,
) {
  g.fillStyle = '#7a74b5';
  g.font = `12px ${FONT}`;
  g.fillText(`${label} · ${keys} · hold Shift for fine`, x, y);
  g.fillStyle = '#eceaff';
  g.font = `600 34px ${FONT}`;
  g.fillText(value, x, y + 42);
  const width = 360;
  g.fillStyle = 'rgba(255,255,255,0.07)';
  g.fillRect(x, y + 58, width, 8);
  g.fillStyle = '#b9b3ff';
  g.fillRect(x, y + 58, width * Math.max(0, Math.min(1, fraction)), 8);
}

function drawGammaCurve(g: CanvasRenderingContext2D, stage: Stage, state: TripState) {
  const mission = currentMission(state);
  const width = Math.min(460, stage.width * 0.34);
  const height = 300;
  const x = stage.width - width - 64;
  const y = 150;
  const maxGamma = 8;
  const toX = (v: number) => x + v * width;
  const toY = (gamma: number) => y + height - ((Math.min(maxGamma, gamma) - 1) / (maxGamma - 1)) * height;

  g.strokeStyle = 'rgba(185, 179, 255, 0.35)';
  g.lineWidth = 1;
  g.strokeRect(x + 0.5, y + 0.5, width, height);
  g.fillStyle = '#7a74b5';
  g.font = `11px ${FONT}`;
  g.textAlign = 'center';
  g.fillText('speed, fraction of light →', x + width / 2, y + height + 22);
  g.textAlign = 'right';
  for (const tick of [1, 2, 4, 6, 8]) g.fillText(String(tick), x - 8, toY(tick) + 4);
  g.textAlign = 'left';
  g.fillText('years on Earth per year aboard', x, y - 10);

  // Beyond the engine rating the curve is out of reach.
  g.fillStyle = 'rgba(255, 107, 107, 0.08)';
  g.fillRect(toX(mission.engineCap), y, x + width - toX(mission.engineCap), height);
  g.strokeStyle = 'rgba(255, 107, 107, 0.6)';
  g.beginPath();
  g.moveTo(toX(mission.engineCap), y);
  g.lineTo(toX(mission.engineCap), y + height);
  g.stroke();

  g.strokeStyle = '#b9b3ff';
  g.lineWidth = 2;
  g.beginPath();
  for (let i = 0; i <= 200; i += 1) {
    const v = (i / 200) * 0.995;
    const px = toX(v);
    const py = toY(lorentz(v));
    if (i === 0) g.moveTo(px, py);
    else g.lineTo(px, py);
  }
  g.stroke();

  const gamma = lorentz(state.speed);
  g.fillStyle = '#ffd166';
  g.beginPath();
  g.arc(toX(state.speed), toY(gamma), 7, 0, Math.PI * 2);
  g.fill();
}

function drawVoyage(g: CanvasRenderingContext2D, stage: Stage, state: TripState) {
  const result = lastResult(state);
  if (!result) return;
  const lastMoment = survivalFraction(result);
  const progress = state.phase === 'voyage'
    ? Math.min(lastMoment, state.phaseElapsed / VOYAGE.voyageSeconds)
    : lastMoment;

  const earthX = stage.width * 0.16;
  const starX = stage.width * 0.84;
  const laneY = stage.height * 0.36;
  g.fillStyle = '#4f8dff';
  g.beginPath();
  g.arc(earthX, laneY, 22, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#ffe9a8';
  g.beginPath();
  g.arc(starX, laneY, 14, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = 'rgba(185, 179, 255, 0.2)';
  g.setLineDash([4, 8]);
  g.beginPath();
  g.moveTo(earthX, laneY);
  g.lineTo(starX, laneY);
  g.stroke();
  g.setLineDash([]);

  const leg = progress < 0.5 ? progress * 2 : 2 - progress * 2;
  const shipX = earthX + (starX - earthX) * leg;
  const alive = !(result.verdict === 'died' && progress >= lastMoment - 1e-6 && state.phase === 'arrival');
  g.fillStyle = alive ? '#eceaff' : '#555070';
  g.beginPath();
  const heading = progress < 0.5 ? 1 : -1;
  g.moveTo(shipX + 14 * heading, laneY - 34);
  g.lineTo(shipX - 10 * heading, laneY - 42);
  g.lineTo(shipX - 10 * heading, laneY - 26);
  g.closePath();
  g.fill();

  const shipYears = result.shipYears * progress;
  const earthYears = result.earthYears * progress;
  drawClock(g, stage.width * 0.28, stage.height * 0.56, 'ABOARD SHIP', shipYears, `your age ${(VOYAGE.startingAge + shipYears).toFixed(1)}`, alive ? '#eceaff' : '#ff6b6b');
  drawClock(g, stage.width * 0.72, stage.height * 0.56, 'ON EARTH', earthYears, `target ${result.mission.target}`, '#b9b3ff');

  if (state.phase !== 'arrival') return;
  const text = LISTING_TEXT[result.verdict];
  g.textAlign = 'center';
  g.fillStyle = VERDICT_COLOUR[result.verdict];
  g.font = `600 30px ${FONT}`;
  g.fillText(text, stage.width / 2, stage.height * 0.8);
  g.fillStyle = '#7a74b5';
  g.font = `13px ${FONT}`;
  g.fillText('Press Enter for the next mission.', stage.width / 2, stage.height * 0.8 + 30);
}

function drawClock(
  g: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  label: string,
  years: number,
  caption: string,
  colour: string,
) {
  g.textAlign = 'center';
  g.fillStyle = '#7a74b5';
  g.font = `12px ${FONT}`;
  g.fillText(label, cx, cy - 46);
  g.fillStyle = colour;
  g.font = `600 44px ${FONT}`;
  g.fillText(`${years.toFixed(1)} yr`, cx, cy);
  g.fillStyle = '#b9b3ff';
  g.font = `14px ${FONT}`;
  g.fillText(caption, cx, cy + 30);
}

function drawDebrief(g: CanvasRenderingContext2D, stage: Stage, state: TripState) {
  const d = state.debrief!;
  const w = Math.min(760, stage.width - 80);
  const h = 380;
  const x = (stage.width - w) / 2;
  const y = (stage.height - h) / 2;
  g.fillStyle = 'rgba(4, 3, 14, 0.95)';
  g.fillRect(x, y, w, h);
  g.strokeStyle = d.died ? '#ffd166' : '#7dffb3';
  g.lineWidth = 2;
  g.strokeRect(x, y, w, h);
  g.textAlign = 'center';
  g.fillStyle = '#7a74b5';
  g.font = `12px ${FONT}`;
  g.fillText('VOYAGE LOG', stage.width / 2, y + 28);
  g.fillStyle = d.died ? '#ffd166' : '#7dffb3';
  g.font = `600 30px ${FONT}`;
  g.fillText(d.headline, stage.width / 2, y + 70);
  g.fillStyle = '#eceaff';
  g.font = `15px ${FONT}`;
  g.fillText(d.summary, stage.width / 2, y + 102);
  g.fillStyle = '#b9b3ff';
  g.fillText(`Score ${d.score}`, stage.width / 2, y + 128);

  const columns = ['TARGET', 'SPEED', 'DISTANCE', 'EARTH', 'ABOARD', 'RESULT'];
  const colX = columns.map((_, i) => x + 56 + i * ((w - 112) / (columns.length - 1)));
  g.fillStyle = '#7a74b5';
  g.font = `11px ${FONT}`;
  columns.forEach((label, i) => g.fillText(label, colX[i] ?? x, y + 170));
  state.results.forEach((result, row) => {
    const ry = y + 198 + row * 28;
    const cells = [
      `${result.mission.target}`,
      `${result.speed.toFixed(3)}c`,
      `${result.distance.toFixed(1)} ly`,
      `${result.earthYears.toFixed(1)}`,
      `${result.shipYears.toFixed(1)}`,
      result.verdict === 'on-time' ? 'on time' : result.verdict === 'died' ? 'died' : 'missed',
    ];
    cells.forEach((cell, i) => {
      g.fillStyle = i === 5 ? VERDICT_COLOUR[result.verdict] : '#eceaff';
      g.font = `13px ${FONT}`;
      g.fillText(cell, colX[i] ?? x, ry);
    });
  });
  g.fillStyle = '#7a74b5';
  g.font = `13px ${FONT}`;
  g.fillText('Press Enter to fly five more.', stage.width / 2, y + h - 18);
}

function drawStatus(g: CanvasRenderingContext2D, stage: Stage, state: TripState) {
  g.textAlign = 'center';
  g.fillStyle = '#eceaff';
  g.font = `15px ${FONT}`;
  g.fillText(state.statusMessage, stage.width / 2, stage.height - 52);
  g.fillStyle = '#7a74b5';
  g.font = `12px ${FONT}`;
  const hint = state.phase === 'plan' ? 'Enter launches · Esc leaves' : 'Esc leaves';
  g.fillText(hint, stage.width / 2, stage.height - 28);
}
