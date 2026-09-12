import type { GameFactory } from '../types';
import { audioCues, type AudioCueId } from '../../assets/audio';
import {
  EVIL_ALIEN_RULES,
  HUNT_CONSTANTS,
  advanceCapture,
  beginDrop,
  createEvilAlienState,
  detonate,
  moveCursor,
  resetHunt,
} from './state';
import { renderEvilAlien } from './render';

const ALARM_STEPS = [0.5, 0.75, 0.9];

export const createGame: GameFactory = ({ stage, input, audio, manifest }) => {
  const state = createEvilAlienState();
  let active = false;
  let alarmStep = 0;
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

  function updateHunt(dt: number) {
    if (input.consumePress('ArrowLeft')) moveCursor(state, -1, 0, 0);
    if (input.consumePress('ArrowRight')) moveCursor(state, 1, 0, 0);
    if (input.consumePress('ArrowUp')) moveCursor(state, 0, 1, 0);
    if (input.consumePress('ArrowDown')) moveCursor(state, 0, -1, 0);
    if (input.consumePress('w') || input.consumePress('W')) moveCursor(state, 0, 0, -1);
    if (input.consumePress('s') || input.consumePress('S')) moveCursor(state, 0, 0, 1);
    if (input.consumePress('Enter') || input.consumePress(' ')) beginDrop(state);

    advanceCapture(state, dt);
    if (state.phase === 'debrief') {
      play('evil-alien/fail', 0.6);
      return;
    }
    while (alarmStep < ALARM_STEPS.length && state.capture >= (ALARM_STEPS[alarmStep] ?? 1)) {
      play('evil-alien/alarm', 0.3 + alarmStep * 0.15);
      alarmStep += 1;
    }
  }

  function updateDrop() {
    if (state.phaseElapsed < HUNT_CONSTANTS.dropDuration) return;
    const shot = detonate(state);
    play('evil-alien/detonate', 0.45);
    if (shot.hit) play('evil-alien/hit', 0.6);
    else if (state.phase === 'debrief') play('evil-alien/fail', 0.6);
  }

  function updateDebrief() {
    if (state.phaseElapsed < 0.5) return;
    if (input.consumePress('Enter') || input.consumePress(' ')) {
      resetHunt(state);
      alarmStep = 0;
    }
  }

  return {
    enter() {
      active = true;
      for (const id of ['evil-alien/detonate', 'evil-alien/hit', 'evil-alien/fail', 'evil-alien/alarm'] as AudioCueId[]) {
        void loadCue(id);
      }
    },
    update(dt: number) {
      state.elapsed += dt;
      state.phaseElapsed += dt;
      switch (state.phase) {
        case 'hunt':
          updateHunt(dt);
          break;
        case 'drop':
          updateDrop();
          break;
        case 'debrief':
          updateDebrief();
          break;
      }
    },
    render() {
      renderEvilAlien(stage, manifest.title, state);
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
        target: state.target,
        cursor: state.cursor,
        bombsUsed: state.bombsUsed,
        bombsMax: EVIL_ALIEN_RULES.bombs,
        capture: Number(state.capture.toFixed(3)),
        bounds: state.bounds,
        shots: state.shots,
        debrief: state.debrief,
      };
    },
    debugAction(action: string, payload?: unknown) {
      if (action === 'solve') {
        state.cursor = { ...state.target };
        return state.cursor;
      }
      if (action === 'aim' && payload && typeof payload === 'object') {
        const p = payload as Partial<typeof state.cursor>;
        state.cursor = {
          x: p.x ?? state.cursor.x,
          y: p.y ?? state.cursor.y,
          d: p.d ?? state.cursor.d,
        };
        return state.cursor;
      }
      if (action === 'drop') {
        beginDrop(state);
        return state.phase;
      }
      return null;
    },
  };
};
