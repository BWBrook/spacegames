import { RetroScreen } from '../../core/retroScreen';
import type { RetroFactory } from '../types';
import {
  BUG_EYES_RULES,
  RETRO_POSITIONS,
  RETRO_TIMING,
  isBlast,
  randomPosition,
  retroLurkSeconds,
} from './state';

type Stage = 'lurk' | 'window' | 'flash' | 'done';

interface RetroState {
  bug: number;
  score: number;
  position: number;
  stage: Stage;
  timer: number;
  duration: number;
  buffered: string | null;
}

export const createRetroGame: RetroFactory = ({ stage, manifest }) => {
  const source = manifest.sources.find(item => item.id === 'bug-eyes-bbc-game')
    ?? manifest.sources.find(item => item.role === 'game');
  const screen = new RetroScreen({
    stage,
    title: `${manifest.title} (Retro)`,
    sourceLabel: source
      ? `Source: ${source.label}${source.dfsName ? ` ${source.dfsName}` : ''}`
      : 'Source: unavailable',
    rows: 14,
  });
  const state: RetroState = {
    bug: 0,
    score: 0,
    position: 1,
    stage: 'lurk',
    timer: 0,
    duration: 0,
    buffered: null,
  };

  const keyHandler = (event: KeyboardEvent) => {
    if (event.metaKey || event.ctrlKey) return;
    if (state.stage === 'done') {
      if (event.key === 'Enter' || event.key.toLowerCase() === 'r') {
        event.preventDefault();
        startRun();
      }
      return;
    }
    if (event.key.length !== 1) return;
    // The BBC keyboard buffer holds a key struck during the delay, so the first
    // INKEY$ of the window returns it at once. Mashing early costs you the bug.
    if (state.stage === 'lurk') {
      state.buffered ??= event.key;
      return;
    }
    if (state.stage === 'window') resolve(event.key);
  };

  function startRun() {
    state.bug = 0;
    state.score = 0;
    screen.clear();
    screen.writeAt(0, 0, 'BUG EYES');
    nextBug();
  }

  function nextBug() {
    state.bug += 1;
    if (state.bug > BUG_EYES_RULES.bugs) return finish();
    screen.clear();
    state.position = randomPosition();
    state.stage = 'lurk';
    state.timer = 0;
    state.duration = retroLurkSeconds();
    state.buffered = null;
  }

  function showEyes() {
    const spot = RETRO_POSITIONS[state.position - 1];
    if (spot) screen.writeAt(spot.row, spot.column, 'OO');
    state.stage = 'window';
    state.timer = 0;
    state.duration = RETRO_TIMING.windowSeconds;
    if (state.buffered !== null) resolve(state.buffered);
  }

  function resolve(key: string) {
    if (!isBlast(state.position, key)) return nextBug();
    state.score += 1;
    screen.clear();
    const spot = RETRO_POSITIONS[state.position - 1];
    if (spot) screen.writeAt(spot.row, spot.column, '*');
    state.stage = 'flash';
    state.timer = 0;
    state.duration = RETRO_TIMING.flashSeconds;
  }

  function finish() {
    screen.clear();
    screen.writeAt(0, 0, `YOU BLASTED ${state.score}/${BUG_EYES_RULES.bugs} BUGS`);
    screen.writeAt(2, 0, 'R OR ENTER TO PLAY AGAIN');
    state.stage = 'done';
  }

  return {
    enter() {
      window.addEventListener('keydown', keyHandler);
      startRun();
    },
    update(dt: number) {
      if (state.stage === 'done') return;
      state.timer += dt;
      if (state.timer < state.duration) return;
      if (state.stage === 'lurk') showEyes();
      else if (state.stage === 'window') nextBug();
      else if (state.stage === 'flash') nextBug();
    },
    render() {
      screen.render();
    },
    exit() {
      window.removeEventListener('keydown', keyHandler);
    },
    debugSnapshot() {
      return {
        gameId: manifest.id,
        source: source?.path ?? null,
        bug: state.bug,
        score: state.score,
        position: state.position,
        stage: state.stage,
        done: state.stage === 'done',
        lines: screen.toText(),
      };
    },
  };
};
