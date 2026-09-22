import type { GameFactory } from '../types';
import { audioCues, type AudioCueId } from '../../assets/audio';
import {
  SNIPER_TIMING,
  adjustDifficulty,
  beginRun,
  continueAfterReport,
  createSniperState,
  fire,
  resetRun,
  timeOut,
  windowSeconds,
} from './state';
import { renderSnipers } from './render';
import type { SniperPhase } from './types';

const LETTERS = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

export const createGame: GameFactory = ({ stage, input, audio, manifest }) => {
  const state = createSniperState();
  let active = false;
  const buffers = new Map<AudioCueId, AudioBuffer>();

  async function loadCue(id: AudioCueId) {
    try {
      await audio.unlock();
      const loaded = await audio.load(audioCues[id]);
      if (active) buffers.set(id, loaded);
    } catch {
      // cues are optional
    }
  }

  function play(id: AudioCueId, gain = 0.5) {
    const buffer = buffers.get(id);
    if (buffer && audio.ctx) audio.play(buffer, 0, gain);
  }

  function readLetter() {
    for (const letter of LETTERS) {
      if (input.consumePress(letter) || input.consumePress(letter.toLowerCase())) return letter;
    }
    return null;
  }

  return {
    enter() {
      active = true;
      for (const id of ['snipers/fire', 'snipers/miss', 'snipers/report'] as AudioCueId[]) void loadCue(id);
    },
    update(dt: number) {
      state.elapsed += dt;
      state.phaseElapsed += dt;
      const phase: SniperPhase = state.phase;

      if (phase === 'briefing') {
        if (input.consumePress('ArrowLeft')) adjustDifficulty(state, -1);
        if (input.consumePress('ArrowRight')) adjustDifficulty(state, 1);
        if (input.consumePress('ArrowDown')) adjustDifficulty(state, -1);
        if (input.consumePress('ArrowUp')) adjustDifficulty(state, 1);
        if (input.consumePress('Enter') || input.consumePress(' ')) beginRun(state);
        return;
      }

      if (phase === 'target') {
        const letter = readLetter();
        if (letter) fire(state, letter);
        else if (state.phaseElapsed >= windowSeconds(state.difficulty)) timeOut(state);
        const settled: SniperPhase = state.phase;
        if (settled === 'report') {
          play(state.lastResult === 'hit' ? 'snipers/fire' : 'snipers/miss', 0.45);
        }
        return;
      }

      if (phase === 'report') {
        if (state.phaseElapsed >= SNIPER_TIMING.report) {
          continueAfterReport(state);
          const settled: SniperPhase = state.phase;
          if (settled === 'debrief') play('snipers/report', 0.55);
        }
        return;
      }

      if (state.phaseElapsed >= 0.5 && (input.consumePress('Enter') || input.consumePress(' '))) {
        resetRun(state);
      }
    },
    render() {
      renderSnipers(stage, manifest.title, state);
    },
    exit() {
      active = false;
      buffers.clear();
    },
    debugSnapshot() {
      return {
        gameId: manifest.id,
        phase: state.phase,
        status: state.statusMessage,
        difficulty: state.difficulty,
        round: state.round,
        hits: state.hits,
        streak: state.streak,
        target: state.target,
        typed: state.typed,
        lastResult: state.lastResult,
        windowSeconds: windowSeconds(state.difficulty),
        debrief: state.debrief,
      };
    },
    debugAction(action: string, payload?: unknown) {
      if (action === 'setDifficulty' && typeof payload === 'number') {
        state.difficulty = Math.min(10, Math.max(1, Math.round(payload)));
        return state.difficulty;
      }
      return null;
    },
  };
};
