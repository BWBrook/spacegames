import fs from 'node:fs';
import path from 'node:path';
import { chromium, webkit } from 'playwright';

const DEFAULT_URL = 'http://127.0.0.1:5173';
const BROWSERS = { chromium, webkit };
const GAMES = ['starship-takeoff', 'intergalactic-games', 'evil-alien', 'beat-the-bug-eyes', 'moonlander', 'monsters-of-galacticon', 'alien-snipers', 'asteroid-belt', 'trip-into-the-future', 'death-valley'];
const MODES = new Set(['modern', 'retro']);

function parseArgs(argv) {
  const args = {
    game: null,
    mode: 'modern',
    browser: 'chromium',
    url: DEFAULT_URL,
    outDir: null,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--') continue;
    const next = argv[i + 1];
    if (arg === '--game' && next) {
      args.game = next;
      i += 1;
    } else if (arg === '--mode' && next) {
      args.mode = next;
      i += 1;
    } else if (arg === '--browser' && next) {
      args.browser = next;
      i += 1;
    } else if (arg === '--url' && next) {
      args.url = next;
      i += 1;
    } else if (arg === '--out-dir' && next) {
      args.outDir = next;
      i += 1;
    } else if (arg === '--help') {
      console.log('Usage: pnpm playtest -- --game <id> [--mode modern|retro] [--browser chromium|webkit] [--url URL] [--out-dir DIR]');
      process.exit(0);
    } else {
      throw new Error(`Unknown or incomplete argument "${arg}".`);
    }
  }

  if (!GAMES.includes(args.game)) {
    throw new Error(`Choose --game from: ${GAMES.join(', ')}`);
  }
  if (!MODES.has(args.mode)) {
    throw new Error('Choose --mode from: modern, retro');
  }
  if (!BROWSERS[args.browser]) {
    throw new Error(`Choose --browser from: ${Object.keys(BROWSERS).join(', ')}`);
  }
  args.outDir ??= `output/playtest-${args.game}-${args.mode}-${args.browser}`;
  return args;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function gameSnapshot(snapshot) {
  return snapshot.game ?? snapshot;
}

async function snapshot(page) {
  return page.evaluate(() => JSON.parse(window.render_game_to_text()));
}

async function step(page, frames = 1) {
  for (let i = 0; i < frames; i += 1) {
    await page.evaluate(() => window.advanceTime?.(1000 / 60));
  }
}

async function command(page, action, payload) {
  return page.evaluate(
    ([nextAction, nextPayload]) => window.__spacegamesDebug?.command(nextAction, nextPayload),
    [action, payload],
  );
}

async function openGame(page, args) {
  await page.goto(args.url, { waitUntil: 'networkidle' });
  const laneButton = `[data-game="${args.game}"] [data-mode="${args.mode}"]`;
  await page.waitForSelector(laneButton, { state: 'visible' });
  await page.click(laneButton);

  await page.waitForFunction(expectedGame => {
    if (typeof window.render_game_to_text !== 'function') return false;
    const current = JSON.parse(window.render_game_to_text());
    return current.scene === 'gameplay' && current.gameId === expectedGame && Boolean(current.game);
  }, args.game, { timeout: 5000 });
}

async function runRetro(page, args) {
  await page.screenshot({ path: path.join(args.outDir, '01-retro.png') });
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => {
    if (typeof window.render_game_to_text !== 'function') return false;
    return JSON.parse(window.render_game_to_text()).scene === 'menu';
  }, null, { timeout: 3000 });
  return {
    returnedToMenu: true,
    finalSnapshot: await snapshot(page),
  };
}

