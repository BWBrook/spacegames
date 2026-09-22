import { RetroTerminal } from '../../core/retroTerminal';
import type { RetroFactory } from '../types';
import {
  SNIPER_RULES,
  clampDifficulty,
  isHit,
  rollTarget,
  windowSeconds,
} from './state';
import type { SniperTarget } from './state';

/** Two print zones, as the comma in line 130 gives on a BBC. */
const ZONE = 14;

type Stage = 'difficulty' | 'window' | 'done';

interface RetroState {
  stage: Stage;
  difficulty: number;
  round: number;
  score: number;
  target: SniperTarget;
  timer: number;
  buffered: string | null;
}

export const createRetroGame: RetroFactory = ({ stage, manifest }) => {
  const source = manifest.sources.find(item => item.id === 'snipers-bbc-game')
    ?? manifest.sources.find(item => item.role === 'game');
  const terminal = new RetroTerminal({
    stage,
    title: `${manifest.title} (Retro)`,
    sourceLabel: source
      ? `Source: ${source.label}${source.dfsName ? ` ${source.dfsName}` : ''}`
      : 'Source: unavailable',
    maxLines: 12,
  });
  const state: RetroState = {
    stage: 'difficulty',
    difficulty: 1,
    round: 0,
    score: 0,
    target: { letter: 'A', shift: 1, answer: 'B' },
    timer: 0,
    buffered: null,
  };

  const keyHandler = (event: KeyboardEvent) => {
    if (event.metaKey || event.ctrlKey) return;
    if (state.stage === 'difficulty') {
      terminal.handleKey(event, {
        onSubmit: submitDifficulty,
        acceptedPattern: /^[0-9]$/,
        maxInputLength: 2,
        inputEnabled: true,
      });
      return;
    }
    if (state.stage === 'done') {
      if (event.key === 'Enter' || event.key.toLowerCase() === 'r') {
        event.preventDefault();
        startRun();
      }
      return;
    }
    if (event.key.length !== 1) return;
    event.preventDefault();
    resolve(event.key);
  };

  function startRun() {
    state.stage = 'difficulty';
    state.round = 0;
    state.score = 0;
    terminal.clear();
    terminal.pushLine('ALIEN SNIPERS');
    terminal.pushLine('');
    terminal.pushLine(`DIFFICULTY (${SNIPER_RULES.minDifficulty}-${SNIPER_RULES.maxDifficulty})`);
  }

  function submitDifficulty() {
    const value = Number.parseInt(terminal.input.trim(), 10);
    terminal.pushLine(`> ${terminal.input.trim()}`);
    terminal.input = '';
    // Line 60 loops back to the INPUT, not to the prompt, so a bad answer just
    // asks again with no message.
    if (Number.isNaN(value) || value < SNIPER_RULES.minDifficulty || value > SNIPER_RULES.maxDifficulty) {
      terminal.pushLine('?');
      return;
    }
    state.difficulty = clampDifficulty(value);
    nextTarget();
  }

  function nextTarget() {
    state.round += 1;
    if (state.round > SNIPER_RULES.targets) return finish();
    state.target = rollTarget(state.difficulty);
    terminal.clear();
    terminal.pushLine('');
    terminal.pushLine(`${state.target.letter.padEnd(ZONE, ' ')}${state.target.shift}`);
    state.stage = 'window';
    state.timer = 0;
  }

  function resolve(key: string) {
    // The listing scores in silence and moves straight on; you learn nothing
    // until the tally at the end.
    if (isHit(state.target, key)) state.score += 1;
    nextTarget();
  }

  function finish() {
    terminal.clear();
    terminal.pushLine(`YOU HIT ${state.score}/${SNIPER_RULES.targets}`);
    terminal.pushLine('');
    terminal.pushLine('R OR ENTER TO PLAY AGAIN');
    state.stage = 'done';
  }

  return {
    enter() {
      window.addEventListener('keydown', keyHandler);
      startRun();
    },
    update(dt: number) {
      terminal.update(dt);
      if (state.stage !== 'window') return;
      state.timer += dt;
      if (state.timer >= windowSeconds(state.difficulty)) nextTarget();
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
        stage: state.stage,
        difficulty: state.difficulty,
        round: state.round,
        score: state.score,
        target: state.target,
        done: state.stage === 'done',
        lines: [...terminal.lines],
      };
    },
  };
};
