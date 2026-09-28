/**
 * Trip into the Future, in the storybook register: flat colour, one shadow
 * tone and an ink line, a finned rocket, a domed city of the future, and a
 * child standing in for the reader. The play panel below is laid out like
 * the book's listing panel, with bracket rules explaining the live values.
 */
import { glow, linear, radial } from '../core/paint/airbrush';
import { alpha, shade } from '../core/paint/color';
import { INK, ellipse, inkLine, inked, poly, rect } from '../core/paint/ink';
import { robot } from '../core/paint/robot';
import { between, seeded, type Rng } from '../core/paint/rng';
import { bracketNote, panel } from '../core/print/panel';
import { set } from '../core/print/type';
import type { Frame } from './frame';

type G = CanvasRenderingContext2D;

const C = {
  skyTop: '#e8483f',
  skyMid: '#f2685a',
  skyLow: '#f6b25a',
  sun: '#fff0b8',
  far: '#e98a5e',
  mesa: '#c9523f',
  ground: '#b8453a',
  rock: '#9a3a34',
  glass: '#7fd6d8',
  teal: '#51b2ba',
  slate: '#6b7a98',
  cream: '#f6ead0',
  gold: '#edc84d',
  green: '#4fa05a',
  red: '#e0412f',
  blue: '#3b5ba8',
} as const;

function sky(g: G, w: number, horizon: number) {
  g.fillStyle = linear(g, 0, 0, 0, horizon, [[0, C.skyTop], [0.55, C.skyMid], [1, C.skyLow]]);
  g.fillRect(0, 0, w, horizon + 4);
  glow(g, 910, horizon - 70, 260, '#ffd27a', 0.55);
  inked(g, ellipse(910, horizon - 70, 64, 64), C.sun, { line: 0, ink: 'transparent' });
  // Earth, small and far off, the place the voyage returns to.
  const earth = ellipse(1120, 118, 30, 30);
  inked(g, earth, '#4f9fd8', { line: 2, light: ellipse(1110, 108, 14, 12), shadow: ellipse(1136, 132, 30, 30) });
  const land = new Path2D();
  land.moveTo(1102, 112);
  land.bezierCurveTo(1104, 100, 1120, 96, 1126, 104);
  land.bezierCurveTo(1132, 112, 1122, 116, 1128, 124);
  land.bezierCurveTo(1122, 132, 1108, 128, 1110, 120);
  land.closePath();
  g.save();
  g.clip(earth);
  inked(g, land, '#5bb36a', { line: 1.4 });
  g.restore();
}

function farRange(g: G, rng: Rng, w: number, base: number) {
  const points: [number, number][] = [[0, base]];
  for (let x = 0; x <= w; x += 46) points.push([x, base - between(rng, 30, 95)]);
  points.push([w, base]);
  inked(g, poly(points), C.far, { line: 1.6, ink: shade(C.far, -0.45) });
}

function jaggedRock(g: G, rng: Rng, x: number, base: number, width: number, height: number, fill: string) {
  const points: [number, number][] = [[x, base]];
  const peaks = 4 + Math.floor(rng() * 3);
  for (let i = 1; i < peaks; i += 1) {
    const px = x + (i / peaks) * width + between(rng, -width * 0.06, width * 0.06);
    points.push([px, base - height * between(rng, 0.45, 1)]);
  }
  points.push([x + width, base]);
  const shape = poly(points);
  const shadow = poly([[x + width * 0.55, base], ...points.slice(Math.ceil(points.length / 2)), [x + width, base]]);
  inked(g, shape, fill, { shadow, line: 2.4 });
}

function tower(g: G, x: number, base: number, width: number, height: number, fill: string, rounded: boolean) {
  const top = base - height;
  let body = rect(x, top, width, height + 2);
  if (rounded) {
    body = new Path2D();
    body.moveTo(x, base + 2);
    body.lineTo(x, top + width / 2);
    body.arc(x + width / 2, top + width / 2, width / 2, Math.PI, 0);
    body.lineTo(x + width, base + 2);
    body.closePath();
  }
  inked(g, body, fill, { line: 1.8, shadow: rect(x + width * 0.62, top, width, height + 2) });
  g.fillStyle = alpha('#fff4c4', 0.9);
  for (let wy = top + (rounded ? width * 0.7 : 8); wy < base - 8; wy += 11) {
    for (let wx = x + 4; wx < x + width - 5; wx += 8) g.fillRect(wx, wy, 3.5, 5);
  }
}

