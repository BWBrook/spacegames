import type { GameFactory } from '../types';
import { audioCues, type AudioCueId } from '../../assets/audio';
import { BELT_TIMING, createBeltState, fire, nextAsteroid, resetRun } from './state';
import { renderBelt } from './render';
import type { BeltPhase } from './types';

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

export const createGame: GameFactory = ({ stage, input, audio, manifest }) => {
  const state = createBeltState();
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

  function readStrength() {
    for (const digit of DIGITS) if (input.consumePress(digit)) return Number(digit);
    return null;
  }

  return {
    enter() {
      active = true;
      for (const id of ['belt/destroy', 'belt/hit', 'belt/report'] as AudioCueId[]) void loadCue(id);
    },
    update(dt: number) {
      state.elapsed += dt;
      state.phaseElapsed += dt;
      const phase: BeltPhase = state.phase;

      if (phase === 'approach') {
        const strength = readStrength();
        if (strength !== null) fire(state, strength);
        else if (state.phaseElapsed >= BELT_TIMING.window) fire(state, null);
        const settled: BeltPhase = state.phase;
        if (settled === 'impact') play(state.verdict === 'destroyed' ? 'belt/destroy' : 'belt/hit', 0.5);
        return;
      }

      if (phase === 'impact') {
        if (state.phaseElapsed >= BELT_TIMING.impact) {
          nextAsteroid(state);
          const settled: BeltPhase = state.phase;
          if (settled === 'debrief') play('belt/report', 0.55);
        }
        return;
      }

      if (state.phaseElapsed >= 0.5 && (input.consumePress('Enter') || input.consumePress(' '))) resetRun(state);
    },
    render() {
      renderBelt(stage, manifest.title, state);
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
        round: state.round,
        hits: state.hits,
        streak: state.streak,
        hullHits: state.hullHits,
        stars: state.asteroid.stars,
        verdict: state.verdict,
        debrief: state.debrief,
      };
    },
  };
};
