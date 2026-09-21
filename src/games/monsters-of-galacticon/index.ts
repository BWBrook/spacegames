import type { GameFactory } from '../types';
import { audioCues, type AudioCueId } from '../../assets/audio';
import {
  ENCOUNTER_TIMING,
  WEAPONS,
  advanceEncounter,
  beginChoice,
  chooseWeapon,
  createGalacticonState,
  currentName,
  resetRun,
} from './state';
import { renderGalacticon } from './render';
import type { GalacticonPhase } from './types';

export const createGame: GameFactory = ({ stage, input, audio, manifest }) => {
  const state = createGalacticonState();
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

  function readWeapon() {
    for (const weapon of WEAPONS) {
      if (input.consumePress(weapon) || input.consumePress(weapon.toLowerCase())) return weapon;
    }
    return null;
  }

  return {
    enter() {
      active = true;
      for (const id of ['galacticon/approach', 'galacticon/kill', 'galacticon/nothing', 'galacticon/loss'] as AudioCueId[]) {
        void loadCue(id);
      }
    },
    update(dt: number) {
      state.elapsed += dt;
      state.phaseElapsed += dt;
      const phase: GalacticonPhase = state.phase;

      if (phase === 'approach') {
        if (state.phaseElapsed >= ENCOUNTER_TIMING.approach) {
          beginChoice(state);
          play('galacticon/approach', 0.3);
        }
        return;
      }

      if (phase === 'choose') {
        const weapon = readWeapon();
        if (!weapon) return;
        chooseWeapon(state, weapon);
        if (state.lastOutcome === 'kill') play('galacticon/kill', 0.5);
        else if (state.lastOutcome === 'noeffect' && !state.lastAngered) play('galacticon/nothing', 0.4);
        else play('galacticon/loss', 0.55);
        return;
      }

      if (phase === 'resolve') {
        if (state.phaseElapsed >= ENCOUNTER_TIMING.resolve) advanceEncounter(state);
        return;
      }

      if (state.phaseElapsed >= 0.5 && (input.consumePress('Enter') || input.consumePress(' '))) {
        resetRun(state);
      }
    },
    render() {
      renderGalacticon(stage, manifest.title, state);
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
        encounter: state.encounter,
        slot: state.slot,
        monster: currentName(state),
        crewAlive: state.crew.filter(member => member.alive).length,
        kills: state.kills,
        journal: state.journal,
        lastWeapon: state.lastWeapon,
        lastOutcome: state.lastOutcome,
        lastAngered: state.lastAngered,
        debrief: state.debrief,
      };
    },
    debugAction(action: string, payload?: unknown) {
      if (action === 'choose' && typeof payload === 'string') {
        const weapon = WEAPONS.find(w => w === payload.toUpperCase());
        if (weapon) chooseWeapon(state, weapon);
        return state.lastOutcome;
      }
      return null;
    },
  };
};
