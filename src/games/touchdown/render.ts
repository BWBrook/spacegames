import type { Stage } from '../../core/stage';
import { TEST, TICK_SECONDS, TOUCHDOWN_RULES } from './state';
import type { Grade, TestState } from './types';

const FONT = '"Space Mono", monospace';
const GRADE_COLOUR: Record<Grade, string> = {
  'Feather-light': '#7dffb3',
  Smooth: '#7dffb3',
  Safe: '#ffd166',
  Crashed: '#ff6b6b',
  'Lost in space': '#ff6b6b',
};

export function renderTest(stage: Stage, title: string, state: TestState) {
  const g = stage.ctx;
  stage.clear('#02030a');
  g.save();
  g.textBaseline = 'alphabetic';
  const surfaceY = stage.height - 150;
  drawSky(g, stage);
  drawSurface(g, stage, surfaceY);
  drawCraft(g, stage, state, surfaceY);
  drawPanel(g, state);
  drawTopBar(g, stage, title, state);
  if (state.phase === 'briefing') drawBriefing(g, stage, state);
  if (state.phase === 'debrief') drawDebrief(g, stage, state);
  // Captain Flash, in the right-hand seat.
  g.fillStyle = 'rgba(6, 8, 20, 0.88)';
  g.fillRect(0, stage.height - 64, stage.width, 64);
  g.textAlign = 'left';
  g.fillStyle = '#8fa0d8';
  g.font = `12px ${FONT}`;
  g.fillText('CAPTAIN FLASH', 32, stage.height - 38);
  g.fillStyle = '#eef2ff';
  g.font = `16px ${FONT}`;
  g.fillText(state.remark, 180, stage.height - 36);
  g.fillStyle = '#5c6798';
  g.font = `11px ${FONT}`;
  g.fillText('Up, W or A for more thrust · Down, S or D for less · Esc leaves', 180, stage.height - 16);
  g.restore();
}

