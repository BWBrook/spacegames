import { INTERGALACTIC_CONSTANTS, clamp01 } from './state';
import type { IntergalacticState } from './types';

interface Star {
  x: number;
  y: number;
  size: number;
  drift: number;
  alpha: number;
}
interface Point {
  x: number;
  y: number;
}

export function renderIntergalactic(
  stage: { width: number; height: number; ctx: CanvasRenderingContext2D },
  title: string,
  state: IntergalacticState,
  stars: Star[],
) {
  const g = stage.ctx;
  drawBackdrop(g, stage.width, stage.height, stars);
  drawBroadcastWorld(g, stage.width, stage.height, state);
  if (state.phase === 'aim') renderAim(g, stage.width, stage.height, state);
  if (state.phase === 'flight') renderFlight(g, stage.width, stage.height, state);
  if (state.phase === 'debrief') renderDebrief(g, stage.width, stage.height, state);
  renderTopBar(g, stage.width, title, state);
}

function renderAim(g: CanvasRenderingContext2D, width: number, height: number, state: IntergalacticState) {
  const orbit = getOrbitLayout(width, height, state);
  drawTrajectory(g, orbit.launch, orbit.target, orbit.predicted, 1, '#62e8ff', false);
  drawSatellite(g, orbit.launch.x, orbit.launch.y - 18, 0, '#ffdf6e');
  drawContractPanel(g, 42, 84, Math.min(380, width * 0.28), state);
  drawControlsPanel(g, width - Math.min(430, width * 0.32) - 42, 92, Math.min(430, width * 0.32), state);
  drawTelemetryBands(g, width, height, state);
  drawHint(g, width / 2 - 295, height - 72, 590, 'Arrows tune angle/speed · Shift for fine trim · Enter launches · Space launches');
}

function renderFlight(g: CanvasRenderingContext2D, width: number, height: number, state: IntergalacticState) {
  const t = clamp01(state.phaseElapsed / INTERGALACTIC_CONSTANTS.flightDuration);
  const orbit = getOrbitLayout(width, height, state, true);
  drawTrajectory(g, orbit.launch, orbit.target, orbit.predicted, 1, 'rgba(98, 232, 255, 0.28)', true);
  drawTrajectory(g, orbit.launch, orbit.target, orbit.predicted, t, '#ffdf6e', false);
  const craft = pointOnCurve(orbit.launch, orbit.target, orbit.predicted, t);
  drawSatellite(g, craft.x, craft.y, t * Math.PI * 4, '#ffdf6e');
  drawFlightPanel(g, 42, 90, Math.min(390, width * 0.3), state);
  drawSignalGate(g, width / 2 - 230, 92, 460, state);
  drawHint(g, width / 2 - 310, height - 72, 620, 'Space when the cursor crosses centre for broadcast lock · Arrows trim flight');
}

function renderDebrief(g: CanvasRenderingContext2D, width: number, height: number, state: IntergalacticState) {
  const orbit = getOrbitLayout(width, height, state, true);
  drawTrajectory(g, orbit.launch, orbit.target, orbit.predicted, 1, state.debrief?.outcome === 'success' ? '#8dffb7' : '#ff8e7f', false);
  const end = pointOnCurve(orbit.launch, orbit.target, orbit.predicted, 1);
  drawSatellite(g, end.x, end.y, 0.6, state.debrief?.outcome === 'success' ? '#8dffb7' : '#ff8e7f');
  drawDebriefCard(g, width, height, state);
}

function renderTopBar(g: CanvasRenderingContext2D, width: number, title: string, state: IntergalacticState) {
  g.save();
  g.fillStyle = 'rgba(3, 9, 20, 0.9)';
  g.fillRect(0, 0, width, 58);
  g.fillStyle = '#b7fbff';
  g.font = '18px "Space Mono", monospace';
  g.textAlign = 'left';
  g.fillText(title, 18, 24);
  drawChip(g, state.phase.toUpperCase(), 286, 10, phaseColor(state.phase));
  g.textAlign = 'center';
  g.fillStyle = '#8bdfff';
  g.font = '14px "Space Mono", monospace';
  g.fillText(state.statusMessage, width / 2, 43);
  g.textAlign = 'right';
  g.fillStyle = '#ffdf6e';
  g.fillText(`Attempt ${state.attempt}/${state.maxAttempts}`, width - 24, 24);
  g.restore();
}

