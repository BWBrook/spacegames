import type { Stage } from '../../core/stage';
import {
  BAND_VALUES,
  CAMPAIGN,
  HAZARD_TEXT,
  RESCUE_RULES,
  coverChance,
  currentMission,
  landingFailure,
  landingLeftover,
  reserve,
  velocityFor,
  voyageOdds,
} from './state';
import type { Failure, RescueState } from './types';

const FONT = '"Space Mono", monospace';
const COLOURS = { engines: '#6fb6ff', life: '#7dffb3', shields: '#ffd166', reserve: '#9a9ab0' };
const pct = (value: number) => `${Math.round(value * 100)}%`;
const oddsColour = (value: number) => (value >= 0.9 ? '#7dffb3' : value >= 0.6 ? '#ffd166' : '#ff8f8f');

export const FAILURE_TEXT: Record<Failure, string> = {
  'blown-up': 'SHIELDS DESTROYED - YOU WERE BLOWN UP',
  dead: "LIFE SUPPORT INACTIVE - YOU'RE DEAD",
  engines: 'ENGINES ARE NON-FUNCTIONAL',
  late: 'YOU TOOK TOO LONG ABOUT IT',
  crater: 'YOU MADE A NEW CRATER',
  star: 'YOU MADE A WONDERFUL SHOOTING STAR',
  door: "LANDED, BUT YOU DON'T HAVE ENOUGH ENERGY TO OPEN THE DOOR",
};

export function renderRescue(stage: Stage, title: string, state: RescueState) {
  const g = stage.ctx;
  stage.clear('#030410');
  g.save();
  g.textBaseline = 'alphabetic';
  drawSpiral(g, stage, state);
  drawTopBar(g, stage, title, state);
  if (state.phase === 'allocate') drawAllocate(g, stage, state);
  else if (state.phase === 'voyage') drawVoyage(g, stage, state);
  else if (state.phase === 'landing' || state.phase === 'descent') drawLanding(g, stage, state);
  if (state.phase === 'report') drawReport(g, stage, state);
  if (state.phase === 'debrief') drawDebrief(g, stage, state);
  g.textAlign = 'center';
  g.fillStyle = '#dfe4ff';
  g.font = `14px ${FONT}`;
  g.fillText(state.statusMessage, stage.width / 2, stage.height - 22);
  g.restore();
}

function drawSpiral(g: CanvasRenderingContext2D, stage: Stage, state: RescueState) {
  const cx = stage.width * 0.5;
  const cy = stage.height * 0.5;
  for (let i = 0; i < 420; i += 1) {
    const arm = i % 2;
    const t = (i / 420) * 5.5;
    const r = 30 + t * 70 + ((i * 37) % 23);
    const a = t + arm * Math.PI + state.elapsed * 0.01;
    g.fillStyle = `rgba(${arm ? '170, 160, 255' : '255, 200, 170'}, ${0.08 + ((i * 13) % 10) / 60})`;
    g.fillRect(cx + Math.cos(a) * r * 1.4, cy + Math.sin(a) * r * 0.7, 2, 2);
  }
}

function drawTopBar(g: CanvasRenderingContext2D, stage: Stage, title: string, state: RescueState) {
  g.fillStyle = 'rgba(6, 7, 20, 0.9)';
  g.fillRect(0, 0, stage.width, 56);
  g.fillStyle = '#a9b8ff';
  g.font = `600 20px ${FONT}`;
  g.textAlign = 'left';
  g.fillText(title, 24, 35);
  const cells: Array<[string, string]> = [
    ['MISSION', `${Math.min(state.index + 1, CAMPAIGN.missions)} / ${CAMPAIGN.missions}`],
    ['RESCUES', String(state.results.filter(r => r.rescued).length)],
  ];
  cells.forEach(([label, value], index) => {
    const x = 250 + index * 130;
    g.font = `12px ${FONT}`;
    g.fillStyle = '#6f78a8';
    g.fillText(label, x, 22);
    g.font = `600 18px ${FONT}`;
    g.fillStyle = '#eef0ff';
    g.fillText(value, x, 44);
  });
}

function field(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  value: string,
  note: string,
  active: boolean,
  colour: string,
) {
  if (active) {
    g.fillStyle = 'rgba(169, 184, 255, 0.12)';
    g.fillRect(x - 10, y - 22, 560, 32);
  }
  g.textAlign = 'left';
  g.fillStyle = colour;
  g.fillRect(x - 4, y - 14, 4, 16);
  g.fillStyle = active ? '#ffd166' : '#8f97c8';
  g.font = `12px ${FONT}`;
  g.fillText(label, x + 8, y);
  g.fillStyle = '#eef0ff';
  g.font = `600 18px ${FONT}`;
  g.fillText(value, x + 170, y);
  g.fillStyle = '#8f97c8';
  g.font = `12px ${FONT}`;
  g.fillText(note, x + 270, y);
}

