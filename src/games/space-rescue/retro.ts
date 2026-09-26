import { formatBbcNumber as n, readBbcNumber } from '../../core/bbcNumber';
import { RetroTerminal } from '../../core/retroTerminal';
import type { RetroFactory } from '../types';
import {
  CHECK_PAUSE,
  HAZARD_TEXT,
  RESCUE_RULES,
  rollCondition,
  rollHazard,
  rollMission,
  velocityFor,
} from './state';

type Stage = 'askInstructions' | 'instructions' | 'engines' | 'life' | 'shields' | 'voyage' | 'boosters' | 'heat' | 'done';

const INSTRUCTIONS = [
  '',
  'YOU ARE ABOUT TO EMBARK ON A',
  'MISSION TO A DISTANT PLANET',
  'IN URGENT NEED OF MEDICAL',
  'SUPPLIES. YOU MUST FIRST READY',
  'YOUR SHIP FOR THE TRIP BY',
  "ALLOCATING SOME OF THE SHIP'S",
  'ENERGY TO THE ENGINES,SHIELDS',
  'AND LIFE-SUPPORT. YOU ARE',
  'THEN PUT TO SLEEP FOR THE MAIN',
  'PART OF THE TRIP, AFTER WHICH',
  'YOU WILL GET A REPORT OF THE',
  'EVENTS ON THE WAY. YOU MUST',
  'THEN LAND ON THE PLANET.....',
  'PRESS ANY KEY',
];

interface Listing {
  D: number;
  E: number;
  T: number;
  P: number;
  L: number;
  S: number;
  X: number;
  V: number;
  B: number;
  G: number;
  A: number;
}

