import { RetroTerminal } from '../../core/retroTerminal';
import type { RetroFactory } from '../types';
import {
  MOONLANDER_RULES,
  VERDICT_TEXT,
  applyTurn,
  formatNumber,
  startSnapshot,
} from './state';
import type { FlightSnapshot } from './state';

/** Two print zones, as the commas in lines 70 and 80 produce on a BBC. */
const ZONE = 14;

function zoned(left: string, right: string) {
  return `${left.padEnd(ZONE, ' ')}${right}`;
}

interface RetroState {
  flight: FlightSnapshot;
  awaitingInput: boolean;
  coastTimer: number;
  done: boolean;
}

export const createRetroGame: RetroFactory = ({ stage, manifest }) => {
  const source = manifest.sources.find(item => item.id === 'moonlander-bbc-game')
    ?? manifest.sources.find(item => item.role === 'game');
  const terminal = new RetroTerminal({
    stage,
    title: `${manifest.title} (Retro)`,
    sourceLabel: source
      ? `Source: ${source.label}${source.dfsName ? ` ${source.dfsName}` : ''}`
      : 'Source: unavailable',
    maxLines: 20,
  });
  const state: RetroState = {
    flight: startSnapshot(),
    awaitingInput: false,
    coastTimer: 0,
    done: false,
  };

  const keyHandler = (event: KeyboardEvent) => {
    terminal.handleKey(event, {
      onSubmit: submitInput,
      acceptedPattern: /^[0-9.-]$/,
      maxInputLength: 8,
      inputEnabled: state.awaitingInput,
      replayEnabled: state.done,
      onReplay: startRun,
    });
  };

  function startRun() {
    state.flight = startSnapshot();
    state.done = false;
    state.coastTimer = 0;
    terminal.clear();
    terminal.pushLine('MOONLANDER');
    showStatus();
  }

  function showStatus() {
    const { time, height, velocity, fuel } = state.flight;
    terminal.pushLine(zoned(`TIME ${formatNumber(time)}`, `HEIGHT ${formatNumber(height)}`));
    terminal.pushLine(zoned(`VEL. ${formatNumber(velocity)}`, `FUEL ${formatNumber(fuel)}`));
    // Line 90: with no fuel left the listing skips the prompt and keeps falling.
    if (fuel === 0) {
      state.awaitingInput = false;
      state.coastTimer = 0;
      return;
    }
    state.awaitingInput = true;
    terminal.pushLine(`BURN? (0-${MOONLANDER_RULES.maxBurn})`);
  }

  function submitInput() {
    if (state.done) {
      startRun();
      return;
    }
    if (!state.awaitingInput) return;
    const raw = terminal.input.trim();
    const value = Number.parseFloat(raw);
    if (Number.isNaN(value)) {
      terminal.pushLine('ENTER A NUMBER.');
      terminal.input = '';
      return;
    }
    terminal.pushLine(`> ${raw}`);
    terminal.input = '';
    state.awaitingInput = false;
    advance(value);
  }

  function advance(burnInput: number) {
    const result = applyTurn(state.flight, burnInput);
    if (result.landed) {
      terminal.pushLine('');
      terminal.pushLine(VERDICT_TEXT[result.verdict]);
      terminal.pushLine('');
      terminal.pushLine('R OR ENTER TO FLY AGAIN');
      state.done = true;
      return;
    }
    state.flight = result.next;
    showStatus();
  }

  return {
    enter() {
      window.addEventListener('keydown', keyHandler);
      startRun();
    },
    update(dt: number) {
      terminal.update(dt);
      if (state.done || state.awaitingInput) return;
      // Out of fuel: the listing loops straight back with no input. We pace the
      // free fall so it can be read rather than printing it all at once.
      state.coastTimer += dt;
      if (state.coastTimer < 0.6) return;
      state.coastTimer = 0;
      advance(0);
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
        ...state.flight,
        awaitingInput: state.awaitingInput,
        done: state.done,
        lines: [...terminal.lines],
        input: terminal.input,
      };
    },
  };
};