function drawAllocate(g: CanvasRenderingContext2D, stage: Stage, state: RescueState) {
  const m = currentMission(state);
  const a = state.alloc;
  const left = 60;
  let y = 104;
  g.textAlign = 'left';
  g.fillStyle = '#eef0ff';
  g.font = `600 20px ${FONT}`;
  g.fillText(`The planet is ${m.distance} units away. You have ${m.energy} units of energy.`, left, y);
  g.fillStyle = '#a9b8ff';
  g.font = `15px ${FONT}`;
  g.fillText(`Medical supplies must arrive within ${m.timeLimit} days.`, left, y + 28);

  // The whole tank, split as planned.
  y += 60;
  const barW = stage.width - 2 * left;
  const parts: Array<[number, string]> = [
    [a.engines, COLOURS.engines],
    [a.life, COLOURS.life],
    [a.shields, COLOURS.shields],
    [Math.max(0, reserve(state)), COLOURS.reserve],
  ];
  let bx = left;
  parts.forEach(([amount, colour]) => {
    const w = (Math.max(0, amount) / m.energy) * barW;
    g.fillStyle = colour;
    g.globalAlpha = colour === COLOURS.reserve ? 0.35 : 0.8;
    g.fillRect(bx, y, w, 18);
    bx += w;
  });
  g.globalAlpha = 1;
  if (reserve(state) < 0) {
    g.fillStyle = '#ff5c5c';
    g.fillText('Over budget', left, y + 40);
  }

  const v = velocityFor(a.engines);
  const next = (v + 1) * (v + 1);
  const eta = v > 0 ? Math.floor(m.distance / v) : Infinity;
  const fy = y + 72;
  const active = (i: number) => state.field === i;
  const shown = (i: number, value: number) => (active(i) && state.typing !== null ? `${state.typing}_` : String(value));
  field(g, left, fy, 'ENGINES', shown(0, a.engines), `speed ${v} · ETA ${Number.isFinite(eta) ? eta : '--'} days · next speed at ${next}`, active(0), COLOURS.engines);
  field(g, left, fy + 40, 'LIFE SUPPORT', shown(1, a.life), 'an X-ray burst does 21 to 60', active(1), COLOURS.life);
  field(g, left, fy + 80, 'SHIELDS', shown(2, a.shields), 'an asteroid storm does 21 to 60', active(2), COLOURS.shields);
  field(g, left, fy + 120, 'KEPT FOR LANDING', String(reserve(state)), 'up to 140 each for boosters and heat shields, and more than 25 to open the door', false, COLOURS.reserve);

  const odds = voyageOdds(m, a, state.seeds[state.index] ?? 1);
  const ox = stage.width - 360;
  const oy = fy + 200;
  g.fillStyle = 'rgba(8, 10, 28, 0.85)';
  g.fillRect(left - 12, oy - 30, stage.width - 2 * left + 24, 150);
  g.textAlign = 'left';
  g.fillStyle = '#6f78a8';
  g.font = `12px ${FONT}`;
  g.fillText('CHANCES ON THE VOYAGE, FROM THE SAME RISKS THE SHIP WILL FACE', left, oy - 8);
  const rows: Array<[string, number]> = [
    ['Shields hold', odds.shields],
    ['Life support holds', odds.life],
    ['Arrive in time', odds.onTime],
  ];
  rows.forEach(([label, value], index) => {
    g.fillStyle = '#c9cff5';
    g.font = `14px ${FONT}`;
    g.fillText(label, left, oy + 24 + index * 26);
    g.fillStyle = oddsColour(value);
    g.font = `600 16px ${FONT}`;
    g.fillText(pct(value), left + 230, oy + 24 + index * 26);
  });
  g.fillStyle = '#6f78a8';
  g.font = `12px ${FONT}`;
  g.fillText('REACH ORBIT', ox, oy + 20);
  g.fillStyle = oddsColour(odds.orbit);
  g.font = `600 44px ${FONT}`;
  g.fillText(pct(odds.orbit), ox, oy + 70);
  g.fillStyle = '#8f97c8';
  g.font = `11px ${FONT}`;
  g.fillText('Up/Down choose · type or Left/Right · engines step one speed at a time', left, oy + 108);
}

