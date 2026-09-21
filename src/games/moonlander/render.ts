import type { Stage } from '../../core/stage';
import { MOONLANDER_RULES, projectTouchdown, verdictFor } from './state';
import type { LandingVerdict } from './state';
import type { MoonlanderState } from './types';

const FONT = '"Space Mono", monospace';
const VERDICT_COLOUR: Record<LandingVerdict, string> = {
  good: '#7dffb3',
  injuries: '#ffd166',
  crashed: '#ff6b6b',
};

/** Altitude visible above the pad, shrinking as you close in so the last metres read. */
function viewSpan(height: number) {
  return Math.min(560, Math.max(45, height * 1.9));
}

export function renderMoonlander(stage: Stage, title: string, state: MoonlanderState) {
  const g = stage.ctx;
  stage.clear('#03040a');
  g.save();
  g.textBaseline = 'alphabetic';

  const groundY = stage.height - 96;
  const span = viewSpan(state.height);
  const pixelsPerUnit = (groundY - 110) / span;
  const landerY = groundY - state.height * pixelsPerUnit;
  const landerX = stage.width * 0.42;

  const shake = state.phase !== 'descent' && state.debrief?.verdict === 'crashed'
    ? Math.max(0, 1 - state.phaseElapsed / 0.6) * 9
    : 0;
  if (shake) g.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);

  drawSky(g, stage, state);
  drawAltitudeScale(g, stage, groundY, pixelsPerUnit, span, state);
  drawSurface(g, stage, groundY, landerX);
  drawLander(g, landerX, landerY, state);
  drawHud(g, stage, title, state);
  drawThrottle(g, stage, state);
  drawStatus(g, stage, state);
  if (state.phase === 'debrief' && state.debrief) drawDebrief(g, stage, state);
  g.restore();
}

function drawSky(g: CanvasRenderingContext2D, stage: Stage, state: MoonlanderState) {
  g.fillStyle = 'rgba(200, 220, 255, 0.5)';
  for (let i = 0; i < 90; i += 1) {
    const x = ((i * 787) % 1000) / 1000 * stage.width;
    const drift = (state.height * 0.4) % stage.height;
    const y = (((i * 421) % 1000) / 1000 * stage.height + drift) % stage.height;
    g.globalAlpha = 0.25 + 0.4 * (((i * 37) % 10) / 10);
    g.fillRect(x, y, 2, 2);
  }
  g.globalAlpha = 1;
  const glow = g.createRadialGradient(stage.width * 0.8, 120, 10, stage.width * 0.8, 120, 220);
  glow.addColorStop(0, 'rgba(120, 160, 220, 0.35)');
  glow.addColorStop(1, 'rgba(120, 160, 220, 0)');
  g.fillStyle = glow;
  g.fillRect(0, 0, stage.width, stage.height);
}

function drawAltitudeScale(
  g: CanvasRenderingContext2D,
  stage: Stage,
  groundY: number,
  pixelsPerUnit: number,
  span: number,
  state: MoonlanderState,
) {
  const stepChoices = [1, 2, 5, 10, 25, 50, 100, 200];
  const target = span / 6;
  const stepSize = stepChoices.find(s => s >= target) ?? 200;
  g.strokeStyle = 'rgba(140, 180, 230, 0.16)';
  g.fillStyle = 'rgba(140, 180, 230, 0.55)';
  g.font = `11px ${FONT}`;
  g.textAlign = 'right';
  g.lineWidth = 1;
  for (let altitude = 0; altitude <= span + stepSize; altitude += stepSize) {
    const y = groundY - altitude * pixelsPerUnit;
    if (y < 80) break;
    g.beginPath();
    g.moveTo(stage.width * 0.26, y + 0.5);
    g.lineTo(stage.width - 250, y + 0.5);
    g.stroke();
    g.fillText(String(altitude), stage.width * 0.26 - 8, y + 4);
  }
  void state;
}

