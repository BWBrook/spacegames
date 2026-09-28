/**
 * Alien Snipers, in the painted-hardware register: the deck of the cruiser
 * in steep perspective under a violet sky, with the snipers diving in and
 * the radar that the reimagined lane already has, now built into the deck
 * as a console. Deck features are laid out in deck coordinates and projected,
 * so plates, bands and intakes all foreshorten together.
 */
import { glint, glow, grain, linear, radial, rim, spray, within } from '../core/paint/airbrush';
import { alpha, shade } from '../core/paint/color';
import { RED_FIGHTER, deltaFighter } from '../core/paint/craft';
import { bolt, nebula, starburst, starfield } from '../core/paint/motifs';
import { between, seeded, type Rng } from '../core/paint/rng';
import { panel } from '../core/print/panel';
import { set } from '../core/print/type';
import type { Frame } from './frame';

type G = CanvasRenderingContext2D;

const C = {
  night: '#1b1150',
  violet: '#5e48b7',
  lilac: '#8f7fe0',
  yellow: '#fbec16',
  ochre: '#c39e4d',
  red: '#e0302a',
  black: '#17131a',
  mint: '#7dffb3',
} as const;

/** The deck plane: X across (0 on the centre line), z forward from the viewer. */
const VP = { x: 640, y: 214 };
const K = 700;
const F = 720;
const project = (X: number, z: number): [number, number] => [VP.x + (X * F) / z, VP.y + K / z];
const halfWidth = (z: number) => 1.5 - 0.13 * (z - 1);

function quad(X0: number, z0: number, X1: number, z1: number) {
  const p = new Path2D();
  const corners = [project(X0, z0), project(X1, z0), project(X1, z1), project(X0, z1)];
  corners.forEach(([x, y], i) => (i === 0 ? p.moveTo(x, y) : p.lineTo(x, y)));
  p.closePath();
  return p;
}

function sky(g: G, rng: Rng, w: number, h: number) {
  g.fillStyle = linear(g, 0, 0, 0, h, [[0, C.night], [0.45, C.violet], [1, '#3a2a8a']]);
  g.fillRect(0, 0, w, h);
  nebula(g, rng, -80, 520, 1360, 20, 130, '#cfc4ff', 0.13);
  starfield(g, rng, 0, 0, w, h, { count: 900, bright: 0.01 });
}

