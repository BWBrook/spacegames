import { readBbcNumber } from '../../core/bbcNumber';
import { RetroTerminal } from '../../core/retroTerminal';
import type { RetroFactory } from '../types';
import {
  AUTO_REPEAT,
  VALLEY_RULES,
  halfWidth,
  rollDrift,
  rowSeconds,
  screenLines,
  valleyRow,
} from './state';

type Stage = 'width' | 'run' | 'done';

interface Hold {
  key: string;
  held: number;
  nextRepeat: number;
}

interface RetroState {
  stage: Stage;
  left: number;
  gapLeft: number;
  gapRight: number;
  survived: number;
  timer: number;
  nextRow: number;
  buffer: string[];
  holds: Map<string, Hold>;
}

export const createRetroGame: RetroFactory = ({ stage, manifest }) => {
  const source = manifest.sources.find(item => item.id === 'valley-bbc-game')
    ?? manifest.sources.find(item => item.role === 'game');
  const terminal = new RetroTerminal({
    stage,
    title: `${manifest.title} (Retro)`,
    sourceLabel: source
      ? `Source: ${source.label}${source.dfsName ? ` ${source.dfsName}` : ''}`
      : 'Source: unavailable',
    maxLines: 22,
  });
  const state: RetroState = {
    stage: 'width',
    left: VALLEY_RULES.startLeft,
    gapLeft: 0,
    gapRight: 0,
    survived: 0,
    timer: 0,
    nextRow: 0,
    buffer: [],
    holds: new Map(),
  };

  function buffer(key: string) {
    if (state.buffer.length < AUTO_REPEAT.bufferSize) state.buffer.push(key);
  }

  const keyDown = (event: KeyboardEvent) => {
    if (event.metaKey || event.ctrlKey) return;
    if (state.stage === 'width') {
      terminal.handleKey(event, { onSubmit: submitWidth, acceptedPattern: /^[0-9.-]$/, maxInputLength: 6 });
      return;
    }
    if (state.stage === 'done') {
      if (event.key === 'Enter' || event.key.toLowerCase() === 'r') {
        event.preventDefault();
        startRun();
      }
      return;
    }
    // Browser auto-repeat is ignored; the BBC's own is emulated in update().
    if (event.repeat || event.key.length !== 1) return;
    event.preventDefault();
    const key = event.key.toUpperCase();
    buffer(key);
    state.holds.set(key, { key, held: 0, nextRepeat: AUTO_REPEAT.delay });
  };

  const keyUp = (event: KeyboardEvent) => {
    state.holds.delete(event.key.toUpperCase());
  };

  function startRun() {
    state.stage = 'width';
    state.buffer = [];
    state.holds.clear();
    terminal.promptVisible = true;
    terminal.clear();
    terminal.pushLine('DEATH VALLEY');
    terminal.pushLine('WIDTH?');
  }

  function submitWidth() {
    const raw = terminal.input.trim();
    terminal.pushLine(`> ${raw}`);
    terminal.input = '';
    const w = halfWidth(readBbcNumber(raw));
    state.left = VALLEY_RULES.startLeft;
    state.gapLeft = w;
    state.gapRight = w;
    state.survived = 0;
    state.timer = 0;
    state.nextRow = 0;
    state.buffer = [];
    state.stage = 'run';
    terminal.promptVisible = false;
  }

  function printRow() {
    const drift = rollDrift(state.left);
    state.left += drift;
    state.gapLeft -= drift;
    state.gapRight += drift;
    for (const line of screenLines(valleyRow(state.left, state.gapLeft, state.gapRight))) terminal.pushLine(line);

    const keyWaiting = state.buffer.length > 0;
    const key = state.buffer.shift() ?? '';
    if (key === 'Q') { state.gapLeft -= 1; state.gapRight += 1; }
    if (key === 'P') { state.gapLeft += 1; state.gapRight -= 1; }

    const spaces = state.left + Math.max(0, state.gapLeft) + Math.max(0, state.gapRight);
    state.nextRow = rowSeconds(spaces, keyWaiting);

    if (state.gapLeft < 1 || state.gapRight < 1) {
      terminal.pushLine('YOU CRASHED INTO THE WALL');
      terminal.pushLine('AND DISINTEGRATED');
      return finish();
    }
    state.survived += 1;
    if (state.survived >= VALLEY_RULES.rows) {
      terminal.pushLine('WELL DONE-YOU MADE IT');
      terminal.pushLine('THROUGH DEATH VALLEY');
      finish();
    }
  }

  function finish() {
    terminal.pushLine('');
    terminal.pushLine('R OR ENTER TO FLY AGAIN');
    state.stage = 'done';
    state.holds.clear();
  }

  return {
    enter() {
      window.addEventListener('keydown', keyDown);
      window.addEventListener('keyup', keyUp);
      startRun();
    },
    update(dt: number) {
      terminal.update(dt);
      if (state.stage !== 'run') return;
      for (const hold of state.holds.values()) {
        hold.held += dt;
        while (hold.held >= hold.nextRepeat) {
          buffer(hold.key);
          hold.nextRepeat += AUTO_REPEAT.period;
        }
      }
      state.timer += dt;
      while (state.stage === 'run' && state.timer >= state.nextRow) {
        state.timer -= state.nextRow;
        printRow();
      }
    },
    render() {
      terminal.render();
    },
    exit() {
      window.removeEventListener('keydown', keyDown);
      window.removeEventListener('keyup', keyUp);
    },
    debugSnapshot() {
      return {
        gameId: manifest.id,
        source: source?.path ?? null,
        stage: state.stage,
        left: state.left,
        gapLeft: state.gapLeft,
        gapRight: state.gapRight,
        survived: state.survived,
        buffered: state.buffer.length,
        done: state.stage === 'done',
        lines: [...terminal.lines],
      };
    },
  };
};