function drawSurface(g: CanvasRenderingContext2D, stage: Stage, groundY: number, landerX: number) {
  g.fillStyle = '#171a26';
  g.beginPath();
  g.moveTo(0, groundY);
  for (let x = 0; x <= stage.width; x += 40) {
    const bump = Math.sin(x * 0.021) * 7 + Math.sin(x * 0.006) * 11;
    const flat = Math.abs(x - landerX) < 90 ? 0 : bump;
    g.lineTo(x, groundY + flat);
  }
  g.lineTo(stage.width, stage.height);
  g.lineTo(0, stage.height);
  g.closePath();
  g.fill();

  g.strokeStyle = 'rgba(160, 200, 255, 0.45)';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(landerX - 78, groundY);
  g.lineTo(landerX + 78, groundY);
  g.stroke();
  g.fillStyle = 'rgba(160, 200, 255, 0.5)';
  g.font = `11px ${FONT}`;
  g.textAlign = 'center';
  g.fillText('LANDING ZONE', landerX, groundY + 22);
}

function drawLander(g: CanvasRenderingContext2D, x: number, y: number, state: MoonlanderState) {
  const crashed = state.phase !== 'descent' && state.debrief?.verdict === 'crashed';
  if (crashed) {
    const fade = Math.max(0, 1 - state.phaseElapsed / 1.2);
    g.fillStyle = `rgba(255, 190, 120, ${fade})`;
    g.beginPath();
    g.arc(x, y, 30 + (1 - fade) * 70, 0, Math.PI * 2);
    g.fill();
    return;
  }

  if (state.burn > 0.2 && state.phase === 'descent') {
    const scale = state.burn / MOONLANDER_RULES.maxBurn;
    const length = 16 + 54 * scale;
    const flicker = 0.85 + 0.15 * Math.sin(state.elapsed * 40);
    const plume = g.createLinearGradient(x, y + 14, x, y + 14 + length * flicker);
    plume.addColorStop(0, 'rgba(255, 240, 190, 0.95)');
    plume.addColorStop(1, 'rgba(255, 110, 60, 0)');
    g.fillStyle = plume;
    g.beginPath();
    g.moveTo(x - 7 - 4 * scale, y + 14);
    g.lineTo(x + 7 + 4 * scale, y + 14);
    g.lineTo(x, y + 14 + length * flicker);
    g.closePath();
    g.fill();
  }

  g.fillStyle = '#dbe6f5';
  g.beginPath();
  g.moveTo(x - 16, y + 2);
  g.lineTo(x - 11, y - 12);
  g.lineTo(x + 11, y - 12);
  g.lineTo(x + 16, y + 2);
  g.closePath();
  g.fill();
  g.fillStyle = '#8fa8c8';
  g.fillRect(x - 8, y + 2, 16, 11);
  g.strokeStyle = '#dbe6f5';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(x - 12, y + 13);
  g.lineTo(x - 19, y + 26);
  g.moveTo(x + 12, y + 13);
  g.lineTo(x + 19, y + 26);
  g.stroke();
  g.fillStyle = '#5df7ff';
  g.fillRect(x - 5, y - 8, 10, 5);
}

function drawHud(g: CanvasRenderingContext2D, stage: Stage, title: string, state: MoonlanderState) {
  g.fillStyle = 'rgba(4, 7, 16, 0.85)';
  g.fillRect(0, 0, stage.width, 58);
  g.fillStyle = '#9be7ff';
  g.font = `600 20px ${FONT}`;
  g.textAlign = 'left';
  g.fillText(title, 24, 36);

  const readouts: Array<[string, string, string]> = [
    ['ALTITUDE', state.height.toFixed(1), '#dbe6f5'],
    ['DESCENT', `${state.velocity >= 0 ? '' : '+'}${Math.abs(state.velocity).toFixed(1)}`, state.velocity > 5 ? '#ffd166' : '#7dffb3'],
    ['FUEL', state.fuel.toFixed(0), state.fuel > 20 ? '#dbe6f5' : '#ff6b6b'],
  ];
  readouts.forEach(([label, value, colour], index) => {
    const x = 250 + index * 130;
    g.font = `12px ${FONT}`;
    g.fillStyle = '#6f93b5';
    g.fillText(label, x, 24);
    g.font = `600 19px ${FONT}`;
    g.fillStyle = colour;
    g.fillText(value, x, 46);
  });

  const projected = state.phase === 'descent' ? projectTouchdown(state) : null;
  const x = stage.width - 250;
  g.font = `12px ${FONT}`;
  g.fillStyle = '#6f93b5';
  g.fillText('TOUCHDOWN AT THIS THROTTLE', x, 24);
  g.font = `600 19px ${FONT}`;
  if (projected === null) {
    g.fillStyle = '#6f93b5';
    g.fillText(state.phase === 'descent' ? 'climbing' : '--', x, 46);
  } else {
    g.fillStyle = VERDICT_COLOUR[verdictFor(projected)];
    g.fillText(projected.toFixed(1), x, 46);
  }
}

