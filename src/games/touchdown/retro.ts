import { formatBbcNumber } from '../../core/bbcNumber';
import { RetroTerminal } from '../../core/retroTerminal';
import type { RetroFactory } from '../types';
import { Mode5 } from './mode5';
import { LISTING_KEYS, TICK_SECONDS, isSafe, launchCraft, tick, touchdownSpeed } from './state';
import type { Craft } from './state';

type Stage = 'intro' | 'flying' | 'done';

/** 13.bas lines 50-67, printed as MODE 7 wraps them at 40 columns, typos and all. */
const INTRO = [
  'Ace space pilot, Captain Flash, is      sitting next to you as you take the     final part of your Advanced Spacecraft  Handling Test (Part III).',
  "Your lightweight, two-man landing craft is rapidly approaching the Moon's       surface. Your velocity must be almost   zero as you touch down.",
  '  Deftly you control the thrust, presing Ato increase it and D to decrease it,    watching your progress on the screen allthe time.',
  'If you use too much thrust you will     begin to go back up again. Too little   and you will make a new crater on the   Moon. Can you impress Captain Flash     with your skill?',
];

function wrap40(text: string) {
  const lines: string[] = [];
  for (let i = 0; i < text.length; i += 40) lines.push(text.slice(i, i + 40).replace(/\s+$/, ''));
  return lines;
}

export const createRetroGame: RetroFactory = ({ stage, manifest }) => {
  const source = manifest.sources.find(item => item.id === 'touchdown-bbc-game')
    ?? manifest.sources.find(item => item.role === 'game');
  const sourceLabel = source ? `Source: ${source.label}${source.dfsName ? ` ${source.dfsName}` : ''}` : 'Source: unavailable';
  const intro = new RetroTerminal({ stage, title: `${manifest.title} (Retro)`, sourceLabel: 'Source: BBC Micro intro $.13', maxLines: 24 });
  const screen = new Mode5();
  const held = { up: false, down: false };
  let current: Stage = 'intro';
  let craft: Craft = launchCraft();
  let timer = 0;
  let ticks = 0;

  const keyDown = (event: KeyboardEvent) => {
    if (event.metaKey || event.ctrlKey) return;
    const key = event.key.toUpperCase();
    if (current === 'intro') {
      if (event.key === ' ') { event.preventDefault(); startGame(); }
      return;
    }
    if (current === 'done') {
      if (event.key === 'Enter' || key === 'R') { event.preventDefault(); startGame(); }
      return;
    }
    if (key === LISTING_KEYS.thrustUp) held.up = true;
    if (key === LISTING_KEYS.thrustDown) held.down = true;
  };
  const keyUp = (event: KeyboardEvent) => {
    const key = event.key.toUpperCase();
    if (key === LISTING_KEYS.thrustUp) held.up = false;
    if (key === LISTING_KEYS.thrustDown) held.down = false;
  };

  function showIntro() {
    intro.clear();
    intro.promptVisible = false;
    intro.pushLine('               TOUCHDOWN');
    intro.pushLine('               _________');
    intro.pushLine('');
    for (const paragraph of INTRO) for (const line of wrap40(paragraph)) intro.pushLine(line);
    intro.pushLine('');
    intro.pushLine(' Press the SPACE BAR to play the game.');
    current = 'intro';
  }

  const barY = (n: number) => 1000 - 192 * n;
  function bar(n: number, value: number, colour: number) {
    const y = barY(n);
    screen.fillRect(0, y - 16, value * 4, y, colour);
    screen.fillRect(value * 4, y - 16, 400, y, 0);
  }

  function module(height: number, colour: number) {
    const y = height * 8.5 + 150;
    const points: Array<[number, number]> = [[1040, y], [1000, y - 40], [992, y - 100], [1088, y - 100], [1080, y - 40], [1040, y]];
    for (let i = 1; i < points.length; i += 1) {
      const [x0, y0] = points[i - 1]!;
      const [x1, y1] = points[i]!;
      screen.line(x0, y0, x1, y1, colour);
    }
  }

  function drawBars() {
    bar(1, craft.fuel, craft.fuel < 25 ? 1 : 3);
    bar(2, Math.abs(craft.velocity), craft.velocity < 0 ? 2 : 3);
    bar(3, craft.height, craft.height < 25 ? 1 : 3);
    bar(4, craft.thrust, 3);
  }

  function startGame() {
    craft = launchCraft();
    held.up = false;
    held.down = false;
    timer = 0;
    ticks = 0;
    screen.clear();
    // PROCDISPLAY: a jagged strip of ground on the right, and the labels.
    let px = 800;
    let py = 30;
    for (let x = 800; x <= 1280; x += 16) {
      const y = 10 + Math.floor(Math.random() * 40) + 1;
      screen.line(px, py, x, y, 3);
      px = x;
      py = y;
    }
    screen.print(0, 0, `GRAVITY=${formatBbcNumber(craft.gravity)}`);
    screen.print(0, 5, 'FUEL:');
    screen.print(0, 11, 'VEL:');
    screen.print(0, 17, 'HEIGHT:');
    screen.print(0, 23, 'THRUST:');
    module(craft.height, 3);
    drawBars();
    current = 'flying';
  }

  function step() {
    ticks += 1;
    const before = craft.height;
    const result = tick(craft, held.up, held.down);
    module(before, 0);
    if (result.kind === 'landed') {
      module(0, 2);
      screen.clearTextWindow(0, 31, 11, 0);
      screen.print(0, 1, 'LANDED');
      screen.print(0, 3, `AT VEL ${formatBbcNumber(touchdownSpeed(result.sum))}`);
      screen.print(0, 5, isSafe(result.sum) ? 'SAFELY' : 'ALL DEAD');
      current = 'done';
      return;
    }
    if (result.kind === 'lost') {
      screen.clear();
      for (let i = 0; i < 20; i += 1) {
        screen.print(Math.floor(Math.random() * 19) + 1, Math.floor(Math.random() * 31) + 1, '*');
      }
      screen.print(4, 16, 'LOST IN SPACE!!');
      current = 'done';
      return;
    }
    module(craft.height, 3);
    drawBars();
  }

  return {
    enter() {
      window.addEventListener('keydown', keyDown);
      window.addEventListener('keyup', keyUp);
      showIntro();
    },
    update(dt: number) {
      intro.update(dt);
      if (current !== 'flying') return;
      timer += dt;
      while (current === 'flying' && timer >= TICK_SECONDS) {
        timer -= TICK_SECONDS;
        step();
      }
    },
    render() {
      if (current === 'intro') {
        intro.render();
        return;
      }
      stage.clear('#050507');
      const g = stage.ctx;
      g.save();
      g.textAlign = 'left';
      g.fillStyle = '#5df7ff';
      g.font = '600 32px "Space Mono", monospace';
      g.fillText(`${manifest.title} (Retro)`, 32, 40);
      g.fillStyle = '#9be7ff';
      g.font = '16px "Space Mono", monospace';
      g.fillText(current === 'done' ? `${sourceLabel} · R or Enter to fly again` : sourceLabel, 32, 64);
      g.restore();
      screen.render(stage);
    },
    exit() {
      window.removeEventListener('keydown', keyDown);
      window.removeEventListener('keyup', keyUp);
    },
    debugSnapshot() {
      return {
        gameId: manifest.id,
        source: source?.path ?? null,
        stage: current,
        ticks,
        craft: { ...craft },
        held: { ...held },
        done: current === 'done',
      };
    },
  };
};