function dome(g: G, rng: Rng, cx: number, base: number, r: number) {
  const glass = new Path2D();
  glass.moveTo(cx - r, base);
  glass.ellipse(cx, base, r, r * 0.86, 0, Math.PI, 0);
  glass.closePath();
  g.save();
  g.clip(glass);
  const fills = [C.cream, C.slate, C.gold, '#e7d9b8', '#8c9bb8', C.teal];
  let x = cx - r * 0.9;
  while (x < cx + r * 0.85) {
    const tw = between(rng, r * 0.09, r * 0.18);
    const th = between(rng, r * 0.25, r * 0.78) * (1 - Math.abs(x - cx) / (r * 1.3));
    tower(g, x, base, tw, th, fills[Math.floor(rng() * fills.length)]!, rng() < 0.35);
    x += tw + between(rng, 1, 5);
  }
  for (let i = 0; i < Math.round(r / 12); i += 1) {
    const tx = cx + between(rng, -r * 0.85, r * 0.85);
    const tr = between(rng, r * 0.05, r * 0.09);
    inked(g, ellipse(tx, base - tr * 0.8, tr, tr), C.green, { line: 1.5, shadow: ellipse(tx + tr * 0.5, base - tr * 0.4, tr, tr) });
  }
  g.fillStyle = alpha(C.glass, 0.26);
  g.fill(glass);
  g.restore();
  g.save();
  g.clip(glass);
  g.strokeStyle = alpha('#ffffff', 0.7);
  g.lineWidth = r * 0.06;
  g.lineCap = 'round';
  g.beginPath();
  g.ellipse(cx, base, r * 0.82, r * 0.7, 0, Math.PI * 1.12, Math.PI * 1.42);
  g.stroke();
  g.lineWidth = r * 0.025;
  g.beginPath();
  g.ellipse(cx, base, r * 0.72, r * 0.6, 0, Math.PI * 1.5, Math.PI * 1.56);
  g.stroke();
  g.restore();
  g.strokeStyle = INK;
  g.lineWidth = 2.6;
  g.stroke(glass);
  // The ribs of the dome.
  g.strokeStyle = alpha(INK, 0.35);
  g.lineWidth = 1.2;
  for (const k of [0.45, 0.8]) {
    g.beginPath();
    g.ellipse(cx, base, r * k, r * 0.86, 0, Math.PI, 0);
    g.stroke();
  }
}

function monorail(g: G, points: ReadonlyArray<readonly [number, number]>, ground: number) {
  inkLine(g, points, 11);
  g.strokeStyle = C.cream;
  g.lineWidth = 6.5;
  g.beginPath();
  points.forEach(([x, y], i) => (i === 0 ? g.moveTo(x, y) : g.lineTo(x, y)));
  g.stroke();
  for (const [x, y] of points.slice(1, -1)) inked(g, rect(x - 3, y + 5, 6, ground - y - 5), C.slate, { line: 1.6 });
}

function car(g: G, x: number, y: number) {
  inked(g, rect(x - 34, y - 12, 68, 16, 8), C.red, { line: 2, shadow: rect(x - 34, y - 2, 68, 8) });
  g.fillStyle = '#bdeef0';
  for (let i = 0; i < 4; i += 1) g.fillRect(x - 26 + i * 14, y - 8, 9, 6);
}

function disc(g: G, x: number, y: number) {
  inked(g, ellipse(x, y, 58, 13), C.gold, { line: 2.2, shadow: ellipse(x, y + 8, 58, 9) });
  inked(g, ellipse(x, y - 9, 22, 14), '#bdeef0', { line: 2, light: ellipse(x - 7, y - 14, 7, 4) });
  for (const dx of [-38, -12, 12, 38]) {
    g.fillStyle = '#fff4c4';
    g.beginPath();
    g.arc(x + dx, y + 2, 3, 0, Math.PI * 2);
    g.fill();
  }
}

