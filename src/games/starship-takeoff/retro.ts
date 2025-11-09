import type { RetroFactory } from '../types';

interface RetroState {
  gravity: number;
  wind: number;
  target: number;
  guesses: number;
  maxGuesses: number;
  lines: string[];
  input: string;
  done: boolean;
  caretTimer: number;
}

const MAX_LINES = 18;

export const createRetroGame: RetroFactory = ({ stage, manifest }) => {
  const state: RetroState = {
    gravity: 0,
    wind: 0,
    target: 0,
    guesses: 0,
    maxGuesses: 10,
    lines: [],
    input: '',
    done: false,
    caretTimer: 0,
  };

  const keyHandler = (event: KeyboardEvent) => {
    if (event.metaKey || event.ctrlKey) return;
    const key = event.key;
    if (key === 'Enter') {
      event.preventDefault();
      submitGuess();
      return;
    }
    if (key === 'Backspace') {
      event.preventDefault();
      state.input = state.input.slice(0, -1);
      return;
    }
    if (state.done) {
      if (key.toLowerCase() === 'r') {
        event.preventDefault();
        startRound();
      }
      return;
    }
    if (/^[0-9-]$/.test(key)) {
      event.preventDefault();
      if (state.input.length < 6) state.input += key;
    }
  };

  function pushLine(text: string) {
    state.lines.push(text);
    if (state.lines.length > MAX_LINES) state.lines.splice(0, state.lines.length - MAX_LINES);
  }

  function startRound() {
    state.gravity = randInt(1, 20);
    state.wind = randInt(1, 40);
    state.target = state.gravity * state.wind;
    state.guesses = 0;
    state.done = false;
    state.input = '';
    state.lines = [];
    pushLine('STARSHIP TAKE-OFF');
    pushLine('');
    pushLine(`GRAVITY=${state.gravity}`);
    pushLine('TYPE IN FORCE (10 TRIES)');
  }

  function submitGuess() {
    if (state.done) return;
    const trimmed = state.input.trim();
    if (!trimmed) {
      pushLine('ENTER A NUMBER.');
      return;
    }
    const guess = Number.parseInt(trimmed, 10);
    if (Number.isNaN(guess)) {
      pushLine('ONLY NUMBERS PLEASE.');
      state.input = '';
      return;
    }
    state.input = '';
    state.guesses += 1;
    pushLine(`> ${guess}`);
    if (guess > state.target) pushLine('TOO HIGH');
    if (guess < state.target) pushLine('TOO LOW');
    if (guess === state.target) {
      pushLine('GOOD TAKE OFF');
      endRound(true);
      return;
    }
    if (state.guesses >= state.maxGuesses) {
      pushLine('YOU FAILED --');
      pushLine('THE ALIENS GOT YOU');
      endRound(false);
      return;
    }
    pushLine('TRY AGAIN');
  }

  function endRound(success: boolean) {
    state.done = true;
    pushLine('---');
    pushLine('PRESS R TO REPLAY OR ESC TO MENU');
  }

  return {
    enter() {
      startRound();
      window.addEventListener('keydown', keyHandler);
    },
    update(dt: number) {
      state.caretTimer = (state.caretTimer + dt) % 1.2;
    },
    render() {
      const g = stage.ctx;
      g.save();
      g.fillStyle = '#020512';
      g.fillRect(0, 0, stage.width, stage.height);
      g.translate(32, 64);
      g.fillStyle = '#5df7ff';
      g.font = '600 32px "Space Mono", monospace';
      g.fillText(`${manifest.title} (Retro)`, 0, -24);
      g.font = '16px "Space Mono", monospace';
      g.fillStyle = '#9be7ff';
      g.fillText(`Source: ${manifest.basicSource}`, 0, 0);
      g.translate(0, 24);
      g.fillStyle = '#dff9ff';
      g.font = '18px "Space Mono", monospace';
      state.lines.forEach((line, i) => {
        g.fillText(line, 0, i * 22);
      });
      const caretOn = state.caretTimer < 0.6;
      const promptY = state.lines.length * 22 + 8;
      const prompt = `> ${state.input}`;
      g.fillText(prompt, 0, promptY);
      if (caretOn) {
        const metrics = g.measureText(prompt);
        g.fillRect(metrics.width + 4, promptY - 16, 12, 2);
      }
      g.restore();
    },
    exit() {
      window.removeEventListener('keydown', keyHandler);
    },
  };
};

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default { createRetroGame };
