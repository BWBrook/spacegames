import { computeBaseThrust } from './state';
import type { Particle, StarshipState } from './types';

export interface PointerState {
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

export function renderStarship(
  stage: { width: number; height: number; ctx: CanvasRenderingContext2D },
  state: StarshipState,
  pointer: PointerState,
  stars: StarSprite[],
  title: string,
) {
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
  renderStatusBar(g, stage, state, title);
}

export function updateStars(stars: StarSprite[], dt: number, stage: { width: number; height: number }) {
  for (const star of stars) {
    star.y += star.speed * dt * 40;
    if (star.y > stage.height) {
      star.y = 0;
      star.x = Math.random() * stage.width;
      star.size = 0.5 + Math.random() * 2;
    }
  }
}

export function createStars(width: number, height: number): StarSprite[] {
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
  const layout = getPrepLayout(stage);
  drawShipSilhouette(g, w, h, state.ascent.altitude);
  drawMissionPanel(g, layout.panel.x, layout.panel.y, layout.panel.width, state, 'prep');
  drawSlider(g, {
    label: 'Booster Power',
    x: layout.booster.x,
    y: layout.booster.y,
    width: layout.booster.width,
    height: layout.booster.height,
    value: state.controls.baseThrust,
    vertical: true,
    readout: `${Math.round(state.controls.baseThrust * 100)}%  A/D`,
  });
  drawDial(g, {
    label: 'Vector Bias',
    cx: layout.vector.cx,
    cy: layout.vector.cy,
    radius: layout.vector.radius,
    value: state.controls.vectorBias,
    readout: `${formatPercentSigned(state.controls.vectorBias)}  W/S`,
  });
  drawSlider(g, {
    label: 'Fuel Mix',
    x: layout.fuel.x,
    y: layout.fuel.y,
    width: layout.fuel.width,
    height: layout.fuel.height,
    value: (state.controls.fuelMix + 1) / 2,
    vertical: false,
    readout: `${formatPercentSigned(state.controls.fuelMix)}  Q/E`,
  });

  g.fillStyle = '#7de3ff';
  g.font = '26px "Space Mono", monospace';
  g.textAlign = 'center';
  g.fillText('Prep: Solve the noisy launch equation', w / 2, h * 0.12);
  g.font = '16px "Space Mono", monospace';
  g.fillStyle = '#9edcff';
  g.fillText('Match projected burn to the telemetry target, then commit with Enter.', w / 2, h * 0.16);

  const interactionLabel = pointer.active && pointer.mode
    ? `Dragging ${pointer.mode.replace('-', ' ')}`
    : 'Mouse drag also works on any highlighted control';
  drawHintStrip(g, layout.hint.x, layout.hint.y, layout.hint.width, layout.hint.height, interactionLabel);
}

function renderCommit(g: CanvasRenderingContext2D, stage: { width: number; height: number }, state: StarshipState) {
  const { width: w, height: h } = stage;
  drawShipSilhouette(g, w, h, state.ascent.altitude);
  drawMissionPanel(g, 88, 110, 290, state, 'commit');
  const barWidth = w * 0.6;
  const x = (w - barWidth) / 2;
  const y = h * 0.45;
  g.fillStyle = 'rgba(10, 24, 44, 0.75)';
  g.fillRect(x, y - 18, barWidth, 60);
  g.strokeStyle = 'rgba(99, 201, 255, 0.25)';
  g.strokeRect(x, y - 18, barWidth, 60);
  g.fillStyle = '#143d73';
  g.fillRect(x + 12, y + 2, barWidth - 24, 20);
  g.fillStyle = '#0ff';
  const cursorPos = x + state.commit.cursor * barWidth;
  g.fillRect(cursorPos - 5, y - 16, 10, 56);
  g.strokeStyle = '#ffec6e';
  g.lineWidth = 3;
  g.strokeRect(x + barWidth / 2 - 28, y - 6, 56, 36);
  g.fillStyle = '#7de3ff';
  g.font = '28px "Space Mono", monospace';
  g.textAlign = 'center';
  g.fillText('Commit: Time ignition!', w / 2, h * 0.32);
  g.font = '16px "Space Mono", monospace';
  g.fillStyle = '#9edcff';
  g.fillText('Center hit boosts the launch; press Enter or Space in the gold window.', w / 2, h * 0.37);
  drawHintStrip(g, w / 2 - 180, y + 62, 360, 30, 'Enter / Space to fire the stack');
}

function renderAscent(g: CanvasRenderingContext2D, stage: { width: number; height: number }, state: StarshipState) {
  drawAscentScene(g, stage.width, stage.height, state);
  renderAscentParticles(g, state.exhaust);
  renderAscentParticles(g, state.debris);
  drawMissionPanel(g, 34, 84, 310, state, 'ascent');
  drawSlider(g, {
    label: 'Live Thrust',
    x: stage.width - 70,
    y: stage.height * 0.2,
    width: 32,
    height: stage.height * 0.6,
    value: state.ascent.thrust,
    vertical: true,
    readout: `${Math.round(state.ascent.thrust * 100)}%  W/S`,
  });
  drawTimeline(g, state, stage.width, stage.height);
  drawHintStrip(g, stage.width - 332, stage.height - 126, 280, 30, 'Hold Space to vent heat');
}

function renderDebrief(g: CanvasRenderingContext2D, stage: { width: number; height: number }, state: StarshipState) {
  const { width: w, height: h } = stage;
  drawShipSilhouette(g, w, h, state.ascent.altitude);
  const cardWidth = Math.min(520, w * 0.8);
  const x = (w - cardWidth) / 2;
  const y = h * 0.3;
  g.fillStyle = 'rgba(5, 12, 24, 0.92)';
  g.fillRect(x, y, cardWidth, 254);
  g.strokeStyle = '#61d7ff';
  g.lineWidth = 2;
  g.strokeRect(x, y, cardWidth, 254);
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
    g.fillText(`Rewards: ${state.debrief.rewards} star credits`, w / 2, y + 186);
    g.fillStyle = '#9edcff';
    g.fillText(
      `Peak heat ${state.ascent.peakHeat.toFixed(0)}  ·  Hull ${state.ascent.integrity.toFixed(0)}%  ·  Avg burn ${Math.round(getAverageBurn(state))}`,
      w / 2,
      y + 214,
    );
    g.font = '16px "Space Mono", monospace';
    g.fillText('Press Enter to prep the next launch', w / 2, y + 238);
  }
}