function rocket(g: G, x: number, base: number, height: number) {
  const w = height * 0.2;
  const top = base - height;
  // Launch ring.
  inked(g, ellipse(x, base + 4, w * 1.35, w * 0.32), C.slate, { line: 2.2, shadow: ellipse(x, base + 10, w * 1.35, w * 0.28) });
  // Fins behind the body.
  const fin = (side: number) => poly([
    [x + side * w * 0.42, base - height * 0.36],
    [x + side * w * 1.25, base - height * 0.08],
    [x + side * w * 1.15, base + 2],
    [x + side * w * 0.46, base - height * 0.06],
  ]);
  inked(g, fin(-1), C.red, { line: 2.4, light: poly([[x - w * 0.5, base - height * 0.3], [x - w * 1.1, base - height * 0.07], [x - w * 1.05, base - height * 0.03]]) });
  inked(g, fin(1), C.red, { line: 2.4, shadow: fin(1) });
  // The body: a straight barrel under an ogive nose.
  const body = new Path2D();
  body.moveTo(x - w * 0.5, base - height * 0.02);
  body.lineTo(x - w * 0.5, base - height * 0.55);
  body.bezierCurveTo(x - w * 0.5, base - height * 0.82, x - w * 0.18, top + height * 0.06, x, top);
  body.bezierCurveTo(x + w * 0.18, top + height * 0.06, x + w * 0.5, base - height * 0.82, x + w * 0.5, base - height * 0.55);
  body.lineTo(x + w * 0.5, base - height * 0.02);
  body.closePath();
  inked(g, body, C.cream, { line: 2.8, shadow: rect(x + w * 0.16, top, w, height) });
  g.save();
  g.clip(body);
  g.fillStyle = C.teal;
  g.fillRect(x - w, top, w * 2, height * 0.2);
  g.fillStyle = shade(C.teal, -0.25);
  g.fillRect(x + w * 0.16, top, w, height * 0.2);
  g.fillStyle = C.red;
  g.fillRect(x - w, base - height * 0.47, w * 2, height * 0.05);
  g.fillStyle = shade(C.red, -0.25);
  g.fillRect(x + w * 0.16, base - height * 0.47, w, height * 0.05);
  g.restore();
  g.save();
  g.clip(body);
  inkLine(g, [[x - w, top + height * 0.2], [x + w, top + height * 0.2]], 2);
  g.restore();
  g.strokeStyle = INK;
  g.lineWidth = 2.8;
  g.stroke(body);
  // Portholes down the barrel.
  for (const t of [0.3, 0.52, 0.72]) {
    const py = top + height * t;
    inked(g, ellipse(x - w * 0.05, py, w * 0.2, w * 0.2), C.slate, { line: 2.2 });
    inked(g, ellipse(x - w * 0.05, py, w * 0.13, w * 0.13), '#9fe2f0', { line: 1.6, light: ellipse(x - w * 0.1, py - w * 0.05, w * 0.05, w * 0.04) });
  }
  // A lightning flash of livery.
  inked(g, poly([
    [x + w * 0.08, base - height * 0.4], [x + w * 0.32, base - height * 0.4], [x + w * 0.16, base - height * 0.3],
    [x + w * 0.34, base - height * 0.3], [x + w * 0.02, base - height * 0.16], [x + w * 0.14, base - height * 0.26], [x - w * 0.02, base - height * 0.26],
  ]), C.gold, { line: 1.8 });
  // The centre fin, facing us.
  inked(g, poly([[x - w * 0.02, base - height * 0.24], [x + w * 0.02, base - height * 0.24], [x + w * 0.06, base + 10], [x - w * 0.06, base + 10]]), C.red, { line: 2.2, shadow: poly([[x, base - height * 0.24], [x + w * 0.02, base - height * 0.24], [x + w * 0.06, base + 10], [x, base + 10]]) });
  inked(g, rect(x - w * 0.3, base - height * 0.02, w * 0.6, height * 0.035, 3), C.slate, { line: 2 });
}

