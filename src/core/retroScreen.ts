import type { Stage } from './stage';

interface RetroScreenOptions {
  stage: Stage;
  title: string;
  sourceLabel: string;
  columns?: number;
  rows?: number;
}

/**
 * A fixed character grid for BASIC listings that print at specific rows and
 * columns, as distinct from RetroTerminal's scrolling prompt loop. Defaults to
 * the BBC Micro MODE 7 width.
 */
export class RetroScreen {
  readonly columns: number;
  readonly rows: number;
  private cells: string[][];

  constructor(private readonly options: RetroScreenOptions) {
    this.columns = options.columns ?? 40;
    this.rows = options.rows ?? 22;
    this.cells = this.blank();
  }

  private blank() {
    return Array.from({ length: this.rows }, () =>
      Array.from({ length: this.columns }, () => ' '));
  }

  clear() {
    this.cells = this.blank();
  }

  writeAt(row: number, column: number, text: string) {
    const line = this.cells[row];
    if (!line) return;
    for (let i = 0; i < text.length; i += 1) {
      const col = column + i;
      if (col < 0 || col >= this.columns) continue;
      line[col] = text[i] ?? ' ';
    }
  }

  /** Row-by-row text with trailing blanks removed, for snapshots and assertions. */
  toText() {
    return this.cells.map(row => row.join('').replace(/\s+$/, ''));
  }

  render() {
    const { stage, title, sourceLabel } = this.options;
    const g = stage.ctx;
    g.save();
    g.textAlign = 'left';
    g.textBaseline = 'alphabetic';
    g.fillStyle = '#020512';
    g.fillRect(0, 0, stage.width, stage.height);
    g.translate(32, 64);
    g.fillStyle = '#5df7ff';
    g.font = '600 32px "Space Mono", monospace';
    g.fillText(title, 0, -24);
    g.font = '16px "Space Mono", monospace';
    g.fillStyle = '#9be7ff';
    g.fillText(sourceLabel, 0, 0);

    g.translate(0, 28);
    g.font = '18px "Space Mono", monospace';
    g.fillStyle = '#dff9ff';
    const cellWidth = g.measureText('M').width;
    this.cells.forEach((row, rowIndex) => {
      row.forEach((char, colIndex) => {
        if (char === ' ') return;
        g.fillText(char, colIndex * cellWidth, rowIndex * 22);
      });
    });
    g.restore();
  }
}