function getPrepLayout(stage: { width: number; height: number }) {
  const { width: w, height: h } = stage;
  const panelWidth = Math.min(300, w * 0.25);
  const panelHeight = 236;
  const panel = { x: 68, y: 96, width: panelWidth, height: panelHeight };
  return {
    panel,
    booster: {
      x: panel.x + 18,
      y: panel.y + panel.height + 52,
      width: 40,
      height: Math.min(248, h * 0.34),
    },
    vector: {
      cx: w * 0.35,
      cy: h * 0.65,
      radius: 60,
    },
    fuel: {
      x: w * 0.55,
      y: h * 0.75,
      width: Math.min(w * 0.35, 420),
      height: 28,
    },
    hint: {
      x: w / 2 - 220,
      y: h - 70,
      width: 440,
      height: 34,
    },
  };
}

function renderStatusBar(
  g: CanvasRenderingContext2D,
  stage: { width: number; height: number },
  state: StarshipState,
  title: string,
) {
  g.save();
  g.fillStyle = 'rgba(2, 6, 12, 0.88)';
  g.fillRect(0, 0, stage.width, 56);
  g.fillStyle = '#93e7ff';
  g.font = '18px "Space Mono", monospace';
  g.textAlign = 'left';
  g.fillText(title, 18, 22);
  drawPhaseChip(g, state.phase, 242, 8);
  g.textAlign = 'right';
  g.font = '13px "Space Mono", monospace';
  g.fillStyle = '#7de3ff';
  g.fillText(phaseObjective(state.phase), stage.width - 18, 22);
  g.textAlign = 'center';
  g.font = '14px "Space Mono", monospace';
  g.fillStyle = '#9edcff';
  g.fillText(state.statusMessage, stage.width / 2, 44);
  g.restore();
}

function drawShipSilhouette(g: CanvasRenderingContext2D, w: number, h: number, altitude: number) {
  const pose = getShipPose(w, h, altitude, 0, 0);
  g.save();
  g.translate(pose.x, pose.y);
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
  g.strokeStyle = 'rgba(109, 214, 255, 0.18)';
  g.beginPath();
  g.moveTo(-36, 120);
  g.lineTo(116, 120);
  g.stroke();
  g.restore();
}

