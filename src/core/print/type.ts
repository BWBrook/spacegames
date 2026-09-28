/**
 * The book's type, set with faces this machine already has. The book pairs a
 * heavy slab serif for its text with a bold grotesque for its headings, a
 * flared display face on the cover and a monospaced face for the listings.
 * The macOS faces come first; open-licence faces would replace them before
 * the anthology is shipped anywhere else.
 */
export const FACES = {
  slab: '"Rockwell", "Superclarendon", "Roboto Slab", "Arvo", Georgia, serif',
  clarendon: '"Superclarendon", "Rockwell", "Roboto Slab", Georgia, serif',
  grotesque: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  display: 'Optima, "Optima Nova", Candara, "Segoe UI", sans-serif',
  mono: 'Menlo, Monaco, "Courier New", monospace',
} as const;

export type Face = keyof typeof FACES;

export function font(face: Face, size: number, weight: number | 'normal' | 'bold' = 'bold') {
  return `${weight} ${Math.round(size)}px ${FACES[face]}`;
}

type G = CanvasRenderingContext2D;

export function wrap(g: G, text: string, width: number) {
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const word of paragraph.split(' ')) {
      const trial = line ? `${line} ${word}` : word;
      if (g.measureText(trial).width > width && line) {
        lines.push(line);
        line = word;
      } else {
        line = trial;
      }
    }
    lines.push(line);
  }
  return lines;
}

export interface SetOptions {
  face: Face;
  size: number;
  color: string;
  weight?: number | 'normal' | 'bold';
  width?: number;
  leading?: number;
  align?: CanvasTextAlign;
}

/** Set a block of text from its top-left corner; returns the y below it. */
export function set(g: G, text: string, x: number, y: number, { face, size, color, weight = 'bold', width, leading = 1.22, align = 'left' }: SetOptions) {
  g.font = font(face, size, weight);
  g.fillStyle = color;
  g.textAlign = align;
  g.textBaseline = 'top';
  const lines = width ? wrap(g, text, width) : text.split('\n');
  lines.forEach((line, i) => g.fillText(line, x, y + i * size * leading));
  return y + lines.length * size * leading;
}