export const createRetroGame: RetroFactory = ({ stage, manifest }) => {
  const source = manifest.sources.find(item => item.id === 'rescue-bbc-game')
    ?? manifest.sources.find(item => item.role === 'game');
  const terminal = new RetroTerminal({
    stage,
    title: `${manifest.title} (Retro)`,
    sourceLabel: source
      ? `Source: ${source.label}${source.dfsName ? ` ${source.dfsName}` : ''}`
      : 'Source: unavailable',
    maxLines: 22,
  });
  const v: Listing = { D: 0, E: 0, T: 0, P: 0, L: 0, S: 0, X: 0, V: 0, B: 0, G: 0, A: 0 };
  let current: Stage = 'askInstructions';
  let checks = 0;
  let checked = 0;
  let timer = 0;

  const keyHandler = (event: KeyboardEvent) => {
    if (event.metaKey || event.ctrlKey) return;
    if (current === 'instructions') {
      // I=GET: any key at all.
      event.preventDefault();
      terminal.clear();
      return startMission();
    }
    if (current === 'voyage') return;
    terminal.handleKey(event, {
      onSubmit: submit,
      acceptedPattern: current === 'askInstructions' ? /^[A-Za-z]$/ : /^[0-9.-]$/,
      maxInputLength: 10,
      inputEnabled: current !== 'done',
      replayEnabled: current === 'done',
      onReplay: startRun,
    });
  };

  function setStage(next: Stage) {
    current = next;
    terminal.promptVisible = next !== 'voyage' && next !== 'instructions';
  }

  function startRun() {
    terminal.clear();
    terminal.pushLine('SPACE RESCUE');
    terminal.pushLine('');
    terminal.pushLine('DO YOU WANT INSTRUCTIONS? ');
    setStage('askInstructions');
  }

  function startMission() {
    const mission = rollMission();
    Object.assign(v, { D: mission.distance, E: mission.energy, T: mission.timeLimit });
    terminal.pushLine(`THE PLANET IS ${n(v.D)} UNITS AWAY`);
    terminal.pushLine(`YOU HAVE ${n(v.E)} UNITS OF ENERGY`);
    terminal.pushLine(`AND A TIME LIMIT OF ${n(v.T)} DAYS`);
    terminal.pushLine('');
    askDistribution();
  }

  function askDistribution() {
    terminal.pushLine('ENERGY DISTRIBUTION:');
    terminal.pushLine('TO ENGINES?');
    setStage('engines');
  }

  function submit() {
    if (current === 'done') return startRun();
    const raw = terminal.input.trim();
    terminal.pushLine(`> ${raw}`);
    terminal.input = '';

    if (current === 'askInstructions') {
      // The BBC powered up with CAPS LOCK on, so this compares capitals.
      if (raw.toUpperCase().startsWith('Y')) {
        INSTRUCTIONS.forEach(line => terminal.pushLine(line));
        return setStage('instructions');
      }
      return startMission();
    }

    const x = readBbcNumber(raw);
    if (current === 'engines') { v.P = x; terminal.pushLine('TO LIFE SUPPORT?'); return setStage('life'); }
    if (current === 'life') { v.L = x; terminal.pushLine('TO SHIELDS?'); return setStage('shields'); }
    if (current === 'shields') {
      v.S = x;
      // Only the total is checked, so negative allocations are accepted.
      if (v.P + v.L + v.S > v.E) return askDistribution();
      v.X = v.E - v.P - v.L - v.S;
      if (v.P < 0) return halt('-ve root at line 230');
      v.V = velocityFor(v.P);
      if (v.V === 0) return halt('Division by zero at line 240');
      terminal.clear();
      terminal.pushLine(`YOUR VELOCITY IS ${n(v.V)}`);
      terminal.pushLine(`YOU HAVE AN ETA OF ${n(Math.floor(v.D / v.V))} DAYS`);
      terminal.pushLine('');
      checks = Math.floor(Math.random() * RESCUE_RULES.checkSpan + RESCUE_RULES.minChecks);
      checked = 0;
      setStage('voyage');
      return check();
    }
    if (current === 'boosters') {
      v.B = x;
      terminal.pushLine('HOW MUCH ENERGY TO HEAT SHIELDS?');
      return setStage('heat');
    }
    // Line 710 reuses S, the voyage's shields, for the heat shields.
    v.S = x;
    if (v.B + v.S > v.X) return askBoosters();
    terminal.clear();
    if (v.B < v.G * 10) return end('YOU MADE A NEW CRATER');
    if (v.S < v.A * 10) return end('YOU MADE A WONDERFUL SHOOTING STAR');
    terminal.pushLine('YOU LANDED SUCCESSFULLY - WELL DONE');
    // The door is mentioned nowhere until now.
    if (v.X - v.S - v.B > RESCUE_RULES.doorEnergy) return end();
    terminal.pushLine("PITY YOU DON'T HAVE ENOUGH");
    end('ENERGY TO OPEN THE DOOR');
  }

  function check() {
    checked += 1;
    timer = 0;
    const roll = rollHazard();
    if (!roll.hazard) return;
    terminal.pushLine(HAZARD_TEXT[roll.hazard]);
    if (roll.hazard === 'storm') v.S -= roll.amount;
    if (roll.hazard === 'breakdown') v.D += roll.amount;
    if (roll.hazard === 'engine') v.V -= roll.amount;
    if (roll.hazard === 'xray') v.L -= roll.amount;
  }

  function arrive() {
    // Line 460 divides by the velocity before line 510 can say the engines failed.
    if (v.V === 0) return halt('Division by zero at line 460');
    const eta = Math.floor(v.D / v.V);
    terminal.clear();
    terminal.pushLine(`ARRIVED IN ${n(eta)} DAYS`);
    const lostShields = v.S < 0;
    const lostLife = v.L <= 0;
    const lostEngines = v.V <= 0;
    const late = eta > v.T;
    if (lostShields) { terminal.pushLine('SHIELDS DESTROYED'); terminal.pushLine('YOU WERE BLOWN UP'); }
    if (lostLife) { terminal.pushLine('LIFE SUPPORT INACTIVE'); terminal.pushLine("YOU'RE DEAD"); }
    if (lostEngines) terminal.pushLine('ENGINES ARE NON-FUNCTIONAL');
    if (late) terminal.pushLine('YOU TOOK TOO LONG ABOUT IT');
    if (lostShields || lostLife || lostEngines || late) return end();

    const gravity = rollCondition();
    const atmosphere = rollCondition();
    v.G = gravity.value;
    v.A = atmosphere.value;
    terminal.pushLine('');
    terminal.pushLine('YOU ARE NOW ORBITING THE PLANET');
    terminal.pushLine(`SURPLUS ENERGY=${n(v.X)}`);
    terminal.pushLine(`GRAVITY IS ${gravity.band}`);
    terminal.pushLine(`ATMOSPHERE IS ${atmosphere.band}`);
    terminal.pushLine('');
    askBoosters();
  }

  function askBoosters() {
    terminal.pushLine('HOW MUCH ENERGY TO BOOSTERS?');
    setStage('boosters');
  }

  function halt(error: string) {
    terminal.pushLine('');
    terminal.pushLine(error);
    end();
  }

  function end(message?: string) {
    if (message) terminal.pushLine(message);
    terminal.pushLine('');
    terminal.pushLine('R OR ENTER TO RUN AGAIN');
    setStage('done');
  }

  return {
    enter() {
      window.addEventListener('keydown', keyHandler);
      startRun();
    },
    update(dt: number) {
      terminal.update(dt);
      if (current !== 'voyage') return;
      timer += dt;
      if (timer < CHECK_PAUSE) return;
      if (checked < checks) check();
      else arrive();
    },
    render() {
      terminal.render();
    },
    exit() {
      window.removeEventListener('keydown', keyHandler);
    },
    debugSnapshot() {
      return {
        gameId: manifest.id,
        source: source?.path ?? null,
        ...v,
        stage: current,
        checks,
        checked,
        done: current === 'done',
        lines: [...terminal.lines],
      };
    },
  };
};
