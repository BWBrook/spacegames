/**
 * Starship Take-Off, in the painted-place register: a magenta sky, a ringed
 * planet, a captured alien ship with a scaled carapace hovering on green
 * beams over bubbling acid rock, and the red crab-like aliens closing in.
 * Every surface is airbrushed: a hard mask filled with a soft spray.
 */
import { glint, glow, grain, linear, radial, rim, spray, within } from '../core/paint/airbrush';
import { alpha, mix, shade } from '../core/paint/color';
import { planet, starfield } from '../core/paint/motifs';
import { between, seeded, type Rng } from '../core/paint/rng';
import { bracketNote, machineMark, panel } from '../core/print/panel';
import { set } from '../core/print/type';
import type { Frame } from './frame';

type G = CanvasRenderingContext2D;

const C = {
  skyTop: '#6e1457',
  skyMid: '#d8398f',
  skyLow: '#fcb3d8',
  acid: '#c8e25a',
  lizard: '#5f9a4e',
  deep: '#1e3a22',
  pool: '#e46fb2',
  teal: '#53aeb5',
  red: '#e8352e',
  ink: '#2a0c24',
} as const;

function sky(g: G, rng: Rng, w: number, horizon: number) {
  g.fillStyle = linear(g, 0, 0, 0, horizon, [[0, C.skyTop], [0.5, C.skyMid], [1, C.skyLow]]);
  g.fillRect(0, 0, w, horizon + 60);
  starfield(g, rng, 0, 0, w, horizon * 0.45, { count: 140, bright: 0.02 });
  planet(g, 1010, 190, 118, {
    base: C.teal, rng, bands: ['#9fe3dd', '#2c7c86', '#c6f2ea', '#3f96a0'],
    ring: { color: '#ffe4f2', tilt: -0.32, inner: 1.35, outer: 2.05 }, atmosphere: '#c9fff6',
  });
  planet(g, 600, 92, 26, { base: '#f0c0de', rng, light: -0.6 });
}

function acidGround(g: G, rng: Rng, w: number, h: number, horizon: number) {
  const land = new Path2D();
  land.moveTo(0, horizon + 20);
  for (let x = 0; x <= w; x += 40) land.lineTo(x, horizon + 10 + Math.sin(x * 0.013) * 14 + between(rng, -6, 6));
  land.lineTo(w, h);
  land.lineTo(0, h);
  land.closePath();
  spray(g, land, 0, horizon, 0, h, [[0, mix(C.acid, C.skyLow, 0.35)], [0.25, C.lizard], [1, C.deep]]);
  within(g, land, () => {
    // A haze where the ground meets the pink sky.
    g.fillStyle = linear(g, 0, horizon, 0, horizon + 70, [[0, alpha(C.skyLow, 0.55)], [1, alpha(C.skyLow, 0)]]);
    g.fillRect(0, horizon, w, 80);
  });
  // Pink pools reflecting the sky.
  for (const [px, py, rx] of [[520, 640, 120], [900, 700, 150], [150, 690, 90]] as const) {
    const pool = new Path2D();
    pool.ellipse(px, py, rx, rx * 0.18, 0, 0, Math.PI * 2);
    spray(g, pool, 0, py - rx * 0.18, 0, py + rx * 0.18, [[0, '#ffd0ea'], [0.5, C.pool], [1, shade(C.pool, -0.35)]]);
    g.strokeStyle = alpha('#ffffff', 0.6);
    g.lineWidth = 2;
    g.beginPath();
    g.ellipse(px - rx * 0.1, py - rx * 0.04, rx * 0.6, rx * 0.06, 0, Math.PI * 1.05, Math.PI * 1.6);
    g.stroke();
  }
  // Bubbles of acid rock, back to front, each an airbrushed sphere.
  const bubbles: [number, number, number][] = [];
  for (let i = 0; i < 70; i += 1) {
    const y = between(rng, horizon + 20, h + 20);
    const depth = (y - horizon) / (h - horizon);
    bubbles.push([between(rng, -20, w + 20), y, between(rng, 6, 40) * (0.4 + depth)]);
  }
  bubbles.sort((a, b) => a[1] - b[1]);
  for (const [bx, by, br] of bubbles) {
    if (by < horizon + 30 && rng() < 0.5) continue;
    const depth = Math.min(1, (by - horizon) / (h - horizon));
    const bubble = new Path2D();
    bubble.arc(bx, by, br, 0, Math.PI * 2);
    g.fillStyle = radial(g, bx, by, br * 0.1, br * 1.05, [
      [0, shade(C.acid, 0.45)], [0.35, C.acid], [0.8, mix(C.lizard, C.deep, depth * 0.5)], [1, shade(C.deep, -0.2)],
    ], bx - br * 0.4, by - br * 0.45);
    g.fill(bubble);
    rim(g, bubble, '#fff7c8', 1.2, 0.35);
    if (br > 14) glint(g, bx - br * 0.4, by - br * 0.45, br * 0.5);
  }
}