function drawMissionPanel(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  panelWidth: number,
  state: StarshipState,
  mode: 'prep' | 'commit' | 'ascent',
) {
  const panelHeight = mode === 'ascent' ? 408 : mode === 'commit' ? 264 : 236;
  const estimatedTarget = getTelemetryTarget(state);
  const projectedBurn = getProjectedBurn(state);
  const offset = projectedBurn - estimatedTarget;
  const activeEvent = getActiveEvent(state);
  const nextEvent = getNextEvent(state);
  g.save();
  g.translate(x, y);
  g.fillStyle = 'rgba(10, 24, 44, 0.88)';
  g.fillRect(0, 0, panelWidth, panelHeight);
  g.strokeStyle = 'rgba(109, 214, 255, 0.32)';
  g.strokeRect(0, 0, panelWidth, panelHeight);
  g.fillStyle = '#8af3ff';
  g.font = '15px "Space Mono", monospace';
  g.textAlign = 'left';
  g.fillText(mode === 'ascent' ? 'Mission Telemetry' : 'Telemetry Solution', 14, 24);
  g.fillStyle = '#d7f8ff';
  g.font = '14px "Space Mono", monospace';
  g.fillText(`G  ${state.telemetry.displayGravity.toFixed(1)}`, 14, 56);
  g.fillText(`W  ${state.telemetry.displayWind.toFixed(1)}`, 14, 82);
  g.fillText(`Noise  +/-${state.telemetry.noise.toFixed(1)}`, 14, 108);
  g.fillStyle = '#7de3ff';
  g.fillText(`Telemetry target  ~${Math.round(estimatedTarget)}`, 14, 142);
  g.fillText(`Projected burn   ${Math.round(projectedBurn)}`, 14, 168);
  g.fillText(`Offset           ${formatDelta(offset)}`, 14, 194);

  if (mode === 'ascent') {
    drawMeter(g, 14, 226, panelWidth - 28, 10, state.ascent.altitude / state.ascent.targetAltitude, '#77f7c2', 'Orbit');
    drawMeter(g, 14, 254, panelWidth - 28, 10, state.ascent.integrity / 100, '#68cbff', 'Hull');
    drawMeter(g, 14, 282, panelWidth - 28, 10, state.ascent.heat / 140, state.ascent.heat > 110 ? '#ff8e7f' : '#ffcf6e', 'Heat');
    g.fillStyle = '#d7f8ff';
    g.font = '13px "Space Mono", monospace';
    g.fillText(`Altitude  ${Math.round(state.ascent.altitude)} / ${state.ascent.targetAltitude} m`, 14, 322);
    g.fillText(`Velocity  ${Math.round(state.ascent.velocity)} m/s`, 14, 346);
    g.fillText(`Burn  ${Math.round(state.ascent.lastThrust)}   Avg  ${Math.round(getAverageBurn(state))}`, 14, 370);
    g.fillStyle = activeEvent ? '#ffec6e' : '#9edcff';
    g.fillText(
      activeEvent
        ? `Event  ${activeEvent.title}`
        : nextEvent
          ? `Next  ${nextEvent.title}  ${Math.max(0, nextEvent.triggerTime - state.phaseElapsed).toFixed(1)}s`
          : 'Event lane clear',
      14,
      394,
    );
  } else if (mode === 'commit') {
    g.fillStyle = '#9edcff';
    g.fillText('Centered hits lift thrust ceiling.', 14, 218);
    g.fillText('Gold-window hit means cleaner launch.', 14, 244);
  } else {
    g.fillStyle = Math.abs(offset) <= 18 ? '#8dffb7' : '#ffec6e';
    g.fillText(Math.abs(offset) <= 18 ? 'Lock  Ready to commit' : 'Lock  Tune closer before commit', 14, 220);
  }
  g.restore();
}

function drawSlider(
  g: CanvasRenderingContext2D,
  opts: { label: string; x: number; y: number; width: number; height: number; value: number; vertical: boolean; readout?: string },
) {
  const { label, x, y, width, height, value, vertical, readout } = opts;
  g.save();
  g.translate(x, y);
  g.fillStyle = 'rgba(8, 18, 34, 0.7)';
  g.fillRect(0, 0, width, height);
  g.fillStyle = '#1d3d66';
  g.fillRect(4, 4, width - 8, height - 8);
  g.fillStyle = '#7de3ff';
  g.font = '14px "Space Mono", monospace';
  g.textAlign = 'center';
  g.fillText(label, width / 2, -14);
  g.fillStyle = '#f5f76d';
  if (vertical) {
    const knobY = (1 - value) * (height - 16);
    g.fillRect(4, knobY, width - 8, 16);
  } else {
    const knobX = value * (width - 16);
    g.fillRect(knobX, 4, 16, height - 8);
  }
  if (readout) {
    g.fillStyle = '#9edcff';
    g.font = '12px "Space Mono", monospace';
    g.fillText(readout, width / 2, height + 18);
  }
  g.restore();
}