async function runStarship(page, args) {
  let current = await snapshot(page);
  await page.screenshot({ path: path.join(args.outDir, '01-prep.png') });

  const target = current.game.telemetry.estimatedTarget;
  const baseRatio = clamp((target - 150) / 800, 0, 1);
  await command(page, 'setControl', { control: 'baseThrust', value: baseRatio });
  await step(page, 3);
  await page.screenshot({ path: path.join(args.outDir, '02-prep-tuned.png') });

  await page.keyboard.press('Enter');
  for (let i = 0; i < 240; i += 1) {
    current = await snapshot(page);
    if (current.game.phase !== 'commit') break;
    if (Math.abs(current.game.commit.cursor - 0.5) < 0.02) {
      await page.keyboard.press('Space');
      break;
    }
    await step(page);
  }
  await step(page, 6);
  await page.screenshot({ path: path.join(args.outDir, '03-commit-fired.png') });

  await command(page, 'setControl', { control: 'throttle', value: 0.98 });
  let capturedAscent = false;
  for (let i = 0; i < 900; i += 1) {
    current = await snapshot(page);
    if (current.game.phase === 'debrief') break;

    if (!capturedAscent && current.game.ascent.altitude > current.game.ascent.targetAltitude * 0.25) {
      await page.screenshot({ path: path.join(args.outDir, '04-ascent.png') });
      capturedAscent = true;
    }

    const heat = current.game.ascent.heat;
    const altitudeRatio = current.game.ascent.altitude / current.game.ascent.targetAltitude;
    if (heat > 112 || current.game.activeEvent === 'Reactor Spike') {
      await page.keyboard.down('Space');
      await command(page, 'setControl', { control: 'throttle', value: altitudeRatio > 0.8 ? 0.72 : 0.58 });
      await step(page, 12);
      await page.keyboard.up('Space');
    } else if (heat < 74) {
      await command(page, 'setControl', { control: 'throttle', value: altitudeRatio > 0.7 ? 0.92 : 0.98 });
      await step(page, 10);
    } else {
      await command(page, 'setControl', { control: 'throttle', value: 0.84 });
      await step(page, 10);
    }
  }

  current = await snapshot(page);
  if (!capturedAscent) await page.screenshot({ path: path.join(args.outDir, '04-ascent.png') });
  await page.screenshot({ path: path.join(args.outDir, '05-final.png') });
  return {
    reachedDebrief: current.game.phase === 'debrief',
    outcome: current.game.debrief?.outcome ?? null,
    finalSnapshot: current,
  };
}

async function runIntergalactic(page, args) {
  await page.screenshot({ path: path.join(args.outDir, '01-aim.png') });
  await command(page, 'solve');
  await step(page, 3);
  await page.screenshot({ path: path.join(args.outDir, '02-solved-aim.png') });
  await page.keyboard.press('Enter');
  await step(page, 8);
  await page.screenshot({ path: path.join(args.outDir, '03-flight-start.png') });

  let current = await snapshot(page);
  let capturedMidflight = false;
  for (let i = 0; i < 420; i += 1) {
    current = await snapshot(page);
    const game = gameSnapshot(current);
    if (game.phase === 'debrief') break;
    if (game.phase === 'flight') {
      if (Math.abs(game.flight.signalCursor - 0.5) < 0.055) await page.keyboard.press('Space');
      if (!capturedMidflight && game.flight.progress > 0.45) {
        await page.screenshot({ path: path.join(args.outDir, '04-midflight.png') });
        capturedMidflight = true;
      }
    }
    await step(page);
  }

  current = await snapshot(page);
  if (!capturedMidflight) await page.screenshot({ path: path.join(args.outDir, '04-midflight.png') });
  await page.screenshot({ path: path.join(args.outDir, '05-debrief.png') });
  const game = gameSnapshot(current);
  return {
    reachedDebrief: game.phase === 'debrief',
    outcome: game.debrief?.outcome ?? null,
    finalSnapshot: current,
  };
}

async function runEvilAlien(page, args) {
  await page.screenshot({ path: path.join(args.outDir, '01-hunt.png') });
  let game = gameSnapshot(await snapshot(page));
  const t = game.target;
  const miss = { x: (t.x + 3) % 10, y: (t.y + 3) % 10, d: (t.d + 3) % 10 };
  await command(page, 'aim', miss);
  await step(page, 2);
  await page.keyboard.press('Enter');
  for (let i = 0; i < 200; i += 1) {
    await step(page);
    game = gameSnapshot(await snapshot(page));
    if (game.phase !== 'drop') break;
  }
  await step(page, 4);
  await page.screenshot({ path: path.join(args.outDir, '02-scanner.png') });
  await command(page, 'solve');
  await step(page, 2);
  await page.keyboard.press('Enter');
  for (let i = 0; i < 200; i += 1) {
    await step(page);
    game = gameSnapshot(await snapshot(page));
    if (game.phase === 'debrief') break;
  }
  await step(page, 6);
  await page.screenshot({ path: path.join(args.outDir, '03-debrief.png') });
  const current = await snapshot(page);
  game = gameSnapshot(current);
  return {
    reachedDebrief: game.phase === 'debrief',
    outcome: game.debrief?.outcome ?? null,
    finalSnapshot: current,
  };
}

