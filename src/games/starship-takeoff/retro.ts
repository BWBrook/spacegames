import { RetroTerminal } from '../../core/retroTerminal';
import type { RetroFactory } from '../types';

interface RetroState {
  gravity: number;
  wind: number;
  target: number;
  guesses: number;
  maxGuesses: number;
  done: boolean;
}

export const createRetroGame: RetroFactory = ({ stage, manifest }) => {
  const source = manifest.sources.find(item => item.id === 'starship-bbc-game')
    ?? manifest.sources.find(item => item.role === 'game')
    ?? manifest.sources.find(item => item.role === 'transcription');
  const sourceLabel = source
    ? `Source: ${source.label}${source.dfsName ? ` ${source.dfsName}` : ''}`
    : `Source: ${manifest.basicSource}`;
  const terminal = new RetroTerminal({
    stage,
    title: `${manifest.title} (Retro)`,
    sourceLabel,
  });
  const state: RetroState = {
    gravity: 0,
    wind: 0,
    target: 0,
    guesses: 0,
    maxGuesses: 10,
    done: false,
  };

  const keyHandler = (event: KeyboardEvent) => {
    terminal.handleKey(event, {
      onSubmit: submitGuess,
      inputEnabled: !state.done,
      replayEnabled: state.done,
      onReplay: startRound,
    });
  };

  function startRound() {
    state.gravity = randInt(1, 20);
    state.wind = randInt(1, 40);
    state.target = state.gravity * state.wind;
    state.guesses = 0;
    state.done = false;
    terminal.clear();
    terminal.pushLine('STARSHIP TAKE-OFF');
    terminal.pushLine('CRASHED CAPTAIN: CAPTURED ALIEN SHIP');
    terminal.pushLine('');
    terminal.pushLine(`GRAVITY=${state.gravity}`);
    terminal.pushLine('TYPE IN FORCE (10 TRIES)');
  }

  function submitGuess() {
    if (state.done) return;
    const trimmed = terminal.input.trim();
    if (!trimmed) {
      terminal.pushLine('ENTER A NUMBER.');
      return;
    }
    const guess = Number.parseInt(trimmed, 10);
    if (Number.isNaN(guess)) {
      terminal.pushLine('ONLY NUMBERS PLEASE.');
      terminal.input = '';
      return;
    }
    terminal.input = '';
    state.guesses += 1;
    terminal.pushLine(`> ${guess}`);
    if (guess > state.target) terminal.pushLine('TOO HIGH - FAIL-SAFE CUT IN');
    if (guess < state.target) terminal.pushLine('TOO LOW');
    if (guess === state.target) {
      terminal.pushLine('GOOD TAKE OFF');
      endRound();
      return;
    }
    if (state.guesses >= state.maxGuesses) {
      terminal.pushLine('YOU FAILED --');
      terminal.pushLine('THE ALIENS GOT YOU');
      endRound();
      return;
    }
    terminal.pushLine('TRY AGAIN');
  }

  function endRound() {
    state.done = true;
    terminal.pushLine('---');
    terminal.pushLine('PRESS R TO REPLAY OR ESC TO MENU');
  }

  return {
    enter() {
      startRound();
      window.addEventListener('keydown', keyHandler);
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
        source: source?.id ?? null,
        gravity: state.gravity,
        guesses: state.guesses,
        done: state.done,
        lines: [...terminal.lines],
        input: terminal.input,
      };
    },
  };
};

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default { createRetroGame };
