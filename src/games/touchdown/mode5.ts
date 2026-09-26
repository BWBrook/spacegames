import type { Stage } from '../../core/stage';

const WIDTH = 160;
const HEIGHT = 256;
const COLUMNS = 20;
const ROWS = 32;
/** MODE 5's default palette: black, red, yellow, white. */
const PALETTE: Array<[number, number, number]> = [[0, 0, 0], [255, 40, 40], [255, 255, 60], [255, 255, 255]];

/**
 * Just enough of the BBC's MODE 5 for Touchdown: a 160 by 256 four-colour
 * pixel buffer addressed in the 1280 by 1024 logical coordinates BASIC uses,
 * with the origin at the bottom left, plus a 20 by 32 grid of text.
 */
export class Mode5 {
  private readonly pixels = new Uint8Array(WIDTH * HEIGHT);
  private readonly text: string[][] = Array.from({ length: ROWS }, () => Array(COLUMNS).fill(' '));
  private readonly buffer: HTMLCanvasElement;
  private readonly image: ImageData;

  constructor() {
    this.buffer = document.createElement('canvas');
    this.buffer.width = WIDTH;
    this.buffer.height = HEIGHT;
    this.image = new ImageData(WIDTH, HEIGHT);
  }

  clear() {
    this.pixels.fill(0);
    for (const row of this.text) row.fill(' ');
  }

  /** VDU 28 then 12: clear a text window, and the graphics under it. */
  clearTextWindow(left: number, bottom: number, right: number, top: number) {
    for (let row = top; row <= bottom; row += 1) {
      for (let col = left; col <= right; col += 1) {
        const line = this.text[row];
        if (line) line[col] = ' ';
        for (let py = row * 8; py < row * 8 + 8; py += 1) {
          for (let px = col * 8; px < col * 8 + 8; px += 1) this.pixels[py * WIDTH + px] = 0;
        }
      }
    }
  }

  print(col: number, row: number, words: string) {
    const line = this.text[row];
    if (!line) return;
    for (let i = 0; i < words.length && col + i < COLUMNS; i += 1) line[col + i] = words[i] ?? ' ';
  }

  private plot(px: number, py: number, colour: number) {
    if (px < 0 || px >= WIDTH || py < 0 || py >= HEIGHT) return;
    this.pixels[py * WIDTH + px] = colour;
  }

  private toPixel(x: number, y: number): [number, number] {
    return [Math.floor(x / 8), Math.floor((1023 - y) / 4)];
  }

  line(x0: number, y0: number, x1: number, y1: number, colour: number) {
    let [ax, ay] = this.toPixel(x0, y0);
    const [bx, by] = this.toPixel(x1, y1);
    const dx = Math.abs(bx - ax);
    const dy = -Math.abs(by - ay);
    const sx = ax < bx ? 1 : -1;
    const sy = ay < by ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.plot(ax, ay, colour);
      if (ax === bx && ay === by) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; ax += sx; }
      if (e2 <= dx) { err += dx; ay += sy; }
    }
  }

  /** A filled rectangle between two logical corners, which is what PROCBAR's triangle pairs draw. */
  fillRect(x0: number, y0: number, x1: number, y1: number, colour: number) {
    const [ax, ay] = this.toPixel(Math.min(x0, x1), Math.max(y0, y1));
    const [bx, by] = this.toPixel(Math.max(x0, x1), Math.min(y0, y1));
    for (let py = ay; py <= by; py += 1) for (let px = ax; px < bx; px += 1) this.plot(px, py, colour);
  }

  render(stage: Stage) {
    const data = this.image.data;
    for (let i = 0; i < this.pixels.length; i += 1) {
      const [r, g, b] = PALETTE[this.pixels[i] ?? 0] ?? PALETTE[0]!;
      data[i * 4] = r;
      data[i * 4 + 1] = g;
      data[i * 4 + 2] = b;
      data[i * 4 + 3] = 255;
    }
    this.buffer.getContext('2d')!.putImageData(this.image, 0, 0);

    const ctx = stage.ctx;
    const displayHeight = stage.height - 120;
    const displayWidth = Math.min(stage.width - 64, displayHeight * 1.25);
    const x = (stage.width - displayWidth) / 2;
    const y = 88;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.buffer, x, y, displayWidth, displayHeight);

    const cellW = displayWidth / COLUMNS;
    const cellH = displayHeight / ROWS;
    const fontPx = Math.floor(cellH * 0.95);
    ctx.font = `600 ${fontPx}px "Space Mono", monospace`;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    const glyph = ctx.measureText('M').width;
    this.text.forEach((line, row) => {
      line.forEach((char, col) => {
        if (char === ' ') return;
        ctx.save();
        ctx.translate(x + col * cellW, y + (row + 1) * cellH - cellH * 0.15);
        ctx.scale((cellW * 0.9) / glyph, 1);
        ctx.fillText(char, 0, 0);
        ctx.restore();
      });
    });
    ctx.strokeStyle = 'rgba(160, 180, 255, 0.25)';
    ctx.strokeRect(x - 1, y - 1, displayWidth + 2, displayHeight + 2);
    ctx.restore();
  }
}
