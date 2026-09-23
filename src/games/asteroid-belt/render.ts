import type { Stage } from '../../core/stage';
import { ASTEROID_RULES, BELT_TIMING } from './state';
import type { Verdict } from './state';
import type { BeltState } from './types';

const FONT = '"Space Mono", monospace';
const VERDICT_COLOUR: Record<Verdict, string> = {
  destroyed: '#7dffb3',
  weak: '#ffd166',
  strong: '#ff9f5a',
  crashed: '#ff6b6b',
};

export function renderBelt(stage: Stage, title: string, state: BeltState) {
  const g = stage.ctx;
  stage.clear('#050507');
  g.save();
  g.textBaseline = 'alphabetic';
  const shake = state.phase === 'impact' && state.verdict !== 'destroyed'
    ? Math.max(0, 1 - state.phaseElapsed / 0.45) * 10
    : 0;
  if (shake) g.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
  drawStreaks(g, stage, state);
  drawTopBar(g, stage, title, state);
  if (state.phase !== 'debrief') {
    drawAsteroid(g, stage, state);
    drawShip(g, stage, state);
    if (state.phase === 'approach') drawWindow(g, stage, state);
  } else if (state.debrief) {
    drawDebrief(g, stage, state);
  }
  drawStatus(g, stage, state);
  g.restore();
}

function drawStreaks(g: CanvasRenderingContext2D, stage: Stage, state: BeltState) {
  // The belt streams past, so the stars streak toward the viewer.
  for (let i = 0; i < 80; i += 1) {
    const seed = (i * 733) % 1000 / 1000;
    const x = ((i * 389) % 1000) / 1000 * stage.width;
    const speed = 120 + seed * 260;
    const y = (seed * stage.height + state.elapsed * speed) % stage.height;
    g.strokeStyle = `rgba(210, 200, 180, ${0.15 + seed * 0.35})`;
    g.lineWidth = 1 + seed;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x, y + 6 + seed * 14);
    g.stroke();
  }
}

function drawTopBar(g: CanvasRenderingContext2D, stage: Stage, title: string, state: BeltState) {
  g.fillStyle = 'rgba(8, 7, 6, 0.86)';
  g.fillRect(0, 0, stage.width, 56);
  g.fillStyle = '#ffcf8a';
  g.font = `600 20px ${FONT}`;
  g.textAlign = 'left';
  g.fillText(title, 24, 35);
  const cells: Array<[string, string, string]> = [
    ['ASTEROID', `${Math.min(state.round, ASTEROID_RULES.asteroids)} / ${ASTEROID_RULES.asteroids}`, '#fff2dd'],
    ['DESTROYED', String(state.hits), '#7dffb3'],
    ['STREAK', String(state.streak), state.streak >= 3 ? '#ffd166' : '#fff2dd'],
    ['HULL HITS', String(state.hullHits), state.hullHits ? '#ff6b6b' : '#fff2dd'],
  ];
  cells.forEach(([label, value, colour], index) => {
    const x = 250 + index * 130;
    g.font = `12px ${FONT}`;
    g.fillStyle = '#9a7f5c';
    g.fillText(label, x, 22);
    g.font = `600 18px ${FONT}`;
    g.fillStyle = colour;
    g.fillText(value, x, 44);
  });
}

function asteroidPose(stage: Stage, state: BeltState) {
  const shipY = stage.height - 150;
  const startY = 140;
  const progress = state.phase === 'approach'
    ? Math.min(1, state.phaseElapsed / BELT_TIMING.window)
    : 1;
  const x = stage.width * state.asteroid.lane;
  const y = startY + (shipY - 150 - startY) * progress;
  // Countable from the first frame, as the original's printed stars were.
  return { x, y, scale: 1.5 + progress * 0.8, progress };
}

