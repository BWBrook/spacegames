import type { GameFactory } from '../types';
import { STARSHIP_CONSTANTS } from './constants';
import { stepEvents } from './events';
import {
  computeBaseThrust,
  computeOptimality,
  createStarshipState,
  refreshTelemetry,
  resetForRetry,
  transitionPhase,
} from './state';
import type { StarshipState, Particle } from './types';

interface PointerState {
  active: boolean;
  mode: null | 'base-thrust' | 'vector' | 'fuel' | 'throttle';
  x: number;
  y: number;
}

interface StarSprite {
  x: number;
  y: number;
  speed: number;
  size: number;
}

export const createGame: GameFactory = ({ stage, input, manifest: entry }) => {
  const state = createStarshipState();
  const pointer: PointerState = { active: false, mode: null, x: 0, y: 0 };
  const stars: StarSprite[] = createStars(stage.width, stage.height);

  const canvas = stage.canvas;

  const pointerDown = (event: PointerEvent) => {
    const coords = toStageCoords(event, stage);
    pointer.active = true;
    pointer.x = coords.x;
    pointer.y = coords.y;
    pointer.mode = resolvePointerMode(coords.x, coords.y, stage, state.phase);
    updatePointerControl(pointer, state, stage);
    canvas.setPointerCapture(event.pointerId);
  };

  const pointerMove = (event: PointerEvent) => {
    if (!pointer.active) return;
    const coords = toStageCoords(event, stage);
    pointer.x = coords.x;
    pointer.y = coords.y;
    updatePointerControl(pointer, state, stage);
  };

  const pointerUp = (event: PointerEvent) => {
    pointer.active = false;
    pointer.mode = null;
    canvas.releasePointerCapture(event.pointerId);
  };

  canvas.addEventListener('pointerdown', pointerDown);
  canvas.addEventListener('pointermove', pointerMove);
  canvas.addEventListener('pointerup', pointerUp);
  canvas.addEventListener('pointerleave', pointerUp);

  const game = {
    enter() {
      transitionPhase(state, 'prep');
    },
    update(dt: number) {
      state.elapsed += dt;
      state.phaseElapsed += dt;
      refreshTelemetry(state, dt);
      updateStars(stars, dt, stage);
      switch (state.phase) {
        case 'prep':
          updatePrep(state, input, dt);
          break;
        case 'commit':
          updateCommit(state, input, dt);
          break;
        case 'ascent':
          updateAscent(state, input, dt);
          break;
        case 'debrief':
          updateDebrief(state, input, dt);
          break;
      }
      updateParticles(state.exhaust, dt);
      updateParticles(state.debris, dt);
    },
    render() {
      const g = stage.ctx;
      drawBackdrop(g, stage.width, stage.height, stars);
      switch (state.phase) {
        case 'prep':
          renderPrep(g, stage, state, pointer);
          break;
        case 'commit':
          renderCommit(g, stage, state);
          break;
        case 'ascent':
          renderAscent(g, stage, state);
          break;
        case 'debrief':
          renderDebrief(g, stage, state);
          break;
      }
      renderStatusBar(g, stage, state, entry.title);
    },
    exit() {
      canvas.removeEventListener('pointerdown', pointerDown);
      canvas.removeEventListener('pointermove', pointerMove);
      canvas.removeEventListener('pointerup', pointerUp);
      canvas.removeEventListener('pointerleave', pointerUp);
    },
  };

  return game;
};

function updatePrep(state: StarshipState, input: { isDown(key: string): boolean; consumePress(key: string): boolean }, dt: number) {
  const adjustment = state.config.thrustAdjustmentPerSecond * dt;
  if (input.isDown('ArrowLeft') || input.isDown('a')) state.controls.baseThrust = clamp01(state.controls.baseThrust - adjustment);
  if (input.isDown('ArrowRight') || input.isDown('d')) state.controls.baseThrust = clamp01(state.controls.baseThrust + adjustment);
  if (input.isDown('ArrowUp') || input.isDown('w')) state.controls.vectorBias = clampSigned(state.controls.vectorBias + adjustment * 0.5);
  if (input.isDown('ArrowDown') || input.isDown('s')) state.controls.vectorBias = clampSigned(state.controls.vectorBias - adjustment * 0.5);

  if (state.phaseElapsed >= state.config.prepDuration || input.consumePress('Enter')) {
    state.statusMessage = 'Hit Enter with the cursor centered to capture the ignition window.';
    transitionPhase(state, 'commit');
  }
}

