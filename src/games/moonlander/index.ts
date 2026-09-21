import type { GameFactory } from '../types';
import { audioCues, type AudioCueId } from '../../assets/audio';
import {
  FLIGHT_CONSTANTS,
  MOONLANDER_RULES,
  adjustThrottle,
  createMoonlanderState,
  projectTouchdown,
  resetFlight,
  settleTouchdown,
  stepFlight,
} from './state';
import { renderMoonlander } from './render';
import type { MoonlanderPhase } from './types';

export const createGame: GameFactory = ({ stage, input, audio, manifest }) => {
  const state = createMoonlanderState();
  let active = false;
  let thrustSource: AudioBufferSourceNode | null = null;
  let thrustGain: GainNode | null = null;
  let thrustRequest = 0;
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

  /** A looped bed whose gain tracks the throttle, so the burn is audible as well as visible. */
  async function startThrust() {
    const request = ++thrustRequest;
    await loadCue('moonlander/thrust');
    const buffer = buffers.get('moonlander/thrust');
    if (!active || request !== thrustRequest || !buffer || !audio.ctx) return;
    const source = audio.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const gain = audio.ctx.createGain();
    gain.gain.value = 0;
    source.connect(gain).connect(audio.ctx.destination);
    source.start();
    thrustSource = source;
    thrustGain = gain;
  }

  function stopThrust() {
    thrustRequest += 1;
    try {
      thrustSource?.stop();
    } catch {
      // already stopped
    }
    thrustSource = null;
    thrustGain = null;
  }

  return {
    enter() {
      active = true;
      for (const id of ['moonlander/touchdown', 'moonlander/crash'] as AudioCueId[]) void loadCue(id);
      void startThrust();
    },
    update(dt: number) {
      state.elapsed += dt;
      state.phaseElapsed += dt;

      const phase: MoonlanderPhase = state.phase;
      if (phase === 'descent') {
        const step = FLIGHT_CONSTANTS.throttleRate * dt;
        if (input.isDown('ArrowUp') || input.isDown('w')) adjustThrottle(state, step);
        if (input.isDown('ArrowDown') || input.isDown('s')) adjustThrottle(state, -step);
        stepFlight(state, dt);
        if (thrustGain && audio.ctx) {
          const level = state.burn / MOONLANDER_RULES.maxBurn;
          thrustGain.gain.setTargetAtTime(level * 0.35, audio.ctx.currentTime, 0.05);
        }
        const settled: MoonlanderPhase = state.phase;
        if (settled === 'touchdown') {
          stopThrust();
          play(state.debrief?.verdict === 'crashed' ? 'moonlander/crash' : 'moonlander/touchdown', 0.6);
        }
        return;
      }

      if (phase === 'touchdown') {
        if (state.phaseElapsed >= FLIGHT_CONSTANTS.touchdownHold) settleTouchdown(state);
        return;
      }

      if (state.phaseElapsed >= 0.4 && (input.consumePress('Enter') || input.consumePress(' '))) {
        resetFlight(state);
        void startThrust();
      }
    },
    render() {
      renderMoonlander(stage, manifest.title, state);
    },
    exit() {
      active = false;
      stopThrust();
      buffers.clear();
    },
    debugSnapshot() {
      return {
        gameId: manifest.id,
        phase: state.phase,
        status: state.statusMessage,
        height: Number(state.height.toFixed(3)),
        velocity: Number(state.velocity.toFixed(3)),
        fuel: Number(state.fuel.toFixed(3)),
        throttle: Number(state.throttle.toFixed(2)),
        projected: state.phase === 'descent' ? projectTouchdown(state) : null,
        debrief: state.debrief,
      };
    },
    debugAction(action: string, payload?: unknown) {
      if (action !== 'setThrottle' || typeof payload !== 'number') return null;
      state.throttle = Math.min(MOONLANDER_RULES.maxBurn, Math.max(0, payload));
      return state.throttle;
    },
  };
};