function drawContractPanel(g: CanvasRenderingContext2D, x: number, y: number, panelWidth: number, state: IntergalacticState) {
  drawPanel(g, x, y, panelWidth, 308, 'NCTV LAUNCH CONTRACT');
  g.save();
  g.translate(x + 18, y + 48);
  g.fillStyle = '#dffbff';
  g.font = '17px "Space Mono", monospace';
  g.fillText('First Intergalactic Games', 0, 0);
  g.fillStyle = '#8bdfff';
  g.font = '14px "Space Mono", monospace';
  g.fillText('Exclusive feed depends on one satellite.', 0, 30);
  g.fillText('Hit the requested orbital height.', 0, 52);
  metric(g, 'Target height', `${state.targetHeight}`, 94);
  metric(g, 'Rival coverage', `${Math.round(state.rivalCoverage * 100)}%`, 126);
  metric(g, 'Signal lock', `${Math.round(state.signalLock * 100)}%`, 158);
  g.fillStyle = '#ffdf6e';
  g.fillText('BBC rules preserved:', 0, 205);
  g.fillStyle = '#dffbff';
  g.fillText('Success window is <2 degrees', 0, 232);
  g.fillText('and <100 speed units.', 0, 254);
  g.restore();
}

function drawControlsPanel(g: CanvasRenderingContext2D, x: number, y: number, panelWidth: number, state: IntergalacticState) {
  drawPanel(g, x, y, panelWidth, 330, 'ENGINEERING CONSOLE');
  const left = x + 22;
  const top = y + 58;
  drawReadout(g, left, top, 'Angle', `${state.angle.toFixed(1)} deg`, `${state.telemetryAngle.toFixed(1)} deg analyst band`);
  drawMeter(g, left, top + 62, panelWidth - 44, state.angle / 90, '#62e8ff');
  drawRangeMarker(g, left, top + 62, panelWidth - 44, state.telemetryAngle / 90, 3.2 / 90);
  drawReadout(g, left, top + 122, 'Speed', `${Math.round(state.speed)} m/s`, `${Math.round(state.telemetrySpeed)} m/s analyst band`);
  drawMeter(g, left, top + 184, panelWidth - 44, state.speed / 40_000, '#ffdf6e');
  drawRangeMarker(g, left, top + 184, panelWidth - 44, state.telemetrySpeed / 40_000, 850 / 40_000);
  const angleError = state.angle - state.telemetryAngle;
  const speedError = state.speed - state.telemetrySpeed;
  g.save();
  g.fillStyle = '#9edcff';
  g.font = '13px "Space Mono", monospace';
  g.fillText(`Telemetry offset: ${formatSigned(angleError, 1)} deg · ${formatSigned(speedError, 0)} speed`, left, top + 244);
  g.fillStyle = Math.abs(angleError) < 3.2 && Math.abs(speedError) < 850 ? '#8dffb7' : '#ffdf6e';
  g.fillText(Math.abs(angleError) < 3.2 && Math.abs(speedError) < 850 ? 'Band lock: plausible' : 'Band lock: tune closer', left, top + 272);
  g.restore();
}