function drawDial(g: CanvasRenderingContext2D, opts: { label: string; cx: number; cy: number; radius: number; value: number; readout?: string }) {
  const { label, cx, cy, radius, value, readout } = opts;
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
  if (readout) {
    g.fillStyle = '#9edcff';
    g.font = '12px "Space Mono", monospace';
    g.fillText(readout, 0, radius + 40);
  }
  g.restore();
}

function drawTimeline(g: CanvasRenderingContext2D, state: StarshipState, width: number, height: number) {
  const timelineWidth = width * 0.65;
  const x = (width - timelineWidth) / 2;
  const y = height - 92;
  const activeEvent = getActiveEvent(state);
  const nextEvent = getNextEvent(state);
  g.save();
  g.fillStyle = 'rgba(5, 12, 24, 0.8)';
  g.fillRect(x, y, timelineWidth, 58);
  g.strokeStyle = '#143d66';
  g.strokeRect(x, y, timelineWidth, 58);
  const total = state.ascent.targetAltitude;
  g.fillStyle = '#77f7c2';
  g.fillRect(x, y + 46, timelineWidth * clamp01(state.ascent.altitude / total), 6);
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
  g.textAlign = 'right';
  g.fillStyle = activeEvent ? '#ffec6e' : '#9edcff';
  g.fillText(
    activeEvent
      ? activeEvent.title
      : nextEvent
        ? `${nextEvent.title} in ${Math.max(0, nextEvent.triggerTime - state.phaseElapsed).toFixed(1)}s`
        : 'Clear corridor',
    x + timelineWidth - 8,
    y + 16,
  );
  g.restore();
}

