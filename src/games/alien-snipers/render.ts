import type { Stage } from '../../core/stage';
import { SNIPER_RULES, highestLetter, letterIndex, windowSeconds } from './state';
import type { SniperState } from './types';

const FONT = '"Space Mono", monospace';
const ALPHABET = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

export function renderSnipers(stage: Stage, title: string, state: SniperState) {
  const g = stage.ctx;
  stage.clear('#01060a');
  g.save();
  g.textBaseline = 'alphabetic';
  drawBackdrop(g, stage, state);
  drawTopBar(g, stage, title, state);
  if (state.phase === 'briefing') drawBriefing(g, stage, state);
  else if (state.phase === 'debrief' && state.debrief) drawDebrief(g, stage, state);
  else {
    drawScope(g, stage, state);
    drawReading(g, stage, state);
    if (state.phase === 'target') drawWindow(g, stage, state);
    if (state.phase === 'report') drawAlphabet(g, stage, state);
  }
  drawStatus(g, stage, state);
  g.restore();
}

function drawBackdrop(g: CanvasRenderingContext2D, stage: Stage, state: SniperState) {
  g.fillStyle = 'rgba(120, 220, 200, 0.35)';
  for (let i = 0; i < 70; i += 1) {
    const x = ((i * 691) % 1000) / 1000 * stage.width;
    const y = ((i * 457) % 1000) / 1000 * stage.height;
    g.globalAlpha = 0.15 + 0.35 * (0.5 + 0.5 * Math.sin(state.elapsed * 1.6 + i));
    g.fillRect(x, y, 2, 2);
  }
  g.globalAlpha = 1;
}

function drawTopBar(g: CanvasRenderingContext2D, stage: Stage, title: string, state: SniperState) {
  g.fillStyle = 'rgba(2, 10, 16, 0.86)';
  g.fillRect(0, 0, stage.width, 56);
  g.fillStyle = '#5df7c8';
  g.font = `600 20px ${FONT}`;
  g.textAlign = 'left';
  g.fillText(title, 24, 35);
  if (state.phase === 'briefing') return;

  const cells: Array<[string, string, string]> = [
    ['SNIPER', `${Math.min(state.round, SNIPER_RULES.targets)} / ${SNIPER_RULES.targets}`, '#d9fff4'],
    ['HITS', String(state.hits), '#7dffb3'],
    ['STREAK', String(state.streak), state.streak >= 3 ? '#ffd166' : '#d9fff4'],
    ['CODE RANGE', `1-${state.difficulty}`, '#8fd8c8'],
  ];
  cells.forEach(([label, value, colour], index) => {
    const x = 270 + index * 125;
    g.font = `12px ${FONT}`;
    g.fillStyle = '#4f8c80';
    g.fillText(label, x, 22);
    g.font = `600 18px ${FONT}`;
    g.fillStyle = colour;
    g.fillText(value, x, 44);
  });
}

function scopeGeometry(stage: Stage) {
  return { cx: stage.width * 0.5, cy: stage.height * 0.47, radius: Math.min(stage.width, stage.height) * 0.26 };
}

function bearing(letter: string) {
  return (letterIndex(letter) / 26) * Math.PI * 2 - Math.PI / 2;
}