function updateCommit(state: StarshipState, input: { consumePress(key: string): boolean }, dt: number) {
  const speed = state.config.commitCursorSpeed;
  state.commit.cursor += state.commit.direction * speed * dt;
  if (state.commit.cursor >= 1) {
    state.commit.cursor = 1;
    state.commit.direction = -1;
  }
  if (state.commit.cursor <= 0) {
    state.commit.cursor = 0;
    state.commit.direction = 1;
  }

  if (input.consumePress('Enter') || input.consumePress(' ')) {
    const delta = Math.abs(state.commit.cursor - 0.5);
    state.commit.score = Math.max(0, 1 - delta * 2);
    state.commit.resolved = true;
    state.statusMessage = 'Engines ignited—ride the burn and manage heat!';
    transitionPhase(state, 'ascent');
    state.phaseElapsed = 0;
    return;
  }

  if (state.phaseElapsed >= state.config.commitWindow) {
    state.commit.score = Math.max(0.2, 1 - Math.abs(state.commit.cursor - 0.5));
    state.commit.resolved = true;
    state.statusMessage = 'Autosequencer forced ignition—ride carefully!';
    transitionPhase(state, 'ascent');
    state.phaseElapsed = 0;
  }
}

function updateAscent(state: StarshipState, input: { isDown(key: string): boolean }, dt: number) {
  const activeEvent = state.ascent.events.some(evt => evt.status === 'active');
  const thrustAdjust = state.config.thrustAdjustmentPerSecond * dt * 1.6;
  if (input.isDown('ArrowUp') || input.isDown('w')) state.ascent.thrust = clamp01(state.ascent.thrust + thrustAdjust);
  if (input.isDown('ArrowDown') || input.isDown('s')) state.ascent.thrust = clamp01(state.ascent.thrust - thrustAdjust);

  const venting = input.isDown(' ') || input.isDown('Shift');

  const baseThrust = computeBaseThrust(state);
  const commitBonus = 0.85 + state.commit.score * 0.35;
  const liveMod = 0.7 + state.ascent.thrust * 0.6;
  const vectorPenalty = 1 - Math.abs(state.controls.vectorBias) * 0.08;
  const fuelBonus = 1 + state.controls.fuelMix * 0.05;
  const actualThrust = baseThrust * commitBonus * liveMod * vectorPenalty * fuelBonus;
  state.ascent.lastThrust = actualThrust;

  const gravityPull = 38 + state.telemetry.trueGravity * 1.5;
  const thrustAccel = actualThrust * 0.06;
  const acceleration = thrustAccel - gravityPull;
  state.ascent.velocity += acceleration * dt;
  state.ascent.altitude += state.ascent.velocity * dt;

  const heatGain = (actualThrust / 10) * dt;
  const heatLoss = (state.config.heatCoolRate + (venting ? state.config.heatVentRate : 0)) * dt;
  state.ascent.heat += heatGain - heatLoss;
  state.ascent.heat = Math.max(0, state.ascent.heat);

  if (venting) {
    state.statusMessage = 'Venting heat; climb efficiency reduced.';
    state.ascent.velocity -= 15 * dt;
  } else if (!activeEvent) {
    state.statusMessage = 'Balance thrust vs. heat; watch hull integrity.';
  }

  if (state.ascent.heat > 120) {
    state.ascent.integrity = Math.max(0, state.ascent.integrity - 18 * dt);
  }

  if (state.ascent.altitude < 0) {
    state.ascent.altitude = 0;
    state.ascent.velocity = Math.max(0, state.ascent.velocity);
  }

  stepEvents(state, state.phaseElapsed);

  spawnExhaust(state, dt);
  maybeSpawnDebris(state, dt);

  const success = state.ascent.altitude >= state.ascent.targetAltitude;
  const failure = state.ascent.integrity <= 0 || state.ascent.heat >= 140;

  if (success || failure) {
    const accuracy = computeOptimality(state, actualThrust);
    state.debrief = {
      outcome: success ? 'success' : 'failure',
      accuracy,
      summary: success ? successSummary(accuracy) : failureSummary(state),
      rewards: Math.round(accuracy * 240),
    };
    transitionPhase(state, 'debrief');
  }
}