function drawFlightPanel(g: CanvasRenderingContext2D, x: number, y: number, panelWidth: number, state: IntergalacticState) {
  drawPanel(g, x, y, panelWidth, 292, 'LIVE LAUNCH REPORT');
  g.save();
  g.translate(x + 18, y + 48);
  const angleError = state.launchAngle - state.idealAngle;
  const speedError = state.launchSpeed - state.idealSpeed;
  metric(g, 'Angle trim', `${state.launchAngle.toFixed(1)} deg`, 0);
  metric(g, 'Speed trim', `${Math.round(state.launchSpeed)} m/s`, 34);
  metric(g, 'Broadcast lock', `${Math.round(state.signalLock * 100)}%`, 68);
  metric(g, 'Rival feed', `${Math.round(state.rivalCoverage * 100)}%`, 102);
  g.fillStyle = '#8bdfff';
  g.font = '13px "Space Mono", monospace';
  g.fillText(`Hidden solution delta: ${formatSigned(angleError, 1)} deg / ${formatSigned(speedError, 0)}`, 0, 160);
  g.fillStyle = '#ffdf6e';
  g.fillText('NCTV director: keep the signal gate centred.', 0, 198);
  g.restore();
}

function drawDebriefCard(g: CanvasRenderingContext2D, width: number, height: number, state: IntergalacticState) {
  const debrief = state.debrief;
  const cardWidth = Math.min(650, width * 0.72);
  const x = (width - cardWidth) / 2;
  const y = height * 0.24;
  drawPanel(g, x, y, cardWidth, 350, 'NETWORK DEBRIEF');
  if (!debrief) return;
  g.save();
  g.textAlign = 'center';
  g.fillStyle = debrief.outcome === 'success' ? '#8dffb7' : debrief.outcome === 'fired' ? '#ff8e7f' : '#ffdf6e';
  g.font = '34px "Space Mono", monospace';
  g.fillText(debrief.outcome === 'success' ? 'NCTV WINS' : debrief.outcome === 'fired' ? "YOU'RE FIRED" : 'ORBIT MISSED', width / 2, y + 78);
  g.fillStyle = '#dffbff';
  g.font = '17px "Space Mono", monospace';
  wrapText(g, debrief.summary, width / 2, y + 120, cardWidth - 80, 22);
  g.fillStyle = '#8bdfff';
  g.fillText(`Angle error ${formatSigned(debrief.angleError, 2)} deg · Speed error ${formatSigned(debrief.speedError, 0)}`, width / 2, y + 190);
  g.fillText(`Signal lock ${Math.round(debrief.signalLock * 100)}% · Score ${debrief.score}`, width / 2, y + 222);
  if (debrief.outcome === 'success') {
    g.fillStyle = '#ffdf6e';
    g.fillText(`Bonus of ${debrief.bonus} credits`, width / 2, y + 256);
  } else if (debrief.feedback.length) {
    g.fillStyle = '#ffdf6e';
    g.fillText(debrief.feedback.join(' · '), width / 2, y + 256);
  }
  g.fillStyle = '#9edcff';
  g.font = '15px "Space Mono", monospace';
  g.fillText(debrief.outcome === 'miss' ? 'Press Enter to relaunch this satellite' : 'Press Enter for the next event', width / 2, y + 310);
  g.restore();
}

function drawBroadcastWorld(g: CanvasRenderingContext2D, width: number, height: number, state: IntergalacticState) {
  const orbit = getOrbitLayout(width, height, state, state.phase !== 'aim');
  g.save();
  g.strokeStyle = 'rgba(98, 232, 255, 0.25)';
  g.lineWidth = 2;
  g.beginPath();
  g.ellipse(orbit.target.x, orbit.target.y, 86, 42, -0.18, 0, Math.PI * 2);
  g.stroke();
  g.strokeStyle = '#8dffb7';
  g.globalAlpha = 0.86;
  g.beginPath();
  g.moveTo(orbit.target.x - 72, orbit.target.y);
  g.lineTo(orbit.target.x + 72, orbit.target.y);
  g.stroke();
  g.globalAlpha = 1;
  g.fillStyle = '#dffbff';
  g.font = '13px "Space Mono", monospace';
  g.textAlign = 'center';
  g.fillText(`TARGET HEIGHT ${state.targetHeight}`, orbit.target.x, orbit.target.y - 58);
  drawBroadcastTruck(g, orbit.launch.x - 92, orbit.launch.y + 12);
  drawLaunchMast(g, orbit.launch.x, orbit.launch.y);
  drawRivalBeam(g, width, height, state.rivalCoverage);
  g.restore();
}

