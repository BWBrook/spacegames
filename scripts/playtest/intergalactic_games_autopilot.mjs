import fs from 'node:fs';
import path from 'node:path';
import { chromium, webkit } from 'playwright';

const DEFAULT_URL = 'http://127.0.0.1:5173';
const DEFAULT_OUT_DIR = 'output/playtest-intergalactic';
const DEFAULT_BROWSER = 'chromium';

const BROWSERS = {
  chromium,
  webkit,
};

function parseArgs(argv) {
  const args = {
    url: DEFAULT_URL,
    outDir: DEFAULT_OUT_DIR,
    browser: DEFAULT_BROWSER,
  };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === '--url' && next) {
      args.url = next;
      i++;
    } else if (arg === '--out-dir' && next) {
      args.outDir = next;
      i++;
    } else if (arg === '--browser' && next) {
      args.browser = next;
      i++;
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  const launcher = BROWSERS[args.browser];
  if (!launcher) {
    throw new Error(`Unsupported browser "${args.browser}". Use one of: ${Object.keys(BROWSERS).join(', ')}`);
  }
  fs.mkdirSync(args.outDir, { recursive: true });

  const browser = await launcher.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1024 } });
  const consoleErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => {
    consoleErrors.push(err.message);
  });

  await page.goto(args.url, { waitUntil: 'networkidle' });
  await page.waitForSelector('#start', { state: 'visible' });
  await page.click('#start');
  await page.waitForTimeout(120);
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(60);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(60);
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => {
    if (typeof window.render_game_to_text !== 'function') return false;
    const snap = JSON.parse(window.render_game_to_text());
    return snap.scene === 'gameplay' && snap.gameId === 'intergalactic-games' && Boolean(snap.game);
  }, null, { timeout: 5000 });

  const snapshot = async () => JSON.parse(await page.evaluate(() => window.render_game_to_text()));
  const command = async (action, payload) => page.evaluate(
    ([nextAction, nextPayload]) => window.__vibeDebug?.command(nextAction, nextPayload),
    [action, payload],
  );
  const step = async (frames = 1) => {
    for (let i = 0; i < frames; i++) {
      await page.evaluate(() => window.advanceTime?.(1000 / 60));
    }
  };

  let snap = await snapshot();
  if (snap.gameId !== 'intergalactic-games' && snap.game?.gameId !== 'intergalactic-games') {
    throw new Error(`Expected intergalactic-games, got ${JSON.stringify(snap)}`);
  }
  await page.screenshot({ path: path.join(args.outDir, '01-aim.png') });

  await command('solve');
  await step(3);
  await page.screenshot({ path: path.join(args.outDir, '02-solved-aim.png') });
  await page.keyboard.press('Enter');
  await step(8);
  await page.screenshot({ path: path.join(args.outDir, '03-flight-start.png') });

  let capturedMidflight = false;
  for (let i = 0; i < 420; i++) {
    snap = await snapshot();
    const game = snap.game ?? snap;
    if (game.phase === 'debrief') break;
    if (game.phase === 'flight') {
      const cursor = game.flight.signalCursor;
      if (Math.abs(cursor - 0.5) < 0.055) {
        await page.keyboard.press('Space');
      }
      if (!capturedMidflight && game.flight.progress > 0.45) {
        await page.screenshot({ path: path.join(args.outDir, '04-midflight.png') });
        capturedMidflight = true;
      }
    }
    await step(1);
  }

  snap = await snapshot();
  const game = snap.game ?? snap;
  if (!capturedMidflight) {
    await page.screenshot({ path: path.join(args.outDir, '04-midflight.png') });
  }
  await page.screenshot({ path: path.join(args.outDir, '05-debrief.png') });
  await browser.close();

  const report = {
    browser: args.browser,
    url: args.url,
    outDir: args.outDir,
    reachedDebrief: game.phase === 'debrief',
    outcome: game.debrief?.outcome ?? null,
    finalSnapshot: snap,
    consoleErrors,
  };

  fs.writeFileSync(
    path.join(args.outDir, 'report.json'),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8',
  );
  console.log(JSON.stringify(report, null, 2));
  if (!report.reachedDebrief) {
    throw new Error(`Playtest did not reach debrief; ended in ${game.phase}`);
  }
  if (report.outcome !== 'success') {
    throw new Error(`Expected successful orbit; got ${report.outcome}`);
  }
  if (consoleErrors.length) {
    throw new Error(`Console errors found: ${consoleErrors.join('\n')}`);
  }
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