function child(g: G, x: number, feet: number, s: number) {
  const u = s / 100;
  // Trainers and legs.
  for (const [dx, lean] of [[-9, -1], [9, 1]] as const) {
    inked(g, poly([[x + dx * u - 7 * u, feet - 44 * u], [x + dx * u + 7 * u, feet - 44 * u], [x + dx * u + 6 * u + lean * 2 * u, feet - 6 * u], [x + dx * u - 6 * u + lean * 2 * u, feet - 6 * u]]), C.blue, { line: 2, shadow: rect(x + dx * u + 1 * u, feet - 44 * u, 8 * u, 40 * u) });
    inked(g, rect(x + dx * u - 9 * u + lean * 2 * u, feet - 8 * u, 18 * u, 8 * u, 3 * u), '#fbf6ee', { line: 2 });
    inkLine(g, [[x + dx * u - 6 * u + lean * 2 * u, feet - 4 * u], [x + dx * u + 6 * u + lean * 2 * u, feet - 4 * u]], 1.6, C.red);
  }
  // Jumper, with one arm raised towards the city.
  const jumper = poly([[x - 17 * u, feet - 44 * u], [x - 19 * u, feet - 86 * u], [x - 10 * u, feet - 94 * u], [x + 12 * u, feet - 94 * u], [x + 19 * u, feet - 86 * u], [x + 17 * u, feet - 44 * u]]);
  inked(g, jumper, C.green, { line: 2.2, shadow: rect(x + 4 * u, feet - 96 * u, 20 * u, 54 * u) });
  inked(g, poly([[x - 18 * u, feet - 86 * u], [x - 26 * u, feet - 60 * u], [x - 20 * u, feet - 56 * u], [x - 13 * u, feet - 80 * u]]), C.green, { line: 2 });
  inked(g, poly([[x + 16 * u, feet - 90 * u], [x + 44 * u, feet - 110 * u], [x + 48 * u, feet - 104 * u], [x + 19 * u, feet - 80 * u]]), C.green, { line: 2, shadow: poly([[x + 19 * u, feet - 84 * u], [x + 48 * u, feet - 104 * u], [x + 46 * u, feet - 101 * u], [x + 19 * u, feet - 80 * u]]) });
  inked(g, ellipse(x + 49 * u, feet - 109 * u, 5 * u, 5 * u), '#f1c9a5', { line: 1.8 });
  inked(g, ellipse(x - 23 * u, feet - 56 * u, 5 * u, 5 * u), '#f1c9a5', { line: 1.8 });
  // Head from behind: mostly hair, one ear.
  inked(g, ellipse(x + 13 * u, feet - 112 * u, 3.5 * u, 5 * u), '#f1c9a5', { line: 1.6 });
  inked(g, ellipse(x, feet - 114 * u, 14 * u, 16 * u), '#e7b84c', { line: 2.2, shadow: ellipse(x + 8 * u, feet - 108 * u, 12 * u, 16 * u) });
  inkLine(g, [[x - 8 * u, feet - 124 * u], [x - 2 * u, feet - 118 * u]], 1.4);
  inkLine(g, [[x + 2 * u, feet - 127 * u], [x + 6 * u, feet - 120 * u]], 1.4);
}

function playPanel(g: G) {
  const box = { x: 34, y: 604, w: 830, h: 170 };
  panel(g, box, '#fbf7ec', INK);
  set(g, 'How the voyage works', box.x + 20, box.y + 14, { face: 'grotesque', size: 20, color: INK, weight: 800 });
  const lines = [
    ['YEARS TO PASS ON EARTH', '67'],
    ['SPEED OF SHIP (0-1)', '0.95'],
    ['DISTANCE OF TRIP', '58'],
    ['TIME ABOARD', '19.1 YEARS'],
  ] as const;
  const top = box.y + 50;
  lines.forEach(([label, value], i) => {
    set(g, label, box.x + 20, top + i * 28, { face: 'mono', size: 17, color: INK, weight: 700 });
    set(g, value, box.x + 330, top + i * 28, { face: 'mono', size: 17, color: i === 1 || i === 2 ? C.red : INK, weight: 700 });
  });
  const noteX = box.x + 492;
  const noteColor = INK;
  bracketNote(g, { x: box.x + 470, top: top + 8, bottom: top + 8, noteX, text: 'Set by the computer. Earth’s calendar is the one that counts.', width: 330, color: noteColor, size: 14 });
  bracketNote(g, { x: box.x + 470, top: top + 30, bottom: top + 70, noteX, text: 'Your choices: how fast, as a fraction of light, and how far.', width: 330, color: noteColor, size: 14 });
  bracketNote(g, { x: box.x + 470, top: top + 92, bottom: top + 92, noteX, text: 'Time runs slow aboard. You must not outlive the trip.', width: 330, color: noteColor, size: 14 });
}

