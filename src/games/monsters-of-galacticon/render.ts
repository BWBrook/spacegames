import type { Stage } from '../../core/stage';
import {
  GALACTICON_RULES,
  MONSTER_NAMES,
  WEAPONS,
  WEAPON_NAMES,
  currentName,
} from './state';
import type { Outcome, Weapon } from './state';
import type { GalacticonState } from './types';

const FONT = '"Space Mono", monospace';
const OUTCOME_COLOUR: Record<Outcome, string> = {
  kill: '#7dffb3',
  noeffect: '#ffd166',
  eaten: '#ff6b6b',
};
const OUTCOME_MARK: Record<Outcome, string> = { kill: 'KILL', noeffect: 'none', eaten: 'EATS' };

export function renderGalacticon(stage: Stage, title: string, state: GalacticonState) {
  const g = stage.ctx;
  stage.clear('#060310');
  g.save();
  g.textBaseline = 'alphabetic';
  drawCavern(g, stage, state);
  drawTopBar(g, stage, title, state);
  drawMonster(g, stage, state);
  drawWeapons(g, stage, state);
  drawJournal(g, stage, state);
  drawCrew(g, stage, state);
  drawStatus(g, stage, state);
  if (state.phase === 'debrief' && state.debrief) drawDebrief(g, stage, state);
  g.restore();
}

function drawCavern(g: CanvasRenderingContext2D, stage: Stage, state: GalacticonState) {
  const danger = state.phase === 'resolve' && state.lastOutcome !== 'kill' ? 1 : 0;
  const glow = g.createRadialGradient(
    stage.width * 0.42, stage.height * 0.42, 40,
    stage.width * 0.42, stage.height * 0.42, stage.height * 0.8,
  );
  glow.addColorStop(0, `rgba(${60 + danger * 90}, 30, 70, 0.5)`);
  glow.addColorStop(1, 'rgba(6, 3, 16, 0)');
  g.fillStyle = glow;
  g.fillRect(0, 0, stage.width, stage.height);
  g.fillStyle = '#100a1e';
  g.beginPath();
  g.moveTo(0, stage.height);
  for (let x = 0; x <= stage.width; x += 50) {
    g.lineTo(x, stage.height - 70 - Math.sin(x * 0.013) * 22 - Math.sin(x * 0.004) * 14);
  }
  g.lineTo(stage.width, stage.height);
  g.closePath();
  g.fill();
}

function drawTopBar(g: CanvasRenderingContext2D, stage: Stage, title: string, state: GalacticonState) {
  g.fillStyle = 'rgba(8, 4, 18, 0.88)';
  g.fillRect(0, 0, stage.width, 56);
  g.fillStyle = '#c9a6ff';
  g.font = `600 20px ${FONT}`;
  g.textAlign = 'left';
  g.fillText(title, 24, 35);

  g.font = `12px ${FONT}`;
  g.fillStyle = '#8a76b5';
  g.fillText('MONSTER', 300, 22);
  g.font = `600 18px ${FONT}`;
  g.fillStyle = '#f0e6ff';
  g.fillText(`${Math.min(state.encounter, GALACTICON_RULES.encounters)} / ${GALACTICON_RULES.encounters}`, 300, 44);

  g.font = `12px ${FONT}`;
  g.fillStyle = '#8a76b5';
  g.fillText('KILLED', 410, 22);
  g.font = `600 18px ${FONT}`;
  g.fillStyle = '#7dffb3';
  g.fillText(String(state.kills), 410, 44);
}

function monsterIndex(state: GalacticonState) {
  // The look follows the name, not the slot, so appearance never leaks the answer.
  return Math.max(0, (MONSTER_NAMES as readonly string[]).indexOf(currentName(state)));
}

