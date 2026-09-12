import type { Stage } from '../../core/stage';
import { EVIL_ALIEN_RULES, HUNT_CONSTANTS } from './state';
import type { AxisBounds, EvilAlienState } from './types';

const FONT = '"Space Mono", monospace';
const GRID = EVIL_ALIEN_RULES.gridSize;

interface Layout {
  grid: { x: number; y: number; size: number; cell: number };
  gauge: { x: number; y: number; width: number; height: number };
  log: { x: number; y: number; width: number };
}

function layout(stage: Stage): Layout {
  const top = 92;
  const bottom = 96;
  const size = Math.min(stage.height - top - bottom, stage.width * 0.46);
  const cell = size / GRID;
  const gridX = 72;
  const gaugeX = gridX + size + 96;
  return {
    grid: { x: gridX, y: top, size, cell },
    gauge: { x: gaugeX, y: top, width: 56, height: size },
    log: { x: gaugeX + 56 + 72, y: top, width: stage.width - (gaugeX + 56 + 72) - 48 },
  };
}

export function renderEvilAlien(stage: Stage, title: string, state: EvilAlienState) {
  const g = stage.ctx;
  const L = layout(stage);
  stage.clear('#040816');
  g.save();
  g.textBaseline = 'alphabetic';
  drawStarfield(g, stage, state.elapsed);
  drawTopBar(g, stage, title, state);
  drawGrid(g, L, state);
  drawGauge(g, L, state);
  drawLog(g, L, state);
  drawStatus(g, stage, state);
  drawThreat(g, stage, L, state);
  if (state.phase === 'debrief' && state.debrief) drawDebrief(g, stage, state);
  g.restore();
}

function drawStarfield(g: CanvasRenderingContext2D, stage: Stage, t: number) {
  g.fillStyle = 'rgba(160, 200, 255, 0.35)';
  for (let i = 0; i < 90; i += 1) {
    const x = ((i * 977) % 1000) / 1000 * stage.width;
    const y = ((i * 613) % 1000) / 1000 * stage.height;
    const twinkle = 0.5 + 0.5 * Math.sin(t * 1.3 + i);
    g.globalAlpha = 0.2 + 0.5 * twinkle;
    g.fillRect(x, y, 2, 2);
  }
  g.globalAlpha = 1;
}

function drawTopBar(g: CanvasRenderingContext2D, stage: Stage, title: string, state: EvilAlienState) {
  g.fillStyle = 'rgba(5, 12, 30, 0.85)';
  g.fillRect(0, 0, stage.width, 60);
  g.fillStyle = '#9be7ff';
  g.font = `600 20px ${FONT}`;
  g.textAlign = 'left';
  g.fillText(title, 24, 38);

  g.font = `13px ${FONT}`;
  g.fillStyle = '#7fb6d9';
  g.fillText('SPACE BOMBS', 260, 26);
  for (let i = 0; i < EVIL_ALIEN_RULES.bombs; i += 1) {
    const x = 262 + i * 26;
    const spent = i < state.bombsUsed;
    g.beginPath();
    g.arc(x + 8, 42, 7, 0, Math.PI * 2);
    g.fillStyle = spent ? 'rgba(120, 140, 160, 0.25)' : '#ffd166';
    g.fill();
    if (spent) {
      g.strokeStyle = 'rgba(120, 140, 160, 0.6)';
      g.lineWidth = 1;
      g.stroke();
    }
  }

  const barX = stage.width - 24 - 300;
  g.fillStyle = '#7fb6d9';
  g.textAlign = 'left';
  g.fillText('ELRON PROXIMITY', barX, 26);
  g.fillStyle = 'rgba(255,255,255,0.08)';
  g.fillRect(barX, 34, 300, 14);
  const c = state.capture;
  const hue = 190 - 190 * c;
  g.fillStyle = `hsl(${hue}, 90%, ${55 + 15 * c}%)`;
  g.fillRect(barX, 34, 300 * c, 14);
  g.strokeStyle = 'rgba(155, 231, 255, 0.5)';
  g.lineWidth = 1;
  g.strokeRect(barX + 0.5, 34.5, 299, 13);
}

function outside(b: AxisBounds, v: number) {
  return v < b.min || v > b.max;
}

function cellRect(L: Layout, x: number, y: number) {
  return {
    px: L.grid.x + x * L.grid.cell,
    py: L.grid.y + (GRID - 1 - y) * L.grid.cell,
  };
}

