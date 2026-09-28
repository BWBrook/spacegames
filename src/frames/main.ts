/**
 * Style frames: still paintings that test whether the painter and the print
 * system can carry the feeling of the book before any game is changed. Each
 * frame is judged on one question: does it feel like the book?
 */
import { coverFrame } from './cover';
import type { Frame } from './frame';
import { snipersFrame } from './snipers';
import { specimenFrame } from './specimen';
import { starshipFrame } from './starship';
import { tripFrame } from './trip';

const FRAMES: Frame[] = [coverFrame, tripFrame, starshipFrame, snipersFrame, specimenFrame];
export const FRAME_WIDTH = 1280;
export const FRAME_HEIGHT = 800;

const canvas = document.querySelector<HTMLCanvasElement>('#frame')!;
const caption = document.querySelector<HTMLElement>('#caption')!;
const nav = document.querySelector<HTMLElement>('#nav')!;
const g = canvas.getContext('2d')!;

function show(index: number) {
  const frame = FRAMES[(index + FRAMES.length) % FRAMES.length]!;
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = FRAME_WIDTH * dpr;
  canvas.height = FRAME_HEIGHT * dpr;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, FRAME_WIDTH, FRAME_HEIGHT);
  frame.draw(g, FRAME_WIDTH, FRAME_HEIGHT);
  caption.textContent = `${frame.title}. ${frame.note}`;
  nav.querySelectorAll('button').forEach(button => button.setAttribute('aria-current', String(button.dataset.id === frame.id)));
  history.replaceState(null, '', `#${frame.id}`);
  current = FRAMES.indexOf(frame);
}

let current = 0;
for (const frame of FRAMES) {
  const button = document.createElement('button');
  button.textContent = frame.title;
  button.dataset.id = frame.id;
  button.addEventListener('click', () => show(FRAMES.indexOf(frame)));
  nav.append(button);
}
window.addEventListener('hashchange', () => {
  const index = FRAMES.findIndex(frame => `#${frame.id}` === location.hash);
  if (index >= 0 && index !== current) show(index);
});
window.addEventListener('keydown', event => {
  if (event.key === 'ArrowRight') show(current + 1);
  if (event.key === 'ArrowLeft') show(current - 1);
});

const start = FRAMES.findIndex(frame => `#${frame.id}` === location.hash);
show(Math.max(0, start));

declare global {
  interface Window { styleFrames?: { ids: string[]; show: (id: string) => void } }
}
window.styleFrames = { ids: FRAMES.map(frame => frame.id), show: id => show(FRAMES.findIndex(frame => frame.id === id)) };
