/** The recurring motifs of the book's paintings, built from the airbrush techniques. */
import { glint, glow, linear, radial, spatter, within } from './airbrush';
import { alpha, shade } from './color';
import { between, type Rng } from './rng';

type G = CanvasRenderingContext2D;

function starPath(x: number, y: number, outer: number, inner: number, points: number, rng: Rng, jitter: number, turn = 0) {
  const path = new Path2D();
  for (let i = 0; i < points * 2; i += 1) {
    const r = (i % 2 === 0 ? outer : inner) * (1 - jitter / 2 + jitter * rng());
    const a = turn + (i / (points * 2)) * Math.PI * 2;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    if (i === 0) path.moveTo(px, py);
    else path.lineTo(px, py);
  }
  path.closePath();
  return path;
}

/** The book's explosion: a ragged red star around a yellow one around white heat. */
export function starburst(g: G, x: number, y: number, r: number, rng: Rng, colors: [string, string, string] = ['#ff2b2b', '#ffe81a', '#ffffff'], points = 13) {
  const turn = rng() * Math.PI;
  glow(g, x, y, r * 1.5, colors[1], 0.5);
  g.fillStyle = colors[0];
  g.fill(starPath(x, y, r, r * 0.42, points, rng, 0.55, turn));
  g.fillStyle = colors[1];
  g.fill(starPath(x, y, r * 0.72, r * 0.34, points, rng, 0.45, turn + 0.1));
  g.fillStyle = radial(g, x, y, 0, r * 0.45, [[0, '#ffffff'], [0.55, colors[2]], [1, alpha(colors[2], 0)]]);
  g.fill(starPath(x, y, r * 0.46, r * 0.26, points, rng, 0.3, turn + 0.2));
}

export interface StarfieldOptions {
  count: number;
  /** Fraction of stars given a sparkle. */
  bright?: number;
  tint?: string;
}

/** Dots of mixed size and brightness on a deep ground, a few of them catching the light. */
export function starfield(g: G, rng: Rng, x: number, y: number, w: number, h: number, { count, bright = 0.012, tint = '#ffffff' }: StarfieldOptions) {
  g.save();
  for (let i = 0; i < count; i += 1) {
    const sx = x + rng() * w;
    const sy = y + rng() * h;
    const size = 0.35 + rng() ** 3 * 1.9;
    g.globalAlpha = 0.35 + rng() * 0.65;
    g.fillStyle = tint;
    g.beginPath();
    g.arc(sx, sy, size, 0, Math.PI * 2);
    g.fill();
    if (rng() < bright) {
      g.globalAlpha = 1;
      glint(g, sx, sy, 6 + rng() * 10, tint);
    }
  }
  g.restore();
}

/** A soft band of starlight across the sky, like the Milky Way on the Alien Snipers spread. */
export function nebula(g: G, rng: Rng, x0: number, y0: number, x1: number, y1: number, width: number, color: string, strength = 0.18) {
  g.save();
  g.globalCompositeOperation = 'lighter';
  const steps = 60;
  for (let i = 0; i < steps; i += 1) {
    const t = i / (steps - 1);
    const cx = x0 + (x1 - x0) * t + between(rng, -width, width) * 0.5;
    const cy = y0 + (y1 - y0) * t + between(rng, -width, width) * 0.5;
    const r = width * between(rng, 0.5, 1.2);
    g.fillStyle = radial(g, cx, cy, 0, r, [[0, alpha(color, strength * between(rng, 0.4, 1))], [1, alpha(color, 0)]]);
    g.fillRect(cx - r, cy - r, r * 2, r * 2);
  }
  g.restore();
  spatter(g, rng, Math.min(x0, x1) - width, Math.min(y0, y1) - width, Math.abs(x1 - x0) + width * 2, Math.abs(y1 - y0) + width * 2, 700, '#ffffff', [0.3, 0.9], [0.15, 0.6]);
}

export interface PlanetOptions {
  base: string;
  /** Direction the light comes from, in radians; 0 is from the right. */
  light?: number;
  bands?: string[];
  ring?: { color: string; tilt: number; inner: number; outer: number };
  atmosphere?: string;
  rng?: Rng;
}