async function runBugEyes(page, args) {
  await page.screenshot({ path: path.join(args.outDir, '01-lurk.png') });
  let game = gameSnapshot(await snapshot(page));
  let exposedShot = false;
  let missedOne = false;

  for (let i = 0; i < 4000; i += 1) {
    game = gameSnapshot(await snapshot(page));
    if (game.phase === 'debrief') break;
    if (game.phase === 'exposed') {
      if (!exposedShot) {
        await page.screenshot({ path: path.join(args.outDir, '02-exposed.png') });
        exposedShot = true;
      }
      // Miss the first bug on purpose to prove the outcrop creeps closer, then
      // blast the rest to reach the escape debrief.
      if (!missedOne) {
        missedOne = true;
        const wrong = (game.activeKey % 4) + 1;
        await page.keyboard.press(String(wrong));
      } else {
        await page.keyboard.press(String(game.activeKey));
      }
    }
    await step(page);
  }

  await step(page, 4);
  await page.screenshot({ path: path.join(args.outDir, '03-debrief.png') });
  const current = await snapshot(page);
  game = gameSnapshot(current);
  return {
    reachedDebrief: game.phase === 'debrief',
    outcome: game.debrief?.outcome ?? null,
    blasted: game.blasted,
    finalSnapshot: current,
  };
}

async function runMoonlander(page, args) {
  await page.screenshot({ path: path.join(args.outDir, '01-descent.png') });
  let game = gameSnapshot(await snapshot(page));
  const GRAVITY = 5;
  const TARGET = 0.5;
  let shotFreefall = false;

  for (let i = 0; i < 6000; i += 1) {
    game = gameSnapshot(await snapshot(page));
    if (game.phase !== 'descent') break;
    // Coast until the shortfall is steep enough to need near-maximum thrust,
    // then hold the exact deceleration that arrives at TARGET.
    const need = GRAVITY
      + (game.velocity * game.velocity - TARGET * TARGET) / (2 * Math.max(game.height, 1e-6));
    const throttle = need >= 24 ? Math.min(30, need) : 0;
    await command(page, 'setThrottle', throttle);
    if (!shotFreefall && i === 60) {
      await page.screenshot({ path: path.join(args.outDir, '02-freefall.png') });
      shotFreefall = true;
    }
    await step(page);
  }

  await page.screenshot({ path: path.join(args.outDir, '03-touchdown.png') });
  for (let i = 0; i < 400 && gameSnapshot(await snapshot(page)).phase !== 'debrief'; i += 1) await step(page);
  await step(page, 4);
  await page.screenshot({ path: path.join(args.outDir, '04-debrief.png') });
  const current = await snapshot(page);
  game = gameSnapshot(current);
  return {
    reachedDebrief: game.phase === 'debrief',
    outcome: game.debrief?.verdict ?? null,
    touchdown: game.debrief?.touchdownVelocity ?? null,
    fuelLeft: game.debrief?.fuelLeft ?? null,
    finalSnapshot: current,
  };
}

const GALACTICON_WEAPONS = ['R', 'S', 'T'];

/** One observation fixes a row: kill, then the next weapon does nothing, then it eats. */
function galacticonKiller(weapon, outcome) {
  const shift = outcome === 'kill' ? 0 : outcome === 'noeffect' ? 2 : 1;
  return GALACTICON_WEAPONS[(GALACTICON_WEAPONS.indexOf(weapon) + shift) % 3];
}

