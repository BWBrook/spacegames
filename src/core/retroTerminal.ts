import type { Stage } from './stage';

interface RetroTerminalOptions {
  stage: Stage;
  title: string;
  sourceLabel: string;
  maxLines?: number;
}

interface KeyboardOptions {
  onSubmit: () => void;
  acceptedPattern?: RegExp;
  maxInputLength?: number;
  inputEnabled?: boolean;
  replayEnabled?: boolean;
  onReplay?: () => void;
}

export class RetroTerminal {
  readonly lines: string[] = [];
  input = '';

  private caretTimer = 0;
  private readonly maxLines: number;

  constructor(private readonly options: RetroTerminalOptions) {
    this.maxLines = options.maxLines ?? 18;
  }

  clear() {
    this.lines.splice(0);
    this.input = '';
  }

  pushLine(text = '') {
    this.lines.push(text);
    if (this.lines.length > this.maxLines) {
      this.lines.splice(0, this.lines.length - this.maxLines);
    }
  }

  update(dt: number) {
    this.caretTimer = (this.caretTimer + dt) % 1.2;
  }

  handleKey(event: KeyboardEvent, options: KeyboardOptions) {
    if (event.metaKey || event.ctrlKey) return false;
    const {
      acceptedPattern = /^[0-9-]$/,
      maxInputLength = 6,
      inputEnabled = true,
      onSubmit,
      replayEnabled = false,
      onReplay,
    } = options;

    if (event.key === 'Enter') {
      event.preventDefault();
      onSubmit();
      return true;
    }
    if (event.key === 'Backspace') {
      event.preventDefault();
      this.input = this.input.slice(0, -1);
      return true;
    }
    if (replayEnabled && event.key.toLowerCase() === 'r') {
      event.preventDefault();
      onReplay?.();
      return true;
    }
    if (!inputEnabled) return false;
    if (acceptedPattern.test(event.key)) {
      event.preventDefault();
      if (this.input.length < maxInputLength) this.input += event.key;
      return true;
    }
    return false;
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
    g.translate(0, 24);
    g.fillStyle = '#dff9ff';
    g.font = '18px "Space Mono", monospace';
    this.lines.forEach((line, index) => {
      g.fillText(line, 0, index * 22);
    });
    const promptY = this.lines.length * 22 + 8;
    const prompt = `> ${this.input}`;
    g.fillText(prompt, 0, promptY);
    if (this.caretTimer < 0.6) {
      const metrics = g.measureText(prompt);
      g.fillRect(metrics.width + 4, promptY - 16, 12, 2);
    }
    g.restore();
  }
}