function drawGrid(g: CanvasRenderingContext2D, L: Layout, state: EvilAlienState) {
  const { x: gx, y: gy, size, cell } = L.grid;
  g.font = `12px ${FONT}`;
  g.fillStyle = '#7fb6d9';
  g.textAlign = 'center';
  g.fillText('SECTOR SCAN · X EAST →', gx + size / 2, gy - 14);
  g.save();
  g.translate(gx - 40, gy + size / 2);
  g.rotate(-Math.PI / 2);
  g.fillText('Y NORTH →', 0, 0);
  g.restore();

  for (let y = 0; y < GRID; y += 1) {
    for (let x = 0; x < GRID; x += 1) {
      const { px, py } = cellRect(L, x, y);
      const dead = outside(state.bounds.x, x) || outside(state.bounds.y, y);
      g.fillStyle = dead ? 'rgba(20, 28, 48, 0.9)' : 'rgba(40, 110, 160, 0.22)';
      g.fillRect(px + 1, py + 1, cell - 2, cell - 2);
      if (dead) {
        g.strokeStyle = 'rgba(90, 110, 140, 0.25)';
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(px + 4, py + cell - 4);
        g.lineTo(px + cell - 4, py + 4);
        g.stroke();
      }
    }
  }

  g.fillStyle = '#5f8fb0';
  g.font = `11px ${FONT}`;
  for (let i = 0; i < GRID; i += 1) {
    g.textAlign = 'center';
    g.fillText(String(i), gx + i * cell + cell / 2, gy + size + 16);
    g.textAlign = 'right';
    g.fillText(String(i), gx - 8, gy + (GRID - 1 - i) * cell + cell / 2 + 4);
  }

  state.shots.forEach((shot, index) => {
    const { px, py } = cellRect(L, shot.position.x, shot.position.y);
    g.strokeStyle = shot.hit ? '#7dffb3' : '#ff9f89';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(px + cell * 0.3, py + cell * 0.3);
    g.lineTo(px + cell * 0.7, py + cell * 0.7);
    g.moveTo(px + cell * 0.7, py + cell * 0.3);
    g.lineTo(px + cell * 0.3, py + cell * 0.7);
    g.stroke();
    g.fillStyle = '#ffd7c9';
    g.font = `10px ${FONT}`;
    g.textAlign = 'left';
    g.fillText(String(index + 1), px + cell - 12, py + 12);
  });

  const lastShot = state.shots[state.shots.length - 1];
  if (lastShot && state.phase === 'hunt' && state.phaseElapsed < 0.6) {
    const { px, py } = cellRect(L, lastShot.position.x, lastShot.position.y);
    const r = (cell / 2) * (1 + state.phaseElapsed * 2.5);
    g.strokeStyle = `rgba(255, 190, 120, ${1 - state.phaseElapsed / 0.6})`;
    g.lineWidth = 3;
    g.beginPath();
    g.arc(px + cell / 2, py + cell / 2, r, 0, Math.PI * 2);
    g.stroke();
  }

  if (state.phase === 'debrief') {
    const { px, py } = cellRect(L, state.target.x, state.target.y);
    g.fillStyle = state.debrief?.outcome === 'destroyed' ? 'rgba(125, 255, 179, 0.35)' : 'rgba(255, 80, 80, 0.45)';
    g.fillRect(px + 1, py + 1, cell - 2, cell - 2);
    drawElron(g, px + cell / 2, py + cell / 2, cell * 0.32, 1);
  }

  if (state.phase !== 'debrief') {
    const { px, py } = cellRect(L, state.cursor.x, state.cursor.y);
    const pulse = 0.6 + 0.4 * Math.sin(state.elapsed * 6);
    g.strokeStyle = state.phase === 'drop' ? `rgba(255, 209, 102, ${pulse})` : '#5df7ff';
    g.lineWidth = 2.5;
    g.strokeRect(px + 2, py + 2, cell - 4, cell - 4);
  }

  g.strokeStyle = 'rgba(155, 231, 255, 0.35)';
  g.lineWidth = 1;
  g.strokeRect(gx + 0.5, gy + 0.5, size, size);
}