async function runGalacticon(page, args) {
  await page.screenshot({ path: path.join(args.outDir, '01-approach.png') });
  const learned = {};
  let game = gameSnapshot(await snapshot(page));
  let shotChoose = false;
  let shotResolve = false;

  for (let i = 0; i < 6000; i += 1) {
    game = gameSnapshot(await snapshot(page));
    if (game.phase === 'debrief') break;
    if (game.phase === 'choose') {
      if (!shotChoose) {
        await page.screenshot({ path: path.join(args.outDir, '02-choose.png') });
        shotChoose = true;
      }
      // Play it the way a person would: probe an unfamiliar monster, then rely
      // on the rotation the first observation reveals.
      await page.keyboard.press(learned[game.monster] ?? 'R');
      await step(page, 2);
      const after = gameSnapshot(await snapshot(page));
      if (after.lastWeapon && after.lastOutcome) {
        learned[after.monster] = galacticonKiller(after.lastWeapon, after.lastOutcome);
      }
      if (!shotResolve && after.lastOutcome && after.lastOutcome !== 'kill') {
        await page.screenshot({ path: path.join(args.outDir, '03-miss.png') });
        shotResolve = true;
      }
      continue;
    }
    await step(page);
  }

  await step(page, 4);
  await page.screenshot({ path: path.join(args.outDir, '04-debrief.png') });
  const current = await snapshot(page);
  game = gameSnapshot(current);
  return {
    reachedDebrief: game.phase === 'debrief',
    survived: game.debrief?.survived ?? null,
    kills: game.debrief?.kills ?? null,
    crewLeft: game.debrief?.crewLeft ?? null,
    learnedCount: Object.keys(learned).length,
    finalSnapshot: current,
  };
}

async function runSnipers(page, args) {
  await page.screenshot({ path: path.join(args.outDir, '01-briefing.png') });
  await command(page, 'setDifficulty', 6);
  await step(page, 2);
  await page.keyboard.press('Enter');
  await step(page, 2);

  let game = gameSnapshot(await snapshot(page));
  let missedOne = false;
  let shotTarget = false;
  let shotReport = false;

  for (let i = 0; i < 6000; i += 1) {
    game = gameSnapshot(await snapshot(page));
    if (game.phase === 'debrief') break;
    if (game.phase === 'target') {
      if (!shotTarget) {
        await page.screenshot({ path: path.join(args.outDir, '02-target.png') });
        shotTarget = true;
      }
      // Miss the first one deliberately, so the report panel and the miss path
      // both get exercised, then decode the rest correctly.
      const answer = game.target.answer;
      const key = missedOne
        ? answer
        : String.fromCharCode(((answer.charCodeAt(0) - 65 + 1) % 26) + 65);
      missedOne = true;
      await page.keyboard.press(key);
      await step(page, 2);
      if (!shotReport) {
        await page.screenshot({ path: path.join(args.outDir, '03-report.png') });
        shotReport = true;
      }
      continue;
    }
    await step(page);
  }

  await step(page, 4);
  await page.screenshot({ path: path.join(args.outDir, '04-debrief.png') });
  const current = await snapshot(page);
  game = gameSnapshot(current);
  return {
    reachedDebrief: game.phase === 'debrief',
    hits: game.debrief?.hits ?? null,
    difficulty: game.debrief?.difficulty ?? null,
    bestStreak: game.debrief?.bestStreak ?? null,
    finalSnapshot: current,
  };
}

async function runBelt(page, args) {
  await page.screenshot({ path: path.join(args.outDir, '01-approach.png') });
  let game = gameSnapshot(await snapshot(page));
  const plan = [];
  let shotImpact = false;

  for (let i = 0; i < 8000; i += 1) {
    game = gameSnapshot(await snapshot(page));
    if (game.phase === 'debrief') break;
    if (game.phase === 'approach') {
      // First asteroid: undercount on purpose. Second: sit on the keys and let
      // it hit. Every other one: count correctly.
      const shot = plan.length;
      if (shot === 0) {
        await page.keyboard.press(String(game.stars > 1 ? game.stars - 1 : 2));
      } else if (shot === 1) {
        for (let wait = 0; wait < 90 && gameSnapshot(await snapshot(page)).phase === 'approach'; wait += 1) await step(page);
      } else {
        await page.keyboard.press(String(game.stars));
      }
      plan.push(shot);
      await step(page, 2);
      if (!shotImpact) {
        await page.screenshot({ path: path.join(args.outDir, '02-impact.png') });
        shotImpact = true;
      }
      continue;
    }
    await step(page);
  }

  await step(page, 4);
  await page.screenshot({ path: path.join(args.outDir, '03-debrief.png') });
  const current = await snapshot(page);
  game = gameSnapshot(current);
  return {
    reachedDebrief: game.phase === 'debrief',
    hits: game.debrief?.hits ?? null,
    crashes: game.debrief?.crashes ?? null,
    misses: (game.debrief?.undercounts ?? 0) + (game.debrief?.overcounts ?? 0),
    finalSnapshot: current,
  };
}

