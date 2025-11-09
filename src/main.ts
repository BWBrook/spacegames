import './style.css';
import { AudioManager } from './core/audio';
import { InputManager } from './core/input';
import { SceneManager } from './core/sceneManager';
import { Stage } from './core/stage';
import { games } from './games/manifest';
import { createGameplayScene } from './scenes/gameplayScene';
import { createMenuScene } from './scenes/menuScene';

const canvas = document.getElementById('stage') as HTMLCanvasElement;
const gate = document.getElementById('gate')!;
const startBtn = document.getElementById('start') as HTMLButtonElement;

const stage = new Stage(canvas);
const audio = new AudioManager();
const input = new InputManager();
const scenes = new SceneManager({ stage, audio, input, manifest: games });

scenes.register('menu', createMenuScene);
scenes.register('gameplay', createGameplayScene);
scenes.goto('menu');

const STEP = 1 / 60;
let acc = 0;
let last = performance.now();

function loop(now: number) {
  const delta = Math.min(0.25, (now - last) / 1000);
  last = now;
  input.beginFrame();
  acc += delta;
  while (acc >= STEP) {
    scenes.update(STEP);
    acc -= STEP;
  }
  scenes.render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

startBtn.addEventListener('click', async () => {
  await audio.unlock();
  gate.classList.add('hidden');
  try {
    const beep = await audio.load('/audio/bleep.wav');
    audio.play(beep, 0, 0.2);
  } catch {
    // optional asset; ignore if missing
  }
});
