/**
 * The anthology's tutor robot: an original design in the book's idiom of
 * friendly machines that wear the BASIC keyword they act out.
 */
import { shade } from './color';
import { INK, ellipse, inked, rect } from './ink';

type G = CanvasRenderingContext2D;

export interface RobotOptions {
  body: string;
  label?: string;
  /** Raise the right arm, as if offering or pointing. */
  wave?: boolean;
  /** Carry a crate marked with a variable name. */
  crate?: { label: string; color: string };
}

/** Drawn standing on (x, y), `size` tall. */
export function robot(g: G, x: number, y: number, size: number, { body, label, wave, crate }: RobotOptions) {
  const u = size / 100;
  g.save();
  g.translate(x, y);
  const line = Math.max(1.4, 2.2 * u);
  const trim = shade(body, -0.35);

  // Feet and legs.
  for (const side of [-1, 1]) {
    inked(g, rect(side * 14 * u - 5 * u, -22 * u, 10 * u, 14 * u, 2 * u), trim, { line });
    inked(g, ellipse(side * 14 * u, -6 * u, 12 * u, 6 * u), shade(body, -0.15), { line });
  }

  // Barrel body with a keyword plate and rivets.
  const torso = rect(-26 * u, -64 * u, 52 * u, 44 * u, 12 * u);
  inked(g, torso, body, { line, shadow: rect(8 * u, -64 * u, 30 * u, 44 * u), light: rect(-22 * u, -60 * u, 8 * u, 34 * u, 4 * u) });
  if (label) {
    const plate = rect(-20 * u, -52 * u, 40 * u, 17 * u, 3 * u);
    inked(g, plate, '#fff6d8', { line: line * 0.8 });
    g.fillStyle = INK;
    g.font = `800 ${Math.round(10 * u)}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(label, 0, -43.5 * u, 36 * u);
  }
  g.fillStyle = trim;
  for (const [rx, ry] of [[-21, -28], [21, -28], [-21, -58], [21, -58]] as const) {
    g.beginPath();
    g.arc(rx * u, ry * u, 1.6 * u, 0, Math.PI * 2);
    g.fill();
  }

  // Concertina arms.
  const arm = (side: number, raised: boolean) => {
    const segments = 4;
    for (let i = 0; i < segments; i += 1) {
      const t = i / segments;
      const ax = side * (28 + t * 10) * u;
      const ay = raised ? (-56 - t * 26) * u : (-52 + t * 14) * u;
      inked(g, ellipse(ax, ay, 5.5 * u, 4.2 * u), shade(body, -0.1), { line: line * 0.8 });
    }
    const hx = side * 40 * u;
    const hy = raised ? -86 * u : -34 * u;
    inked(g, ellipse(hx, hy, 6 * u, 6 * u), trim, { line: line * 0.8 });
  };
  arm(-1, false);
  arm(1, Boolean(wave));

  // Dome head with a face window, two big lamp eyes and an antenna.
  const head = new Path2D();
  head.moveTo(-22 * u, -68 * u);
  head.lineTo(-22 * u, -84 * u);
  head.arc(0, -84 * u, 22 * u, Math.PI, 0);
  head.lineTo(22 * u, -68 * u);
  head.closePath();
  inked(g, head, body, { line, shadow: rect(6 * u, -110 * u, 20 * u, 44 * u) });
  inked(g, rect(-16 * u, -94 * u, 32 * u, 20 * u, 7 * u), '#fff6d8', { line: line * 0.8 });
  for (const side of [-1, 1]) {
    inked(g, ellipse(side * 7 * u, -85 * u, 5 * u, 5.5 * u), '#ffffff', { line: line * 0.7 });
    g.fillStyle = INK;
    g.beginPath();
    g.arc(side * 7 * u + 1.2 * u, -84.5 * u, 2.4 * u, 0, Math.PI * 2);
    g.fill();
  }
  g.strokeStyle = INK;
  g.lineWidth = line * 0.8;
  g.beginPath();
  g.arc(0, -79 * u, 5 * u, 0.2 * Math.PI, 0.8 * Math.PI);
  g.stroke();
  g.beginPath();
  g.moveTo(0, -106 * u);
  g.lineTo(0, -116 * u);
  g.stroke();
  inked(g, ellipse(0, -119 * u, 4 * u, 4 * u), '#ff4d3d', { line: line * 0.7 });

  if (crate) {
    const box = rect(-18 * u, -58 * u, 36 * u, 30 * u, 2 * u);
    inked(g, box, crate.color, { line, shadow: rect(4 * u, -58 * u, 16 * u, 30 * u) });
    g.fillStyle = INK;
    g.font = `800 ${Math.round(16 * u)}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(crate.label, 0, -43 * u);
  }
  g.restore();
}
