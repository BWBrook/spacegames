/**
 * The storybook register of the Trip into the Future spread: flat colour,
 * one shadow tone, and a dark ink line round everything.
 */
import { shade } from './color';

type G = CanvasRenderingContext2D;

export const INK = '#231a2e';

export interface InkOptions {
  line?: number;
  ink?: string;
  /** A shadow shape filled in a darker tone of the fill, clipped to the shape. */
  shadow?: Path2D;
  shadowDepth?: number;
  /** A lighter shape, clipped to the shape, for a single highlight. */
  light?: Path2D;
}

export function inked(g: G, shape: Path2D, fill: string, { line = 2.4, ink = INK, shadow, shadowDepth = -0.22, light }: InkOptions = {}) {
  g.fillStyle = fill;
  g.fill(shape);
  if (shadow || light) {
    g.save();
    g.clip(shape);
    if (shadow) {
      g.fillStyle = shade(fill, shadowDepth);
      g.fill(shadow);
    }
    if (light) {
      g.fillStyle = shade(fill, 0.3);
      g.fill(light);
    }
    g.restore();
  }
  g.strokeStyle = ink;
  g.lineWidth = line;
  g.lineJoin = 'round';
  g.lineCap = 'round';
  g.stroke(shape);
}

/** An ink line with no fill, for details drawn over flat colour. */
export function inkLine(g: G, points: ReadonlyArray<readonly [number, number]>, width = 2, ink = INK) {
  g.strokeStyle = ink;
  g.lineWidth = width;
  g.lineJoin = 'round';
  g.lineCap = 'round';
  g.beginPath();
  points.forEach(([x, y], i) => (i === 0 ? g.moveTo(x, y) : g.lineTo(x, y)));
  g.stroke();
}

export function rect(x: number, y: number, w: number, h: number, r = 0) {
  const path = new Path2D();
  if (r > 0) path.roundRect(x, y, w, h, r);
  else path.rect(x, y, w, h);
  return path;
}

export function ellipse(x: number, y: number, rx: number, ry: number) {
  const path = new Path2D();
  path.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  return path;
}

export function poly(points: ReadonlyArray<readonly [number, number]>) {
  const path = new Path2D();
  points.forEach(([x, y], i) => (i === 0 ? path.moveTo(x, y) : path.lineTo(x, y)));
  path.closePath();
  return path;
}