/** A lit sphere with optional cloud bands and a ring drawn behind and in front of it. */
export function planet(g: G, x: number, y: number, r: number, options: PlanetOptions) {
  const { base, light = -2.4, bands, ring, atmosphere, rng } = options;
  const lx = Math.cos(light);
  const ly = Math.sin(light);
  if (ring) ringHalf(g, x, y, r, ring, 'back');
  const disc = new Path2D();
  disc.arc(x, y, r, 0, Math.PI * 2);
  g.fillStyle = radial(g, x, y, 0, r * 1.05, [[0, shade(base, 0.35)], [0.6, base], [1, shade(base, -0.35)]], x + lx * r * 0.45, y + ly * r * 0.45);
  g.fill(disc);
  within(g, disc, () => {
    if (bands && rng) {
      for (let i = 0; i < 14; i += 1) {
        const by = y - r + (i / 14) * 2 * r + between(rng, -r * 0.04, r * 0.04);
        g.fillStyle = alpha(bands[i % bands.length]!, between(rng, 0.25, 0.6));
        g.beginPath();
        g.moveTo(x - r, by);
        for (let s = 0; s <= 24; s += 1) {
          const sx = x - r + (s / 24) * 2 * r;
          g.lineTo(sx, by + Math.sin(s * 0.9 + i) * r * 0.025);
        }
        const thick = r * between(rng, 0.04, 0.12);
        for (let s = 24; s >= 0; s -= 1) {
          const sx = x - r + (s / 24) * 2 * r;
          g.lineTo(sx, by + thick + Math.sin(s * 0.7 + i * 1.3) * r * 0.03);
        }
        g.closePath();
        g.fill();
      }
    }
    g.fillStyle = radial(g, x - lx * r * 0.7, y - ly * r * 0.7, r * 0.2, r * 1.7, [[0, 'rgba(0,0,0,0.85)'], [0.55, 'rgba(0,0,0,0.35)'], [1, 'rgba(0,0,0,0)']]);
    g.fillRect(x - r, y - r, r * 2, r * 2);
  });
  if (atmosphere) {
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.strokeStyle = alpha(atmosphere, 0.5);
    g.lineWidth = r * 0.05;
    g.beginPath();
    g.arc(x, y, r * 0.99, light - 1.3, light + 1.3);
    g.stroke();
    g.restore();
  }
  if (ring) ringHalf(g, x, y, r, ring, 'front');
}

function ringHalf(g: G, x: number, y: number, r: number, ring: NonNullable<PlanetOptions['ring']>, half: 'back' | 'front') {
  g.save();
  g.translate(x, y);
  g.rotate(ring.tilt);
  g.beginPath();
  if (half === 'back') g.rect(-r * ring.outer, -r * ring.outer, r * ring.outer * 2, r * ring.outer);
  else g.rect(-r * ring.outer, 0, r * ring.outer * 2, r * ring.outer);
  g.clip();
  for (let band = 0; band < 5; band += 1) {
    const t = band / 4;
    const radius = ring.inner + (ring.outer - ring.inner) * t;
    g.strokeStyle = alpha(ring.color, half === 'back' ? 0.35 + 0.25 * Math.sin(band * 1.7) : 0.55 + 0.3 * Math.sin(band * 1.7));
    g.lineWidth = r * (ring.outer - ring.inner) / 5;
    g.beginPath();
    g.ellipse(0, 0, r * radius, r * radius * 0.22, 0, 0, Math.PI * 2);
    g.stroke();
  }
  g.restore();
}

/** Parallel bands of livery clipped to a hull. */
export function stripes(g: G, mask: Path2D, x: number, y: number, angle: number, widths: number[], colors: string[]) {
  within(g, mask, () => {
    g.save();
    g.translate(x, y);
    g.rotate(angle);
    let offset = 0;
    widths.forEach((w, i) => {
      g.fillStyle = colors[i % colors.length]!;
      g.fillRect(-4000, offset, 8000, w);
      offset += w;
    });
    g.restore();
  });
}

