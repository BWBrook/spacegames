import type { Stage } from '../../core/stage';
import { BUG_EYES_RULES, HUNT_CONSTANTS } from './state';
import type { BugEyesState } from './types';

const FONT = '"Space Mono", monospace';

/** Left, top, right, bottom: keys 1-4 ring the player, so a miss reads as encirclement. */
const BEARINGS = [Math.PI, -Math.PI / 2, 0, Math.PI / 2];

interface Field {
  cx: number;
  cy: number;
  reach: number;
}

function field(stage: Stage): Field {
  const cy = stage.height / 2 + 14;
  return {
    cx: stage.width / 2,
    cy,
    reach: Math.min(stage.width * 0.3, stage.height * 0.34),
  };
}

function stationPoint(f: Field, index: number, advance: number) {
  const bearing = BEARINGS[index] ?? 0;
  const closeness = advance / HUNT_CONSTANTS.caughtAt;
  const distance = f.reach * (1 - 0.62 * closeness);
  return { x: f.cx + Math.cos(bearing) * distance, y: f.cy + Math.sin(bearing) * distance };
}

export function renderBugEyes(stage: Stage, title: string, state: BugEyesState) {
  const g = stage.ctx;
  const f = field(stage);
  stage.clear('#050409');
  g.save();
  g.textBaseline = 'alphabetic';
  drawGround(g, stage, state);
  drawTopBar(g, stage, title, state);
  for (let i = 0; i < BUG_EYES_RULES.positions; i += 1) drawStation(g, f, state, i);
  drawPlayer(g, f, state);
  if (state.phase === 'resolve' && state.lastResult === 'hit') drawBeam(g, f, state);
  drawStatus(g, stage, state);
  if (state.phase === 'debrief' && state.debrief) drawDebrief(g, stage, state);
  g.restore();
}

function drawGround(g: CanvasRenderingContext2D, stage: Stage, state: BugEyesState) {
  const threat = Math.max(...state.stations.map(s => s.advance)) / HUNT_CONSTANTS.caughtAt;
  const gradient = g.createRadialGradient(
    stage.width / 2, stage.height / 2, 40,
    stage.width / 2, stage.height / 2, stage.height * 0.75,
  );
  gradient.addColorStop(0, 'rgba(60, 40, 20, 0.35)');
  gradient.addColorStop(1, `rgba(${40 + 90 * threat}, 10, 20, ${0.35 + 0.3 * threat})`);
  g.fillStyle = gradient;
  g.fillRect(0, 0, stage.width, stage.height);
  g.fillStyle = 'rgba(190, 210, 255, 0.28)';
  for (let i = 0; i < 70; i += 1) {
    const x = ((i * 733) % 1000) / 1000 * stage.width;
    const y = ((i * 419) % 1000) / 1000 * stage.height;
    g.globalAlpha = 0.15 + 0.35 * (0.5 + 0.5 * Math.sin(state.elapsed + i));
    g.fillRect(x, y, 2, 2);
  }
  g.globalAlpha = 1;
}

function drawTopBar(g: CanvasRenderingContext2D, stage: Stage, title: string, state: BugEyesState) {
  g.fillStyle = 'rgba(6, 5, 12, 0.85)';
  g.fillRect(0, 0, stage.width, 58);
  g.fillStyle = '#ffd166';
  g.font = `600 20px ${FONT}`;
  g.textAlign = 'left';
  g.fillText(title, 24, 36);

  g.font = `13px ${FONT}`;
  g.fillStyle = '#c08a72';
  g.fillText('BUG', 250, 24);
  g.fillStyle = '#ffe2b0';
  g.font = `600 18px ${FONT}`;
  const facing = Math.min(state.bugIndex + 1, BUG_EYES_RULES.bugs);
  g.fillText(`${facing} / ${BUG_EYES_RULES.bugs}`, 250, 46);

  g.font = `13px ${FONT}`;
  g.fillStyle = '#c08a72';
  g.fillText('BLASTED', 360, 24);
  g.fillStyle = '#7dffb3';
  g.font = `600 18px ${FONT}`;
  g.fillText(String(state.blasted), 360, 46);

  const runX = stage.width - 24 - BUG_EYES_RULES.bugs * 18;
  g.font = `13px ${FONT}`;
  g.fillStyle = '#c08a72';
  g.textAlign = 'left';
  g.fillText('RUN', runX, 24);
  state.history.forEach((record, index) => {
    g.fillStyle = record.result === 'hit' ? '#7dffb3' : '#ff6b6b';
    g.fillRect(runX + index * 18, 34, 12, 12);
  });
  for (let i = state.history.length; i < BUG_EYES_RULES.bugs; i += 1) {
    g.strokeStyle = 'rgba(255, 226, 176, 0.28)';
    g.lineWidth = 1;
    g.strokeRect(runX + i * 18 + 0.5, 34.5, 11, 11);
  }
}

