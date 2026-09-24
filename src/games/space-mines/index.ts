import type { GameFactory } from '../types';
import { audioCues, type AudioCueId } from '../../assets/audio';
import {
  FIELDS,
  FIELD_STEP,
  commitYear,
  continueFromReport,
  createMinesState,
  fieldLimit,
  preview,
  resetRun,
  setField,
} from './state';
import { renderMines } from './render';
import type { MinesPhase } from './types';

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

export const createGame: GameFactory = ({ stage, input, audio, manifest }) => {
  const state = createMinesState();
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

  function activeField() {
    return FIELDS[state.field] ?? 'sellOre';
  }

  function decide() {
    if (input.consumePress('ArrowUp')) { state.field = (state.field + FIELDS.length - 1) % FIELDS.length; state.typing = null; }
    if (input.consumePress('ArrowDown')) { state.field = (state.field + 1) % FIELDS.length; state.typing = null; }
    const id = activeField();
    const big = input.isDown('Shift') ? 10 : 1;
    if (input.consumePress('ArrowRight')) { state.typing = null; setField(state, id, state.plan[id] + FIELD_STEP[id] * big); }
    if (input.consumePress('ArrowLeft')) { state.typing = null; setField(state, id, state.plan[id] - FIELD_STEP[id] * big); }
    for (const digit of DIGITS) {
      if (!input.consumePress(digit)) continue;
      state.typing = `${state.typing ?? ''}${digit}`.replace(/^0+(?=\d)/, '').slice(0, 7);
      setField(state, id, Number(state.typing));
    }
    if (input.consumePress('Backspace') && state.typing !== null) {
      state.typing = state.typing.slice(0, -1);
      setField(state, id, Number(state.typing || '0'));
    }
    if (state.typing !== null && Number(state.typing) > fieldLimit(state, id)) state.typing = String(state.plan[id]);
    if (input.consumePress('Enter')) {
      state.typing = null;
      commitYear(state);
      const settled: MinesPhase = state.phase;
      if (settled === 'report') {
        const r = state.report;
        play(r?.ending && r.ending !== 'survived' ? 'mines/fail' : r?.leak ? 'mines/fail' : 'mines/year', 0.4);
      } else {
        play('mines/refused', 0.3);
      }
    }
  }

  return {
    enter() {
      active = true;
      for (const id of ['mines/year', 'mines/fail', 'mines/refused', 'mines/term'] as AudioCueId[]) void loadCue(id);
    },
    update(dt: number) {
      state.elapsed += dt;
      state.phaseElapsed += dt;
      const phase: MinesPhase = state.phase;
      if (phase === 'decide') return decide();
      if (phase === 'report') {
        if (state.phaseElapsed >= 0.3 && input.consumePress('Enter')) {
          continueFromReport(state);
          const settled: MinesPhase = state.phase;
          if (settled === 'debrief') play(state.debrief?.ending === 'survived' ? 'mines/term' : 'mines/fail', 0.55);
        }
        return;
      }
      if (state.phaseElapsed >= 0.5 && input.consumePress('Enter')) resetRun(state);
    },
    render() {
      renderMines(stage, manifest.title, state);
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
        colony: state.colony,
        market: state.market,
        plan: state.plan,
        field: activeField(),
        preview: preview(state),
        report: state.report,
        debrief: state.debrief,
      };
    },
    debugAction(action: string, payload?: unknown) {
      if (action === 'setPlan' && payload && typeof payload === 'object') {
        const plan = payload as Partial<typeof state.plan>;
        for (const id of FIELDS) if (typeof plan[id] === 'number') setField(state, id, plan[id]!);
        return state.plan;
      }
      if (action === 'setColony' && payload && typeof payload === 'object') {
        Object.assign(state.colony, payload);
        return state.colony;
      }
      return null;
    },
  };
};