function updateDebrief(state: StarshipState, input: { consumePress(key: string): boolean }, dt: number) {
  if (state.phaseElapsed < 1) return;
  if (input.consumePress('Enter') || input.consumePress(' ')) {
    resetForRetry(state);
  }
}

function successSummary(accuracy: number) {
  if (accuracy > 0.95) return 'Perfect burn! The crew is weightless before the second marker.';
  if (accuracy > 0.8) return 'Smooth climb with minor course nudges.';
  if (accuracy > 0.6) return 'Orbit achieved, but engineering wants more headroom.';
  return 'Barely scraped orbit—review telemetry before the next sortie.';
}

function failureSummary(state: StarshipState) {
  if (state.ascent.integrity <= 0) return 'Hull fracture from debris stress—abort triggered.';
  if (state.ascent.heat >= 140) return 'Core overheated; emergency shutdown before detonation.';
  return 'Lost ascent solution—mission control pulled you back.';
}

function updateStars(stars: StarSprite[], dt: number, stage: { width: number; height: number }) {
  for (const star of stars) {
    star.y += star.speed * dt * 40;
    if (star.y > stage.height) {
      star.y = 0;
      star.x = Math.random() * stage.width;
      star.size = 0.5 + Math.random() * 2;
    }
  }
}

function createStars(width: number, height: number): StarSprite[] {
  return Array.from({ length: 90 }, () => ({
    x: Math.random() * Math.max(1, width),
    y: Math.random() * Math.max(1, height),
    speed: 0.1 + Math.random() * 0.6,
    size: 0.5 + Math.random() * 2,
  }));
}

function drawBackdrop(g: CanvasRenderingContext2D, width: number, height: number, stars: StarSprite[]) {
  const gradient = g.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#030816');
  gradient.addColorStop(1, '#041f38');
  g.fillStyle = gradient;
  g.fillRect(0, 0, width, height);

  g.save();
  g.fillStyle = '#9edbff';
  for (const star of stars) {
    g.globalAlpha = 0.2 + star.size * 0.1;
    g.fillRect(star.x, star.y, star.size, star.size);
  }
  g.restore();
}

function renderPrep(
  g: CanvasRenderingContext2D,
  stage: { width: number; height: number },
  state: StarshipState,
  pointer: PointerState,
) {
  const { width: w, height: h } = stage;
  drawShipSilhouette(g, w, h, state.ascent.altitude);
  drawTelemetry(g, 220, state.telemetry, 80, 100);
  drawSlider(g, {
    label: 'Booster Power',
    x: w * 0.08,
    y: h * 0.25,
    width: 40,
    height: h * 0.5,
    value: state.controls.baseThrust,
    vertical: true,
  });
  drawDial(g, {
    label: 'Vector Bias',
    cx: w * 0.35,
    cy: h * 0.65,
    radius: 60,
    value: state.controls.vectorBias,
  });
  drawSlider(g, {
    label: 'Fuel Mix',
    x: w * 0.55,
    y: h * 0.75,
    width: w * 0.35,
    height: 28,
    value: (state.controls.fuelMix + 1) / 2,
    vertical: false,
  });

  g.fillStyle = '#7de3ff';
  g.font = '24px "Space Mono", monospace';
  g.textAlign = 'center';
  g.fillText('Prep: Tune systems before ignition', w / 2, h * 0.12);
  g.font = '16px "Space Mono", monospace';
  g.fillText('Enter to proceed to ignition window sooner', w / 2, h * 0.16);
}

function renderCommit(g: CanvasRenderingContext2D, stage: { width: number; height: number }, state: StarshipState) {
  const { width: w, height: h } = stage;
  drawShipSilhouette(g, w, h, state.ascent.altitude);
  const barWidth = w * 0.6;
  const x = (w - barWidth) / 2;
  const y = h * 0.45;
  g.fillStyle = 'rgba(20, 40, 60, 0.7)';
  g.fillRect(x, y, barWidth, 24);
  g.fillStyle = '#123d7a';
  g.fillRect(x, y, barWidth, 24);
  g.fillStyle = '#0ff';
  const cursorPos = x + state.commit.cursor * barWidth;
  g.fillRect(cursorPos - 6, y - 10, 12, 44);
  g.strokeStyle = '#ffec6e';
  g.lineWidth = 2;
  g.strokeRect(x + barWidth / 2 - 25, y - 4, 50, 32);
  g.fillStyle = '#7de3ff';
  g.font = '28px "Space Mono", monospace';
  g.textAlign = 'center';
  g.fillText('Commit: Time ignition!', w / 2, h * 0.32);
  g.font = '16px "Space Mono", monospace';
  g.fillText('Press Enter/Space when the cursor is inside the golden gate', w / 2, h * 0.37);
}