function drawGauge(g: CanvasRenderingContext2D, L: Layout, state: EvilAlienState) {
  const { x, y, width, height } = L.gauge;
  const band = height / GRID;
  g.font = `12px ${FONT}`;
  g.fillStyle = '#7fb6d9';
  g.textAlign = 'center';
  g.fillText('DISTANCE', x + width / 2, y + height + 16);

  for (let d = 0; d < GRID; d += 1) {
    const py = y + d * band;
    const dead = outside(state.bounds.d, d);
    g.fillStyle = dead ? 'rgba(20, 28, 48, 0.9)' : 'rgba(40, 110, 160, 0.22)';
    g.fillRect(x, py + 1, width, band - 2);
    g.fillStyle = '#5f8fb0';
    g.font = `11px ${FONT}`;
    g.textAlign = 'left';
    g.fillText(String(d), x + width + 8, py + band / 2 + 4);
  }

  for (const shot of state.shots) {
    const py = y + shot.position.d * band + band / 2;
    g.fillStyle = shot.hit ? '#7dffb3' : '#ff9f89';
    g.fillRect(x + width / 2 - 8, py - 1.5, 16, 3);
  }

  if (state.phase === 'debrief') {
    const py = y + state.target.d * band + band / 2;
    drawElron(g, x + width / 2, py, band * 0.35, 1);
  } else {
    const py = y + state.cursor.d * band;
    g.strokeStyle = '#5df7ff';
    g.lineWidth = 2.5;
    g.strokeRect(x - 2, py + 1, width + 4, band - 2);
  }

  if (state.phase === 'drop') {
    const progress = Math.min(1, state.phaseElapsed / HUNT_CONSTANTS.dropDuration);
    const eased = progress * progress;
    const targetY = y + state.cursor.d * band + band / 2;
    const bombY = y - 18 + (targetY - (y - 18)) * eased;
    g.fillStyle = '#ffd166';
    g.beginPath();
    g.arc(x + width / 2, bombY, 6, 0, Math.PI * 2);
    g.fill();
    if (progress > 0.92) {
      g.fillStyle = `rgba(255, 230, 160, ${(progress - 0.92) / 0.08})`;
      g.beginPath();
      g.arc(x + width / 2, targetY, band * 1.4, 0, Math.PI * 2);
      g.fill();
    }
  }

  drawShip(g, x + width / 2, y - 26);
  g.strokeStyle = 'rgba(155, 231, 255, 0.35)';
  g.lineWidth = 1;
  g.strokeRect(x + 0.5, y + 0.5, width, height);
}

function drawShip(g: CanvasRenderingContext2D, cx: number, cy: number) {
  g.fillStyle = '#dff9ff';
  g.beginPath();
  g.moveTo(cx, cy - 10);
  g.lineTo(cx + 10, cy + 6);
  g.lineTo(cx - 10, cy + 6);
  g.closePath();
  g.fill();
}

