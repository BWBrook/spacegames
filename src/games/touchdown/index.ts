import type { GameFactory } from '../types';
import { audioCues, type AudioCueId } from '../../assets/audio';
import { TEST, beginFlight, createTestState, nextLanding, resetTest, stepTest } from './state';
import { renderTest } from './render';
import type { TestPhase } from './types';

export const createGame: GameFactory = ({ stage, input, audio, manifest }) => {
  const state = createTestState();
  let active = false;
  let engine: AudioBufferSourceNode | null = null;
  let engineGain: GainNode | null = null;
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
    await loadCue('touchdown/engine');
    const buffer = buffers.get('touchdown/engine');
    if (!active || request !== engineRequest || !buffer || !audio.ctx) return;
    const source = audio.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const gain = audio.ctx.createGain();
    gain.gain.value = 0;
    source.connect(gain).connect(audio.ctx.destination);
    source.start();
    engine = source;
    engineGain = gain;
  }

  function stopEngine() {
    engineRequest += 1;
    try {
      engine?.stop();
    } catch {
      // already stopped
    }
    engine = null;
    engineGain = null;
  }

  return {
    enter() {
      active = true;
      for (const id of ['touchdown/landed', 'touchdown/crash'] as AudioCueId[]) void loadCue(id);
    },
    update(dt: number) {
      state.elapsed += dt;
      state.phaseElapsed += dt;
      const phase: TestPhase = state.phase;

      if (phase === 'briefing') {
        if (state.phaseElapsed >= 0.3 && (input.consumePress('Enter') || input.consumePress(' '))) {
          beginFlight(state);
          void startEngine();
        }
        return;
      }

      if (phase === 'flight') {
        // The intro's intended keys, A for more thrust, alongside the arrows.
        const up = input.isDown('ArrowUp') || input.isDown('w') || input.isDown('W') || input.isDown('a') || input.isDown('A');
        const down = input.isDown('ArrowDown') || input.isDown('s') || input.isDown('S') || input.isDown('d') || input.isDown('D');
        stepTest(state, dt, up, down);
        if (engineGain && audio.ctx) engineGain.gain.setTargetAtTime((state.craft.thrust / 100) * 0.35, audio.ctx.currentTime, 0.05);
        const settled: TestPhase = state.phase;
        if (settled === 'landed') {
          stopEngine();
          const grade = state.landings.at(-1)?.grade;
          play(grade === 'Crashed' || grade === 'Lost in space' ? 'touchdown/crash' : 'touchdown/landed', 0.6);
        }
        return;
      }

      if (phase === 'landed') {
        if (state.phaseElapsed >= TEST.landedHold && (input.consumePress('Enter') || input.consumePress(' '))) nextLanding(state);
        return;
      }

      if (state.phaseElapsed >= 0.5 && (input.consumePress('Enter') || input.consumePress(' '))) resetTest(state);
    },
    render() {
      renderTest(stage, manifest.title, state);
    },
    exit() {
      active = false;
      stopEngine();
      buffers.clear();
    },
    debugSnapshot() {
      return {
        gameId: manifest.id,
        phase: state.phase,
        remark: state.remark,
        attempt: state.attempt,
        ticks: state.ticks,
        craft: { ...state.craft },
        landings: state.landings,
        debrief: state.debrief,
      };
    },
    debugAction(action: string, payload?: unknown) {
      if (action === 'setCraft' && payload && typeof payload === 'object') {
        Object.assign(state.craft, payload);
        state.entry = state.craft.velocity;
        state.previousHeight = state.craft.height;
        return state.craft;
      }
      return null;
    },
  };
};
