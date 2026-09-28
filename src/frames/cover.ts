/**
 * The anthology's cover, for the landing page. It follows the book's idiom,
 * not its composition: a heavy red title on white, a painting entering below
 * on a curve with hardware over a canyon, and CRT insets showing what the
 * retro lanes really put on the screen.
 */
import { glint, glow, grain, linear, radial, rim, spatter, spray, within } from '../core/paint/airbrush';
import { alpha, mix } from '../core/paint/color';
import { GREEN_FIGHTER, deltaFighter } from '../core/paint/craft';
import { bolt, greebles, planet, starburst, starfield } from '../core/paint/motifs';
import { between, seeded, type Rng } from '../core/paint/rng';
import { font, set } from '../core/print/type';
import type { Frame } from './frame';

type G = CanvasRenderingContext2D;

const C = {
  paper: '#fffdf7',
  title: '#e8141f',
  duskTop: '#2a1b58',
  duskLow: '#f08a4a',
  far: '#e9a36e',
  canyon: '#b8583a',
  deep: '#4a1d16',
  hull: '#f4f6fb',
  blue: '#2b4fb8',
  red: '#e0302a',
} as const;

function paintingEdge(w: number) {
  const edge = new Path2D();
  edge.moveTo(0, 262);
  edge.bezierCurveTo(w * 0.3, 218, w * 0.7, 206, w, 250);
  edge.lineTo(w, 900);
  edge.lineTo(0, 900);
  edge.closePath();
  return edge;
}

function duskAndPlanet(g: G, rng: Rng, w: number, horizon: number) {
  g.fillStyle = linear(g, 0, 200, 0, horizon, [[0, C.duskTop], [0.6, '#8a3f7a'], [1, C.duskLow]]);
  g.fillRect(0, 180, w, horizon - 150);
  starfield(g, rng, 0, 190, w, horizon - 220, { count: 120, bright: 0.03 });
  planet(g, 1060, horizon - 18, 118, {
    base: '#e39ad0', rng, light: -2.2, bands: ['#ffe0f2', '#b0679e', '#f2b6dc'],
    ring: { color: '#fff0e6', tilt: -0.12, inner: 1.3, outer: 1.9 },
  });
}