function renderAscent(g: CanvasRenderingContext2D, stage: { width: number; height: number }, state: StarshipState) {
  drawAscentScene(g, stage.width, stage.height, state);
  renderAscentParticles(g, state.exhaust);
  renderAscentParticles(g, state.debris);
  drawTelemetry(g, 220, state.telemetry, 32, 90);
  drawSlider(g, {
    label: 'Live Thrust',
    x: stage.width - 70,
    y: stage.height * 0.2,
    width: 32,
    height: stage.height * 0.6,
    value: state.ascent.thrust,
    vertical: true,
  });
  drawTimeline(g, state, stage.width, stage.height);
}

function renderDebrief(g: CanvasRenderingContext2D, stage: { width: number; height: number }, state: StarshipState) {
  const { width: w, height: h } = stage;
  drawShipSilhouette(g, w, h, state.ascent.altitude);
  const cardWidth = Math.min(520, w * 0.8);
  const x = (w - cardWidth) / 2;
  const y = h * 0.35;
  g.fillStyle = 'rgba(5, 12, 24, 0.92)';
  g.fillRect(x, y, cardWidth, 220);
  g.strokeStyle = '#61d7ff';
  g.lineWidth = 2;
  g.strokeRect(x, y, cardWidth, 220);
  if (state.debrief) {
    g.fillStyle = state.debrief.outcome === 'success' ? '#8dffb7' : '#ff9f9f';
    g.font = '32px "Space Mono", monospace';
    g.textAlign = 'center';
    g.fillText(state.debrief.outcome === 'success' ? 'Orbit Achieved' : 'Mission Aborted', w / 2, y + 48);
    g.fillStyle = '#d6f5ff';
    g.font = '18px "Space Mono", monospace';
    g.fillText(`Accuracy ${(state.debrief.accuracy * 100).toFixed(1)}%`, w / 2, y + 90);
    wrapText(g, state.debrief.summary, w / 2, y + 130, cardWidth - 40, 20);
    g.fillStyle = '#7de3ff';
    g.fillText(`Rewards: ${state.debrief.rewards} star credits`, w / 2, y + 190);
    g.font = '16px "Space Mono", monospace';
    g.fillText('Press Enter to prep the next launch', w / 2, y + 215);
  }
}

function renderStatusBar(
  g: CanvasRenderingContext2D,
  stage: { width: number; height: number },
  state: StarshipState,
  title: string,
) {
  g.save();
  g.fillStyle = 'rgba(2, 6, 12, 0.8)';
  g.fillRect(0, 0, stage.width, 48);
  g.fillStyle = '#93e7ff';
  g.font = '18px "Space Mono", monospace';
  g.textAlign = 'left';
  g.fillText(title, 18, 30);
  g.textAlign = 'right';
  g.font = '14px "Space Mono", monospace';
  g.fillStyle = '#7de3ff';
  g.fillText(state.statusMessage, stage.width - 18, 30);
  g.restore();
}

function drawShipSilhouette(g: CanvasRenderingContext2D, w: number, h: number, altitude: number) {
  const baseY = h * 0.75;
  const offset = Math.min(altitude / 2000, h * 0.4);
  const y = baseY - offset;
  g.save();
  g.translate(w * 0.2, y);
  g.fillStyle = '#0f2337';
  g.strokeStyle = '#6bdcff';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(0, 120);
  g.lineTo(40, -80);
  g.lineTo(80, 120);
  g.closePath();
  g.fill();
  g.stroke();
  g.restore();
}

function drawTelemetry(
  g: CanvasRenderingContext2D,
  panelWidth: number,
  telemetry: StarshipState['telemetry'],
  x: number,
  y: number,
) {
  g.save();
  g.translate(x, y);
  g.fillStyle = '#1a2c49';
  g.fillRect(0, 0, panelWidth, 160);
  g.fillStyle = '#8af3ff';
  g.font = '16px "Space Mono", monospace';
  g.fillText(`G=${telemetry.displayGravity.toFixed(1)}`, 12, 32);
  g.fillText(`W=${telemetry.displayWind.toFixed(1)}`, 12, 60);
  g.fillText(`Noise±${telemetry.noise.toFixed(1)}`, 12, 88);
  g.restore();
}

