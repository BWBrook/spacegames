/**
 * The book's graphic furniture: flat colour panels laid over the paintings,
 * bracket rules that tie lines of a listing to plain-English notes, sidebar
 * boxes, starburst badges and the machine symbols.
 */
import { starburst } from '../paint/motifs';
import type { Rng } from '../paint/rng';
import { set, type Face } from './type';

type G = CanvasRenderingContext2D;

export interface Rect { x: number; y: number; w: number; h: number }

export function panel(g: G, { x, y, w, h }: Rect, fill: string, edge?: string) {
  g.fillStyle = fill;
  g.fillRect(x, y, w, h);
  if (edge) {
    g.strokeStyle = edge;
    g.lineWidth = 2.5;
    g.strokeRect(x + 1.25, y + 1.25, w - 2.5, h - 2.5);
  }
}

export interface Note {
  /** The span of the listing the note explains, as a vertical extent at x. */
  x: number;
  top: number;
  bottom: number;
  /** Where the note's text starts. */
  noteX: number;
  text: string;
  width: number;
  color: string;
  size?: number;
  face?: Face;
}

/**
 * A bracket closing the span, then a rule from its middle to the note. A
 * span of a single line gets a plain rule, as in the book.
 */
export function bracketNote(g: G, { x, top, bottom, noteX, text, width, color, size = 15, face = 'slab' }: Note) {
  const mid = (top + bottom) / 2;
  g.strokeStyle = color;
  g.lineWidth = 2;
  g.lineCap = 'butt';
  g.beginPath();
  if (bottom - top > 4) {
    g.moveTo(x - 7, top);
    g.lineTo(x, top);
    g.lineTo(x, bottom);
    g.lineTo(x - 7, bottom);
  }
  g.moveTo(x, mid);
  g.lineTo(noteX - 6, mid);
  g.stroke();
  set(g, text, noteX, mid - size * 0.62, { face, size, color, width });
}

export function sidebar(g: G, box: Rect, title: string, body: string, fill: string, ink: string) {
  panel(g, box, fill, ink);
  const y = set(g, title, box.x + 16, box.y + 12, { face: 'grotesque', size: 19, color: ink, weight: 800 });
  set(g, body, box.x + 16, y + 6, { face: 'slab', size: 14.5, color: ink, width: box.w - 32 });
}

/** A starburst carrying a word or two, as the book's "1K" flash does. */
export function badge(g: G, x: number, y: number, r: number, text: string, rng: Rng) {
  starburst(g, x, y, r, rng, ['#e8261c', '#e8261c', '#e8261c'], 12);
  set(g, text, x, y - r * 0.2, { face: 'grotesque', size: r * 0.4, color: '#ffffff', weight: 900, align: 'center' });
}

export type Machine = 'zx81' | 'vic' | 'bbc' | 'trs80' | 'apple' | 'spectrum';

/**
 * The marks the book puts beside lines that differ by machine. In the
 * anthology the BBC's star marks the retro lane, since the disk is a BBC's.
 */
export function machineMark(g: G, machine: Machine, x: number, y: number, size: number, color: string) {
  g.fillStyle = color;
  g.beginPath();
  if (machine === 'apple') g.arc(x, y, size / 2, 0, Math.PI * 2);
  else if (machine === 'vic') { g.moveTo(x, y - size / 2); g.lineTo(x + size / 2, y + size / 2); g.lineTo(x - size / 2, y + size / 2); }
  else if (machine === 'trs80') g.rect(x - size / 2, y - size / 2, size, size);
  else if (machine === 'bbc') {
    for (let i = 0; i < 10; i += 1) {
      const r = i % 2 === 0 ? size * 0.58 : size * 0.24;
      const a = -Math.PI / 2 + (i / 10) * Math.PI * 2;
      if (i === 0) g.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      else g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
  } else if (machine === 'spectrum') {
    set(g, 's', x, y - size * 0.7, { face: 'grotesque', size: size * 1.2, color, weight: 700, align: 'center' });
    return;
  } else return;
  g.closePath();
  g.fill();
}