function crab(g: G, x: number, y: number, s: number, facing: number) {
  g.save();
  g.translate(x, y);
  g.scale(facing, 1);
  const leg = (angle: number, len: number) => {
    const kx = Math.cos(angle) * len * 0.55;
    const ky = -Math.abs(Math.sin(angle)) * len * 0.35 - s * 0.1;
    const fx = Math.cos(angle) * len;
    const fy = s * 0.28;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.strokeStyle = shade(C.red, -0.45);
    g.lineWidth = s * 0.1;
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(kx, ky);
    g.lineTo(fx, fy);
    g.stroke();
    g.strokeStyle = alpha('#ffb0a0', 0.6);
    g.lineWidth = s * 0.03;
    g.beginPath();
    g.moveTo(kx * 0.2, ky * 0.2 - s * 0.02);
    g.lineTo(kx, ky - s * 0.02);
    g.stroke();
  };
  for (const a of [0.35, 0.7, 1.05]) { leg(Math.PI - a, s * 1.1); leg(a, s * 1.1); }
  // Claws, raised.
  for (const side of [-1, 1]) {
    const cx = side * s * 0.95;
    const cy = -s * 0.5;
    g.strokeStyle = shade(C.red, -0.4);
    g.lineWidth = s * 0.12;
    g.beginPath();
    g.moveTo(side * s * 0.45, -s * 0.05);
    g.quadraticCurveTo(side * s * 0.8, -s * 0.1, cx, cy + s * 0.15);
    g.stroke();
    const claw = new Path2D();
    claw.ellipse(cx, cy, s * 0.26, s * 0.18, side * 0.5, 0, Math.PI * 2);
    g.fillStyle = radial(g, cx, cy, 0, s * 0.3, [[0, '#ff8a70'], [0.6, C.red], [1, shade(C.red, -0.5)]], cx - s * 0.08, cy - s * 0.08);
    g.fill(claw);
    g.fillStyle = C.skyLow;
    g.beginPath();
    g.moveTo(cx + side * s * 0.05, cy - s * 0.02);
    g.lineTo(cx + side * s * 0.32, cy - s * 0.14);
    g.lineTo(cx + side * s * 0.3, cy + s * 0.02);
    g.closePath();
    g.fill();
  }
  // Eye stalks.
  for (const side of [-1, 1]) {
    g.strokeStyle = shade(C.red, -0.35);
    g.lineWidth = s * 0.06;
    g.beginPath();
    g.moveTo(side * s * 0.18, -s * 0.2);
    g.lineTo(side * s * 0.24, -s * 0.62);
    g.stroke();
    g.fillStyle = radial(g, side * s * 0.24, -s * 0.66, 0, s * 0.12, [[0, '#fffbd0'], [0.6, '#ffe23a'], [1, '#b88a00']]);
    g.beginPath();
    g.arc(side * s * 0.24, -s * 0.66, s * 0.11, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#1a0a10';
    g.beginPath();
    g.arc(side * s * 0.25, -s * 0.65, s * 0.045, 0, Math.PI * 2);
    g.fill();
  }
  // The shell, glossy.
  const shell = new Path2D();
  shell.ellipse(0, 0, s * 0.62, s * 0.36, 0, 0, Math.PI * 2);
  g.fillStyle = radial(g, 0, 0, s * 0.05, s * 0.66, [[0, '#ff9a80'], [0.45, C.red], [1, shade(C.red, -0.6)]], -s * 0.2, -s * 0.16);
  g.fill(shell);
  within(g, shell, () => {
    g.fillStyle = alpha('#ffffff', 0.55);
    g.beginPath();
    g.ellipse(-s * 0.16, -s * 0.18, s * 0.26, s * 0.08, -0.2, 0, Math.PI * 2);
    g.fill();
  });
  glint(g, -s * 0.28, -s * 0.2, s * 0.35);
  g.restore();
}

function scales(g: G, hull: Path2D, x: number, y: number, w: number, h: number, size: number) {
  within(g, hull, () => {
    for (let row = 0, sy = y; sy < y + h + size; row += 1, sy += size * 0.62) {
      const offset = row % 2 === 0 ? 0 : size * 0.5;
      for (let sx = x - size + offset; sx < x + w + size; sx += size) {
        g.strokeStyle = alpha(C.deep, 0.55);
        g.lineWidth = 1.6;
        g.beginPath();
        g.arc(sx, sy, size * 0.52, 0.05 * Math.PI, 0.95 * Math.PI);
        g.stroke();
        g.strokeStyle = alpha('#f4ffb0', 0.35);
        g.lineWidth = 1.1;
        g.beginPath();
        g.arc(sx, sy - size * 0.1, size * 0.4, 1.15 * Math.PI, 1.6 * Math.PI);
        g.stroke();
      }
    }
  });
}

function ship(g: G, cx: number, cy: number, r: number, ground: number) {
  // Green beams to the ground, drawn first so the hull sits in front of them.
  for (const side of [-1, 1]) {
    const bx = cx + side * r * 0.52;
    const beam = new Path2D();
    beam.moveTo(bx - r * 0.12, cy + r * 0.42);
    beam.lineTo(bx + r * 0.12, cy + r * 0.42);
    beam.lineTo(bx + r * 0.34 + side * r * 0.12, ground);
    beam.lineTo(bx - r * 0.34 + side * r * 0.12, ground);
    beam.closePath();
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.fillStyle = linear(g, 0, cy + r * 0.4, 0, ground, [[0, alpha('#b9ff7a', 0.75)], [0.6, alpha('#7dff6a', 0.28)], [1, alpha('#7dff6a', 0.05)]]);
    g.fill(beam);
    g.restore();
    glow(g, bx + side * r * 0.12, ground, r * 0.5, '#9dff6a', 0.6);
    glow(g, bx, cy + r * 0.44, r * 0.25, '#e6ff9a', 1);
  }
  // Landing legs in airbrushed chrome.
  for (const side of [-1, 0, 1]) {
    const footX = cx + side * r * 1.05;
    const footY = ground - (side === 0 ? 0 : r * 0.08);
    const strut = new Path2D();
    strut.moveTo(cx + side * r * 0.62 - 6, cy + r * 0.28);
    strut.lineTo(cx + side * r * 0.62 + 6, cy + r * 0.28);
    strut.lineTo(footX + 5, footY - 8);
    strut.lineTo(footX - 5, footY - 8);
    strut.closePath();
    if (side === 0) continue;
    spray(g, strut, footX - 10, 0, footX + 10, 0, [[0, '#3a2c34'], [0.45, '#f6f2ff'], [0.55, '#8b7f95'], [1, '#2a1f28']]);
    const pad = new Path2D();
    pad.ellipse(footX, footY - 5, r * 0.16, r * 0.05, 0, 0, Math.PI * 2);
    g.fillStyle = alpha('#0e1a10', 0.45);
    g.beginPath();
    g.ellipse(footX + 8, footY + 2, r * 0.2, r * 0.05, 0, 0, Math.PI * 2);
    g.fill();
    spray(g, pad, 0, footY - 10, 0, footY, [[0, '#ffffff'], [0.5, '#b7aac4'], [1, '#3a2c34']]);
  }
  // The carapace: a low dome with a lip, sprayed from the upper left, then scaled.
  const hull = new Path2D();
  hull.moveTo(cx - r * 1.2, cy + r * 0.2);
  hull.bezierCurveTo(cx - r * 1.2, cy - r * 0.9, cx - r * 0.5, cy - r * 1.05, cx, cy - r * 1.05);
  hull.bezierCurveTo(cx + r * 0.5, cy - r * 1.05, cx + r * 1.2, cy - r * 0.9, cx + r * 1.2, cy + r * 0.2);
  hull.bezierCurveTo(cx + r * 1.0, cy + r * 0.52, cx - r * 1.0, cy + r * 0.52, cx - r * 1.2, cy + r * 0.2);
  hull.closePath();
  g.fillStyle = radial(g, cx, cy, r * 0.05, r * 1.35, [[0, '#e9ff9a'], [0.35, C.acid], [0.7, C.lizard], [1, C.deep]], cx - r * 0.45, cy - r * 0.6);
  g.fill(hull);
  scales(g, hull, cx - r * 1.2, cy - r * 1.05, r * 2.4, r * 1.6, r * 0.2);
  within(g, hull, () => {
    g.fillStyle = radial(g, cx + r * 0.5, cy + r * 0.3, r * 0.2, r * 1.5, [[0, 'rgba(10,30,12,0.55)'], [1, 'rgba(10,30,12,0)']]);
    g.fillRect(cx - r * 1.3, cy - r * 1.2, r * 2.6, r * 1.8);
  });
  // The collar band in black, red and yellow livery.
  const band = new Path2D();
  band.moveTo(cx - r * 1.19, cy + r * 0.02);
  band.bezierCurveTo(cx - r * 0.9, cy + r * 0.3, cx + r * 0.9, cy + r * 0.3, cx + r * 1.19, cy + r * 0.02);
  band.lineTo(cx + r * 1.2, cy + r * 0.2);
  band.bezierCurveTo(cx + r * 1.0, cy + r * 0.52, cx - r * 1.0, cy + r * 0.52, cx - r * 1.2, cy + r * 0.2);
  band.closePath();
  g.fillStyle = '#16100f';
  g.fill(band);
  within(g, band, () => {
    for (const [offset, color] of [[0.13, '#e8261c'], [0.21, '#ffd21a']] as const) {
      g.strokeStyle = color;
      g.lineWidth = r * 0.055;
      g.beginPath();
      g.moveTo(cx - r * 1.25, cy + r * offset);
      g.bezierCurveTo(cx - r * 0.9, cy + r * (offset + 0.3), cx + r * 0.9, cy + r * (offset + 0.3), cx + r * 1.25, cy + r * offset);
      g.stroke();
    }
    g.fillStyle = linear(g, 0, cy, 0, cy + r * 0.5, [[0, 'rgba(255,255,255,0.35)'], [0.4, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,0,0.3)']]);
    g.fillRect(cx - r * 1.3, cy, r * 2.6, r * 0.6);
  });
  const skirt = new Path2D();
  skirt.ellipse(cx, cy + r * 0.42, r * 0.78, r * 0.12, 0, 0, Math.PI);
  skirt.closePath();
  spray(g, skirt, 0, cy + r * 0.38, 0, cy + r * 0.56, [[0, '#2b3a26'], [1, '#0d160c']]);
  for (const side of [-1, 1]) {
    const ex = cx + side * r * 0.52;
    const emitter = new Path2D();
    emitter.ellipse(ex, cy + r * 0.47, r * 0.12, r * 0.04, 0, 0, Math.PI * 2);
    g.fillStyle = radial(g, ex, cy + r * 0.47, 0, r * 0.13, [[0, '#ffffff'], [0.5, '#caff8a'], [1, '#4fbf3a']]);
    g.fill(emitter);
  }
  rim(g, hull, '#fbffd0', 2.4, 0.5);
  // The eye of the ship: an amber lens.
  const lens = new Path2D();
  lens.ellipse(cx, cy - r * 0.42, r * 0.3, r * 0.2, 0, 0, Math.PI * 2);
  g.fillStyle = '#1b0d06';
  g.fill(lens);
  const inner = new Path2D();
  inner.ellipse(cx, cy - r * 0.42, r * 0.25, r * 0.16, 0, 0, Math.PI * 2);
  g.fillStyle = radial(g, cx, cy - r * 0.42, 0, r * 0.28, [[0, '#fff6c0'], [0.3, '#ffb21a'], [1, '#6a2400']], cx - r * 0.06, cy - r * 0.47);
  g.fill(inner);
  glow(g, cx, cy - r * 0.42, r * 0.5, '#ffb21a', 0.5);
  glint(g, cx - r * 0.1, cy - r * 0.48, r * 0.22);
  glint(g, cx - r * 0.55, cy - r * 0.78, r * 0.3);
}

function playPanel(g: G) {
  const box = { x: 36, y: 574, w: 560, h: 196 };
  panel(g, box, '#fff6fa', C.ink);
  set(g, 'GRAVITY= 12', box.x + 20, box.y + 16, { face: 'mono', size: 30, color: C.ink, weight: 700 });
  set(g, 'TYPE IN FORCE', box.x + 20, box.y + 58, { face: 'mono', size: 17, color: C.ink, weight: 700 });
  const guesses = [['300', 'TOO LOW, TRY AGAIN'], ['450', 'TOO HIGH, TRY AGAIN'], ['372', '']] as const;
  guesses.forEach(([force, verdict], i) => {
    set(g, `? ${force}`, box.x + 20, box.y + 90 + i * 26, { face: 'mono', size: 17, color: i === 2 ? '#c2185b' : C.ink, weight: 700 });
    if (verdict) set(g, verdict, box.x + 100, box.y + 90 + i * 26, { face: 'mono', size: 17, color: C.ink, weight: 700 });
  });
  for (let i = 0; i < 10; i += 1) {
    g.fillStyle = i < 3 ? '#c2185b' : alpha(C.ink, 0.25);
    g.beginPath();
    g.arc(box.x + 28 + i * 20, box.y + 176, 6, 0, Math.PI * 2);
    g.fill();
  }
  bracketNote(g, { x: box.x + 300, top: box.y + 26, bottom: box.y + 26, noteX: box.x + 322, text: 'The only clue you get.', width: 220, color: C.ink, size: 14 });
  bracketNote(g, { x: box.x + 300, top: box.y + 94, bottom: box.y + 140, noteX: box.x + 322, text: 'Each miss says which way. Halve the gap every time.', width: 220, color: C.ink, size: 14 });
  bracketNote(g, { x: box.x + 300, top: box.y + 176, bottom: box.y + 176, noteX: box.x + 322, text: 'Ten goes, then the aliens win.', width: 230, color: C.ink, size: 14 });
}

function draw(g: G, w: number, h: number) {
  const rng = seeded(5);
  const horizon = 470;
  sky(g, rng, w, horizon);
  acidGround(g, rng, w, h, horizon);
  ship(g, 820, 330, 170, 600);
  crab(g, 1120, 700, 70, -1);
  crab(g, 700, 745, 52, 1);
  grain(g, w, h, 0.07);
  set(g, 'Starship Take-off', 40, 34, { face: 'grotesque', size: 46, color: '#ffffff', weight: 800 });
  set(g, 'Stranded on a hostile planet, you have seized an alien ship. Its computer shows the planet’s gravity. Guess the force that will lift you clear before the aliens reach you.', 42, 96, { face: 'slab', size: 19, color: '#ffffff', width: 430, leading: 1.28 });
  playPanel(g);
  machineMark(g, 'bbc', 1236, 50, 30, '#ffffff');
}

export const starshipFrame: Frame = {
  id: 'starship',
  title: 'Starship Take-off',
  note: 'The painted-place register in airbrush: every surface a hard mask filled with a soft spray, with glints, beams and grain, under a flat play panel. Does it feel like the book?',
  draw,
};