function draw(g: G, w: number, h: number) {
  const rng = seeded(1982);
  const horizon = 470;
  sky(g, w, horizon);
  farRange(g, rng, w, horizon + 6);
  g.fillStyle = C.mesa;
  g.fillRect(0, horizon, w, h - horizon);
  dome(g, rng, 1080, horizon + 2, 190);
  dome(g, rng, 830, horizon + 8, 128);
  dome(g, rng, 680, horizon + 14, 74);
  monorail(g, [[600, horizon - 40], [720, horizon - 70], [860, horizon - 96], [980, horizon - 88], [1280, horizon - 130]], horizon + 10);
  car(g, 920, horizon - 100);
  disc(g, 760, 220);
  inked(g, poly([[0, horizon + 30], [300, horizon + 10], [640, horizon + 70], [1280, horizon + 80], [1280, h], [0, h]]), C.ground, { line: 2.6 });
  // A worn track from the launch pad towards the city.
  const track = new Path2D();
  track.moveTo(360, 600);
  track.bezierCurveTo(520, 590, 520, 540, 640, 520);
  track.bezierCurveTo(700, 510, 760, 500, 800, 492);
  track.lineTo(822, 494);
  track.bezierCurveTo(760, 512, 700, 530, 660, 548);
  track.bezierCurveTo(560, 590, 560, 618, 420, 640);
  track.closePath();
  inked(g, track, shade(C.ground, 0.16), { line: 1.6, ink: shade(C.ground, -0.4) });
  // Craters and scattered stones on the near ground.
  for (let i = 0; i < 16; i += 1) {
    const sx = between(rng, 20, 1260);
    const sy = between(rng, horizon + 70, 600);
    const sr = between(rng, 5, 16);
    inked(g, ellipse(sx, sy, sr * 1.6, sr * 0.5), shade(C.ground, -0.18), { line: 1.6 });
  }
  for (let i = 0; i < 9; i += 1) {
    const sx = between(rng, 60, 1240);
    const sy = between(rng, horizon + 40, 590);
    const sr = between(rng, 6, 14);
    jaggedRock(g, rng, sx, sy, sr * 3, sr * 1.8, shade(C.rock, 0.1));
  }
  jaggedRock(g, rng, 1070, 640, 220, 150, C.rock);
  jaggedRock(g, rng, -30, 600, 180, 190, C.rock);
  rocket(g, 300, 588, 400);
  child(g, 470, 596, 118);
  // Title and story, printed straight onto the painting as the book does.
  set(g, 'Trip into the Future', 40, 34, { face: 'grotesque', size: 46, color: INK, weight: 800 });
  set(g, 'Near the speed of light, time aboard runs slow. Earth wants you home a set number of years from now. Choose how far and how fast, and do not grow old on the way.', 42, 96, { face: 'slab', size: 19, color: INK, width: 470, leading: 1.28 });
  playPanel(g);
  robot(g, 950, 772, 132, { body: '#e98a3a', crate: { label: 'V', color: C.gold } });
  robot(g, 1100, 772, 132, { body: '#9a7fd1', label: 'SQR', wave: true });
  // A faint grain over the painted areas keeps the flat colour from looking digital.
  g.save();
  g.globalAlpha = 0.05;
  g.fillStyle = radial(g, w / 2, h / 2, 0, w * 0.8, [[0, 'rgba(0,0,0,0)'], [1, '#2a0f18']]);
  g.fillRect(0, 0, w, h);
  g.restore();
}

export const tripFrame: Frame = {
  id: 'trip',
  title: 'Trip into the Future',
  note: 'The storybook register: flat colour, one shadow tone and an ink line, with the play panel laid out like the book’s listing panel. Does it feel like the book?',
  draw,
};