function drawThrottle(g: CanvasRenderingContext2D, stage: Stage, state: MoonlanderState) {
  const width = 26;
  const height = 250;
  const x = stage.width - 78;
  const y = stage.height / 2 - height / 2;
  g.fillStyle = 'rgba(8, 14, 28, 0.9)';
  g.fillRect(x, y, width, height);
  g.strokeStyle = 'rgba(155, 231, 255, 0.35)';
  g.lineWidth = 1;
  g.strokeRect(x + 0.5, y + 0.5, width, height);

  const level = state.throttle / MOONLANDER_RULES.maxBurn;
  g.fillStyle = 'rgba(255, 170, 90, 0.85)';
  g.fillRect(x + 2, y + height - level * height + 2, width - 4, level * height - 4);

  const hoverY = y + height - (MOONLANDER_RULES.gravity / MOONLANDER_RULES.maxBurn) * height;
  g.strokeStyle = '#7dffb3';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(x - 8, hoverY);
  g.lineTo(x + width + 8, hoverY);
  g.stroke();
  g.fillStyle = '#7dffb3';
  g.font = `10px ${FONT}`;
  g.textAlign = 'right';
  g.fillText('HOLD', x - 12, hoverY + 4);

  g.fillStyle = '#9be7ff';
  g.font = `12px ${FONT}`;
  g.textAlign = 'center';
  g.fillText('THROTTLE', x + width / 2, y - 14);
  g.font = `600 16px ${FONT}`;
  g.fillText(state.throttle.toFixed(0), x + width / 2, y + height + 24);
}

function drawStatus(g: CanvasRenderingContext2D, stage: Stage, state: MoonlanderState) {
  g.textAlign = 'center';
  g.fillStyle = '#dbe6f5';
  g.font = `15px ${FONT}`;
  g.fillText(state.statusMessage, stage.width / 2, stage.height - 52);
  g.fillStyle = '#6f93b5';
  g.font = `12px ${FONT}`;
  g.fillText('Up and Down set the throttle · land at 1 or less · Esc leaves', stage.width / 2, stage.height - 30);
}

function drawDebrief(g: CanvasRenderingContext2D, stage: Stage, state: MoonlanderState) {
  const d = state.debrief!;
  const w = Math.min(620, stage.width - 80);
  const h = 250;
  const x = (stage.width - w) / 2;
  const y = (stage.height - h) / 2;
  g.fillStyle = 'rgba(3, 6, 16, 0.94)';
  g.fillRect(x, y, w, h);
  g.strokeStyle = VERDICT_COLOUR[d.verdict];
  g.lineWidth = 2;
  g.strokeRect(x, y, w, h);
  g.textAlign = 'center';
  g.fillStyle = '#6f93b5';
  g.font = `12px ${FONT}`;
  g.fillText('MISSION LOG', stage.width / 2, y + 30);
  g.fillStyle = VERDICT_COLOUR[d.verdict];
  g.font = `600 28px ${FONT}`;
  g.fillText(d.headline, stage.width / 2, y + 76);
  g.fillStyle = '#dbe6f5';
  g.font = `15px ${FONT}`;
  g.fillText(d.summary, stage.width / 2, y + 114);
  g.fillStyle = '#9be7ff';
  g.fillText(`Touchdown ${d.touchdownVelocity.toFixed(2)} · Fuel left ${d.fuelLeft.toFixed(0)} · ${d.elapsed.toFixed(1)}s`, stage.width / 2, y + 152);
  g.fillText(`Score ${d.score}`, stage.width / 2, y + 180);
  g.fillStyle = '#6f93b5';
  g.font = `13px ${FONT}`;
  g.fillText('Press Enter to take her down again.', stage.width / 2, y + 218);
}