function drawAsteroid(g: CanvasRenderingContext2D, stage: Stage, state: BeltState) {
  const pose = asteroidPose(stage, state);
  const t = state.phaseElapsed;
  const destroyed = state.phase === 'impact' && state.verdict === 'destroyed';
  const shattered = state.phase === 'impact' && state.verdict === 'strong';

  if (destroyed) {
    const fade = Math.max(0, 1 - t / 0.8);
    g.fillStyle = `rgba(255, 230, 170, ${fade})`;
    g.beginPath();
    g.arc(pose.x, pose.y, 40 + (1 - fade) * 90, 0, Math.PI * 2);
    g.fill();
  }

  g.save();
  g.translate(pose.x, pose.y);
  g.scale(pose.scale, pose.scale);
  state.asteroid.rocks.forEach((rock, index) => {
    let { dx, dy } = rock;
    let alpha = 1;
    if (destroyed || shattered) {
      const burst = Math.min(1, t / 0.7);
      const angle = Math.atan2(dy || 0.1, dx || 0.1) + index;
      dx += Math.cos(angle) * burst * (destroyed ? 140 : 70);
      dy += Math.sin(angle) * burst * (destroyed ? 140 : 70) + (shattered ? burst * 120 : 0);
      alpha = destroyed ? 1 - burst : 1;
    }
    g.globalAlpha = Math.max(0, alpha);
    g.save();
    g.translate(dx, dy);
    g.rotate(rock.spin + state.elapsed * 0.6);
    g.fillStyle = '#6a5a48';
    g.beginPath();
    for (let k = 0; k < 7; k += 1) {
      const a = (k / 7) * Math.PI * 2;
      const r = rock.radius * (0.78 + ((k * 37 + index * 11) % 10) / 40);
      if (k === 0) g.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    g.closePath();
    g.fill();
    g.fillStyle = 'rgba(255, 240, 210, 0.22)';
    g.beginPath();
    g.arc(-rock.radius * 0.3, -rock.radius * 0.3, rock.radius * 0.35, 0, Math.PI * 2);
    g.fill();
    g.restore();
  });
  g.restore();
  g.globalAlpha = 1;
}

function drawShip(g: CanvasRenderingContext2D, stage: Stage, state: BeltState) {
  const x = stage.width / 2;
  const y = stage.height - 150;
  const pose = asteroidPose(stage, state);

  if (state.phase === 'impact' && state.strength !== null) {
    const fade = Math.max(0, 1 - state.phaseElapsed / 0.35);
    if (fade > 0) {
      g.strokeStyle = state.verdict === 'destroyed'
        ? `rgba(125, 255, 179, ${fade})`
        : `rgba(255, 209, 102, ${fade})`;
      g.lineWidth = 2 + state.strength * 0.8;
      g.beginPath();
      g.moveTo(x, y - 20);
      g.lineTo(pose.x, pose.y);
      g.stroke();
    }
  }

  g.fillStyle = '#ffe2b0';
  g.beginPath();
  g.moveTo(x, y - 26);
  g.lineTo(x + 20, y + 16);
  g.lineTo(x, y + 6);
  g.lineTo(x - 20, y + 16);
  g.closePath();
  g.fill();
  const flame = 0.7 + 0.3 * Math.sin(state.elapsed * 30);
  g.fillStyle = `rgba(255, 150, 70, ${flame})`;
  g.beginPath();
  g.moveTo(x - 8, y + 12);
  g.lineTo(x + 8, y + 12);
  g.lineTo(x, y + 28 + flame * 10);
  g.closePath();
  g.fill();
}

function drawWindow(g: CanvasRenderingContext2D, stage: Stage, state: BeltState) {
  const remaining = Math.max(0, 1 - state.phaseElapsed / BELT_TIMING.window);
  const width = Math.min(460, stage.width - 200);
  const x = (stage.width - width) / 2;
  const y = stage.height - 104;
  g.fillStyle = 'rgba(255,255,255,0.07)';
  g.fillRect(x, y, width, 8);
  g.fillStyle = remaining > 0.35 ? '#ffcf8a' : '#ff6b6b';
  g.fillRect(x, y, width * remaining, 8);
}

function drawDebrief(g: CanvasRenderingContext2D, stage: Stage, state: BeltState) {
  const d = state.debrief!;
  const w = Math.min(660, stage.width - 80);
  const h = 340;
  const x = (stage.width - w) / 2;
  const y = (stage.height - h) / 2;
  g.fillStyle = 'rgba(8, 6, 4, 0.95)';
  g.fillRect(x, y, w, h);
  g.strokeStyle = d.hits >= 7 ? '#7dffb3' : '#ffd166';
  g.lineWidth = 2;
  g.strokeRect(x, y, w, h);
  g.textAlign = 'center';
  g.fillStyle = '#9a7f5c';
  g.font = `12px ${FONT}`;
  g.fillText('NAVIGATION LOG', stage.width / 2, y + 28);
  g.fillStyle = d.hits >= 7 ? '#7dffb3' : '#ffd166';
  g.font = `600 30px ${FONT}`;
  g.fillText(d.headline, stage.width / 2, y + 72);
  g.fillStyle = '#fff2dd';
  g.font = `15px ${FONT}`;
  g.fillText(d.summary, stage.width / 2, y + 106);

  const ms = d.averageReaction === null ? '--' : `${(d.averageReaction * 1000).toFixed(0)} ms`;
  g.fillStyle = '#ffcf8a';
  g.fillText(`Average shot ${ms} · best streak ${d.bestStreak} · score ${d.score}`, stage.width / 2, y + 138);
  g.fillText(
    `Undercounted ${d.undercounts} · overcounted ${d.overcounts} · crashed ${d.crashes}`,
    stage.width / 2,
    y + 164,
  );

  g.fillStyle = '#9a7f5c';
  g.font = `12px ${FONT}`;
  g.fillText('HOW YOU FARED BY SIZE', stage.width / 2, y + 204);
  const columns = d.byStars.length || 1;
  const spread = Math.min(w - 80, columns * 58);
  const start = stage.width / 2 - spread / 2;
  d.byStars.forEach((entry, index) => {
    const cx = start + (index + 0.5) * (spread / columns);
    g.fillStyle = '#ffcf8a';
    g.font = `12px ${FONT}`;
    g.fillText(String(entry.stars), cx, y + 228);
    g.fillStyle = entry.hits === entry.attempts ? '#7dffb3' : entry.hits === 0 ? '#ff6b6b' : '#ffd166';
    g.font = `600 14px ${FONT}`;
    g.fillText(`${entry.hits}/${entry.attempts}`, cx, y + 250);
  });
  g.fillStyle = '#9a7f5c';
  g.font = `13px ${FONT}`;
  g.fillText('Press Enter to fly the belt again.', stage.width / 2, y + h - 20);
}

function drawStatus(g: CanvasRenderingContext2D, stage: Stage, state: BeltState) {
  g.textAlign = 'center';
  g.fillStyle = state.verdict ? VERDICT_COLOUR[state.verdict] : '#fff2dd';
  g.font = `15px ${FONT}`;
  g.fillText(state.statusMessage, stage.width / 2, stage.height - 58);
  g.fillStyle = '#9a7f5c';
  g.font = `12px ${FONT}`;
  g.fillText('Press 1 to 9 to fire at that strength · one shot each · Esc leaves', stage.width / 2, stage.height - 34);
}