function drawScope(g: CanvasRenderingContext2D, stage: Stage, state: SniperState) {
  const { cx, cy, radius } = scopeGeometry(stage);
  g.strokeStyle = 'rgba(93, 247, 200, 0.28)';
  g.lineWidth = 1;
  for (const r of [radius, radius * 0.68, radius * 0.36]) {
    g.beginPath();
    g.arc(cx, cy, r, 0, Math.PI * 2);
    g.stroke();
  }
  g.beginPath();
  g.moveTo(cx - radius, cy);
  g.lineTo(cx + radius, cy);
  g.moveTo(cx, cy - radius);
  g.lineTo(cx, cy + radius);
  g.stroke();

  // Twenty-six unlabelled bearings: the shift is arithmetic, not counting blips.
  for (let i = 0; i < 26; i += 1) {
    const a = (i / 26) * Math.PI * 2 - Math.PI / 2;
    g.strokeStyle = 'rgba(93, 247, 200, 0.2)';
    g.beginPath();
    g.moveTo(cx + Math.cos(a) * (radius - 8), cy + Math.sin(a) * (radius - 8));
    g.lineTo(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius);
    g.stroke();
  }

  if (state.phase === 'target') {
    const sweep = (state.elapsed * 1.6) % (Math.PI * 2) - Math.PI / 2;
    const gradient = g.createLinearGradient(cx, cy, cx + Math.cos(sweep) * radius, cy + Math.sin(sweep) * radius);
    gradient.addColorStop(0, 'rgba(93, 247, 200, 0.35)');
    gradient.addColorStop(1, 'rgba(93, 247, 200, 0)');
    g.strokeStyle = gradient;
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(cx, cy);
    g.lineTo(cx + Math.cos(sweep) * radius, cy + Math.sin(sweep) * radius);
    g.stroke();
  }

  const falseAngle = bearing(state.target.letter);
  const fx = cx + Math.cos(falseAngle) * radius * 0.82;
  const fy = cy + Math.sin(falseAngle) * radius * 0.82;
  g.fillStyle = 'rgba(255, 107, 107, 0.85)';
  g.beginPath();
  g.arc(fx, fy, 8, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = 'rgba(255, 107, 107, 0.4)';
  g.lineWidth = 1.5;
  g.beginPath();
  g.arc(fx, fy, 8 + (state.elapsed * 22) % 18, 0, Math.PI * 2);
  g.stroke();

  if (state.phase !== 'report') return;

  const trueAngle = bearing(state.target.answer);
  const tx = cx + Math.cos(trueAngle) * radius * 0.82;
  const ty = cy + Math.sin(trueAngle) * radius * 0.82;
  g.strokeStyle = 'rgba(255, 209, 102, 0.8)';
  g.lineWidth = 2;
  g.beginPath();
  g.arc(cx, cy, radius * 0.82, falseAngle, trueAngle);
  g.stroke();
  for (let i = 1; i <= state.target.shift; i += 1) {
    const a = falseAngle + (trueAngle - falseAngle) * (i / state.target.shift);
    g.fillStyle = 'rgba(255, 209, 102, 0.9)';
    g.beginPath();
    g.arc(cx + Math.cos(a) * radius * 0.82, cy + Math.sin(a) * radius * 0.82, 3, 0, Math.PI * 2);
    g.fill();
  }

  const hit = state.lastResult === 'hit';
  g.fillStyle = hit ? '#7dffb3' : '#ffd166';
  g.beginPath();
  g.arc(tx, ty, 10, 0, Math.PI * 2);
  g.fill();
  if (hit) {
    const fade = Math.max(0, 1 - state.phaseElapsed / 0.6);
    g.strokeStyle = `rgba(125, 255, 179, ${fade})`;
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(cx, cy);
    g.lineTo(tx, ty);
    g.stroke();
  }
}

function drawReading(g: CanvasRenderingContext2D, stage: Stage, state: SniperState) {
  const { cx, cy, radius } = scopeGeometry(stage);
  g.textAlign = 'center';
  g.fillStyle = '#4f8c80';
  g.font = `12px ${FONT}`;
  g.fillText('FALSE READING', cx - 72, cy - 16);
  g.fillText('CODE', cx + 72, cy - 16);
  g.fillStyle = '#ff9f89';
  g.font = `600 54px ${FONT}`;
  g.fillText(state.target.letter, cx - 72, cy + 30);
  g.fillStyle = '#5df7c8';
  g.fillText(String(state.target.shift), cx + 72, cy + 30);
  void radius;
}

function drawWindow(g: CanvasRenderingContext2D, stage: Stage, state: SniperState) {
  const total = windowSeconds(state.difficulty);
  const remaining = Math.max(0, 1 - state.phaseElapsed / total);
  const width = Math.min(560, stage.width - 160);
  const x = (stage.width - width) / 2;
  const y = stage.height - 124;
  g.fillStyle = 'rgba(255,255,255,0.07)';
  g.fillRect(x, y, width, 10);
  g.fillStyle = remaining > 0.35 ? '#5df7c8' : '#ff6b6b';
  g.fillRect(x, y, width * remaining, 10);
  g.textAlign = 'center';
  g.fillStyle = '#4f8c80';
  g.font = `11px ${FONT}`;
  g.fillText(`${(remaining * total).toFixed(1)}s`, stage.width / 2, y - 8);
}

function drawAlphabet(g: CanvasRenderingContext2D, stage: Stage, state: SniperState) {
  const width = Math.min(700, stage.width - 120);
  const cell = width / 26;
  const x = (stage.width - width) / 2;
  const y = stage.height - 130;
  const from = letterIndex(state.target.letter);
  const to = letterIndex(state.target.answer);

  ALPHABET.forEach((letter, index) => {
    const inPath = index > from && index <= to;
    const isFrom = index === from;
    const isTo = index === to;
    g.fillStyle = isTo ? '#7dffb3' : isFrom ? '#ff9f89' : inPath ? 'rgba(255, 209, 102, 0.75)' : 'rgba(217,255,244,0.28)';
    g.font = `${isFrom || isTo ? '600 17px' : '13px'} ${FONT}`;
    g.textAlign = 'center';
    g.fillText(letter, x + index * cell + cell / 2, y);
    if (isFrom || isTo) {
      g.strokeStyle = isTo ? '#7dffb3' : '#ff9f89';
      g.lineWidth = 1;
      g.strokeRect(x + index * cell + 1, y - 18, cell - 2, 24);
    }
  });
  g.fillStyle = '#4f8c80';
  g.font = `11px ${FONT}`;
  g.textAlign = 'center';
  g.fillText(`${state.target.letter} + ${state.target.shift} = ${state.target.answer}`, stage.width / 2, y + 24);
}

function drawBriefing(g: CanvasRenderingContext2D, stage: Stage, state: SniperState) {
  const cx = stage.width / 2;
  const top = stage.height * 0.26;
  g.textAlign = 'center';
  g.fillStyle = '#d9fff4';
  g.font = `600 26px ${FONT}`;
  g.fillText('Their radar readings are jammed', cx, top);
  g.fillStyle = '#8fd8c8';
  g.font = `15px ${FONT}`;
  g.fillText('You get a false letter and a code number. Count that many letters on', cx, top + 34);
  g.fillText('through the alphabet and fire at the letter you land on.', cx, top + 58);

  g.fillStyle = '#4f8c80';
  g.font = `12px ${FONT}`;
  g.fillText('HIGHEST CODE NUMBER', cx, top + 112);

  const cell = 48;
  const start = cx - (SNIPER_RULES.maxDifficulty * cell) / 2;
  for (let d = SNIPER_RULES.minDifficulty; d <= SNIPER_RULES.maxDifficulty; d += 1) {
    const x = start + (d - 1) * cell;
    const chosen = d === state.difficulty;
    g.fillStyle = chosen ? 'rgba(93, 247, 200, 0.85)' : 'rgba(10, 30, 34, 0.9)';
    g.fillRect(x + 3, top + 128, cell - 6, 42);
    g.strokeStyle = chosen ? '#d9fff4' : 'rgba(93, 247, 200, 0.4)';
    g.lineWidth = 1;
    g.strokeRect(x + 3.5, top + 128.5, cell - 6, 42);
    g.fillStyle = chosen ? '#01221c' : '#8fd8c8';
    g.font = `600 18px ${FONT}`;
    g.fillText(String(d), x + cell / 2, top + 155);
  }

  g.fillStyle = '#d9fff4';
  g.font = `14px ${FONT}`;
  g.fillText(
    `Letters A to ${highestLetter(state.difficulty)} · ${windowSeconds(state.difficulty).toFixed(1)} seconds a shot`,
    cx,
    top + 198,
  );
  g.fillStyle = '#4f8c80';
  g.font = `12px ${FONT}`;
  g.fillText('Left and Right choose · Enter begins', cx, top + 226);
}

function drawDebrief(g: CanvasRenderingContext2D, stage: Stage, state: SniperState) {
  const d = state.debrief!;
  const w = Math.min(640, stage.width - 80);
  const h = 330;
  const x = (stage.width - w) / 2;
  const y = (stage.height - h) / 2;
  g.fillStyle = 'rgba(1, 8, 12, 0.95)';
  g.fillRect(x, y, w, h);
  g.strokeStyle = d.hits >= 7 ? '#7dffb3' : '#ffd166';
  g.lineWidth = 2;
  g.strokeRect(x, y, w, h);

  g.textAlign = 'center';
  g.fillStyle = '#4f8c80';
  g.font = `12px ${FONT}`;
  g.fillText('GUNNERY REPORT', stage.width / 2, y + 28);
  g.fillStyle = d.hits >= 7 ? '#7dffb3' : '#ffd166';
  g.font = `600 30px ${FONT}`;
  g.fillText(d.headline, stage.width / 2, y + 72);
  g.fillStyle = '#d9fff4';
  g.font = `15px ${FONT}`;
  g.fillText(d.summary, stage.width / 2, y + 106);
  const ms = (value: number | null) => (value === null ? '--' : `${(value * 1000).toFixed(0)} ms`);
  g.fillStyle = '#8fd8c8';
  g.fillText(`Codes to ${d.difficulty} · best streak ${d.bestStreak} · score ${d.score}`, stage.width / 2, y + 138);
  g.fillText(`Fastest ${ms(d.bestReaction)} · average ${ms(d.averageReaction)}`, stage.width / 2, y + 164);

  g.fillStyle = '#4f8c80';
  g.font = `12px ${FONT}`;
  g.fillText('HOW YOU FARED BY CODE NUMBER', stage.width / 2, y + 200);
  const columns = d.byShift.length || 1;
  const spread = Math.min(w - 80, columns * 56);
  const start = stage.width / 2 - spread / 2;
  d.byShift.forEach((entry, index) => {
    const cx = start + (index + 0.5) * (spread / columns);
    g.fillStyle = '#8fd8c8';
    g.font = `12px ${FONT}`;
    g.fillText(`+${entry.shift}`, cx, y + 224);
    g.fillStyle = entry.hits === entry.attempts ? '#7dffb3' : entry.hits === 0 ? '#ff6b6b' : '#ffd166';
    g.font = `600 14px ${FONT}`;
    g.fillText(`${entry.hits}/${entry.attempts}`, cx, y + 246);
  });

  g.fillStyle = '#4f8c80';
  g.font = `13px ${FONT}`;
  g.fillText('Press Enter to take another run at them.', stage.width / 2, y + h - 20);
}

function drawStatus(g: CanvasRenderingContext2D, stage: Stage, state: SniperState) {
  if (state.phase === 'briefing') return;
  g.textAlign = 'center';
  g.fillStyle = '#d9fff4';
  g.font = `15px ${FONT}`;
  g.fillText(state.statusMessage, stage.width / 2, stage.height - 56);
  g.fillStyle = '#4f8c80';
  g.font = `12px ${FONT}`;
  g.fillText('Type the letter to fire · one shot each · Esc leaves', stage.width / 2, stage.height - 32);
}