function drawElron(g: CanvasRenderingContext2D, cx: number, cy: number, r: number, alpha: number) {
  g.save();
  g.globalAlpha = alpha;
  g.fillStyle = '#3b0f3f';
  g.beginPath();
  g.ellipse(cx, cy, r * 1.3, r, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#ff3b6b';
  g.beginPath();
  g.arc(cx - r * 0.45, cy - r * 0.1, r * 0.22, 0, Math.PI * 2);
  g.arc(cx + r * 0.45, cy - r * 0.1, r * 0.22, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

function drawLog(g: CanvasRenderingContext2D, L: Layout, state: EvilAlienState) {
  const { x, y, width } = L.log;
  g.font = `12px ${FONT}`;
  g.fillStyle = '#7fb6d9';
  g.textAlign = 'left';
  g.fillText('SCANNER LOG', x, y - 14);
  g.fillStyle = 'rgba(5, 12, 30, 0.7)';
  g.fillRect(x, y, width, L.grid.size);
  g.strokeStyle = 'rgba(155, 231, 255, 0.35)';
  g.strokeRect(x + 0.5, y + 0.5, width, L.grid.size);

  g.font = `14px ${FONT}`;
  let lineY = y + 30;
  if (!state.shots.length) {
    g.fillStyle = '#5f8fb0';
    g.fillText('No bombs dropped yet.', x + 16, lineY);
    lineY += 22;
    g.fillText('Compass words point from', x + 16, lineY + 22);
    g.fillText('your shot toward Elron.', x + 16, lineY + 44);
  }
  state.shots.forEach((shot, index) => {
    const { x: sx, y: sy, d } = shot.position;
    g.fillStyle = '#dff9ff';
    g.fillText(`#${index + 1}  X${sx} Y${sy} D${d}`, x + 16, lineY);
    g.fillStyle = shot.hit ? '#7dffb3' : '#ffb98a';
    const verdict = shot.hit ? '*BOOM*' : `${shot.compass || 'ON TARGET CELL'}${shot.range ? ` · ${shot.range}` : ''}`;
    g.fillText(verdict, x + 16, lineY + 20);
    lineY += 52;
  });

  const b = state.bounds;
  const span = (a: AxisBounds) => (a.min === a.max ? `${a.min}` : `${a.min}–${a.max}`);
  const footY = y + L.grid.size - 20;
  g.fillStyle = '#7fb6d9';
  g.font = `12px ${FONT}`;
  g.fillText(`Elron still possible in  X ${span(b.x)}   Y ${span(b.y)}   D ${span(b.d)}`, x + 16, footY);
}

function drawStatus(g: CanvasRenderingContext2D, stage: Stage, state: EvilAlienState) {
  g.font = `15px ${FONT}`;
  g.textAlign = 'center';
  g.fillStyle = '#dff9ff';
  g.fillText(state.statusMessage, stage.width / 2, stage.height - 58);
  g.font = `12px ${FONT}`;
  g.fillStyle = '#5f8fb0';
  g.fillText('Arrows move the target · W/S change distance · Enter or Space drops a bomb', stage.width / 2, stage.height - 34);
}

function drawThreat(g: CanvasRenderingContext2D, stage: Stage, L: Layout, state: EvilAlienState) {
  const c = state.capture;
  if (c < 0.35 || state.phase === 'debrief') return;
  const intensity = (c - 0.35) / 0.65;
  const pulse = 0.5 + 0.5 * Math.sin(state.elapsed * (4 + 10 * intensity));
  const gradient = g.createRadialGradient(
    stage.width / 2, stage.height / 2, stage.height * 0.35,
    stage.width / 2, stage.height / 2, stage.height * 0.8,
  );
  gradient.addColorStop(0, 'rgba(255, 30, 60, 0)');
  gradient.addColorStop(1, `rgba(255, 30, 60, ${0.12 + 0.4 * intensity * pulse})`);
  g.fillStyle = gradient;
  g.fillRect(0, 0, stage.width, stage.height);
  const laneX = L.gauge.x + L.gauge.width + 44;
  const bottom = L.gauge.y + L.gauge.height - 16;
  const top = L.gauge.y + 24;
  drawElron(g, laneX, bottom - (bottom - top) * c, 10 + intensity * 8, 0.25 + 0.75 * intensity);
}

function drawDebrief(g: CanvasRenderingContext2D, stage: Stage, state: EvilAlienState) {
  const d = state.debrief!;
  const w = Math.min(620, stage.width - 80);
  const h = 250;
  const x = (stage.width - w) / 2;
  const y = (stage.height - h) / 2;
  g.fillStyle = 'rgba(3, 8, 20, 0.92)';
  g.fillRect(x, y, w, h);
  g.strokeStyle = d.outcome === 'destroyed' ? '#7dffb3' : '#ff5c7a';
  g.lineWidth = 2;
  g.strokeRect(x, y, w, h);
  g.textAlign = 'center';
  g.fillStyle = '#7fb6d9';
  g.font = `12px ${FONT}`;
  g.fillText('TACTICAL DEBRIEF', stage.width / 2, y + 30);
  g.fillStyle = d.outcome === 'destroyed' ? '#7dffb3' : '#ff8fa3';
  g.font = `600 30px ${FONT}`;
  g.fillText(d.headline, stage.width / 2, y + 80);
  g.fillStyle = '#dff9ff';
  g.font = `15px ${FONT}`;
  g.fillText(d.summary, stage.width / 2, y + 118);
  g.fillStyle = '#9be7ff';
  g.fillText(`Bombs used ${d.bombsUsed} of ${EVIL_ALIEN_RULES.bombs} · Proximity ${Math.round(d.capture * 100)}% · Score ${d.score}`, stage.width / 2, y + 160);
  g.fillStyle = '#7fb6d9';
  g.font = `13px ${FONT}`;
  g.fillText(`Elron was at X${state.target.x} Y${state.target.y} D${state.target.d}. Press Enter to hunt again.`, stage.width / 2, y + 210);
}
