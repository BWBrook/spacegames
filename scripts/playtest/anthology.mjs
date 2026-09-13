import fs from 'node:fs';
import path from 'node:path';
import { chromium, webkit } from 'playwright';

const DEFAULT_URL = 'http://127.0.0.1:5173';
const BROWSERS = { chromium, webkit };
const GAMES = ['starship-takeoff', 'intergalactic-games', 'evil-alien'];
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
          : await runEvilAlien(page, args);
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
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