const TRIP_MISSIONS = [
  { target: 30, engineCap: 0.6 },
  { target: 60, engineCap: 0.6 },
  { target: 90, engineCap: 0.87 },
  { target: 110, engineCap: 0.93 },
  { target: 124, engineCap: 0.96 },
];

async function runTrip(page, args) {
  await command(page, 'setMissions', TRIP_MISSIONS);
  await step(page, 2);
  await page.screenshot({ path: path.join(args.outDir, '01-plan.png') });

  for (let m = 0; m < TRIP_MISSIONS.length; m += 1) {
    const mission = TRIP_MISSIONS[m];
    // Correct physics: Earth time is distance over speed. The last mission is
    // flown deliberately slowly, so Earth's calendar is right and the crew is not.
    const speed = m === TRIP_MISSIONS.length - 1 ? 0.5 : mission.engineCap;
    await command(page, 'setPlan', { speed, distance: speed * mission.target });
    await step(page, 2);
    await page.keyboard.press('Enter');
    await step(page, 2);
    if (m === 2) {
      for (let i = 0; i < 150; i += 1) await step(page);
      await page.screenshot({ path: path.join(args.outDir, '02-voyage.png') });
    }
    for (let i = 0; i < 600 && gameSnapshot(await snapshot(page)).phase !== 'arrival'; i += 1) await step(page);
    await step(page, 50);
    if (m === TRIP_MISSIONS.length - 1) await page.screenshot({ path: path.join(args.outDir, '03-died.png') });
    await page.keyboard.press('Enter');
    await step(page, 3);
  }

  await step(page, 4);
  await page.screenshot({ path: path.join(args.outDir, '04-debrief.png') });
  const current = await snapshot(page);
  const game = gameSnapshot(current);
  return {
    reachedDebrief: game.phase === 'debrief',
    onTime: game.debrief?.onTime ?? null,
    died: game.debrief?.died ?? null,
    lastEarthYears: game.results.at(-1)?.earthYears ?? null,
    finalSnapshot: current,
  };
}

async function runValley(page, args) {
  await page.screenshot({ path: path.join(args.outDir, '01-briefing.png') });
  await command(page, 'setWidth', 12);
  await step(page, 2);
  await page.keyboard.press('Enter');
  await step(page, 2);

  // Steer at the centre of the valley a little ahead, holding keys as a player would.
  let held = null;
  const hold = async key => {
    if (held === key) return;
    if (held) await page.keyboard.up(held);
    if (key) await page.keyboard.down(key);
    held = key;
  };
  let game = gameSnapshot(await snapshot(page));
  let shotMid = false;
  for (let i = 0; i < 4000; i += 1) {
    game = gameSnapshot(await snapshot(page));
    if (game.phase !== 'flight') break;
    const error = game.aheadCentre - game.shipX;
    await hold(error > 0.35 ? 'ArrowRight' : error < -0.35 ? 'ArrowLeft' : null);
    if (!shotMid && game.distance > 90) {
      await page.screenshot({ path: path.join(args.outDir, '02-flight.png') });
      shotMid = true;
    }
    await step(page);
  }
  await hold(null);
  for (let i = 0; i < 200 && gameSnapshot(await snapshot(page)).phase !== 'debrief'; i += 1) await step(page);
  await step(page, 4);
  await page.screenshot({ path: path.join(args.outDir, '03-debrief.png') });
  const current = await snapshot(page);
  game = gameSnapshot(current);
  return {
    reachedDebrief: game.phase === 'debrief',
    escaped: game.debrief?.escaped ?? null,
    rows: game.debrief?.rows ?? null,
    closestShave: game.debrief?.closestShave ?? null,
    finalSnapshot: current,
  };
}