function canyon(g: G, rng: Rng, w: number, h: number, horizon: number) {
  const land = new Path2D();
  land.moveTo(0, horizon + 6);
  for (let x = 0; x <= w; x += 32) land.lineTo(x, horizon + Math.sin(x * 0.02) * 4 + between(rng, -3, 3));
  land.lineTo(w, h);
  land.lineTo(0, h);
  land.closePath();
  spray(g, land, 0, horizon, 0, h, [[0, C.far], [0.18, mix(C.far, C.canyon, 0.6)], [0.6, C.canyon], [1, C.deep]]);
  within(g, land, () => {
    // Strata: soft lit ridges running across, closer together near the horizon.
    for (let i = 0; i < 26; i += 1) {
      const t = i / 26;
      const y = horizon + (h - horizon) * t ** 1.6;
      const amp = 6 + t * 30;
      const ridge = new Path2D();
      ridge.moveTo(0, y);
      for (let x = 0; x <= w; x += 24) ridge.lineTo(x, y + Math.sin(x * (0.006 + rng() * 0.002) + i) * amp + between(rng, -amp * 0.2, amp * 0.2));
      ridge.lineTo(w, y + 30 + t * 60);
      ridge.lineTo(0, y + 30 + t * 60);
      ridge.closePath();
      g.fillStyle = linear(g, 0, y - amp, 0, y + 20 + t * 50, [[0, alpha('#ffd7a8', 0.28 - t * 0.12)], [0.3, alpha(C.canyon, 0)], [1, alpha(C.deep, 0.25)]]);
      g.fill(ridge);
    }
    // A winding chasm from the horizon towards the viewer.
    const chasm = new Path2D();
    chasm.moveTo(700, horizon + 4);
    chasm.bezierCurveTo(640, horizon + 90, 820, horizon + 170, 610, horizon + 290);
    chasm.bezierCurveTo(470, horizon + 380, 520, h - 60, 360, h + 20);
    chasm.lineTo(250, h + 20);
    chasm.bezierCurveTo(400, h - 90, 380, horizon + 360, 560, horizon + 270);
    chasm.bezierCurveTo(740, horizon + 170, 600, horizon + 90, 690, horizon + 4);
    chasm.closePath();
    spray(g, chasm, 0, horizon, 0, h, [[0, '#6a2a1c'], [1, '#1c0a08']]);
    rim(g, chasm, '#ffc48a', 1.6, 0.45);
    // Craters, flattened by the view and bigger as they come closer.
    for (let i = 0; i < 24; i += 1) {
      const cy = between(rng, horizon + 20, h - 40);
      const t = (cy - horizon) / (h - horizon);
      const cx = between(rng, 0, w);
      const rx = between(rng, 10, 46) * (0.3 + t * 1.4);
      const ry = rx * (0.28 + t * 0.12);
      const bowl = new Path2D();
      bowl.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      g.fillStyle = linear(g, 0, cy - ry, 0, cy + ry, [[0, alpha(C.deep, 0.7)], [0.7, alpha(C.canyon, 0.2)], [1, alpha('#ffcf9a', 0.5)]]);
      g.fill(bowl);
      g.strokeStyle = alpha('#ffd9aa', 0.5);
      g.lineWidth = 1.4 + t * 1.5;
      g.beginPath();
      g.ellipse(cx, cy, rx, ry, 0, Math.PI * 1.05, Math.PI * 1.95);
      g.stroke();
    }
    spatter(g, rng, 0, horizon, w, h - horizon, 2600, '#3a140e', [0.4, 1.4], [0.1, 0.45]);
    spatter(g, rng, 0, horizon, w, h - horizon, 900, '#ffd2a0', [0.3, 1], [0.1, 0.35]);
    // Distance haze.
    g.fillStyle = linear(g, 0, horizon, 0, horizon + 120, [[0, alpha('#f6b6a0', 0.55)], [1, alpha('#f6b6a0', 0)]]);
    g.fillRect(0, horizon, w, 130);
  });
}