function deck(g: G, rng: Rng) {
  const zNear = 0.82;
  const zFar = 7.4;
  // Outline of the deck: straight sides that taper towards a rounded bow.
  const outline = new Path2D();
  const steps = 24;
  for (let i = 0; i <= steps; i += 1) {
    const z = zNear + ((zFar - zNear) * i) / steps;
    const [x, y] = project(-halfWidth(z), z);
    if (i === 0) outline.moveTo(x, y);
    else outline.lineTo(x, y);
  }
  const [bowX, bowY] = project(0, zFar + 0.9);
  const [farLX] = project(-halfWidth(zFar), zFar);
  const [farRX, farRY] = project(halfWidth(zFar), zFar);
  outline.quadraticCurveTo(farLX + (bowX - farLX) * 0.2, bowY, bowX, bowY);
  outline.quadraticCurveTo(farRX - (farRX - bowX) * 0.2, bowY, farRX, farRY);
  for (let i = steps; i >= 0; i -= 1) {
    const z = zNear + ((zFar - zNear) * i) / steps;
    const [x, y] = project(halfWidth(z), z);
    outline.lineTo(x, y);
  }
  outline.closePath();
  // The hull's side, a thin dark wall under the deck edge.
  g.save();
  g.translate(0, 26);
  g.fillStyle = shade(C.ochre, -0.55);
  g.fill(outline);
  g.restore();
  // Deck paint: cadmium yellow, bright near, cooler and darker into the distance.
  spray(g, outline, 0, 900, 0, VP.y + 60, [[0, '#fff7a0'], [0.35, C.yellow], [0.8, '#e0c21a'], [1, '#a7902c']]);
  within(g, outline, () => {
    // Plates, in deck coordinates, cut in dark and lit along their near edge.
    for (let i = 0; i < 150; i += 1) {
      const z0 = between(rng, zNear, zFar);
      const depth = between(rng, 0.12, 0.6);
      const X0 = between(rng, -halfWidth(z0), halfWidth(z0) - 0.1);
      const width = between(rng, 0.1, 0.45);
      g.strokeStyle = alpha('#6b5a12', 0.55);
      g.lineWidth = 1.4;
      g.stroke(quad(X0, z0, X0 + width, z0 + depth));
      const [ax, ay] = project(X0, z0);
      const [bx, by] = project(X0 + width, z0);
      g.strokeStyle = alpha('#fffbd0', 0.7);
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(ax, ay - 1.5);
      g.lineTo(bx, by - 1.5);
      g.stroke();
    }
    // Conduits running forward, converging on the vanishing point.
    for (const X of [-1.05, -0.62, 0.62, 1.05]) {
      g.strokeStyle = alpha('#5a4a10', 0.5);
      g.lineWidth = 2.2;
      g.beginPath();
      const [x0, y0] = project(X, zNear);
      const [x1, y1] = project(X * 0.7, zFar);
      g.moveTo(x0, y0);
      g.lineTo(x1, y1);
      g.stroke();
    }
    // The central spine, raised and lit.
    const spine = quad(-0.22, zNear, 0.22, zFar);
    spray(g, spine, 0, 900, 0, VP.y + 60, [[0, '#fffbe0'], [0.5, '#f7e02a'], [1, '#b39a2c']]);
    g.strokeStyle = alpha('#6b5a12', 0.7);
    g.lineWidth = 2;
    g.stroke(spine);
    // The red band across the deck.
    const band = quad(-3, 2.6, 3, 2.95);
    g.fillStyle = C.red;
    g.fill(band);
    g.fillStyle = alpha('#ffffff', 0.25);
    g.fill(quad(-3, 2.6, 3, 2.64));
    // Black intakes along both edges.
    for (const side of [-1, 1]) {
      for (const [z0, z1] of [[1.3, 2.2], [3.3, 4.6], [5.2, 6.2]] as const) {
        const edge = side * (halfWidth(z1) - 0.18);
        const slot = quad(edge - side * 0.28, z0, edge, z1);
        g.fillStyle = C.black;
        g.fill(slot);
        g.strokeStyle = alpha('#fff3a0', 0.6);
        g.lineWidth = 1.5;
        g.stroke(slot);
      }
    }
    // Rows of lights along the spine.
    for (let z = 1.2; z < zFar; z += 0.55) {
      const [x, y] = project(0, z);
      glow(g, x, y, 22 / z, '#ffb24a', 0.8);
    }
  });
  rim(g, outline, '#ffffff', 2, 0.55);
}

function turret(g: G, X: number, z: number, r: number) {
  const [x, y] = project(X, z);
  const rx = (r * F) / z;
  const ry = rx * 0.42;
  const base = new Path2D();
  base.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  spray(g, base, x - rx, y, x + rx, y, [[0, '#8a7420'], [0.4, '#fff49a'], [1, '#7a6418']]);
  const dome = new Path2D();
  dome.ellipse(x, y - ry * 0.4, rx * 0.7, rx * 0.55, 0, Math.PI, 0);
  dome.closePath();
  g.fillStyle = radial(g, x, y - ry, 0, rx, [[0, '#ffffff'], [0.3, '#bfe8ff'], [1, '#2a3a8a']], x - rx * 0.3, y - ry * 1.4);
  g.fill(dome);
  glint(g, x - rx * 0.3, y - ry * 1.2, rx * 0.5);
  return [x, y - ry] as const;
}