function drawMonster(g: CanvasRenderingContext2D, stage: Stage, state: GalacticonState) {
  if (state.phase === 'debrief') return;
  const cx = stage.width * 0.42;
  const cy = stage.height * 0.46;
  const approach = state.phase === 'approach'
    ? Math.min(1, state.phaseElapsed / 1.0)
    : 1;
  const dying = state.phase === 'resolve' && state.lastOutcome === 'kill'
    ? Math.min(1, state.phaseElapsed / 1.2)
    : 0;
  const scale = (0.45 + 0.55 * approach) * (1 - dying * 0.75);
  const alpha = state.phase === 'approach' ? approach : 1 - dying;

  g.save();
  g.globalAlpha = Math.max(0, alpha);
  g.translate(cx, cy);
  g.scale(scale, scale);
  const sway = Math.sin(state.elapsed * 2.2) * 6;
  g.translate(0, sway);
  drawCreature(g, monsterIndex(state), state.elapsed);
  g.restore();

  if (state.phase !== 'approach' || approach > 0.6) {
    g.globalAlpha = Math.max(0, alpha);
    g.textAlign = 'center';
    g.fillStyle = '#f0e6ff';
    g.font = `600 26px ${FONT}`;
    g.fillText(currentName(state), cx, cy + 150);
    g.globalAlpha = 1;
  }
}

