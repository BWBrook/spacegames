import { emptyLoopSeconds } from '../../core/bbcTiming';
import { RetroTerminal } from '../../core/retroTerminal';
import type { RetroFactory } from '../types';
import {
  GALACTICON_RULES,
  OUTCOME_TEXT,
  parseWeapon,
  randomSlot,
  resolveWeapon,
  shuffleNames,
} from './state';

/** Line 380: FOR I=1 TO 1200, the pause to read each outcome. */
const OUTCOME_PAUSE = emptyLoopSeconds(1200);

interface RetroState {
  names: string[];
  encounter: number;
  crew: number;
  slot: number;
  awaitingInput: boolean;
  pause: number;
  done: boolean;
}

export const createRetroGame: RetroFactory = ({ stage, manifest }) => {
  const source = manifest.sources.find(item => item.id === 'galacticon-bbc-game')
    ?? manifest.sources.find(item => item.role === 'game');
  const terminal = new RetroTerminal({
    stage,
    title: `${manifest.title} (Retro)`,
    sourceLabel: source
      ? `Source: ${source.label}${source.dfsName ? ` ${source.dfsName}` : ''}`
      : 'Source: unavailable',
    maxLines: 14,
  });
  const state: RetroState = {
    names: shuffleNames(),
    encounter: 0,
    crew: GALACTICON_RULES.crew,
    slot: 1,
    awaitingInput: false,
    pause: 0,
    done: false,
  };

  const keyHandler = (event: KeyboardEvent) => {
    terminal.handleKey(event, {
      onSubmit: submitInput,
      acceptedPattern: /^[A-Za-z]$/,
      maxInputLength: 8,
      inputEnabled: state.awaitingInput,
      replayEnabled: state.done,
      onReplay: startRun,
    });
  };

  function startRun() {
    state.names = shuffleNames();
    state.encounter = 0;
    state.crew = GALACTICON_RULES.crew;
    state.done = false;
    state.pause = 0;
    terminal.clear();
    terminal.pushLine('MONSTERS OF GALACTICON');
    nextEncounter();
  }

  function nextEncounter() {
    state.encounter += 1;
    if (state.encounter > GALACTICON_RULES.encounters) return survive();
    terminal.clear();
    state.slot = randomSlot();
    terminal.pushLine('MONSTER COMING...');
    terminal.pushLine(`IT'S A ${state.names[state.slot - 1]}`);
    terminal.pushLine('WHICH WEAPON ? (R,S OR T) ');
    state.awaitingInput = true;
  }

  function submitInput() {
    if (state.done) {
      startRun();
      return;
    }
    if (!state.awaitingInput) return;
    const raw = terminal.input.trim();
    terminal.pushLine(`> ${raw}`);
    terminal.input = '';
    state.awaitingInput = false;
    resolve(raw.charAt(0));
  }

  function resolve(raw: string) {
    const weapon = parseWeapon(raw);
    // Anything that is not R, S or T lands outside the rotation and eats someone,
    // exactly as ASC of a stray letter does in the listing.
    const outcome = weapon ? resolveWeapon(weapon, state.slot) : 'eaten';
    for (const line of OUTCOME_TEXT[outcome]) terminal.pushLine(line);

    let lost = outcome === 'eaten';
    if (outcome === 'noeffect' && Math.random() <= GALACTICON_RULES.angerChance) {
      terminal.pushLine(`YOU ANGERED THE ${state.names[state.slot - 1]} AND IT`);
      terminal.pushLine('KILLED ONE OF YOUR GROUP');
      lost = true;
    }
    if (lost) {
      state.crew -= 1;
      if (state.crew < 1) return allDead();
    }
    state.pause = 0;
  }

  function survive() {
    terminal.pushLine('YOU HAVE SURVIVED TO');
    terminal.pushLine('CONQUER GALACTICON');
    finish();
  }

  function allDead() {
    terminal.pushLine("YOU'RE ALL DEAD");
    finish();
  }

  function finish() {
    terminal.pushLine('');
    terminal.pushLine('R OR ENTER TO PLAY AGAIN');
    state.done = true;
  }

  return {
    enter() {
      window.addEventListener('keydown', keyHandler);
      startRun();
    },
    update(dt: number) {
      terminal.update(dt);
      if (state.done || state.awaitingInput) return;
      state.pause += dt;
      if (state.pause >= OUTCOME_PAUSE) nextEncounter();
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
        names: state.names,
        encounter: state.encounter,
        crew: state.crew,
        slot: state.slot,
        awaitingInput: state.awaitingInput,
        done: state.done,
        lines: [...terminal.lines],
      };
    },
  };
};