async function main() {
  const args = parseArgs(process.argv);
  fs.mkdirSync(args.outDir, { recursive: true });
  const browser = await BROWSERS[args.browser].launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1024 } });
  const consoleErrors = [];

  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', error => consoleErrors.push(error.message));

  let report;
  let failure = null;
  try {
    await openGame(page, args);
    const result = args.mode === 'retro'
      ? await runRetro(page, args)
      : args.game === 'starship-takeoff'
        ? await runStarship(page, args)
        : args.game === 'intergalactic-games'
          ? await runIntergalactic(page, args)
          : args.game === 'evil-alien'
            ? await runEvilAlien(page, args)
            : args.game === 'beat-the-bug-eyes'
              ? await runBugEyes(page, args)
              : args.game === 'moonlander'
                ? await runMoonlander(page, args)
                : args.game === 'monsters-of-galacticon'
                  ? await runGalacticon(page, args)
                  : args.game === 'alien-snipers'
                    ? await runSnipers(page, args)
                    : args.game === 'asteroid-belt'
                      ? await runBelt(page, args)
                      : args.game === 'trip-into-the-future'
                        ? await runTrip(page, args)
                        : await runValley(page, args);
    report = { ...args, ...result, consoleErrors };
  } catch (error) {
    failure = error;
    report = {
      ...args,
      error: error instanceof Error ? error.message : String(error),
      consoleErrors,
    };
  } finally {
    await browser.close();
  }

  fs.writeFileSync(path.join(args.outDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify(report, null, 2));
  if (failure) throw failure;
  if (consoleErrors.length) throw new Error(`Console errors found:\n${consoleErrors.join('\n')}`);
  if (args.mode === 'retro' && !report.returnedToMenu) throw new Error('Retro lane did not return to menu.');
  if (args.mode === 'modern' && !report.reachedDebrief) {
    throw new Error(`Modern lane did not reach debrief; ended in ${report.finalSnapshot.game.phase}`);
  }
  if (args.game === 'intergalactic-games' && args.mode === 'modern' && report.outcome !== 'success') {
    throw new Error(`Expected successful orbit; got ${report.outcome}`);
  }
  if (args.game === 'evil-alien' && args.mode === 'modern' && report.outcome !== 'destroyed') {
    throw new Error(`Expected Elron destroyed; got ${report.outcome}`);
  }
  if (args.game === 'death-valley' && args.mode === 'modern') {
    if (!report.escaped) throw new Error(`Expected to clear the valley at width 12; crashed after ${report.rows} rows`);
    if (report.rows !== 200) throw new Error(`Expected 200 rows; got ${report.rows}`);
  }
  if (args.game === 'trip-into-the-future' && args.mode === 'modern') {
    if (report.onTime !== 4) throw new Error(`Expected 4 trips on time; got ${report.onTime}`);
    if (report.died !== 1) throw new Error(`Expected the slow final trip to kill the crew; got ${report.died} deaths`);
    if (Math.abs(report.lastEarthYears - 124) > 0.01) throw new Error('The slow trip should still have hit the Earth target exactly');
  }
  if (args.game === 'asteroid-belt' && args.mode === 'modern') {
    if (report.hits !== 8) throw new Error(`Expected 8 hits after one miscount and one crash; got ${report.hits}`);
    if (report.crashes !== 1) throw new Error(`Expected exactly one crash from the timeout; got ${report.crashes}`);
    if (report.misses !== 1) throw new Error(`Expected exactly one miscount; got ${report.misses}`);
  }
  if (args.game === 'alien-snipers' && args.mode === 'modern') {
    if (report.difficulty !== 6) throw new Error(`Expected difficulty 6; got ${report.difficulty}`);
    if (report.hits !== 9) throw new Error(`Expected 9 hits after one deliberate miss; got ${report.hits}`);
    if (report.bestStreak !== 9) throw new Error(`Expected a streak of 9; got ${report.bestStreak}`);
  }
  if (args.game === 'monsters-of-galacticon' && args.mode === 'modern') {
    // Probing once then following the rotation cannot lose: at most four probes,
    // at most one crew member each, out of five.
    if (!report.survived) throw new Error(`Expected survival; crew left ${report.crewLeft}`);
    if (report.crewLeft < 1) throw new Error('Survived with no crew, which is impossible');
  }
  if (args.game === 'moonlander' && args.mode === 'modern') {
    if (report.outcome !== 'good') {
      throw new Error(`Expected a good landing; got ${report.outcome} at ${report.touchdown}`);
    }
    // A clean descent should leave real margin, not scrape in on fumes.
    if (report.fuelLeft < 15) throw new Error(`Expected fuel to spare; only ${report.fuelLeft} left`);
  }
  if (args.game === 'beat-the-bug-eyes' && args.mode === 'modern') {
    if (report.outcome !== 'escaped') throw new Error(`Expected escape; got ${report.outcome}`);
    if (report.blasted !== 9) throw new Error(`Expected 9 blasted after one deliberate miss; got ${report.blasted}`);
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