function drawStation(g: CanvasRenderingContext2D, f: Field, state: BugEyesState, index: number) {
  const station = state.stations[index];
  if (!station) return;
  const point = stationPoint(f, index, station.advance);
  const scale = 1 + 0.28 * (station.advance / HUNT_CONSTANTS.caughtAt);
  const active = state.activeStation === index;
  const exposed = active && state.phase === 'exposed';
  const resolving = active && state.phase === 'resolve';

  g.save();
  g.translate(point.x, point.y);
  g.scale(scale, scale);

  g.fillStyle = station.advance > 0 ? '#3a2130' : '#2a2436';
  g.beginPath();
  g.moveTo(-46, 26);
  g.lineTo(-30, -16);
  g.lineTo(-6, -24);
  g.lineTo(18, -14);
  g.lineTo(44, 26);
  g.closePath();
  g.fill();
  g.strokeStyle = 'rgba(255, 209, 102, 0.22)';
  g.lineWidth = 1.5;
  g.stroke();

  if (exposed || (resolving && state.lastResult !== 'hit')) {
    const glow = 0.65 + 0.35 * Math.sin(state.elapsed * 14);
    g.fillStyle = `rgba(255, 90, 120, ${glow})`;
    g.beginPath();
    g.arc(-11, -30, 7, 0, Math.PI * 2);
    g.arc(11, -30, 7, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#fff';
    g.beginPath();
    g.arc(-11, -30, 2.6, 0, Math.PI * 2);
    g.arc(11, -30, 2.6, 0, Math.PI * 2);
    g.fill();
  }

  if (resolving && state.lastResult === 'hit') {
    const fade = 1 - Math.min(1, state.phaseElapsed / HUNT_CONSTANTS.resolveSeconds);
    g.fillStyle = `rgba(255, 240, 180, ${fade})`;
    g.beginPath();
    g.arc(0, -30, 34 * (1.2 - fade * 0.6), 0, Math.PI * 2);
    g.fill();
  }

  g.restore();

  const badgeY = point.y + 50 * scale;
  g.beginPath();
  g.arc(point.x, badgeY, 15, 0, Math.PI * 2);
  g.fillStyle = exposed ? 'rgba(255, 209, 102, 0.9)' : 'rgba(20, 16, 28, 0.9)';
  g.fill();
  g.strokeStyle = exposed ? '#fff3d0' : 'rgba(255, 209, 102, 0.5)';
  g.lineWidth = 1.5;
  g.stroke();
  g.fillStyle = exposed ? '#2a1c06' : '#ffd166';
  g.font = `600 16px ${FONT}`;
  g.textAlign = 'center';
  g.fillText(String(station.key), point.x, badgeY + 6);

  for (let pip = 0; pip < HUNT_CONSTANTS.caughtAt; pip += 1) {
    const px = point.x - 16 + pip * 16;
    const py = badgeY + 28;
    g.fillStyle = pip < station.advance ? '#ff6b6b' : 'rgba(255, 107, 107, 0.2)';
    g.fillRect(px, py, 11, 4);
  }
}

function drawPlayer(g: CanvasRenderingContext2D, f: Field, state: BugEyesState) {
  if (state.phase === 'exposed') {
    const remaining = Math.max(0, 1 - state.phaseElapsed / state.windowDuration);
    g.strokeStyle = remaining > 0.4 ? '#7dffb3' : '#ff6b6b';
    g.lineWidth = 5;
    g.beginPath();
    g.arc(f.cx, f.cy, 44, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * remaining);
    g.stroke();
  }
  g.strokeStyle = 'rgba(255, 226, 176, 0.25)';
  g.lineWidth = 1;
  g.beginPath();
  g.arc(f.cx, f.cy, 44, 0, Math.PI * 2);
  g.stroke();

  g.fillStyle = '#ffe2b0';
  g.beginPath();
  g.moveTo(f.cx, f.cy - 20);
  g.lineTo(f.cx + 13, f.cy + 16);
  g.lineTo(f.cx, f.cy + 9);
  g.lineTo(f.cx - 13, f.cy + 16);
  g.closePath();
  g.fill();
}

function drawBeam(g: CanvasRenderingContext2D, f: Field, state: BugEyesState) {
  if (state.activeStation === null) return;
  const station = state.stations[state.activeStation];
  if (!station) return;
  const point = stationPoint(f, state.activeStation, station.advance);
  const fade = 1 - Math.min(1, state.phaseElapsed / (HUNT_CONSTANTS.resolveSeconds * 0.5));
  if (fade <= 0) return;
  g.strokeStyle = `rgba(125, 255, 179, ${fade})`;
  g.lineWidth = 4 * fade + 1;
  g.beginPath();
  g.moveTo(f.cx, f.cy);
  g.lineTo(point.x, point.y - 30);
  g.stroke();
}

function drawStatus(g: CanvasRenderingContext2D, stage: Stage, state: BugEyesState) {
  g.textAlign = 'center';
  g.fillStyle = '#ffe2b0';
  g.font = `15px ${FONT}`;
  g.fillText(state.statusMessage, stage.width / 2, stage.height - 56);
  g.fillStyle = '#a2775f';
  g.font = `12px ${FONT}`;
  g.fillText('Press 1 to 4 for the matching rock · one shot per bug · Esc leaves', stage.width / 2, stage.height - 32);
}

function drawDebrief(g: CanvasRenderingContext2D, stage: Stage, state: BugEyesState) {
  const d = state.debrief!;
  const w = Math.min(640, stage.width - 80);
  const h = 260;
  const x = (stage.width - w) / 2;
  const y = (stage.height - h) / 2;
  g.fillStyle = 'rgba(8, 5, 12, 0.94)';
  g.fillRect(x, y, w, h);
  g.strokeStyle = d.outcome === 'escaped' ? '#7dffb3' : '#ff5c7a';
  g.lineWidth = 2;
  g.strokeRect(x, y, w, h);
  g.textAlign = 'center';
  g.fillStyle = '#c08a72';
  g.font = `12px ${FONT}`;
  g.fillText('PROTON BLASTER LOG', stage.width / 2, y + 30);
  g.fillStyle = d.outcome === 'escaped' ? '#7dffb3' : '#ff8fa3';
  g.font = `600 28px ${FONT}`;
  g.fillText(d.headline, stage.width / 2, y + 78);
  g.fillStyle = '#ffe2b0';
  g.font = `15px ${FONT}`;
  g.fillText(d.summary, stage.width / 2, y + 116);
  const ms = (value: number | null) => (value === null ? '--' : `${(value * 1000).toFixed(0)} ms`);
  g.fillStyle = '#ffd166';
  g.fillText(`Fastest ${ms(d.bestReaction)} · Average ${ms(d.averageReaction)}`, stage.width / 2, y + 156);
  g.fillText(`Score ${d.score}`, stage.width / 2, y + 184);
  g.fillStyle = '#a2775f';
  g.font = `13px ${FONT}`;
  g.fillText('Press Enter to face them again.', stage.width / 2, y + 224);
}