function drawSlider(
  g: CanvasRenderingContext2D,
  opts: { label: string; x: number; y: number; width: number; height: number; value: number; vertical: boolean },
) {
  const { label, x, y, width, height, value, vertical } = opts;
  g.save();
  g.translate(x, y);
  g.fillStyle = 'rgba(8, 18, 34, 0.7)';
  g.fillRect(0, 0, width, height);
  g.fillStyle = '#1d3d66';
  g.fillRect(4, 4, width - 8, height - 8);
  g.fillStyle = '#7de3ff';
  g.font = '14px "Space Mono", monospace';
  g.textAlign = 'center';
  g.fillText(label, width / 2, -12);
  g.fillStyle = '#f5f76d';
  if (vertical) {
    const knobY = (1 - value) * (height - 16);
    g.fillRect(4, knobY, width - 8, 16);
  } else {
    const knobX = value * (width - 16);
    g.fillRect(knobX, 4, 16, height - 8);
  }
  g.restore();
}

function drawDial(g: CanvasRenderingContext2D, opts: { label: string; cx: number; cy: number; radius: number; value: number }) {
  const { label, cx, cy, radius, value } = opts;
  g.save();
  g.translate(cx, cy);
  g.fillStyle = 'rgba(12, 22, 40, 0.76)';
  g.beginPath();
  g.arc(0, 0, radius, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = '#5cc6ff';
  g.lineWidth = 2;
  g.stroke();
  const angle = (-Math.PI / 2) + value * Math.PI;
  g.strokeStyle = '#f5f76d';
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(Math.cos(angle) * (radius - 14), Math.sin(angle) * (radius - 14));
  g.stroke();
  g.fillStyle = '#7de3ff';
  g.font = '14px "Space Mono", monospace';
  g.textAlign = 'center';
  g.fillText(label, 0, radius + 20);
  g.restore();
}

function drawTimeline(g: CanvasRenderingContext2D, state: StarshipState, width: number, height: number) {
  const timelineWidth = width * 0.65;
  const x = (width - timelineWidth) / 2;
  const y = height - 80;
  g.save();
  g.fillStyle = 'rgba(5, 12, 24, 0.8)';
  g.fillRect(x, y, timelineWidth, 48);
  g.strokeStyle = '#143d66';
  g.strokeRect(x, y, timelineWidth, 48);
  const total = state.ascent.targetAltitude;
  g.fillStyle = '#7de3ff';
  g.fillRect(x, y + 38, timelineWidth * (state.ascent.altitude / total), 6);
  for (const event of state.ascent.events) {
    const marker = x + (event.triggerTime / 60) * timelineWidth;
    g.fillStyle =
      event.status === 'resolved'
        ? '#64ffa3'
        : event.status === 'active'
          ? '#ffec6e'
          : '#5c79b0';
    g.fillRect(marker - 2, y + 4, 4, 28);
  }
  g.fillStyle = '#7de3ff';
  g.font = '12px "Space Mono", monospace';
  g.textAlign = 'left';
  g.fillText('Events timeline', x + 8, y + 16);
  g.restore();
}

function drawAscentScene(g: CanvasRenderingContext2D, w: number, h: number, state: StarshipState) {
  const shipX = w * 0.3;
  const shipY = h * 0.6 - Math.min(state.ascent.altitude / 2000, h * 0.3);
  g.save();
  g.fillStyle = '#0a1624';
  g.beginPath();
  g.moveTo(shipX - 24, shipY + 80);
  g.lineTo(shipX, shipY - 110);
  g.lineTo(shipX + 24, shipY + 80);
  g.closePath();
  g.fill();
  g.strokeStyle = '#9de9ff';
  g.stroke();
  g.restore();
}

function renderAscentParticles(g: CanvasRenderingContext2D, particles: Particle[]) {
  g.save();
  for (const p of particles) {
    const alpha = 1 - p.life / p.maxLife;
    g.fillStyle = `hsla(${p.hue}, 100%, 70%, ${alpha * p.alpha})`;
    g.fillRect(p.x, p.y, p.size, p.size * 3);
  }
  g.restore();
}

function spawnExhaust(state: StarshipState, dt: number) {
  const spawnCount = Math.floor(dt * 120);
  for (let i = 0; i < spawnCount; i++) {
    state.exhaust.push({
      x: 180 + state.rng() * 12,
      y: 460 + state.rng() * 10,
      vx: (state.rng() - 0.5) * 40,
      vy: 120 + state.rng() * 160,
      life: 0,
      maxLife: 0.6 + state.rng() * 0.6,
      size: 4 + state.rng() * 2,
      hue: 190 + state.rng() * 40,
      alpha: 0.6,
    });
  }
}

function maybeSpawnDebris(state: StarshipState, dt: number) {
  if (state.rng() < dt * 0.5) {
    state.debris.push({
      x: 300 + state.rng() * 200,
      y: 200 + state.rng() * 200,
      vx: -60 - state.rng() * 80,
      vy: 20 + state.rng() * 40,
      life: 0,
      maxLife: 2 + state.rng() * 1.5,
      size: 3 + state.rng() * 3,
      hue: 20 + state.rng() * 20,
      alpha: 0.8,
    });
  }
}

function updateParticles(particles: Particle[], dt: number) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    if (!p) continue;
    p.life += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.life >= p.maxLife) {
      particles.splice(i, 1);
    }
  }
}