function console(g: G, x: number, y: number) {
  // A raised housing on the near deck with the radar set into it.
  const housing = new Path2D();
  housing.moveTo(x - 230, y + 190);
  housing.lineTo(x - 190, y - 10);
  housing.quadraticCurveTo(x, y - 40, x + 190, y - 10);
  housing.lineTo(x + 230, y + 190);
  housing.closePath();
  spray(g, housing, x - 230, y, x + 230, y, [[0, '#8a7420'], [0.25, '#ffe93a'], [0.5, '#fff8b0'], [0.75, '#ffe93a'], [1, '#7a6418']]);
  rim(g, housing, '#ffffff', 1.5, 0.6);
  const screen = new Path2D();
  screen.ellipse(x, y + 78, 150, 74, 0, 0, Math.PI * 2);
  g.fillStyle = '#0a0f12';
  g.fill(screen);
  within(g, screen, () => {
    g.fillStyle = radial(g, x, y + 78, 0, 160, [[0, '#123a2c'], [1, '#050a0c']]);
    g.fillRect(x - 160, y, 320, 160);
    g.strokeStyle = alpha(C.mint, 0.35);
    g.lineWidth = 1.4;
    for (const k of [0.33, 0.66, 1]) {
      g.beginPath();
      g.ellipse(x, y + 78, 140 * k, 66 * k, 0, 0, Math.PI * 2);
      g.stroke();
    }
    g.beginPath();
    g.moveTo(x - 150, y + 78);
    g.lineTo(x + 150, y + 78);
    g.moveTo(x, y + 4);
    g.lineTo(x, y + 152);
    g.stroke();
    g.fillStyle = linear(g, x, y + 78, x + 120, y + 30, [[0, alpha(C.mint, 0.5)], [1, alpha(C.mint, 0)]]);
    g.beginPath();
    g.moveTo(x, y + 78);
    g.lineTo(x + 130, y + 20);
    g.lineTo(x + 150, y + 60);
    g.closePath();
    g.fill();
    set(g, 'M', x - 70, y + 44, { face: 'mono', size: 58, color: '#ff9f89', weight: 700, align: 'center' });
    set(g, '4', x + 70, y + 44, { face: 'mono', size: 58, color: C.mint, weight: 700, align: 'center' });
    set(g, 'FALSE READING', x - 70, y + 30, { face: 'mono', size: 11, color: alpha(C.mint, 0.8), weight: 700, align: 'center' });
    set(g, 'CODE', x + 70, y + 30, { face: 'mono', size: 11, color: alpha(C.mint, 0.8), weight: 700, align: 'center' });
  });
  g.strokeStyle = '#3a3010';
  g.lineWidth = 5;
  g.stroke(screen);
  glint(g, x - 128, y + 96, 20);
}

function draw(g: G, w: number, h: number) {
  const rng = seeded(1616);
  sky(g, rng, w, h);
  deck(g, rng);
  const muzzle = turret(g, -0.78, 2.1, 0.2);
  turret(g, 0.8, 4.2, 0.18);
  deltaFighter(g, rng, 1010, 150, 150, 2.55, RED_FIGHTER);
  deltaFighter(g, rng, 1170, 330, 80, 2.8, RED_FIGHTER);
  deltaFighter(g, rng, 200, 250, 60, 0.4, RED_FIGHTER);
  starburst(g, 470, 120, 64, rng);
  bolt(g, muzzle[0], muzzle[1], 462, 128, '#ffe23a', 3.5);
  console(g, 640, 600);
  grain(g, w, h, 0.07);
  set(g, 'Alien Snipers', 40, 30, { face: 'grotesque', size: 46, color: '#ffffff', weight: 800 });
  set(g, 'Their jamming shifts every reading. Count on through the alphabet by the code, and fire at the letter you land on.', 42, 92, { face: 'slab', size: 19, color: '#ffffff', width: 400, leading: 1.28 });
  const box = { x: 1010, y: 640, w: 234, h: 118 };
  panel(g, box, C.red, '#ffffff');
  set(g, 'SNIPER 4 OF 10', box.x + 16, box.y + 14, { face: 'grotesque', size: 17, color: '#ffffff', weight: 800 });
  set(g, 'HITS  3', box.x + 16, box.y + 42, { face: 'mono', size: 28, color: '#ffffff', weight: 700 });
  g.fillStyle = alpha('#ffffff', 0.3);
  g.fillRect(box.x + 16, box.y + 88, box.w - 32, 10);
  g.fillStyle = '#ffffff';
  g.fillRect(box.x + 16, box.y + 88, (box.w - 32) * 0.62, 10);
}

export const snipersFrame: Frame = {
  id: 'snipers',
  title: 'Alien Snipers',
  note: 'The painted-hardware register: the cruiser’s deck in projected perspective, livery, panel detail and glints, with the lane’s radar built into the deck as a console. Does it feel like the book?',
  draw,
};