/** The freighter, drawn in plan and set into an oblique view with an affine transform. */
function freighter(g: G, rng: Rng, ox: number, oy: number, groundDrop: number) {
  const L = 560;
  const W = 150;
  const T = 38;
  const view = { ax: 0.97, ay: 0.16, bx: -0.42, by: 0.5 };
  const toScreen = (px: number, py: number): [number, number] => [ox + px * view.ax + py * view.bx, oy + px * view.ay + py * view.by];
  const plan = new Path2D();
  plan.moveTo(-L / 2 + W / 2, -W / 2);
  plan.lineTo(L / 2 - W * 0.9, -W / 2);
  plan.bezierCurveTo(L / 2 - W * 0.3, -W / 2, L / 2, -W * 0.12, L / 2, 0);
  plan.bezierCurveTo(L / 2, W * 0.12, L / 2 - W * 0.3, W / 2, L / 2 - W * 0.9, W / 2);
  plan.lineTo(-L / 2 + W / 2, W / 2);
  plan.arc(-L / 2 + W / 2, 0, W / 2, Math.PI / 2, Math.PI * 1.5);
  plan.closePath();
  const inPlan = (dy: number, paint: () => void) => {
    g.save();
    g.translate(0, dy);
    g.transform(view.ax, view.ay, view.bx, view.by, ox, oy);
    paint();
    g.restore();
  };
  // Its shadow on the canyon floor, then the legs down to their pads.
  inPlan(groundDrop, () => {
    g.fillStyle = 'rgba(30, 8, 6, 0.42)';
    g.translate(60, 30);
    g.fill(plan);
  });
  const legs: [number, number][] = [[-L * 0.3, -W * 0.36], [L * 0.22, -W * 0.36], [-L * 0.3, W * 0.36], [L * 0.22, W * 0.36]];
  for (const [px, py] of legs.slice(0, 2)) drawLeg(...toScreen(px, py));
  function drawLeg(sx: number, sy: number) {
    const top = sy + T;
    const foot = sy + groundDrop;
    const strut = new Path2D();
    strut.rect(sx - 7, top, 14, foot - top - 6);
    spray(g, strut, sx - 7, 0, sx + 7, 0, [[0, '#3a3440'], [0.45, '#ffffff'], [1, '#4a4450']]);
    const pad = new Path2D();
    pad.ellipse(sx, foot - 4, 26, 8, 0, 0, Math.PI * 2);
    spray(g, pad, 0, foot - 12, 0, foot + 4, [[0, '#ffffff'], [0.6, '#b8b4c4'], [1, '#3a3440']]);
  }
  // The hull wall, then the deck on top of it.
  inPlan(T, () => {
    g.fillStyle = linear(g, 0, -W / 2, 0, W / 2, [[0, '#9aa6c8'], [1, '#56608a']]);
    g.fill(plan);
  });
  inPlan(T * 0.45, () => {
    g.save();
    g.clip(plan);
    g.fillStyle = C.blue;
    g.fillRect(-L, W * 0.25, L * 2, W);
    g.fillStyle = C.red;
    g.fillRect(-L, W * 0.2, L * 2, W * 0.08);
    g.restore();
  });
  inPlan(0, () => {
    g.fillStyle = radial(g, -L * 0.1, -W * 0.3, 10, L * 0.7, [[0, '#ffffff'], [0.6, C.hull], [1, '#c3c8d8']]);
    g.fill(plan);
    greebles(g, plan, rng, -L / 2, -W / 2, L, W, alpha('#5a6080', 0.6), alpha('#ffffff', 0.9), 0.9);
    g.save();
    g.clip(plan);
    g.fillStyle = C.red;
    g.fillRect(L * 0.18, -W / 2, 14, W);
    g.fillStyle = C.blue;
    g.fillRect(L * 0.18 + 18, -W / 2, 8, W);
    g.restore();
    g.font = font('grotesque', 34, 900);
    g.fillStyle = '#1a1d2a';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('SG-13', L * 0.32, 4);
  });
  inPlan(0, () => rim(g, plan, '#ffffff', 2, 0.9));
  // The bridge: a smaller block raised on the deck, with its window band.
  const bridge = new Path2D();
  bridge.roundRect(-L * 0.3, -W * 0.3, L * 0.3, W * 0.6, W * 0.3);
  const lift = 44;
  inPlan(-lift + 26, () => {
    g.fillStyle = linear(g, 0, -W * 0.3, 0, W * 0.3, [[0, '#a7b1d0'], [1, '#5a6490']]);
    g.fill(bridge);
  });
  inPlan(-lift, () => {
    g.fillStyle = radial(g, -L * 0.2, -W * 0.2, 4, L * 0.3, [[0, '#ffffff'], [1, '#cfd4e2']]);
    g.fill(bridge);
    rim(g, bridge, '#ffffff', 1.5, 0.9);
    const windows = new Path2D();
    windows.roundRect(-L * 0.035, -W * 0.22, L * 0.03, W * 0.44, 4);
    g.fillStyle = linear(g, 0, -W * 0.22, 0, W * 0.22, [[0, '#9fe4ff'], [0.5, '#1a3a8a'], [1, '#0a1440']]);
    g.fill(windows);
  });
  const [wx, wy] = toScreen(-L * 0.02, -W * 0.1);
  glint(g, wx, wy - lift, 26);
  // A dish on the bridge.
  const [dx, dy] = toScreen(-L * 0.2, 0);
  const dish = new Path2D();
  dish.ellipse(dx, dy - lift - 30, 30, 12, -0.3, 0, Math.PI * 2);
  spray(g, dish, dx - 30, 0, dx + 30, 0, [[0, '#6a7090'], [0.5, '#ffffff'], [1, '#8a90b0']]);
  g.strokeStyle = '#5a6080';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(dx, dy - lift - 4);
  g.lineTo(dx, dy - lift - 28);
  g.stroke();
  // Engines at the stern, glowing.
  for (const py of [-W * 0.26, W * 0.26]) {
    const [ex, ey] = toScreen(-L / 2 + 10, py);
    const pod = new Path2D();
    pod.ellipse(ex - 6, ey + T * 0.5, 22, 30, 0.2, 0, Math.PI * 2);
    spray(g, pod, ex - 26, 0, ex + 20, 0, [[0, '#3a3450'], [0.5, '#d8dcf0'], [1, '#4a4466']]);
    glow(g, ex - 18, ey + T * 0.5, 60, '#7ac8ff', 0.9);
    glow(g, ex - 18, ey + T * 0.5, 22, '#ffffff', 1);
  }
  for (const [px, py] of legs.slice(2)) drawLeg(...toScreen(px, py));
  return toScreen;
}

