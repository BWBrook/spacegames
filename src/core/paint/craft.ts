/** Spacecraft that more than one painting needs. */
import { glint, glow, linear, radial, rim, spray } from './airbrush';
import { alpha } from './color';
import { checker } from './motifs';
import { between, type Rng } from './rng';

type G = CanvasRenderingContext2D;

export interface FighterLivery {
  light: string;
  mid: string;
  dark: string;
  /** Checkerboard on the wings, if any. */
  check?: string;
  flame?: string;
}

export const RED_FIGHTER: FighterLivery = { light: '#ffb09a', mid: '#e0302a', dark: '#5a0808', check: '#ffffff', flame: '#ffcf7a' };
export const GREEN_FIGHTER: FighterLivery = { light: '#c8f0a0', mid: '#3f9a3a', dark: '#0f3a12', flame: '#ffe08a' };

/** A delta-winged fighter with a bubble canopy, nose along `angle`, trailing speed lines. */
export function deltaFighter(g: G, rng: Rng, x: number, y: number, s: number, angle: number, livery: FighterLivery, speedLines = true) {
  g.save();
  g.translate(x, y);
  g.rotate(angle);
  if (speedLines) {
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i += 1) {
      const oy = between(rng, -s * 0.5, s * 0.5);
      const len = between(rng, s * 1.5, s * 4);
      g.strokeStyle = linear(g, -s * 0.6 - len, oy, -s * 0.6, oy, [[0, 'rgba(255,255,255,0)'], [1, 'rgba(255,255,255,0.7)']]);
      g.lineWidth = between(rng, 1, 2.5);
      g.beginPath();
      g.moveTo(-s * 0.6 - len, oy);
      g.lineTo(-s * 0.6, oy);
      g.stroke();
    }
    g.globalCompositeOperation = 'source-over';
  }
  for (const side of [-1, 1]) {
    const wing = new Path2D();
    wing.moveTo(s * 0.15, 0);
    wing.lineTo(-s * 0.45, side * s * 0.75);
    wing.lineTo(-s * 0.62, side * s * 0.7);
    wing.lineTo(-s * 0.35, 0);
    wing.closePath();
    spray(g, wing, 0, 0, 0, side * s * 0.75, [[0, livery.light], [0.35, livery.mid], [1, livery.dark]]);
    if (livery.check) checker(g, wing, -s * 0.4, side * s * 0.2, s * 0.09, 0.5, alpha(livery.check, 0.85), alpha(livery.dark, 0.2), 10);
    rim(g, wing, '#ffffff', 1.2, 0.5);
  }
  const body = new Path2D();
  body.moveTo(s * 0.7, 0);
  body.bezierCurveTo(s * 0.4, -s * 0.14, -s * 0.4, -s * 0.13, -s * 0.62, -s * 0.08);
  body.lineTo(-s * 0.62, s * 0.08);
  body.bezierCurveTo(-s * 0.4, s * 0.13, s * 0.4, s * 0.14, s * 0.7, 0);
  spray(g, body, 0, -s * 0.14, 0, s * 0.14, [[0, livery.light], [0.4, livery.mid], [1, livery.dark]]);
  const canopy = new Path2D();
  canopy.ellipse(s * 0.18, -s * 0.03, s * 0.14, s * 0.06, 0, 0, Math.PI * 2);
  g.fillStyle = radial(g, s * 0.18, -s * 0.05, 0, s * 0.15, [[0, '#ffffff'], [0.4, '#9fdcff'], [1, '#1a2a6a']], s * 0.14, -s * 0.07);
  g.fill(canopy);
  glow(g, -s * 0.64, 0, s * 0.22, livery.flame ?? '#ffcf7a', 1);
  g.restore();
  glint(g, x + Math.cos(angle) * s * 0.2, y + Math.sin(angle) * s * 0.2 - s * 0.05, s * 0.3);
}
