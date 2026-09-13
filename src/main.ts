import './style.css';
import { AudioManager } from './core/audio';
import { InputManager } from './core/input';
import { SceneManager } from './core/sceneManager';
import { Stage } from './core/stage';
import { games } from './games/manifest';
import { createGameplayScene } from './scenes/gameplayScene';
import { createLandingScene } from './scenes/landingScene';

declare global {
  interface Window {
    render_game_to_text?: () => string;
    advanceTime?: (ms: number) => void;
    __spacegamesDebug?: {
      currentScene: () => string;
      snapshot: () => unknown;
      advanceTime: (ms: number) => unknown;
      command: (action: string, payload?: unknown) => unknown;
      focusStage: () => void;
      resumeRealtime: () => void;
    };
  }
}

const canvas = document.getElementById('stage') as HTMLCanvasElement;

const stage = new Stage(canvas);
const audio = new AudioManager();
const input = new InputManager();
const scenes = new SceneManager({ stage, audio, input, manifest: games });

function focusStage() {
  canvas.focus({ preventScroll: true });
}

canvas.addEventListener('pointerdown', focusStage);

scenes.register('menu', createLandingScene);
scenes.register('gameplay', (ctx) => {
  requestAnimationFrame(focusStage);
  return createGameplayScene(ctx);
});
scenes.goto('menu');

const STEP = 1 / 60;
let acc = 0;
let last = performance.now();
let manualClock = false;

function stepSimulation(deltaSeconds: number) {
  acc += deltaSeconds;
  while (acc >= STEP) {
    input.beginFrame();
    scenes.update(STEP);
    acc -= STEP;
  }
}

function renderFrame() {
  scenes.render();
}

function snapshotState() {
  return scenes.debugSnapshot();
}

function loop(now: number) {
  if (manualClock) {
    requestAnimationFrame(loop);
    return;
  }
  const delta = Math.min(0.25, (now - last) / 1000);
  last = now;
  stepSimulation(delta);
  renderFrame();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

if (import.meta.env.DEV) {
  window.advanceTime = (ms: number) => {
    manualClock = true;
    let remaining = Math.max(0, ms) / 1000;
    while (remaining > 0) {
      const chunk = Math.min(0.25, remaining);
      stepSimulation(chunk);
      remaining -= chunk;
    }
    renderFrame();
  };

  window.render_game_to_text = () => JSON.stringify(snapshotState());
  window.__spacegamesDebug = {
    currentScene: () => scenes.current(),
    snapshot: () => snapshotState(),
    advanceTime: (ms: number) => {
      window.advanceTime?.(ms);
      return snapshotState();
    },
    command: (action: string, payload?: unknown) => scenes.debugAction(action, payload),
    focusStage,
    resumeRealtime: () => {
      manualClock = false;
      last = performance.now();
    },
  };
}