function drawAscentScene(g: CanvasRenderingContext2D, w: number, h: number, state: StarshipState) {
  const ship = getShipPose(w, h, state.ascent.altitude, state.controls.vectorBias, state.elapsed);
  g.save();
  const atmosphere = g.createLinearGradient(0, h * 0.6, 0, h);
  atmosphere.addColorStop(0, 'rgba(20, 72, 112, 0)');
  atmosphere.addColorStop(1, 'rgba(36, 122, 184, 0.16)');
  g.fillStyle = atmosphere;
  g.fillRect(0, h * 0.6, w, h * 0.4);

  g.fillStyle = '#0a1624';
  g.beginPath();
  g.moveTo(ship.x - 24, ship.y + 80);
  g.lineTo(ship.x, ship.y - 110);
  g.lineTo(ship.x + 24, ship.y + 80);
  g.closePath();
  g.fill();
  g.strokeStyle = '#9de9ff';
  g.stroke();
  g.strokeStyle = 'rgba(109, 214, 255, 0.18)';
  g.beginPath();
  g.moveTo(ship.x - 40, ship.y + 80);
  g.lineTo(ship.x + 40, ship.y + 80);
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

export function updatePointerControl(pointer: PointerState, state: StarshipState, stage: { width: number; height: number }) {
  if (!pointer.mode) return;
  const prep = getPrepLayout(stage);
  switch (pointer.mode) {
    case 'base-thrust': {
      const ratio = 1 - clamp01((pointer.y - prep.booster.y) / prep.booster.height);
      state.controls.baseThrust = ratio;
      break;
    }
    case 'vector': {
      const dx = pointer.x - prep.vector.cx;
      const dy = pointer.y - prep.vector.cy;
      const angle = Math.atan2(dy, dx);
      state.controls.vectorBias = clampSigned((angle + Math.PI / 2) / Math.PI);
      break;
    }
    case 'fuel': {
      const ratio = clamp01((pointer.x - prep.fuel.x) / prep.fuel.width);
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

export function resolvePointerMode(x: number, y: number, stage: { width: number; height: number }, phase: StarshipState['phase']) {
  if (phase === 'prep') {
    const prep = getPrepLayout(stage);
    if (hitRect(x, y, prep.booster.x, prep.booster.y, prep.booster.width, prep.booster.height)) return 'base-thrust';
    if (hitCircle(x, y, prep.vector.cx, prep.vector.cy, prep.vector.radius + 10)) return 'vector';
    if (hitRect(x, y, prep.fuel.x, prep.fuel.y, prep.fuel.width, 40)) return 'fuel';
  } else if (phase === 'ascent') {
    const { width: w, height: h } = stage;
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

export function toStageCoords(event: PointerEvent, stage: { canvas: HTMLCanvasElement; width: number; height: number }) {
  const rect = stage.canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * stage.width;
  const y = ((event.clientY - rect.top) / rect.height) * stage.height;
  return { x, y };
}

export function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}

export function clampSigned(v: number) {
  return Math.min(1, Math.max(-1, v));
}

function drawMeter(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  value: number,
  color: string,
  label: string,
) {
  g.save();
  g.fillStyle = '#08121f';
  g.fillRect(x, y, width, height);
  g.fillStyle = color;
  g.fillRect(x, y, width * clamp01(value), height);
  g.strokeStyle = 'rgba(109, 214, 255, 0.24)';
  g.strokeRect(x, y, width, height);
  g.fillStyle = '#9edcff';
  g.font = '12px "Space Mono", monospace';
  g.textAlign = 'left';
  g.fillText(label, x, y - 4);
  g.restore();
}

function drawHintStrip(g: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, text: string) {
  g.save();
  g.fillStyle = 'rgba(4, 10, 18, 0.74)';
  g.fillRect(x, y, width, height);
  g.strokeStyle = 'rgba(109, 214, 255, 0.28)';
  g.strokeRect(x, y, width, height);
  g.fillStyle = '#9edcff';
  g.font = '13px "Space Mono", monospace';
  g.textAlign = 'center';
  g.fillText(text, x + width / 2, y + 20);
  g.restore();
}

function drawPhaseChip(g: CanvasRenderingContext2D, phase: StarshipState['phase'], x: number, y: number) {
  const label = phase.toUpperCase();
  const width = 110;
  g.save();
  g.fillStyle = 'rgba(17, 44, 72, 0.9)';
  g.fillRect(x, y, width, 24);
  g.strokeStyle = 'rgba(109, 214, 255, 0.36)';
  g.strokeRect(x, y, width, 24);
  g.fillStyle = '#9edcff';
  g.font = '12px "Space Mono", monospace';
  g.textAlign = 'center';
  g.fillText(label, x + width / 2, y + 16);
  g.restore();
}

function phaseObjective(phase: StarshipState['phase']) {
  switch (phase) {
    case 'prep':
      return 'Tune projected burn to the telemetry target';
    case 'commit':
      return 'Center the ignition cursor';
    case 'ascent':
      return 'Reach orbit without cooking the hull';
    case 'debrief':
      return 'Review the run and relaunch';
  }
}

export function getTelemetryTarget(state: StarshipState) {
  return state.telemetry.displayGravity * state.telemetry.displayWind;
}

function getProjectedBurn(state: StarshipState) {
  const baseBurn = computeBaseThrust(state);
  const vectorPenalty = 1 - Math.abs(state.controls.vectorBias) * 0.08;
  const fuelBonus = 1 + state.controls.fuelMix * 0.05;
  return baseBurn * vectorPenalty * fuelBonus;
}

export function getAverageBurn(state: StarshipState) {
  return state.ascent.burnTime > 0
    ? state.ascent.burnIntegral / state.ascent.burnTime
    : getProjectedBurn(state);
}

export function getActiveEvent(state: StarshipState) {
  return state.ascent.events.find(evt => evt.status === 'active') ?? null;
}

export function getNextEvent(state: StarshipState) {
  return state.ascent.events.find(evt => evt.status === 'upcoming') ?? null;
}

export function getShipPose(width: number, height: number, altitude: number, vectorBias: number, elapsed: number) {
  const baseX = width * 0.3 + vectorBias * 44;
  const baseY = height * 0.72 - Math.min((altitude / 1800), height * 0.34);
  const wobble = Math.sin(elapsed * 3.5) * 4;
  return {
    x: baseX + wobble,
    y: baseY,
  };
}

function formatPercentSigned(value: number) {
  const pct = Math.round(value * 100);
  return `${pct > 0 ? '+' : ''}${pct}%`;
}

function formatDelta(value: number) {
  const rounded = Math.round(value);
  return `${rounded > 0 ? '+' : ''}${rounded}`;
}
