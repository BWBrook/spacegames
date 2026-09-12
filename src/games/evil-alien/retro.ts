import { RetroTerminal } from '../../core/retroTerminal';
import type { RetroFactory } from '../types';
import { EVIL_ALIEN_RULES, compassWord, isHit, randomPosition, rangeWord } from './state';
import type { GridPosition } from './state';

type Prompt = 'x' | 'y' | 'd';

interface RetroState {
  target: GridPosition;
  bomb: number;
  prompt: Prompt;
  shot: Partial<GridPosition>;
  done: boolean;
}

const PROMPTS: Record<Prompt, string> = {
  x: 'INPUT X POSITION (0 TO 9)?',
  y: 'Y POSITION (0 TO 9)?',
  d: 'DISTANCE (0 TO 9)?',
};

export const createRetroGame: RetroFactory = ({ stage, manifest }) => {
  const source = manifest.sources.find(item => item.id === 'evil-alien-bbc-game')
    ?? manifest.sources.find(item => item.role === 'game');
  const terminal = new RetroTerminal({
    stage,
    title: `${manifest.title} (Retro)`,
    sourceLabel: source
      ? `Source: ${source.label}${source.dfsName ? ` ${source.dfsName}` : ''}`
      : 'Source: unavailable',
    maxLines: 24,
  });
  const state: RetroState = {
    target: randomPosition(),
    bomb: 1,
    prompt: 'x',
    shot: {},
    done: false,
  };

  const keyHandler = (event: KeyboardEvent) => {
    terminal.handleKey(event, {
      onSubmit: submitInput,
      acceptedPattern: /^[0-9]$/,
      maxInputLength: 2,
      inputEnabled: !state.done,
      replayEnabled: state.done,
      onReplay: startRound,
    });
  };

  function startRound() {
    state.target = randomPosition();
    state.bomb = 1;
    state.shot = {};
    state.done = false;
    terminal.clear();
    terminal.pushLine('EVIL ALIEN');
    ask('x');
  }

  function ask(prompt: Prompt) {
    state.prompt = prompt;
    terminal.pushLine(PROMPTS[prompt]);
  }

  function submitInput() {
    if (state.done) {
      startRound();
      return;
    }
    const raw = terminal.input.trim();
    const value = Number.parseInt(raw, 10);
    if (Number.isNaN(value)) {
      terminal.pushLine('ENTER A NUMBER.');
      terminal.input = '';
      return;
    }
    terminal.pushLine(`> ${raw}`);
    terminal.input = '';
    state.shot[state.prompt] = value;

    if (state.prompt === 'x') return ask('y');
    if (state.prompt === 'y') return ask('d');
    resolveShot({ x: state.shot.x ?? 0, y: state.shot.y ?? 0, d: value });
  }

  function resolveShot(shot: GridPosition) {
    state.shot = {};
    if (isHit(state.target, shot)) {
      terminal.pushLine('*BOOM* YOU GOT HIM!');
      finish();
      return;
    }
    terminal.pushLine(`SHOT WAS ${compassWord(state.target, shot)}`);
    const range = rangeWord(state.target, shot);
    if (range) terminal.pushLine(range);
    if (state.bomb >= EVIL_ALIEN_RULES.bombs) {
      terminal.pushLine('YOUR TIME HAS RUN OUT!!');
      finish();
      return;
    }
    state.bomb += 1;
    ask('x');
  }

  function finish() {
    terminal.pushLine('');
    terminal.pushLine('R OR ENTER TO PLAY AGAIN');
    state.done = true;
  }

  return {
    enter() {
      window.addEventListener('keydown', keyHandler);
      startRound();
    },
    update(dt: number) {
      terminal.update(dt);
    },
    render() {
      terminal.render();
    },
    exit() {
      window.removeEventListener('keydown', keyHandler);
    },
    debugSnapshot() {
      return {
        gameId: manifest.id,
        source: source?.path ?? null,
        target: state.target,
        bomb: state.bomb,
        prompt: state.prompt,
        shot: state.shot,
        done: state.done,
        lines: [...terminal.lines],
        input: terminal.input,
      };
    },
  };
};