function crt(g: G, x: number, y: number, w: number, h: number, paint: (s: G) => void, background = '#050608') {
  const bezel = new Path2D();
  bezel.roundRect(x - 12, y - 12, w + 24, h + 24, 26);
  spray(g, bezel, 0, y - 12, 0, y + h + 12, [[0, '#4a4658'], [0.5, '#1c1a24'], [1, '#0c0b10']]);
  rim(g, bezel, '#ffffff', 1.2, 0.35);
  const glass = new Path2D();
  glass.roundRect(x, y, w, h, 20);
  g.fillStyle = background;
  g.fill(glass);
  within(g, glass, () => {
    g.save();
    g.translate(x, y);
    paint(g);
    g.restore();
    g.fillStyle = 'rgba(0,0,0,0.22)';
    for (let sy = y; sy < y + h; sy += 3) g.fillRect(x, sy, w, 1);
    g.fillStyle = radial(g, x + w * 0.3, y + h * 0.2, 0, w * 0.9, [[0, 'rgba(255,255,255,0.16)'], [0.5, 'rgba(255,255,255,0.03)'], [1, 'rgba(0,0,0,0.35)']]);
    g.fillRect(x, y, w, h);
  });
}

function glowText(g: G, text: string, x: number, y: number, color: string, size = 14) {
  g.font = font('mono', size, 700);
  g.textAlign = 'left';
  g.textBaseline = 'top';
  g.fillStyle = alpha(color, 0.35);
  g.fillText(text, x - 1, y);
  g.fillText(text, x + 1, y);
  g.fillStyle = color;
  g.fillText(text, x, y);
}

function insets(g: G, rng: Rng) {
  const w = 214;
  const h = 132;
  const y = 626;
  crt(g, 44, y, w, h, s => {
    let left = 6;
    for (let row = 0; row < 8; row += 1) {
      left += Math.floor(rng() * 3) - 1;
      const line = `${' '.repeat(Math.max(0, left))}I${' '.repeat(5)}${row === 7 ? '*' : ' '}${' '.repeat(5)}I`;
      glowText(s, line.replace('*', ' '), 6, 6 + row * 15, '#7dff7a');
      if (row === 7) glowText(s, `${' '.repeat(Math.max(0, left) + 6)}*`, 6, 6 + row * 15, '#ffe84a');
    }
  });
  crt(g, 290, y, w, h, s => {
    for (const [col, row, n] of [[3, 1, 5], [14, 4, 8], [7, 6, 3]] as const) {
      for (let i = 0; i < n; i += 1) glowText(s, '*', 8 + (col + (i % 3)) * 9, 6 + (row + Math.floor(i / 3)) * 14, '#ffffff');
    }
    glowText(s, 'YOU DESTROYED IT', 8, 112, '#ffffff', 13);
  });
  crt(g, 536, y, w, h, s => {
    glowText(s, 'X POSITION (0 TO 9)?4', 8, 10, '#ffffff', 13);
    glowText(s, 'Y POSITION (0 TO 9)?7', 8, 28, '#ffffff', 13);
    glowText(s, 'DISTANCE (0 TO 9)?2', 8, 46, '#ffffff', 13);
    glowText(s, 'SHOT WAS NORTHEAST', 8, 70, '#4af0ff', 13);
    glowText(s, 'TOO FAR', 8, 88, '#4af0ff', 13);
  });
  crt(g, 782, y, w, h, s => {
    s.strokeStyle = '#ffffff';
    s.lineWidth = 2;
    s.beginPath();
    for (let x = 120; x <= w; x += 8) s.lineTo(x, h - 10 - rng() * 12);
    s.stroke();
    for (const [i, len, color] of [[0, 70, '#ffe84a'], [1, 30, '#ff3b30'], [2, 56, '#ffe84a'], [3, 22, '#ff3b30']] as const) {
      s.fillStyle = color;
      s.fillRect(10, 14 + i * 28, len, 10);
    }
    s.strokeStyle = '#ffe84a';
    s.lineWidth = 2;
    s.beginPath();
    s.moveTo(150, 40); s.lineTo(170, 60); s.lineTo(130, 60); s.closePath();
    s.stroke();
    glowText(s, 'FUEL', 88, 12, '#ffffff', 11);
  }, '#030308');
}

