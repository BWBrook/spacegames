import type { GameFactory } from '../types';
import { audioCues, type AudioCueId } from '../../assets/audio';
import {
  BUG_EYES_RULES,
  HUNT_CONSTANTS,
  continueAfterResolve,
  createBugEyesState,
  exposeBug,
  pressKey,
  resetHunt,
  timeOut,
} from './state';
import { renderBugEyes } from './render';
import type { BugEyesPhase } from './types';

const KEYS = ['1', '2', '3', '4'];

export const createGame: GameFactory = ({ stage, input, audio, manifest }) => {
  const state = createBugEyesState();
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

  function readKey() {
    for (let i = 0; i < KEYS.length; i += 1) {
      const key = KEYS[i];
      if (key && input.consumePress(key)) return i + 1;
    }
    return null;
  }

  function announceShot() {
    if (state.lastResult === 'hit') play('bug-eyes/blast', 0.45);
    else play('bug-eyes/miss', 0.4);
  }

  function announceOutcome() {
    play(state.debrief?.outcome === 'escaped' ? 'bug-eyes/debrief' : 'bug-eyes/caught', 0.6);
  }

  return {
    enter() {
      active = true;
      for (const id of ['bug-eyes/blast', 'bug-eyes/miss', 'bug-eyes/caught', 'bug-eyes/debrief'] as AudioCueId[]) {
        void loadCue(id);
      }
    },
    update(dt: number) {
      state.elapsed += dt;
      state.phaseElapsed += dt;
      const key = readKey();

      const phase: BugEyesPhase = state.phase;
      if (phase === 'lurk') {
        if (key !== null) pressKey(state, key);
        if (state.phase === 'lurk' && state.phaseElapsed >= state.lurkDuration) exposeBug(state);
      } else if (phase === 'exposed') {
        if (key !== null) pressKey(state, key);
        else if (state.phaseElapsed >= state.windowDuration) timeOut(state);
      } else if (phase === 'resolve') {
        if (state.phaseElapsed >= HUNT_CONSTANTS.resolveSeconds) continueAfterResolve(state);
      } else if (state.phaseElapsed >= 0.5 && (input.consumePress('Enter') || input.consumePress(' '))) {
        resetHunt(state);
      }

      const settled: BugEyesPhase = state.phase;
      if (settled === phase) return;
      // A bug that reaches you ends the run mid-shot, so both cues fire.
      if (settled === 'resolve') announceShot();
      if (settled === 'debrief') {
        if (phase === 'lurk' || phase === 'exposed') announceShot();
        announceOutcome();
      }
    },
    render() {
      renderBugEyes(stage, manifest.title, state);
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
        bugIndex: state.bugIndex,
        bugs: BUG_EYES_RULES.bugs,
        blasted: state.blasted,
        activeStation: state.activeStation,
        activeKey: state.activeStation === null ? null : state.stations[state.activeStation]?.key ?? null,
        windowDuration: Number(state.windowDuration.toFixed(3)),
        stations: state.stations,
        lastResult: state.lastResult,
        history: state.history,
        debrief: state.debrief,
      };
    },
    debugAction(action: string) {
      if (action === 'expose') {
        if (state.phase === 'lurk') exposeBug(state);
        return state.phase;
      }
      return null;
    },
  };
};
