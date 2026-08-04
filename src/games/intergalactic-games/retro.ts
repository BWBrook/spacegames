import { RetroTerminal } from '../../core/retroTerminal';
import type { RetroFactory } from '../types';
import { buildFeedback, targetAngle, targetSpeed } from './state';

type Prompt = 'angle' | 'speed';

interface RetroState {
  targetHeight: number;
  attempt: number;
  maxAttempts: number;
  prompt: Prompt;
  angle: number | null;
  done: boolean;
}

export const createRetroGame: RetroFactory = ({ stage, manifest }) => {
  const source = manifest.sources.find(item => item.id === 'intergalactic-bbc-game')
    ?? manifest.sources.find(item => item.role === 'game')
    ?? manifest.sources.find(item => item.role === 'transcription');
  const terminal = new RetroTerminal({
    stage,
    title: `${manifest.title} (Retro)`,
    sourceLabel: source
      ? `Source: ${source.label}${source.dfsName ? ` ${source.dfsName}` : ''}`
      : 'Source: unavailable',
  });
  const state: RetroState = {
    targetHeight: 1,
    attempt: 1,
    maxAttempts: 8,
    prompt: 'angle',
    angle: null,
    done: false,
  };

  const keyHandler = (event: KeyboardEvent) => {
    terminal.handleKey(event, {
      onSubmit: submitInput,
      acceptedPattern: /^[0-9.-]$/,
      maxInputLength: 8,
      inputEnabled: !state.done,
      replayEnabled: state.done,
      onReplay: startRound,
    });
  };

  function startRound() {
    state.targetHeight = Math.floor(Math.random() * 100 + 1);
    state.attempt = 1;
    state.prompt = 'angle';
    state.angle = null;
    state.done = false;
    terminal.clear();
    terminal.pushLine('INTERGALACTIC GAMES');
    terminal.pushLine('YOU MUST LAUNCH A SATELLITE');
    terminal.pushLine(`TO A HEIGHT OF ${state.targetHeight}`);
    terminal.pushLine('');
    promptAngle();
  }

  function promptAngle() {
    state.prompt = 'angle';
    terminal.pushLine('ENTER ANGLE (0-90)');
  }

  function promptSpeed() {
    state.prompt = 'speed';
    terminal.pushLine('ENTER SPEED (0-40000)');
  }

  function submitInput() {
    if (state.done) {
      startRound();
      return;
    }
    const value = Number.parseFloat(terminal.input.trim());
    if (Number.isNaN(value)) {
      terminal.pushLine('ENTER A NUMBER.');
      terminal.input = '';
      return;
    }
    terminal.pushLine(`> ${terminal.input.trim()}`);
    terminal.input = '';

    if (state.prompt === 'angle') {
      state.angle = value;
      promptSpeed();
      return;
    }

    if (state.angle === null) {
      promptAngle();
      return;
    }
    resolveAttempt(state.angle, value);
  }

  function resolveAttempt(angle: number, speed: number) {
    const feedback = buildFeedback(
      angle - targetAngle(state.targetHeight),
      speed - targetSpeed(state.targetHeight),
    );
    if (!feedback.length) {
      terminal.pushLine("YOU'VE DONE IT");
      terminal.pushLine('NCTV WINS - THANKS TO YOU');
      terminal.pushLine(`YOU'VE EARNED A`);
      terminal.pushLine(`BONUS OF ${Math.floor(1000 / state.attempt)} CREDITS`);
      terminal.pushLine('');
      terminal.pushLine('R OR ENTER FOR ANOTHER EVENT');
      state.done = true;
      return;
    }

    for (const line of feedback) terminal.pushLine(line);
    if (state.attempt >= state.maxAttempts) {
      terminal.pushLine("YOU'VE FAILED");
      terminal.pushLine("YOU'RE FIRED");
      terminal.pushLine('');
      terminal.pushLine('R OR ENTER FOR ANOTHER EVENT');
      state.done = true;
      return;
    }
    state.attempt += 1;
    state.angle = null;
    promptAngle();
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
        targetHeight: state.targetHeight,
        attempt: state.attempt,
        prompt: state.prompt,
        angle: state.angle,
        done: state.done,
        lines: [...terminal.lines],
        input: terminal.input,
      };
    },
  };
};
