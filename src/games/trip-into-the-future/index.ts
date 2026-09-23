import type { GameFactory } from '../types';
import { audioCues, type AudioCueId } from '../../assets/audio';
import {
  VOYAGE,
  adjustDistance,
  adjustSpeed,
  createTripState,
  currentMission,
  endVoyage,
  lastResult,
  launch,
  lorentz,
  nextMission,
  resetRun,
  survivalFraction,
} from './state';
import { renderTrip } from './render';
import type { TripPhase } from './types';

const SPEED_RATE = 0.15;
const DISTANCE_RATE = 30;
const FINE = 0.1;

export const createGame: GameFactory = ({ stage, input, audio, manifest }) => {
  const state = createTripState();
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

  return {
    enter() {
      active = true;
      for (const id of ['trip/launch', 'trip/home', 'trip/lost'] as AudioCueId[]) void loadCue(id);
    },
    update(dt: number) {
      state.elapsed += dt;
      state.phaseElapsed += dt;
      const phase: TripPhase = state.phase;

      if (phase === 'plan') {
        const fine = input.isDown('Shift') ? FINE : 1;
        if (input.isDown('ArrowUp')) adjustSpeed(state, SPEED_RATE * fine * dt);
        if (input.isDown('ArrowDown')) adjustSpeed(state, -SPEED_RATE * fine * dt);
        if (input.isDown('ArrowRight')) adjustDistance(state, DISTANCE_RATE * fine * dt);
        if (input.isDown('ArrowLeft')) adjustDistance(state, -DISTANCE_RATE * fine * dt);
        if (input.consumePress('Enter') || input.consumePress(' ')) {
          launch(state);
          play('trip/launch', 0.45);
        }
        return;
      }

      if (phase === 'voyage') {
        const result = lastResult(state);
        const cutoff = result ? survivalFraction(result) * VOYAGE.voyageSeconds : VOYAGE.voyageSeconds;
        if (state.phaseElapsed >= cutoff) {
          endVoyage(state);
          play(result?.verdict === 'died' ? 'trip/lost' : 'trip/home', 0.55);
        }
        return;
      }

      if (phase === 'arrival') {
        if (state.phaseElapsed >= VOYAGE.arrivalHold && (input.consumePress('Enter') || input.consumePress(' '))) {
          nextMission(state);
        }
        return;
      }

      if (state.phaseElapsed >= 0.5 && (input.consumePress('Enter') || input.consumePress(' '))) resetRun(state);
    },
    render() {
      renderTrip(stage, manifest.title, state);
    },
    exit() {
      active = false;
      buffers.clear();
    },
    debugSnapshot() {
      const mission = currentMission(state);
      return {
        gameId: manifest.id,
        phase: state.phase,
        status: state.statusMessage,
        index: state.index,
        target: mission.target,
        engineCap: mission.engineCap,
        speed: state.speed,
        distance: state.distance,
        gamma: lorentz(state.speed),
        results: state.results,
        debrief: state.debrief,
      };
    },
    debugAction(action: string, payload?: unknown) {
      if (action === 'setMissions' && Array.isArray(payload)) {
        state.missions = payload as typeof state.missions;
        state.index = 0;
        return state.missions.length;
      }
      if (action === 'setPlan' && payload && typeof payload === 'object') {
        const plan = payload as { speed?: number; distance?: number };
        if (typeof plan.speed === 'number') state.speed = Math.min(currentMission(state).engineCap, Math.max(0.01, plan.speed));
        if (typeof plan.distance === 'number') state.distance = Math.max(0, plan.distance);
        return { speed: state.speed, distance: state.distance };
      }
      return null;
    },
  };
};
