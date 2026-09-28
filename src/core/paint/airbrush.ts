/**
 * The airbrush techniques behind the book's painted spreads, as canvas
 * operations. Airbrush art is hard-edged masks, called friskets, filled with
 * soft gradients; here a mask is a Path2D and the spray is a gradient.
 */
import { alpha } from './color';
import type { Rng } from './rng';

export type Stops = ReadonlyArray<readonly [number, string]>;
type G = CanvasRenderingContext2D;

export function linear(g: G, x0: number, y0: number, x1: number, y1: number, stops: Stops) {
  const gradient = g.createLinearGradient(x0, y0, x1, y1);
  for (const [at, color] of stops) gradient.addColorStop(at, color);
  return gradient;
}

export function radial(g: G, x: number, y: number, r0: number, r1: number, stops: Stops, fx = x, fy = y) {
  const gradient = g.createRadialGradient(fx, fy, r0, x, y, r1);
  for (const [at, color] of stops) gradient.addColorStop(at, color);
  return gradient;
}

/** Fill a frisket with a gradient sprayed from (x0, y0) to (x1, y1). */
export function spray(g: G, mask: Path2D, x0: number, y0: number, x1: number, y1: number, stops: Stops) {
  g.fillStyle = linear(g, x0, y0, x1, y1, stops);
  g.fill(mask);
}

/** Spray a second pass inside a mask without disturbing what is outside it. */
export function within(g: G, mask: Path2D, paint: () => void) {
  g.save();
  g.clip(mask);
  paint();
  g.restore();
}

/** Soft light that adds to what is beneath it: engines, lasers, lamps. */
export function glow(g: G, x: number, y: number, radius: number, color: string, strength = 1) {
  g.save();
  g.globalCompositeOperation = 'lighter';
  g.fillStyle = radial(g, x, y, 0, radius, [
    [0, alpha(color, 0.9 * strength)],
    [0.25, alpha(color, 0.45 * strength)],
    [1, alpha(color, 0)],
  ]);
  g.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  g.restore();
}

/** The four-pointed sparkle an airbrush artist put on chrome and glass. */
export function glint(g: G, x: number, y: number, size: number, color = '#ffffff') {
  g.save();
  g.globalCompositeOperation = 'lighter';
  for (const [dx, dy, len] of [[1, 0, size], [0, 1, size], [0.7, 0.7, size * 0.4], [0.7, -0.7, size * 0.4]] as const) {
    const ray = linear(g, x - dx * len, y - dy * len, x + dx * len, y + dy * len, [
      [0, alpha(color, 0)], [0.5, alpha(color, 0.95)], [1, alpha(color, 0)],
    ]);
    g.strokeStyle = ray;
    g.lineWidth = Math.max(1, size * 0.06);
    g.beginPath();
    g.moveTo(x - dx * len, y - dy * len);
    g.lineTo(x + dx * len, y + dy * len);
    g.stroke();
  }
  g.restore();
  glow(g, x, y, size * 0.35, color, 0.9);
}

/** A light line around the inside of a mask's edge, as sprayed along a hull. */
export function rim(g: G, mask: Path2D, color: string, width: number, strength = 0.8) {
  within(g, mask, () => {
    g.strokeStyle = alpha(color, strength);
    g.lineWidth = width * 2;
    g.lineJoin = 'round';
    g.stroke(mask);
  });
}

/**
 * The classic airbrushed chrome: sky reflected above a hard horizon line and
 * warm ground below it, sprayed across a mask.
 */
export function chrome(g: G, mask: Path2D, x0: number, y0: number, x1: number, y1: number, sky: string, ground: string) {
  spray(g, mask, x0, y0, x1, y1, [
    [0, sky],
    [0.42, '#ffffff'],
    [0.5, '#f4f7ff'],
    [0.5, '#3a2c34'],
    [0.62, ground],
    [1, '#fff1d6'],
  ]);
}

/** Flecks of paint flicked from a stiff brush: grain for rock, rings and craters. */
export function spatter(g: G, rng: Rng, x: number, y: number, w: number, h: number, count: number, color: string, size: [number, number] = [0.4, 1.6], opacity: [number, number] = [0.25, 0.9]) {
  g.save();
  for (let i = 0; i < count; i += 1) {
    g.globalAlpha = opacity[0] + (opacity[1] - opacity[0]) * rng();
    g.fillStyle = color;
    const r = size[0] + (size[1] - size[0]) * rng() ** 2;
    g.beginPath();
    g.arc(x + rng() * w, y + rng() * h, r, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
}

let grainTile: HTMLCanvasElement | null = null;

function grainPattern(g: G) {
  if (!grainTile) {
    grainTile = document.createElement('canvas');
    grainTile.width = 160;
    grainTile.height = 160;
    const tile = grainTile.getContext('2d');
    if (!tile) return null;
    const image = tile.createImageData(160, 160);
    for (let i = 0; i < image.data.length; i += 4) {
      const v = 128 + (Math.random() - 0.5) * 255;
      image.data[i] = v;
      image.data[i + 1] = v;
      image.data[i + 2] = v;
      image.data[i + 3] = 255;
    }
    tile.putImageData(image, 0, 0);
  }
  return g.createPattern(grainTile, 'repeat');
}

/**
 * A faint grain over the whole painting, so that sprayed gradients read as
 * paint on board rather than as perfect vector ramps.
 */
export function grain(g: G, w: number, h: number, amount = 0.06) {
  const pattern = grainPattern(g);
  if (!pattern) return;
  g.save();
  g.globalAlpha = amount;
  g.globalCompositeOperation = 'overlay';
  g.fillStyle = pattern;
  g.fillRect(0, 0, w, h);
  g.restore();
}