function drawSignalGate(g: CanvasRenderingContext2D, x: number, y: number, width: number, state: IntergalacticState) {
  g.save();
  drawPanel(g, x, y, width, 128, 'BROADCAST LOCK');
  const barX = x + 32;
  const barY = y + 68;
  const barWidth = width - 64;
  g.fillStyle = '#10223a';
  g.fillRect(barX, barY, barWidth, 18);
  g.fillStyle = 'rgba(141, 255, 183, 0.3)';
  g.fillRect(barX + barWidth * 0.42, barY - 8, barWidth * 0.16, 34);
  g.fillStyle = '#ffdf6e';
  g.fillRect(barX + barWidth * state.signalCursor - 4, barY - 10, 8, 38);
  g.fillStyle = '#8dffb7';
  g.fillRect(barX, y + 106, barWidth * state.signalLock, 8);
  g.fillStyle = '#9edcff';
  g.font = '13px "Space Mono", monospace';
  g.textAlign = 'center';
  g.fillText('Press Space in the green gate', x + width / 2, y + 45);
  g.restore();
}

function drawTrajectory(
  g: CanvasRenderingContext2D,
  start: Point,
  target: Point,
  predicted: Point,
  progress: number,
  color: string,
  dashed: boolean,
) {
  g.save();
  g.strokeStyle = color;
  g.lineWidth = 3;
  if (dashed) g.setLineDash([8, 10]);
  g.beginPath();
  const steps = Math.max(2, Math.floor(42 * progress));
  for (let i = 0; i <= steps; i++) {
    const t = i / 42;
    if (t > progress) break;
    const point = pointOnCurve(start, target, predicted, t);
    if (i === 0) g.moveTo(point.x, point.y);
    else g.lineTo(point.x, point.y);
  }
  g.stroke();
  g.restore();
}

function pointOnCurve(start: Point, target: Point, predicted: Point, t: number): Point {
  const apexLift = 150 + Math.max(0, start.y - target.y) * 0.7;
  const control = {
    x: (start.x + predicted.x) / 2,
    y: Math.min(target.y, predicted.y) - apexLift,
  };
  const a = (1 - t) * (1 - t);
  const b = 2 * (1 - t) * t;
  const c = t * t;
  return {
    x: a * start.x + b * control.x + c * predicted.x,
    y: a * start.y + b * control.y + c * predicted.y,
  };
}

function getOrbitLayout(width: number, height: number, state: IntergalacticState, launched = false) {
  const launch = { x: width * 0.18, y: height * 0.78 };
  const target = {
    x: width * (launched ? 0.78 : 0.64),
    y: height * 0.78 - (state.targetHeight / 100) * height * 0.5,
  };
  const angle = launched ? state.launchAngle : state.angle;
  const speed = launched ? state.launchSpeed : state.speed;
  const angleError = angle - state.idealAngle;
  const speedError = speed - state.idealSpeed;
  const predicted = {
    x: target.x + speedError * 0.012,
    y: target.y - angleError * 6 - speedError * 0.006,
  };
  return { launch, target, predicted };
}

function drawBackdrop(g: CanvasRenderingContext2D, width: number, height: number, stars: Star[]) {
  const gradient = g.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#10112f');
  gradient.addColorStop(0.45, '#071b34');
  gradient.addColorStop(1, '#1c0f21');
  g.fillStyle = gradient;
  g.fillRect(0, 0, width, height);
  g.save();
  for (const star of stars) {
    g.fillStyle = `rgba(198, 246, 255, ${star.alpha})`;
    g.fillRect(star.x, star.y, star.size, star.size);
  }
  g.globalAlpha = 0.08;
  g.strokeStyle = '#8df7ff';
  for (let y = 84; y < height; y += 28) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(width, y);
    g.stroke();
  }
  g.restore();
}