function drawCreature(g: CanvasRenderingContext2D, index: number, t: number) {
  const bodies = ['#5d2a5f', '#7a3320', '#1f4a52', '#4a3f18'];
  const eyes = ['#ff5ad6', '#ffa23a', '#5df7ff', '#c8ff5a'];
  g.fillStyle = bodies[index] ?? bodies[0]!;
  g.strokeStyle = 'rgba(255, 255, 255, 0.16)';
  g.lineWidth = 2;

  if (index === 0) {
    g.beginPath();
    g.ellipse(0, 0, 86, 66, 0, 0, Math.PI * 2);
    g.fill();
    for (let i = 0; i < 7; i += 1) {
      const a = (i / 7) * Math.PI * 2;
      g.beginPath();
      g.moveTo(Math.cos(a) * 70, Math.sin(a) * 52);
      g.lineTo(Math.cos(a) * (108 + Math.sin(t * 3 + i) * 12), Math.sin(a) * (88 + Math.cos(t * 3 + i) * 12));
      g.stroke();
    }
  } else if (index === 1) {
    g.beginPath();
    g.moveTo(0, -96);
    g.lineTo(74, 56);
    g.lineTo(-74, 56);
    g.closePath();
    g.fill();
    g.beginPath();
    g.moveTo(-74, 56);
    g.quadraticCurveTo(0, 96, 74, 56);
    g.fill();
  } else if (index === 2) {
    g.beginPath();
    g.roundRect(-78, -62, 156, 124, 26);
    g.fill();
    g.fillStyle = 'rgba(0,0,0,0.3)';
    for (let i = -2; i <= 2; i += 1) {
      g.fillRect(i * 28 - 5, -62, 10, 124);
    }
  } else {
    g.beginPath();
    g.moveTo(-84, 50);
    g.quadraticCurveTo(-56, -92, 0, -92);
    g.quadraticCurveTo(56, -92, 84, 50);
    g.closePath();
    g.fill();
    for (let i = 0; i < 4; i += 1) {
      g.beginPath();
      g.moveTo(-50 + i * 33, 50);
      g.lineTo(-56 + i * 33, 84 + Math.sin(t * 4 + i) * 6);
      g.stroke();
    }
  }

  const eyeColour = eyes[index] ?? eyes[0]!;
  g.fillStyle = eyeColour;
  const count = index + 2;
  for (let i = 0; i < count; i += 1) {
    const x = (i - (count - 1) / 2) * 34;
    g.beginPath();
    g.arc(x, -18, 10, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = '#0a0410';
  for (let i = 0; i < count; i += 1) {
    const x = (i - (count - 1) / 2) * 34;
    g.beginPath();
    g.arc(x, -18, 4, 0, Math.PI * 2);
    g.fill();
  }
}

function drawWeapons(g: CanvasRenderingContext2D, stage: Stage, state: GalacticonState) {
  if (state.phase === 'debrief') return;
  const armed = state.phase === 'choose';
  const width = 190;
  const height = 58;
  const totalWidth = WEAPONS.length * width + (WEAPONS.length - 1) * 16;
  const startX = stage.width * 0.42 - totalWidth / 2;
  const y = stage.height - 178;

  WEAPONS.forEach((weapon, index) => {
    const x = startX + index * (width + 16);
    const chosen = state.lastWeapon === weapon && state.phase === 'resolve';
    g.fillStyle = chosen
      ? (state.lastOutcome === 'kill' ? 'rgba(125,255,179,0.22)' : 'rgba(255,107,107,0.22)')
      : armed ? 'rgba(28, 16, 48, 0.92)' : 'rgba(18, 10, 32, 0.6)';
    g.fillRect(x, y, width, height);
    g.strokeStyle = chosen
      ? (state.lastOutcome === 'kill' ? '#7dffb3' : '#ff6b6b')
      : armed ? 'rgba(201, 166, 255, 0.7)' : 'rgba(201, 166, 255, 0.25)';
    g.lineWidth = chosen ? 2 : 1;
    g.strokeRect(x + 0.5, y + 0.5, width, height);

    g.textAlign = 'left';
    g.fillStyle = armed || chosen ? '#c9a6ff' : 'rgba(201,166,255,0.45)';
    g.font = `600 22px ${FONT}`;
    g.fillText(weapon, x + 16, y + 38);
    g.fillStyle = armed || chosen ? '#f0e6ff' : 'rgba(240,230,255,0.4)';
    g.font = `14px ${FONT}`;
    g.fillText(WEAPON_NAMES[weapon], x + 44, y + 37);
  });
}

function drawJournal(g: CanvasRenderingContext2D, stage: Stage, state: GalacticonState) {
  const width = 300;
  const x = stage.width - width - 32;
  const y = 84;
  const rowHeight = 46;
  const height = 38 + MONSTER_NAMES.length * rowHeight;

  g.fillStyle = 'rgba(10, 5, 22, 0.82)';
  g.fillRect(x, y, width, height);
  g.strokeStyle = 'rgba(201, 166, 255, 0.3)';
  g.lineWidth = 1;
  g.strokeRect(x + 0.5, y + 0.5, width, height);

  g.textAlign = 'left';
  g.fillStyle = '#8a76b5';
  g.font = `12px ${FONT}`;
  g.fillText('FIELD JOURNAL', x + 14, y + 22);
  WEAPONS.forEach((weapon, index) => {
    g.textAlign = 'center';
    g.fillText(weapon, x + 150 + index * 48, y + 22);
  });

  MONSTER_NAMES.forEach((name, index) => {
    const rowY = y + 38 + index * rowHeight;
    const seen = state.journal[name];
    g.textAlign = 'left';
    g.font = `12px ${FONT}`;
    g.fillStyle = seen ? '#f0e6ff' : 'rgba(240,230,255,0.35)';
    g.fillText(name, x + 14, rowY + 20);
    WEAPONS.forEach((weapon, col) => {
      const outcome = seen?.[weapon];
      const cx = x + 150 + col * 48;
      g.textAlign = 'center';
      if (!outcome) {
        g.fillStyle = 'rgba(240,230,255,0.18)';
        g.font = `13px ${FONT}`;
        g.fillText('?', cx, rowY + 20);
        return;
      }
      g.fillStyle = OUTCOME_COLOUR[outcome];
      g.font = `600 11px ${FONT}`;
      g.fillText(OUTCOME_MARK[outcome], cx, rowY + 20);
    });
  });
}

function drawCrew(g: CanvasRenderingContext2D, stage: Stage, state: GalacticonState) {
  const y = stage.height - 96;
  const startX = 40;
  g.textAlign = 'left';
  g.fillStyle = '#8a76b5';
  g.font = `12px ${FONT}`;
  g.fillText('YOUR GROUP', startX, y - 14);
  state.crew.forEach((member, index) => {
    const x = startX + index * 112;
    const justLost = state.lostMember === member.name && state.phase === 'resolve';
    g.fillStyle = member.alive ? '#c9a6ff' : justLost ? '#ff6b6b' : 'rgba(201,166,255,0.22)';
    g.beginPath();
    g.arc(x + 10, y + 6, 7, 0, Math.PI * 2);
    g.fill();
    if (!member.alive) {
      g.strokeStyle = justLost ? '#ff6b6b' : 'rgba(201,166,255,0.35)';
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(x + 4, y + 12);
      g.lineTo(x + 16, y);
      g.stroke();
    }
    g.fillStyle = member.alive ? '#f0e6ff' : 'rgba(240,230,255,0.3)';
    g.font = `11px ${FONT}`;
    g.fillText(member.name, x + 24, y + 10);
  });
}

function drawStatus(g: CanvasRenderingContext2D, stage: Stage, state: GalacticonState) {
  g.textAlign = 'center';
  g.fillStyle = '#f0e6ff';
  g.font = `15px ${FONT}`;
  g.fillText(state.statusMessage, stage.width / 2, stage.height - 44);
  g.fillStyle = '#8a76b5';
  g.font = `12px ${FONT}`;
  g.fillText('Press R, S or T to choose a weapon · Esc leaves', stage.width / 2, stage.height - 22);
}

function drawDebrief(g: CanvasRenderingContext2D, stage: Stage, state: GalacticonState) {
  const d = state.debrief!;
  const w = Math.min(680, stage.width - 80);
  const h = 330;
  const x = (stage.width - w) / 2;
  const y = (stage.height - h) / 2;
  g.fillStyle = 'rgba(6, 3, 16, 0.95)';
  g.fillRect(x, y, w, h);
  g.strokeStyle = d.survived ? '#7dffb3' : '#ff5c7a';
  g.lineWidth = 2;
  g.strokeRect(x, y, w, h);

  g.textAlign = 'center';
  g.fillStyle = '#8a76b5';
  g.font = `12px ${FONT}`;
  g.fillText('EXPEDITION LOG', stage.width / 2, y + 28);
  g.fillStyle = d.survived ? '#7dffb3' : '#ff8fa3';
  g.font = `600 ${d.survived ? 20 : 26}px ${FONT}`;
  g.fillText(d.headline, stage.width / 2, y + 66);
  g.fillStyle = '#f0e6ff';
  g.font = `15px ${FONT}`;
  g.fillText(d.summary, stage.width / 2, y + 98);
  g.fillStyle = '#c9a6ff';
  g.fillText(`${d.kills} killed · ${d.crewLeft} of ${GALACTICON_RULES.crew} alive · Score ${d.score}`, stage.width / 2, y + 128);
  g.fillStyle = '#ffd166';
  g.font = `600 15px ${FONT}`;
  g.fillText(d.rank, stage.width / 2, y + 156);

  g.fillStyle = '#8a76b5';
  g.font = `12px ${FONT}`;
  g.fillText('WHAT EACH ONE NEEDED', stage.width / 2, y + 194);
  d.answers.forEach((answer, index) => {
    const rowY = y + 218 + index * 22;
    g.textAlign = 'right';
    g.fillStyle = '#f0e6ff';
    g.font = `13px ${FONT}`;
    g.fillText(answer.name, stage.width / 2 + 10, rowY);
    g.textAlign = 'left';
    g.fillStyle = '#7dffb3';
    g.fillText(`${answer.kills}  ${WEAPON_NAMES[answer.kills]}`, stage.width / 2 + 26, rowY);
  });

  g.textAlign = 'center';
  g.fillStyle = '#8a76b5';
  g.font = `13px ${FONT}`;
  g.fillText('Press Enter to land again.', stage.width / 2, y + h - 16);
}
