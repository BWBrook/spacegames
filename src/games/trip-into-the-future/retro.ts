import { formatBbcNumber, readBbcNumber } from '../../core/bbcNumber';
import { RetroTerminal } from '../../core/retroTerminal';
import type { RetroFactory } from '../types';
import { LISTING_TEXT, listingTrip, rollTarget } from './state';

type Stage = 'speed' | 'distance' | 'done';

interface RetroState {
  target: number;
  speed: number;
  stage: Stage;
}

export const createRetroGame: RetroFactory = ({ stage, manifest }) => {
  const source = manifest.sources.find(item => item.id === 'trip-bbc-game')
    ?? manifest.sources.find(item => item.role === 'game');
  const terminal = new RetroTerminal({
    stage,
    title: `${manifest.title} (Retro)`,
    sourceLabel: source
      ? `Source: ${source.label}${source.dfsName ? ` ${source.dfsName}` : ''}`
      : 'Source: unavailable',
    maxLines: 18,
  });
  const state: RetroState = { target: 25, speed: 0, stage: 'speed' };

  const keyHandler = (event: KeyboardEvent) => {
    terminal.handleKey(event, {
      onSubmit: submitInput,
      acceptedPattern: /^[0-9.-]$/,
      maxInputLength: 10,
      inputEnabled: state.stage !== 'done',
      replayEnabled: state.stage === 'done',
      onReplay: startRun,
    });
  };

  function startRun() {
    state.target = rollTarget();
    terminal.clear();
    terminal.pushLine('TRIP INTO THE FUTURE');
    terminal.pushLine(`YOU WISH TO RETURN ${state.target}`);
    terminal.pushLine('YEARS IN THE FUTURE.');
    terminal.pushLine('');
    askSpeed();
  }

  function askSpeed() {
    state.stage = 'speed';
    terminal.pushLine('SPEED OF SHIP (0-1)');
  }

  function submitInput() {
    if (state.stage === 'done') {
      startRun();
      return;
    }
    const raw = terminal.input.trim();
    terminal.pushLine(`> ${raw}`);
    terminal.input = '';
    // BBC INPUT reads a blank line as 0, which is one road to line 120.
    const value = readBbcNumber(raw);

    if (state.stage === 'speed') {
      // Line 90 loops back to line 70, so the prompt is printed again.
      if (value > 1 || value < 0) return askSpeed();
      state.speed = value;
      state.stage = 'distance';
      terminal.pushLine('DISTANCE OF TRIP');
      return;
    }
    travel(value);
  }

  function travel(distance: number) {
    const outcome = listingTrip(state.target, state.speed, distance);
    if (outcome.kind === 'error') {
      terminal.pushLine('');
      terminal.pushLine(outcome.message);
    } else {
      terminal.pushLine(`YOU TOOK ${formatBbcNumber(outcome.took)} YEARS`);
      terminal.pushLine(`AND ARRIVED ${formatBbcNumber(outcome.arrived)} YEARS`);
      terminal.pushLine('IN THE FUTURE');
      if (outcome.verdict !== 'silent') terminal.pushLine(LISTING_TEXT[outcome.verdict]);
    }
    terminal.pushLine('');
    terminal.pushLine('R OR ENTER TO RUN AGAIN');
    state.stage = 'done';
  }

  return {
    enter() {
      window.addEventListener('keydown', keyHandler);
      startRun();
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
        speed: state.speed,
        stage: state.stage,
        done: state.stage === 'done',
        lines: [...terminal.lines],
      };
    },
  };
};