function drawSatellite(g: CanvasRenderingContext2D, x: number, y: number, rotation: number, color: string) {
  g.save();
  g.translate(x, y);
  g.rotate(rotation);
  g.fillStyle = color;
  g.fillRect(-12, -9, 24, 18);
  g.fillStyle = '#62e8ff';
  g.fillRect(-48, -5, 28, 10);
  g.fillRect(20, -5, 28, 10);
  g.strokeStyle = '#dffbff';
  g.strokeRect(-12, -9, 24, 18);
  g.restore();
}

function drawBroadcastTruck(g: CanvasRenderingContext2D, x: number, y: number) {
  g.save();
  g.translate(x, y);
  g.fillStyle = '#10223a';
  g.fillRect(0, 0, 120, 42);
  g.fillStyle = '#62e8ff';
  g.fillRect(14, 10, 38, 12);
  g.fillStyle = '#ffdf6e';
  g.font = '14px "Space Mono", monospace';
  g.fillText('NCTV', 62, 24);
  g.strokeStyle = '#62e8ff';
  g.beginPath();
  g.moveTo(28, 0);
  g.lineTo(54, -34);
  g.lineTo(78, 0);
  g.stroke();
  g.fillStyle = '#07111f';
  g.beginPath();
  g.arc(24, 48, 10, 0, Math.PI * 2);
  g.arc(94, 48, 10, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

function drawLaunchMast(g: CanvasRenderingContext2D, x: number, y: number) {
  g.save();
  g.strokeStyle = '#62e8ff';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(x - 36, y);
  g.lineTo(x, y - 128);
  g.lineTo(x + 36, y);
  g.stroke();
  g.strokeStyle = 'rgba(98, 232, 255, 0.35)';
  g.beginPath();
  g.moveTo(x - 58, y);
  g.lineTo(x + 58, y);
  g.stroke();
  g.restore();
}

function drawRivalBeam(g: CanvasRenderingContext2D, width: number, height: number, coverage: number) {
  g.save();
  const x = width * 0.91;
  const y = height * 0.8;
  const beamHeight = height * 0.54 * coverage;
  g.strokeStyle = 'rgba(255, 99, 132, 0.35)';
  g.lineWidth = 8;
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(width * 0.74, y - beamHeight);
  g.stroke();
  g.fillStyle = '#ff8e7f';
  g.font = '13px "Space Mono", monospace';
  g.textAlign = 'center';
  g.fillText('RIVAL FEED', x - 24, y + 34);
  g.restore();
}

function drawPanel(g: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, title: string) {
  g.save();
  g.fillStyle = 'rgba(4, 13, 27, 0.86)';
  g.fillRect(x, y, width, height);
  g.strokeStyle = 'rgba(98, 232, 255, 0.42)';
  g.lineWidth = 2;
  g.strokeRect(x, y, width, height);
  g.fillStyle = '#62e8ff';
  g.font = '14px "Space Mono", monospace';
  g.textAlign = 'left';
  g.fillText(title, x + 14, y + 25);
  g.restore();
}

function drawReadout(g: CanvasRenderingContext2D, x: number, y: number, label: string, value: string, hint: string) {
  g.save();
  g.fillStyle = '#8bdfff';
  g.font = '14px "Space Mono", monospace';
  g.fillText(label, x, y);
  g.fillStyle = '#dffbff';
  g.font = '24px "Space Mono", monospace';
  g.fillText(value, x, y + 28);
  g.fillStyle = '#9edcff';
  g.font = '12px "Space Mono", monospace';
  g.fillText(hint, x, y + 48);
  g.restore();
}

function drawMeter(g: CanvasRenderingContext2D, x: number, y: number, width: number, value: number, color: string) {
  g.save();
  g.fillStyle = '#10223a';
  g.fillRect(x, y, width, 18);
  g.fillStyle = color;
  g.fillRect(x, y, width * clamp01(value), 18);
  g.strokeStyle = 'rgba(223, 251, 255, 0.35)';
  g.strokeRect(x, y, width, 18);
  g.restore();
}

function drawRangeMarker(g: CanvasRenderingContext2D, x: number, y: number, width: number, centre: number, radius: number) {
  g.save();
  const left = x + width * clamp01(centre - radius);
  const markerWidth = width * radius * 2;
  g.fillStyle = 'rgba(141, 255, 183, 0.35)';
  g.fillRect(left, y - 4, markerWidth, 26);
  g.restore();
}

function drawTelemetryBands(g: CanvasRenderingContext2D, width: number, height: number, state: IntergalacticState) {
  const x = width * 0.48;
  const y = height * 0.18;
  g.save();
  g.fillStyle = '#b7fbff';
  g.font = '24px "Space Mono", monospace';
  g.textAlign = 'center';
  g.fillText('Tune the satellite insertion vector', x, y);
  g.fillStyle = '#9edcff';
  g.font = '14px "Space Mono", monospace';
  g.fillText(`Analyst estimate: ${state.telemetryAngle.toFixed(1)} deg / ${Math.round(state.telemetrySpeed)} m/s`, x, y + 30);
  g.restore();
}

function drawHint(g: CanvasRenderingContext2D, x: number, y: number, width: number, text: string) {
  g.save();
  g.fillStyle = 'rgba(4, 13, 27, 0.78)';
  g.fillRect(x, y, width, 34);
  g.strokeStyle = 'rgba(98, 232, 255, 0.32)';
  g.strokeRect(x, y, width, 34);
  g.fillStyle = '#9edcff';
  g.font = '13px "Space Mono", monospace';
  g.textAlign = 'center';
  g.fillText(text, x + width / 2, y + 22);
  g.restore();
}

function drawChip(g: CanvasRenderingContext2D, text: string, x: number, y: number, color: string) {
  g.save();
  g.fillStyle = 'rgba(10, 24, 44, 0.84)';
  g.fillRect(x, y, 112, 28);
  g.strokeStyle = color;
  g.strokeRect(x, y, 112, 28);
  g.fillStyle = color;
  g.font = '13px "Space Mono", monospace';
  g.textAlign = 'center';
  g.fillText(text, x + 56, y + 18);
  g.restore();
}

function metric(g: CanvasRenderingContext2D, label: string, value: string, y: number) {
  g.fillStyle = '#8bdfff';
  g.font = '14px "Space Mono", monospace';
  g.fillText(label, 0, y);
  g.fillStyle = '#dffbff';
  g.textAlign = 'right';
  g.fillText(value, 310, y);
  g.textAlign = 'left';
}

function wrapText(g: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(' ');
  let line = '';
  let offset = 0;
  for (const word of words) {
    const trial = `${line}${word} `;
    if (g.measureText(trial).width > maxWidth && line) {
      g.fillText(line.trimEnd(), x, y + offset);
      line = `${word} `;
      offset += lineHeight;
    } else {
      line = trial;
    }
  }
  if (line) g.fillText(line.trimEnd(), x, y + offset);
}

function formatSigned(value: number, digits: number) {
  const formatted = digits === 0 ? Math.round(value).toString() : value.toFixed(digits);
  return value >= 0 ? `+${formatted}` : formatted;
}

function phaseColor(phase: IntergalacticState['phase']) {
  if (phase === 'aim') return '#62e8ff';
  if (phase === 'flight') return '#ffdf6e';
  return '#8dffb7';
}

export function createStars(width: number, height: number): Star[] {
  return Array.from({ length: 130 }, () => ({
    x: Math.random() * Math.max(1, width),
    y: Math.random() * Math.max(1, height),
    size: 0.7 + Math.random() * 2.2,
    drift: 0.12 + Math.random() * 0.7,
    alpha: 0.18 + Math.random() * 0.62,
  }));
}

export function updateStars(stars: Star[], dt: number, width: number, height: number) {
  for (const star of stars) {
    star.x -= star.drift * dt * 18;
    star.y += star.drift * dt * 5;
    if (star.x < 0 || star.y > height) {
      star.x = width;
      star.y = Math.random() * Math.max(1, height * 0.75);
    }
  }
}