function wrapText(
  g: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  g.textAlign = 'center';
  const words = text.split(' ');
  let line = '';
  let offset = 0;
  for (const word of words) {
    const test = `${line}${word} `;
    if (g.measureText(test).width > maxWidth && line) {
      g.fillText(line, x, y + offset);
      line = `${word} `;
      offset += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) g.fillText(line.trim(), x, y + offset);
}

function updatePointerControl(pointer: PointerState, state: StarshipState, stage: { width: number; height: number }) {
  if (!pointer.mode) return;
  const { width: w, height: h } = stage;
  switch (pointer.mode) {
    case 'base-thrust': {
      const slider = { x: w * 0.08, y: h * 0.25, height: h * 0.5 };
      const ratio = 1 - clamp01((pointer.y - slider.y) / slider.height);
      state.controls.baseThrust = ratio;
      break;
    }
    case 'vector': {
      const dial = { cx: w * 0.35, cy: h * 0.65 };
      const dx = pointer.x - dial.cx;
      const dy = pointer.y - dial.cy;
      const angle = Math.atan2(dy, dx);
      state.controls.vectorBias = clampSigned((angle + Math.PI / 2) / Math.PI);
      break;
    }
    case 'fuel': {
      const slider = { x: w * 0.55, width: w * 0.35 };
      const ratio = clamp01((pointer.x - slider.x) / slider.width);
      state.controls.fuelMix = ratio * 2 - 1;
      break;
    }
    case 'throttle': {
      const slider = { y: stage.height * 0.2, height: stage.height * 0.6, x: stage.width - 70 };
      const ratio = 1 - clamp01((pointer.y - slider.y) / slider.height);
      state.ascent.thrust = ratio;
      break;
    }
  }
}

function resolvePointerMode(x: number, y: number, stage: { width: number; height: number }, phase: StarshipState['phase']) {
  const { width: w, height: h } = stage;
  if (phase === 'prep') {
    if (hitRect(x, y, w * 0.08, h * 0.25, 40, h * 0.5)) return 'base-thrust';
    if (hitCircle(x, y, w * 0.35, h * 0.65, 70)) return 'vector';
    if (hitRect(x, y, w * 0.55, h * 0.75, w * 0.35, 40)) return 'fuel';
  } else if (phase === 'ascent') {
    if (hitRect(x, y, w - 70, h * 0.2, 32, h * 0.6)) return 'throttle';
  }
  return null;
}

function hitRect(px: number, py: number, x: number, y: number, width: number, height: number) {
  return px >= x && px <= x + width && py >= y && py <= y + height;
}

function hitCircle(px: number, py: number, cx: number, cy: number, radius: number) {
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= radius * radius;
}

function toStageCoords(event: PointerEvent, stage: { canvas: HTMLCanvasElement; width: number; height: number }) {
  const rect = stage.canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * stage.width;
  const y = ((event.clientY - rect.top) / rect.height) * stage.height;
  return { x, y };
}

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}

function clampSigned(v: number) {
  return Math.min(1, Math.max(-1, v));
}
