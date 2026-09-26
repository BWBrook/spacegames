import type { GameFactory } from '../types';
import { audioCues, type AudioCueId } from '../../assets/audio';
import {
  CAMPAIGN,
  commitLanding,
  continueFromReport,
  createRescueState,
  currentMission,
  finishDescent,
  landingFailure,
  launch,
  reserve,
  resetRun,
  stepEngines,
  stepVoyage,
  voyageOdds,
} from './state';
import { renderRescue } from './render';
import type { RescuePhase } from './types';

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const ALLOC_FIELDS = ['engines', 'life', 'shields'] as const;
const LANDING_FIELDS = ['boosters', 'heat'] as const;

export const createGame: GameFactory = ({ stage, input, audio, manifest }) => {
  const state = createRescueState();
  let active = false;
  let lastChecked = 0;
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

  /** Typing, Backspace and Left/Right on whichever field is active. */
  function editField(set: (value: number) => void, step: (direction: 1 | -1, big: boolean) => void) {
    const big = input.isDown('Shift');
    if (input.consumePress('ArrowRight')) { state.typing = null; step(1, big); }
    if (input.consumePress('ArrowLeft')) { state.typing = null; step(-1, big); }
    for (const digit of DIGITS) {
      if (!input.consumePress(digit)) continue;
      state.typing = `${state.typing ?? ''}${digit}`.replace(/^0+(?=\d)/, '').slice(0, 4);
      set(Number(state.typing));
    }
    if (input.consumePress('Backspace') && state.typing !== null) {
      state.typing = state.typing.slice(0, -1);
      set(Number(state.typing || '0'));
    }
  }

  function moveField(count: number) {
    if (input.consumePress('ArrowUp')) { state.field = (state.field + count - 1) % count; state.typing = null; }
    if (input.consumePress('ArrowDown')) { state.field = (state.field + 1) % count; state.typing = null; }
  }

  function allocate() {
    moveField(ALLOC_FIELDS.length);
    const id = ALLOC_FIELDS[state.field] ?? 'engines';
    editField(
      value => { state.alloc[id] = Math.max(0, Math.min(currentMission(state).energy, value)); },
      (direction, big) => {
        if (id === 'engines') stepEngines(state, direction);
        else state.alloc[id] = Math.max(0, state.alloc[id] + direction * (big ? 50 : 5));
      },
    );
    if (input.consumePress('Enter')) {
      state.typing = null;
      launch(state);
      const settled: RescuePhase = state.phase;
      play(settled === 'voyage' ? 'rescue/launch' : 'rescue/refused', 0.4);
      lastChecked = 0;
    }
  }

  function land() {
    moveField(LANDING_FIELDS.length);
    const id = LANDING_FIELDS[state.field] ?? 'boosters';
    editField(
      value => { state.landing[id] = Math.max(0, value); },
      (direction, big) => { state.landing[id] = Math.max(0, state.landing[id] + direction * (big ? 50 : 10)); },
    );
    if (input.consumePress('Enter')) {
      state.typing = null;
      commitLanding(state);
      const settled: RescuePhase = state.phase;
      if (settled !== 'descent') play('rescue/refused', 0.3);
    }
  }

  return {
    enter() {
      active = true;
      for (const id of ['rescue/launch', 'rescue/hazard', 'rescue/refused', 'rescue/landed', 'rescue/lost'] as AudioCueId[]) void loadCue(id);
    },
    update(dt: number) {
      state.elapsed += dt;
      state.phaseElapsed += dt;
      const phase: RescuePhase = state.phase;
      if (phase === 'allocate') return allocate();
      if (phase === 'voyage') {
        stepVoyage(state, dt);
        const v = state.voyage;
        if (v && v.checked !== lastChecked) {
          lastChecked = v.checked;
          if (v.log.at(-1)?.hazard) play('rescue/hazard', 0.35);
        }
        const settled: RescuePhase = state.phase;
        if (settled === 'report') play('rescue/lost', 0.55);
        return;
      }
      if (phase === 'landing') return land();
      if (phase === 'descent') {
        if (state.phaseElapsed >= CAMPAIGN.descentSeconds) {
          const failure = landingFailure(state);
          finishDescent(state);
          play(failure ? 'rescue/lost' : 'rescue/landed', 0.6);
        }
        return;
      }
      if (phase === 'report') {
        if (state.phaseElapsed >= 0.4 && input.consumePress('Enter')) continueFromReport(state);
        return;
      }
      if (state.phaseElapsed >= 0.5 && input.consumePress('Enter')) resetRun(state);
    },
    render() {
      renderRescue(stage, manifest.title, state);
    },
    exit() {
      active = false;
      buffers.clear();
    },
    debugSnapshot() {
      const m = currentMission(state);
      return {
        gameId: manifest.id,
        phase: state.phase,
        status: state.statusMessage,
        index: state.index,
        mission: m,
        alloc: state.alloc,
        reserve: reserve(state),
        odds: state.phase === 'allocate' ? voyageOdds(m, state.alloc, state.seeds[state.index] ?? 1) : null,
        voyage: state.voyage && { ...state.voyage, rng: undefined },
        orbit: state.orbit,
        landing: state.landing,
        results: state.results,
        debrief: state.debrief,
      };
    },
    debugAction(action: string, payload?: unknown) {
      if (action === 'setAllocation' && payload && typeof payload === 'object') {
        Object.assign(state.alloc, payload);
        return state.alloc;
      }
      if (action === 'setLanding' && payload && typeof payload === 'object') {
        Object.assign(state.landing, payload);
        return state.landing;
      }
      if (action === 'setMissions' && Array.isArray(payload)) {
        state.missions = payload as typeof state.missions;
        state.index = 0;
        return state.missions.length;
      }
      return null;
    },
  };
};