function drawVoyage(g: CanvasRenderingContext2D, stage: Stage, state: RescueState) {
  const v = state.voyage!;
  const x0 = stage.width * 0.1;
  const x1 = stage.width * 0.9;
  const y = stage.height * 0.36;
  g.strokeStyle = 'rgba(169, 184, 255, 0.3)';
  g.setLineDash([4, 8]);
  g.beginPath();
  g.moveTo(x0, y);
  g.quadraticCurveTo(stage.width / 2, y - 120, x1, y);
  g.stroke();
  g.setLineDash([]);
  const progress = Math.min(1, (v.checked + v.timer / CAMPAIGN.checkSeconds) / (v.checks + 1));
  const t = progress;
  const px = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * (stage.width / 2) + t * t * x1;
  const py = (1 - t) * (1 - t) * y + 2 * (1 - t) * t * (y - 120) + t * t * y;
  g.fillStyle = '#eef0ff';
  g.beginPath();
  g.arc(px, py, 7, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#ffcf9a';
  g.beginPath();
  g.arc(x1, y, 16, 0, Math.PI * 2);
  g.fill();

  const meters: Array<[string, number, number, string]> = [
    ['SHIELDS', v.shields, state.alloc.shields, COLOURS.shields],
    ['LIFE SUPPORT', v.life, state.alloc.life, COLOURS.life],
  ];
  meters.forEach(([label, value, start, colour], index) => {
    const mx = 60;
    const my = stage.height * 0.52 + index * 46;
    g.textAlign = 'left';
    g.fillStyle = '#6f78a8';
    g.font = `12px ${FONT}`;
    g.fillText(label, mx, my);
    g.fillStyle = 'rgba(255,255,255,0.08)';
    g.fillRect(mx, my + 8, 300, 12);
    g.fillStyle = value < (label === 'SHIELDS' ? 0 : 1) ? '#ff5c5c' : colour;
    g.fillRect(mx, my + 8, 300 * Math.max(0, value) / Math.max(1, start), 12);
    g.fillStyle = '#eef0ff';
    g.fillText(String(value), mx + 310, my + 19);
  });
  const m = currentMission(state);
  const eta = v.velocity > 0 ? Math.floor(v.distance / v.velocity) : '--';
  g.fillStyle = '#c9cff5';
  g.font = `14px ${FONT}`;
  g.fillText(`Speed ${v.velocity} · distance ${v.distance} · ETA ${eta} of ${m.timeLimit} days`, 60, stage.height * 0.52 + 110);

  g.textAlign = 'left';
  g.fillStyle = '#6f78a8';
  g.font = `12px ${FONT}`;
  g.fillText('SHIP LOG', stage.width * 0.55, stage.height * 0.52);
  v.log.slice(-8).forEach((event, index) => {
    const ly = stage.height * 0.52 + 24 + index * 22;
    g.fillStyle = event.hazard ? '#ffb07a' : '#4c5480';
    g.font = `13px ${FONT}`;
    const detail = event.hazard === 'storm' || event.hazard === 'xray' ? ` -${event.amount}` : event.hazard === 'breakdown' ? ` +${event.amount} units` : event.hazard === 'engine' ? ' -0.5 speed' : '';
    g.fillText(`Day check ${event.check}: ${event.hazard ? HAZARD_TEXT[event.hazard] + detail : 'all quiet'}`, stage.width * 0.55, ly);
  });
}

function drawLanding(g: CanvasRenderingContext2D, stage: Stage, state: RescueState) {
  const o = state.orbit!;
  const left = 60;
  const descending = state.phase === 'descent';
  const surfaceY = stage.height - 150;
  g.fillStyle = '#3a2a24';
  g.beginPath();
  g.ellipse(stage.width / 2, surfaceY + 600, stage.width * 0.9, 640, 0, Math.PI, 0);
  g.fill();

  const progress = descending ? Math.min(1, state.phaseElapsed / CAMPAIGN.descentSeconds) : 0;
  const failure = descending ? landingFailure(state) : null;
  const shipY = 130 + (surfaceY - 150) * progress;
  const sx = stage.width * 0.72;
  if (descending && failure === 'star' && progress > 0.4) {
    g.strokeStyle = 'rgba(255, 170, 90, 0.8)';
    g.lineWidth = 6;
    g.beginPath();
    g.moveTo(sx, shipY);
    g.lineTo(sx - 40, shipY - 90);
    g.stroke();
  }
  if (descending && failure === 'crater' && progress >= 1) {
    g.fillStyle = 'rgba(255, 200, 140, 0.8)';
    g.beginPath();
    g.arc(sx, surfaceY - 10, 40, 0, Math.PI * 2);
    g.fill();
  } else {
    g.fillStyle = '#eef0ff';
    g.beginPath();
    g.moveTo(sx, shipY - 16);
    g.lineTo(sx + 12, shipY + 10);
    g.lineTo(sx - 12, shipY + 10);
    g.closePath();
    g.fill();
  }

  const bandLine = (label: string, band: keyof typeof BAND_VALUES) => {
    const values = BAND_VALUES[band];
    return `${label} ${band}: needs ${values[0]! * 10} to ${values.at(-1)! * 10}`;
  };
  g.textAlign = 'left';
  g.fillStyle = '#eef0ff';
  g.font = `600 20px ${FONT}`;
  g.fillText(`In orbit with ${o.surplus} units to spare.`, left, 104);
  g.fillStyle = '#a9b8ff';
  g.font = `15px ${FONT}`;
  g.fillText(bandLine('Gravity', o.gravity.band), left, 134);
  g.fillText(bandLine('Atmosphere', o.atmosphere.band), left, 158);

  const shown = (i: number, value: number) => (state.field === i && state.typing !== null ? `${state.typing}_` : String(value));
  const leftover = landingLeftover(state);
  field(g, left, 210, 'BOOSTERS', shown(0, state.landing.boosters), `covers ${pct(coverChance(o.gravity.band, state.landing.boosters))} of ${o.gravity.band.toLowerCase()} gravity`, state.field === 0 && !descending, '#6fb6ff');
  field(g, left, 250, 'HEAT SHIELDS', shown(1, state.landing.heat), `covers ${pct(coverChance(o.atmosphere.band, state.landing.heat))} of ${o.atmosphere.band.toLowerCase()} atmosphere`, state.field === 1 && !descending, '#ffd166');
  g.fillStyle = leftover < 0 ? '#ff5c5c' : leftover > RESCUE_RULES.doorEnergy ? '#7dffb3' : '#ff8f8f';
  g.font = `14px ${FONT}`;
  g.fillText(
    leftover < 0
      ? 'That is more than you have.'
      : `${leftover} left over: ${leftover > RESCUE_RULES.doorEnergy ? 'enough to open the door' : 'NOT enough to open the door; you need more than 25'}`,
    left,
    296,
  );
}

function panel(g: CanvasRenderingContext2D, stage: Stage, height: number, border: string) {
  const w = Math.min(720, stage.width - 80);
  const x = (stage.width - w) / 2;
  const y = (stage.height - height) / 2;
  g.fillStyle = 'rgba(5, 6, 18, 0.96)';
  g.fillRect(x, y, w, height);
  g.strokeStyle = border;
  g.lineWidth = 2;
  g.strokeRect(x, y, w, height);
  return { x, y, w };
}

function drawReport(g: CanvasRenderingContext2D, stage: Stage, state: RescueState) {
  const r = state.results.at(-1)!;
  const { x, y, w } = panel(g, stage, 230, r.rescued ? '#7dffb3' : '#ff5c5c');
  g.textAlign = 'center';
  g.fillStyle = '#6f78a8';
  g.font = `12px ${FONT}`;
  g.fillText(`MISSION ${state.index + 1} REPORT`, x + w / 2, y + 28);
  if (r.eta !== null) {
    g.fillStyle = '#c9cff5';
    g.font = `14px ${FONT}`;
    g.fillText(`ARRIVED IN ${r.eta} DAYS`, x + w / 2, y + 60);
  }
  const lines = r.rescued ? ['YOU LANDED SUCCESSFULLY - WELL DONE'] : r.failures.map(f => FAILURE_TEXT[f]);
  lines.forEach((line, index) => {
    g.fillStyle = r.rescued ? '#7dffb3' : '#ff8f8f';
    g.font = `600 17px ${FONT}`;
    g.fillText(line, x + w / 2, y + 100 + index * 26);
  });
  if (r.rescued) {
    g.fillStyle = '#c9cff5';
    g.font = `14px ${FONT}`;
    g.fillText(`The door opens with ${r.leftover} units to spare. Score ${r.score}.`, x + w / 2, y + 140);
  }
  g.fillStyle = '#6f78a8';
  g.font = `13px ${FONT}`;
  g.fillText('Press Enter to continue.', x + w / 2, y + 200);
}

function drawDebrief(g: CanvasRenderingContext2D, stage: Stage, state: RescueState) {
  const d = state.debrief!;
  const { x, y, w } = panel(g, stage, 230, d.rescues === d.missions ? '#7dffb3' : '#a9b8ff');
  g.textAlign = 'center';
  g.fillStyle = '#6f78a8';
  g.font = `12px ${FONT}`;
  g.fillText('SERVICE RECORD', x + w / 2, y + 28);
  g.fillStyle = d.rescues === d.missions ? '#7dffb3' : '#eef0ff';
  g.font = `600 28px ${FONT}`;
  g.fillText(d.rank.toUpperCase(), x + w / 2, y + 76);
  g.fillStyle = '#c9cff5';
  g.font = `15px ${FONT}`;
  g.fillText(d.summary, x + w / 2, y + 112);
  g.fillText(`Score ${d.score}`, x + w / 2, y + 142);
  g.fillStyle = '#6f78a8';
  g.font = `13px ${FONT}`;
  g.fillText('Press Enter to fly three more.', x + w / 2, y + 200);
}
