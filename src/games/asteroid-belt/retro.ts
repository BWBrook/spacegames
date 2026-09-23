import { RetroScreen } from '../../core/retroScreen';
import type { RetroFactory } from '../types';
import {
  ASTEROID_RULES,
  INKEY_TIMEOUT,
  RETRO_TIMING,
  VERDICT_TEXT,
  inkeyCode,
  judgeListing,
  rollAsteroid,
  starRows,
} from './state';
import type { Asteroid, Verdict } from './state';

type Stage = 'window' | 'pause' | 'done';

interface RetroState {
  round: number;
  score: number;
  asteroid: Asteroid;
  stage: Stage;
  timer: number;
  /** Row the cursor sits on once the stars are printed, where the verdict lands. */
  messageRow: number;
  lastVerdict: Verdict | null;
}

export const createRetroGame: RetroFactory = ({ stage, manifest }) => {
  const source = manifest.sources.find(item => item.id === 'asteroid-bbc-game')
    ?? manifest.sources.find(item => item.role === 'game');
  const screen = new RetroScreen({
    stage,
    title: `${manifest.title} (Retro)`,
    sourceLabel: source
      ? `Source: ${source.label}${source.dfsName ? ` ${source.dfsName}` : ''}`
      : 'Source: unavailable',
    rows: 19,
  });
  const state: RetroState = {
    round: 0,
    score: 0,
    asteroid: { column: 1, row: 1, stars: 1 },
    stage: 'window',
    timer: 0,
    messageRow: 0,
    lastVerdict: null,
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
    // During the pause, keys are lost to the *FX15 flush at line 305, so
    // unlike Beat The Bug Eyes an early press here costs nothing.
    if (state.stage !== 'window') return;
    const code = inkeyCode(event.key);
    if (code === null) return;
    event.preventDefault();
    resolve(code);
  };

  function startRun() {
    state.round = 0;
    state.score = 0;
    nextAsteroid();
  }

  function nextAsteroid() {
    state.round += 1;
    if (state.round > ASTEROID_RULES.asteroids) return finish();
    state.asteroid = rollAsteroid();
    screen.clear();
    // D blank lines, then a newline and TAB(A) before the 1st, 4th and 7th star.
    const rows = starRows(state.asteroid.stars);
    rows.forEach((count, index) => {
      screen.writeAt(state.asteroid.row + 1 + index, state.asteroid.column, '*'.repeat(count));
    });
    state.messageRow = state.asteroid.row + rows.length + 1;
    state.stage = 'window';
    state.timer = 0;
    state.lastVerdict = null;
  }

  function resolve(code: number) {
    const verdict = judgeListing(code, state.asteroid.stars);
    state.lastVerdict = verdict;
    if (verdict === 'destroyed') state.score += 1;
    screen.writeAt(state.messageRow, 0, VERDICT_TEXT[verdict]);
    state.stage = 'pause';
    state.timer = 0;
  }

  function finish() {
    // The score prints on the line after the last verdict, where the cursor is.
    screen.writeAt(state.messageRow + 1, 0, `YOU HIT ${state.score} OUT OF ${ASTEROID_RULES.asteroids}`);
    screen.writeAt(state.messageRow + 3, 0, 'R OR ENTER TO PLAY AGAIN');
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
      if (state.stage === 'window' && state.timer >= RETRO_TIMING.windowSeconds) resolve(INKEY_TIMEOUT);
      else if (state.stage === 'pause' && state.timer >= RETRO_TIMING.pauseSeconds) nextAsteroid();
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
        round: state.round,
        score: state.score,
        asteroid: state.asteroid,
        stage: state.stage,
        lastVerdict: state.lastVerdict,
        done: state.stage === 'done',
        lines: screen.toText(),
      };
    },
  };
};