function drawSky(g: CanvasRenderingContext2D, stage: Stage) {
  for (let i = 0; i < 90; i += 1) {
    const x = ((i * 719) % 1000) / 1000 * stage.width;
    const y = ((i * 353) % 1000) / 1000 * (stage.height - 200);
    g.fillStyle = `rgba(210, 220, 255, ${0.2 + 0.4 * (((i * 31) % 10) / 10)})`;
    g.fillRect(x, y, 2, 2);
  }
  // Earth, over the horizon.
  const ex = stage.width * 0.84;
  g.fillStyle = '#2f6fd6';
  g.beginPath();
  g.arc(ex, 150, 34, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = 'rgba(120, 200, 120, 0.8)';
  g.beginPath();
  g.arc(ex - 8, 144, 12, 0, Math.PI * 2);
  g.fill();
}

function drawSurface(g: CanvasRenderingContext2D, stage: Stage, surfaceY: number) {
  g.fillStyle = '#5b5d66';
  g.beginPath();
  g.moveTo(0, surfaceY);
  for (let x = 0; x <= stage.width; x += 30) {
    const flat = Math.abs(x - stage.width * 0.62) < 80;
    g.lineTo(x, surfaceY + (flat ? 0 : Math.sin(x * 0.03) * 6 + Math.sin(x * 0.011) * 9));
  }
  g.lineTo(stage.width, stage.height);
  g.lineTo(0, stage.height);
  g.closePath();
  g.fill();
  g.fillStyle = 'rgba(0,0,0,0.25)';
  for (const [cx, r] of [[0.2, 30], [0.4, 18], [0.8, 26], [0.93, 14]] as const) {
    g.beginPath();
    g.ellipse(stage.width * cx, surfaceY + 40, r * 1.6, r * 0.5, 0, 0, Math.PI * 2);
    g.fill();
  }
}

function drawCraft(g: CanvasRenderingContext2D, stage: Stage, state: TestState, surfaceY: number) {
  const c = state.craft;
  const alpha = state.phase === 'flight' ? Math.min(1, state.tickTimer / TICK_SECONDS) : 1;
  const height = state.phase === 'flight' ? state.previousHeight + (c.height - state.previousHeight) * alpha : c.height;
  const top = 110;
  const y = surfaceY - 26 - (height / TOUCHDOWN_RULES.startHeight) * (surfaceY - 26 - top);
  const x = stage.width * 0.62;
  const crashed = state.phase === 'landed' && state.landings.at(-1)?.grade === 'Crashed';
  if (state.phase === 'debrief' && state.landings.at(-1)?.grade === 'Crashed') return;
  if (crashed) {
    const fade = Math.max(0, 1 - state.phaseElapsed / 1.2);
    g.fillStyle = `rgba(255, 200, 140, ${fade})`;
    g.beginPath();
    g.arc(x, surfaceY - 10, 20 + (1 - fade) * 70, 0, Math.PI * 2);
    g.fill();
    return;
  }
  if (c.thrust > 0 && state.phase === 'flight') {
    const length = 10 + c.thrust * 0.7;
    const flicker = 0.85 + 0.15 * Math.sin(state.elapsed * 40);
    const flame = g.createLinearGradient(x, y + 22, x, y + 22 + length);
    flame.addColorStop(0, 'rgba(255, 240, 190, 0.95)');
    flame.addColorStop(1, 'rgba(255, 110, 60, 0)');
    g.fillStyle = flame;
    g.beginPath();
    g.moveTo(x - 8, y + 22);
    g.lineTo(x + 8, y + 22);
    g.lineTo(x, y + 22 + length * flicker);
    g.closePath();
    g.fill();
  }
  // The listing's own outline, scaled up.
  g.strokeStyle = '#eef2ff';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(x, y - 24);
  g.lineTo(x - 18, y - 6);
  g.lineTo(x - 22, y + 22);
  g.lineTo(x + 22, y + 22);
  g.lineTo(x + 18, y - 6);
  g.closePath();
  g.stroke();
  g.fillStyle = '#5df7ff';
  g.fillRect(x - 6, y - 10, 12, 6);
}

function drawPanel(g: CanvasRenderingContext2D, state: TestState) {
  const c = state.craft;
  const x = 40;
  const w = 300;
  const rows: Array<[string, number, string, string]> = [
    ['FUEL', c.fuel, c.fuel < 25 ? '#ff6b6b' : '#eef2ff', c.fuel.toFixed(0)],
    ['VELOCITY', Math.abs(c.velocity) * 4, c.velocity < 0 ? '#ffd166' : '#eef2ff', `${c.velocity < 0 ? 'up ' : ''}${Math.abs(c.velocity).toFixed(1)}`],
    ['HEIGHT', c.height, c.height < 25 ? '#ff6b6b' : '#eef2ff', c.height.toFixed(0)],
    ['THRUST', c.thrust, '#6fb6ff', c.thrust.toFixed(0)],
  ];
  rows.forEach(([label, value, colour, text], index) => {
    const y = 110 + index * 70;
    g.textAlign = 'left';
    g.fillStyle = '#8fa0d8';
    g.font = `12px ${FONT}`;
    g.fillText(label, x, y);
    g.fillStyle = '#eef2ff';
    g.font = `600 16px ${FONT}`;
    g.textAlign = 'right';
    g.fillText(text, x + w, y);
    g.fillStyle = 'rgba(255,255,255,0.08)';
    g.fillRect(x, y + 10, w, 14);
    g.fillStyle = colour;
    g.fillRect(x, y + 10, (Math.min(100, value) / 100) * w, 14);
    if (label === 'THRUST') {
      // The ceiling: thrust can never be more than the fuel left.
      const cap = x + (Math.min(100, c.fuel) / 100) * w;
      g.fillStyle = '#ff9f5a';
      g.fillRect(cap - 1.5, y + 4, 3, 26);
      g.textAlign = 'left';
      g.fillStyle = '#ff9f5a';
      g.font = `11px ${FONT}`;
      g.fillText('ceiling = fuel left', x, y + 44);
    }
  });
}

function drawTopBar(g: CanvasRenderingContext2D, stage: Stage, title: string, state: TestState) {
  g.fillStyle = 'rgba(6, 8, 20, 0.88)';
  g.fillRect(0, 0, stage.width, 56);
  g.textAlign = 'left';
  g.fillStyle = '#a9b8ff';
  g.font = `600 20px ${FONT}`;
  g.fillText(title, 24, 35);
  const cells: Array<[string, string]> = [
    ['LANDING', `${Math.min(state.attempt, TEST.landings)} / ${TEST.landings}`],
    ['GRAVITY', state.craft.gravity.toFixed(2)],
    ['ENTRY SPEED', String(state.entry)],
  ];
  cells.forEach(([label, value], index) => {
    const cx = 230 + index * 150;
    g.font = `12px ${FONT}`;
    g.fillStyle = '#6f7bb0';
    g.fillText(label, cx, 22);
    g.font = `600 18px ${FONT}`;
    g.fillStyle = '#eef2ff';
    g.fillText(value, cx, 44);
  });
  state.landings.forEach((landing, index) => {
    const cx = stage.width - 60 - (TEST.landings - 1 - index) * 34;
    g.fillStyle = GRADE_COLOUR[landing.grade];
    g.beginPath();
    g.arc(cx, 28, 9, 0, Math.PI * 2);
    g.fill();
  });
}

function drawBriefing(g: CanvasRenderingContext2D, stage: Stage, state: TestState) {
  const w = Math.min(560, stage.width - 80);
  const x = (stage.width - w) / 2;
  const y = stage.height * 0.3;
  g.fillStyle = 'rgba(5, 7, 18, 0.94)';
  g.fillRect(x, y, w, 170);
  g.strokeStyle = 'rgba(169, 184, 255, 0.5)';
  g.strokeRect(x, y, w, 170);
  g.textAlign = 'center';
  g.fillStyle = '#8fa0d8';
  g.font = `12px ${FONT}`;
  g.fillText('ADVANCED SPACECRAFT HANDLING TEST · PART III', x + w / 2, y + 30);
  g.fillStyle = '#eef2ff';
  g.font = `600 22px ${FONT}`;
  g.fillText(`Landing ${state.attempt} of ${TEST.landings}`, x + w / 2, y + 68);
  g.fillStyle = '#c4ccf2';
  g.font = `15px ${FONT}`;
  g.fillText(`Gravity ${state.craft.gravity.toFixed(2)} · coming in at ${state.entry}`, x + w / 2, y + 100);
  g.fillText('Touch down at under 4. Press Enter when ready.', x + w / 2, y + 132);
}

function drawDebrief(g: CanvasRenderingContext2D, stage: Stage, state: TestState) {
  const d = state.debrief!;
  const w = Math.min(640, stage.width - 80);
  const h = 300;
  const x = (stage.width - w) / 2;
  const y = (stage.height - h) / 2 - 20;
  g.fillStyle = 'rgba(5, 7, 18, 0.96)';
  g.fillRect(x, y, w, h);
  g.strokeStyle = d.passed ? '#7dffb3' : '#ff6b6b';
  g.lineWidth = 2;
  g.strokeRect(x, y, w, h);
  g.textAlign = 'center';
  g.fillStyle = '#8fa0d8';
  g.font = `12px ${FONT}`;
  g.fillText('EXAMINER\'S REPORT', x + w / 2, y + 30);
  g.fillStyle = d.passed ? '#7dffb3' : '#ff8f8f';
  g.font = `600 30px ${FONT}`;
  g.fillText(d.passed ? 'PASSED' : 'FAILED', x + w / 2, y + 76);
  g.fillStyle = '#eef2ff';
  g.font = `15px ${FONT}`;
  g.fillText(d.verdict, x + w / 2, y + 108);
  state.landings.forEach((landing, index) => {
    const ry = y + 150 + index * 28;
    g.fillStyle = GRADE_COLOUR[landing.grade];
    g.font = `14px ${FONT}`;
    const speed = landing.speed === null ? '' : ` at ${landing.speed}`;
    g.fillText(`Landing ${index + 1}: ${landing.grade}${speed} · gravity ${landing.gravity.toFixed(2)} · entry ${landing.entry}`, x + w / 2, ry);
  });
  g.fillStyle = '#c4ccf2';
  g.fillText(`Score ${d.score}`, x + w / 2, y + 250);
  g.fillStyle = '#6f7bb0';
  g.font = `13px ${FONT}`;
  g.fillText('Press Enter to take the test again.', x + w / 2, y + 280);
}
