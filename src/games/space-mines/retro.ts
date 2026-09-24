import { formatBbcNumber as n, readBbcNumber } from '../../core/bbcNumber';
import { RetroTerminal } from '../../core/retroTerminal';
import type { RetroFactory } from '../types';
import { MINES_RULES, foundColony, rollMarket, rollSmallChange } from './state';

type Prompt = 'sellOre' | 'sellMines' | 'food' | 'buyMines';

const PROMPTS: Record<Prompt, string> = {
  sellOre: 'HOW MUCH ORE TO SELL?',
  sellMines: 'HOW MANY MINES TO SELL?',
  food: 'HOW MUCH TO SPEND ON FOOD ? (APPR. $100 EA.) ',
  buyMines: 'HOW MANY MORE MINES TO BUY?',
};

interface Listing {
  L: number;
  P: number;
  M: number;
  CE: number;
  C: number;
  S: number;
  Y: number;
  LP: number;
  CP: number;
}

export const createRetroGame: RetroFactory = ({ stage, manifest }) => {
  const source = manifest.sources.find(item => item.id === 'mines-bbc-game')
    ?? manifest.sources.find(item => item.role === 'game');
  const terminal = new RetroTerminal({
    stage,
    title: `${manifest.title} (Retro)`,
    sourceLabel: source
      ? `Source: ${source.label}${source.dfsName ? ` ${source.dfsName}` : ''}`
      : 'Source: unavailable',
    maxLines: 24,
  });
  const v: Listing = { L: 0, P: 0, M: 0, CE: 0, C: 0, S: 1, Y: 1, LP: 0, CP: 0 };
  let prompt: Prompt = 'sellOre';
  let done = false;

  const keyHandler = (event: KeyboardEvent) => {
    terminal.handleKey(event, {
      onSubmit: submit,
      acceptedPattern: /^[0-9.-]$/,
      maxInputLength: 10,
      inputEnabled: !done,
      replayEnabled: done,
      onReplay: startRun,
    });
  };

  function startRun() {
    const colony = foundColony();
    Object.assign(v, { L: colony.mines, P: colony.people, M: colony.money, CE: colony.production, C: 0, S: 1, Y: 1 });
    done = false;
    beginYear();
  }

  function beginYear() {
    Object.assign(v, (({ minePrice, orePrice }) => ({ LP: minePrice, CP: orePrice }))(rollMarket()));
    // Line 110 clears the screen, so any leak or glut message from the end of
    // last year is wiped before anyone can read it.
    terminal.clear();
    // BBC BASIC prints no leading space for a positive number, hence YEAR1.
    terminal.pushLine(`YEAR${n(v.Y)}`);
    terminal.pushLine('');
    terminal.pushLine(`THERRE ARE ${n(v.P)} PEOPLE IN THE COLONY`);
    terminal.pushLine(`YOU HAVE ${n(v.L)} MINES, AND $${n(v.M)}`);
    terminal.pushLine(`SATISFACTION FACTOR ${n(v.S)}`);
    terminal.pushLine('');
    terminal.pushLine(`YOUR MINES PRODUCED ${n(v.CE)} TONS EACH`);
    v.C += v.CE * v.L;
    terminal.pushLine(`ORE IN STORE=${n(v.C)} TONS`);
    terminal.pushLine('SELLING');
    terminal.pushLine(`ORE SELLING PRICE=${n(v.CP)}`);
    terminal.pushLine(`MINE SELLING PRICE=${n(v.LP)}/MINE`);
    ask('sellOre');
  }

  function ask(next: Prompt) {
    prompt = next;
    terminal.pushLine(PROMPTS[next]);
  }

  function submit() {
    if (done) {
      startRun();
      return;
    }
    const raw = terminal.input.trim();
    terminal.pushLine(`> ${raw}`);
    terminal.input = '';
    const x = readBbcNumber(raw);

    if (prompt === 'sellOre') {
      // With production below zero the store goes negative and no answer can
      // pass this test, so the prompt repeats for ever.
      if (x < 0 || x > v.C) return ask('sellOre');
      v.C -= x;
      v.M += x * v.CP;
      return ask('sellMines');
    }
    if (prompt === 'sellMines') {
      if (x < 0 || x > v.L) return ask('sellMines');
      v.L -= x;
      v.M += x * v.LP;
      terminal.pushLine('');
      terminal.pushLine(`YOU HAVE $${n(v.M)}`);
      terminal.pushLine('');
      terminal.pushLine('BUYING');
      return ask('food');
    }
    if (prompt === 'food') {
      if (x < 0 || x > v.M) return ask('food');
      v.M -= x;
      if (x / v.P > MINES_RULES.generousPerHead) v.S += 0.1;
      if (x / v.P < MINES_RULES.meanPerHead) v.S -= 0.2;
      return ask('buyMines');
    }
    if (x < 0 || x * v.LP > v.M) return ask('buyMines');
    v.L += x;
    v.M -= x * v.LP;
    endOfYear();
  }

  function endOfYear() {
    if (v.S < MINES_RULES.revoltBelow) return finish('THE PEOPLE REVOLTED');
    // Line 500 reads CE=CE+INT(RND81)*20+1): the opening bracket is Shift-8 on
    // a BBC keyboard, and the Shift was missed. It only runs, and so only
    // fails, once satisfaction is above 1.1.
    if (v.S > MINES_RULES.growthAbove) return finish('', 'Missing ) at line 500');
    if (v.S < MINES_RULES.declineBelow) v.CE -= rollSmallChange(Math.random, 20);
    if (v.L === 0) return finish('', 'Division by zero at line 520');
    if (v.P / v.L < MINES_RULES.peoplePerMine) return finish("YOU'VE OVERWORKED EVERYONE");
    if (v.S < MINES_RULES.declineBelow) v.P -= rollSmallChange(Math.random, 10);
    if (v.P < MINES_RULES.minimumPeople) return finish('NOT ENOUGH PEOPLE LEFT');
    if (Math.random() <= MINES_RULES.leakChance) {
      terminal.pushLine('RADIOACTIVE LEAK....MANY DIE');
      v.P = Math.floor(v.P / 2);
    }
    // Unreachable on this disk: production can only rise through line 500.
    if (v.CE >= MINES_RULES.glutAt) {
      terminal.pushLine('MARKET GLUT - PRICE DROPS');
      v.CE = Math.floor(v.CE / 2);
    }
    v.Y += 1;
    if (v.Y < MINES_RULES.years + 1) return beginYear();
    finish('YOU SURVIVED YOUR TERM OF OFFICE');
  }

  function finish(message: string, error?: string) {
    if (error) {
      terminal.pushLine('');
      terminal.pushLine(error);
    } else {
      terminal.pushLine(message);
    }
    terminal.pushLine('');
    terminal.pushLine('R OR ENTER TO RUN AGAIN');
    done = true;
  }

  return {
    enter() {
      window.addEventListener('keydown', keyHandler);
      startRun();
    },
    update(dt: number) {
      terminal.update(dt);
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
        prompt,
        done,
        lines: [...terminal.lines],
      };
    },
  };
};
