import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const DEFAULT_URL = 'http://127.0.0.1:5173';
const DEFAULT_OUT_DIR = 'output/playtest-starship';

function parseArgs(argv) {
  const args = {
    url: DEFAULT_URL,
    outDir: DEFAULT_OUT_DIR,
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
    }
  }
  return args;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

async function main() {
  const args = parseArgs(process.argv);
  fs.mkdirSync(args.outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1024 } });
  const consoleErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => {
    consoleErrors.push(err.message);
  });

  await page.goto(args.url, { waitUntil: 'networkidle' });
  await page.click('#start');
  await page.waitForTimeout(120);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(80);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(80);

  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas not found');

  const snapshot = async () => JSON.parse(await page.evaluate(() => window.render_game_to_text()));
  const step = async (frames = 1) => {
    for (let i = 0; i < frames; i++) {
      await page.evaluate(() => window.advanceTime?.(1000 / 60));
    }
  };
  const setControl = async (control, value) => {
    await page.evaluate(
      ([nextControl, nextValue]) => window.__vibeDebug?.command('setControl', { control: nextControl, value: nextValue }),
      [control, value],
    );
  };

  let snap = await snapshot();
  await page.screenshot({ path: path.join(args.outDir, '01-prep.png') });

  const target = snap.game.telemetry.estimatedTarget;
  const baseRatio = clamp((target - 150) / 800, 0, 1);
  await setControl('baseThrust', baseRatio);
  await step(3);
  await page.screenshot({ path: path.join(args.outDir, '02-prep-tuned.png') });

  await page.keyboard.press('Enter');
  for (let i = 0; i < 240; i++) {
    snap = await snapshot();
    if (snap.game.phase !== 'commit') break;
    if (Math.abs(snap.game.commit.cursor - 0.5) < 0.02) {
      await page.keyboard.press('Space');
      break;
    }
    await step(1);
  }

  await step(6);
  await page.screenshot({ path: path.join(args.outDir, '03-commit-fired.png') });

  await setControl('throttle', 0.98);
  let capturedAscent = false;
  for (let i = 0; i < 420; i++) {
    snap = await snapshot();
    if (snap.game.phase === 'debrief') break;

    if (!capturedAscent && snap.game.ascent.altitude > snap.game.ascent.targetAltitude * 0.25) {
      await page.screenshot({ path: path.join(args.outDir, '04-ascent.png') });
      capturedAscent = true;
    }

    const heat = snap.game.ascent.heat;
    const altitudeRatio = snap.game.ascent.altitude / snap.game.ascent.targetAltitude;
    const activeEvent = snap.game.activeEvent;

    if (heat > 112 || activeEvent === 'Reactor Spike') {
      await page.keyboard.down(' ');
      await setControl('throttle', altitudeRatio > 0.8 ? 0.72 : 0.58);
      await step(12);
      await page.keyboard.up(' ');
    } else if (heat < 74) {
      await setControl('throttle', altitudeRatio > 0.7 ? 0.92 : 0.98);
      await step(10);
    } else {
      await setControl('throttle', 0.84);
      await step(10);
    }
  }

  snap = await snapshot();
  if (!capturedAscent) {
    await page.screenshot({ path: path.join(args.outDir, '04-ascent.png') });
  }
  await page.screenshot({ path: path.join(args.outDir, '05-final.png') });
  await browser.close();

  const report = {
    url: args.url,
    outDir: args.outDir,
    finalSnapshot: snap,
    consoleErrors,
  };

  fs.writeFileSync(
    path.join(args.outDir, 'report.json'),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8',
  );
  console.log(JSON.stringify(report, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