function flash(g: G, w: number, h: number) {
  const corner = new Path2D();
  corner.moveTo(w, h - 250);
  corner.lineTo(w, h);
  corner.lineTo(w - 250, h);
  corner.closePath();
  g.fillStyle = '#ffe617';
  g.fill(corner);
  g.save();
  g.translate(w - 84, h - 84);
  g.rotate(-Math.PI / 4);
  set(g, 'RETRO AND', 0, -24, { face: 'grotesque', size: 26, color: '#141014', weight: 900, align: 'center' });
  set(g, 'REIMAGINED', 0, 6, { face: 'grotesque', size: 26, color: '#141014', weight: 900, align: 'center' });
  g.restore();
}

function title(g: G, w: number) {
  g.fillStyle = C.paper;
  g.fillRect(0, 0, w, 300);
  g.save();
  g.translate(w / 2, 26);
  g.scale(1, 1.18);
  g.font = font('display', 138, 700);
  g.textAlign = 'center';
  g.textBaseline = 'top';
  g.lineJoin = 'round';
  g.strokeStyle = C.title;
  g.lineWidth = 7;
  g.strokeText('SPACEGAMES', 0, 0);
  g.fillStyle = C.title;
  g.fillText('SPACEGAMES', 0, 0);
  g.restore();
  set(g, 'Thirteen games for the BBC Micro, as they were and as they might have been', w / 2, 196, { face: 'grotesque', size: 25, color: C.title, weight: 800, align: 'center' });
}

function draw(g: G, w: number, h: number) {
  const rng = seeded(1982);
  title(g, w);
  const horizon = 318;
  const edge = paintingEdge(w);
  within(g, edge, () => {
    duskAndPlanet(g, rng, w, horizon);
    canyon(g, rng, w, h, horizon);
    const toScreen = freighter(g, rng, 470, 410, 112);
    const [hitX, hitY] = toScreen(140, 70);
    deltaFighter(g, rng, 1010, 470, 130, 3.4, GREEN_FIGHTER);
    deltaFighter(g, rng, 1150, 360, 80, 3.3, GREEN_FIGHTER);
    bolt(g, 930, 488, hitX + 40, hitY + 10, '#ffe23a', 3.5);
    bolt(g, 1100, 372, 760, 420, '#ffe23a', 2.5);
    starburst(g, hitX + 40, hitY + 10, 46, rng, ['#ff5a1a', '#ffd21a', '#ffffff']);
    starburst(g, 230, 350, 30, rng, ['#ff5a1a', '#ffd21a', '#ffffff']);
    grain(g, w, h, 0.07);
  });
  insets(g, rng);
  flash(g, w, h);
}

export const coverFrame: Frame = {
  id: 'cover',
  title: 'Cover',
  note: 'The landing page as the book’s cover: a red display title on white, hardware over a canyon entering on a curve, and CRT insets of what the retro lanes really show. Does it feel like the book?',
  draw,
};