/** A checkerboard, as on the fighters' wings, clipped to a mask. */
export function checker(g: G, mask: Path2D, x: number, y: number, size: number, angle: number, dark: string, light: string, span = 20) {
  within(g, mask, () => {
    g.save();
    g.translate(x, y);
    g.rotate(angle);
    for (let row = -span; row < span; row += 1) {
      for (let col = -span; col < span; col += 1) {
        g.fillStyle = (row + col) % 2 === 0 ? dark : light;
        g.fillRect(col * size, row * size, size, size);
      }
    }
    g.restore();
  });
}

/**
 * Panel detail: plates, conduits, vents and hatches, each cut in with a dark
 * line and lit with a light one, inside a mask.
 */
export function greebles(g: G, mask: Path2D, rng: Rng, x: number, y: number, w: number, h: number, dark: string, light: string, density = 1) {
  within(g, mask, () => {
    g.lineCap = 'square';
    const plates = Math.round(38 * density);
    for (let i = 0; i < plates; i += 1) {
      const pw = between(rng, 0.04, 0.2) * w;
      const ph = between(rng, 0.03, 0.14) * h;
      const px = x + rng() * (w - pw);
      const py = y + rng() * (h - ph);
      g.strokeStyle = dark;
      g.lineWidth = 1.4;
      g.strokeRect(px, py, pw, ph);
      g.strokeStyle = light;
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(px + 1.5, py + ph - 1.5);
      g.lineTo(px + 1.5, py + 1.5);
      g.lineTo(px + pw - 1.5, py + 1.5);
      g.stroke();
    }
    const conduits = Math.round(18 * density);
    for (let i = 0; i < conduits; i += 1) {
      const cx = x + rng() * w;
      const cy = y + rng() * h;
      const len = between(rng, 0.05, 0.3) * w;
      const horizontal = rng() < 0.6;
      g.strokeStyle = dark;
      g.lineWidth = 2.2;
      g.beginPath();
      g.moveTo(cx, cy);
      if (horizontal) { g.lineTo(cx + len, cy); g.lineTo(cx + len, cy + len * 0.3); }
      else { g.lineTo(cx, cy + len * 0.5); g.lineTo(cx + len * 0.4, cy + len * 0.5); }
      g.stroke();
    }
    const vents = Math.round(10 * density);
    for (let i = 0; i < vents; i += 1) {
      const vx = x + rng() * w;
      const vy = y + rng() * h;
      g.fillStyle = dark;
      for (let s = 0; s < 4; s += 1) g.fillRect(vx + s * 5, vy, 2.5, 9);
    }
    const hatches = Math.round(8 * density);
    for (let i = 0; i < hatches; i += 1) {
      const hx = x + rng() * w;
      const hy = y + rng() * h;
      const hr = between(rng, 3, 9);
      g.strokeStyle = dark;
      g.lineWidth = 1.5;
      g.beginPath();
      g.arc(hx, hy, hr, 0, Math.PI * 2);
      g.stroke();
      g.strokeStyle = light;
      g.beginPath();
      g.arc(hx, hy, hr - 1.5, Math.PI * 1.1, Math.PI * 1.9);
      g.stroke();
    }
  });
}

/** A laser bolt: a white core in a coloured sheath, fading from its tip. */
export function bolt(g: G, x0: number, y0: number, x1: number, y1: number, color: string, width = 4) {
  g.save();
  g.globalCompositeOperation = 'lighter';
  g.lineCap = 'round';
  g.strokeStyle = linear(g, x0, y0, x1, y1, [[0, alpha(color, 0)], [0.6, alpha(color, 0.8)], [1, color]]);
  g.lineWidth = width * 2.4;
  g.beginPath();
  g.moveTo(x0, y0);
  g.lineTo(x1, y1);
  g.stroke();
  g.strokeStyle = linear(g, x0, y0, x1, y1, [[0, 'rgba(255,255,255,0)'], [1, '#ffffff']]);
  g.lineWidth = width * 0.8;
  g.stroke();
  g.restore();
}
