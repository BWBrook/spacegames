import type { GameFactory } from '../types';
import { audioCues, type AudioCueId } from '../../assets/audio';
import {
  FLIGHT,
  adjustWidth,
  beginFlight,
  createValleyState,
  resetRun,
  safeBounds,
  settle,
  stepFlight,
} from './state';
import { renderValley } from './render';
import type { ValleyPhase } from './types';

export const createGame: GameFactory = ({ stage, input, audio, manifest }) => {
  const state = createValleyState();
  let active = false;
  let engine: AudioBufferSourceNode | null = null;
  let engineRequest = 0;
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

  async function startEngine() {
    const request = ++engineRequest;
    await loadCue('valley/engine');
    const buffer = buffers.get('valley/engine');
    if (!active || request !== engineRequest || !buffer || !audio.ctx) return;
    const source = audio.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const gain = audio.ctx.createGain();
    gain.gain.value = 0.18;
    source.connect(gain).connect(audio.ctx.destination);
    source.start();
    engine = source;
  }

  function stopEngine() {
    engineRequest += 1;
    try {
      engine?.stop();
    } catch {
      // already stopped
    }
    engine = null;
  }

  function steer(): -1 | 0 | 1 {
    const left = input.isDown('ArrowLeft') || input.isDown('q') || input.isDown('Q');
    const right = input.isDown('ArrowRight') || input.isDown('p') || input.isDown('P');
    return left === right ? 0 : left ? -1 : 1;
  }

  return {
    enter() {
      active = true;
      for (const id of ['valley/crash', 'valley/through'] as AudioCueId[]) void loadCue(id);
    },
    update(dt: number) {
      state.elapsed += dt;
      state.phaseElapsed += dt;
      const phase: ValleyPhase = state.phase;

      if (phase === 'briefing') {
        if (input.consumePress('ArrowLeft') || input.consumePress('ArrowDown')) adjustWidth(state, -1);
        if (input.consumePress('ArrowRight') || input.consumePress('ArrowUp')) adjustWidth(state, 1);
        if (input.consumePress('Enter') || input.consumePress(' ')) {
          beginFlight(state);
          void startEngine();
        }
        return;
      }

      if (phase === 'flight') {
        stepFlight(state, dt, steer());
        const settled: ValleyPhase = state.phase;
        if (settled === 'ended') {
          stopEngine();
          play(state.debrief?.escaped ? 'valley/through' : 'valley/crash', 0.6);
        }
        return;
      }

      if (phase === 'ended') {
        if (state.phaseElapsed >= FLIGHT.endedHold) settle(state);
        return;
      }

      if (state.phaseElapsed >= 0.5 && (input.consumePress('Enter') || input.consumePress(' '))) resetRun(state);
    },
    render() {
      renderValley(stage, manifest.title, state);
    },
    exit() {
      active = false;
      stopEngine();
      buffers.clear();
    },
    debugSnapshot() {
      const ahead = safeBounds(state, state.distance + 1.2);
      return {
        gameId: manifest.id,
        phase: state.phase,
        status: state.statusMessage,
        width: state.width,
        distance: Number(state.distance.toFixed(3)),
        shipX: Number(state.shipX.toFixed(3)),
        aheadCentre: Number(((ahead.min + ahead.max) / 2).toFixed(3)),
        closestShave: Number.isFinite(state.closestShave) ? Number(state.closestShave.toFixed(3)) : null,
        debrief: state.debrief,
      };
    },
    debugAction(action: string, payload?: unknown) {
      if (action === 'setWidth' && typeof payload === 'number') {
        state.width = Math.round(payload);
        return state.width;
      }
      return null;
    },
  };
};
