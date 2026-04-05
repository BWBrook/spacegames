import type { Scene } from '../core/sceneManager';
import type { SceneContext } from '../core/sceneManager';
import type { GameManifestEntry } from '../games/types';

export function createMenuScene(ctx: SceneContext): Scene {
  let selected = 0;
  let pulse = 0;
  let modePickerActive = false;
  let modeIndex: 0 | 1 = 0;

  function moveSelection(delta: number) {
    const { manifest } = ctx;
    if (!manifest.length) return;
    selected = (selected + delta + manifest.length) % manifest.length;
  }

  function launchGame(entry: GameManifestEntry | undefined) {
    if (!entry) return;
    if (!modePickerActive) {
      modePickerActive = true;
      modeIndex = 0;
      return;
    }
    const mode = modeIndex === 0 ? 'modern' : 'retro';
    if (mode === 'retro' && !entry.retro) {
      return;
    }
    ctx.goto('gameplay', { game: entry, mode });
    modePickerActive = false;
  }

  return {
    update(dt: number) {
      pulse = (pulse + dt) % 1;
      const { manifest, input } = ctx;
      if (!manifest.length) return;
      if (modePickerActive) {
        if (input.consumePress('ArrowLeft') || input.consumePress('ArrowRight')) {
          modeIndex = (modeIndex === 0 ? 1 : 0);
        }
        if (input.consumePress('Escape')) {
          modePickerActive = false;
        } else if (input.consumePress('Enter') || input.consumePress(' ')) {
          launchGame(manifest[selected]);
        }
        return;
      }
      if (input.consumePress('ArrowDown') || input.consumePress('s')) moveSelection(1);
      if (input.consumePress('ArrowUp') || input.consumePress('w')) moveSelection(-1);
      if (input.consumePress('Enter') || input.consumePress(' ')) launchGame(manifest[selected]);
    },
    render() {
      const { stage, manifest } = ctx;
      const g = stage.ctx;
      stage.clear('#030712');

      g.save();
      g.fillStyle = '#0e1624';
      g.fillRect(0, 0, stage.width, stage.height);

      // title
      g.fillStyle = '#8cf1ff';
      g.font = '600 42px "Space Mono", monospace';
      g.textAlign = 'left';
      g.fillText('Vibe Game Anthology', 48, 80);

      g.fillStyle = '#4ca6cb';
      g.font = '16px "Space Mono", monospace';
      g.fillText('Select a reimagined classic BASIC game.', 48, 110);

      if (!manifest.length) {
        g.fillStyle = '#ffb347';
        g.font = '20px "Space Mono", monospace';
        g.fillText('No games have been added yet. Drop a .bas file into /basic.', 48, 160);
        g.restore();
        return;
      }

      const cardWidth = Math.min(640, stage.width - 96);
      const startX = 48;
      const startY = 150;
      const cardHeight = 110;
      const gap = 16;

      manifest.forEach((entry, index) => {
        const y = startY + index * (cardHeight + gap);
        const active = index === selected;
        const padding = 16;
        const bgGrad = g.createLinearGradient(startX, y, startX + cardWidth, y + cardHeight);
        if (active) {
          bgGrad.addColorStop(0, '#12263d');
          bgGrad.addColorStop(1, '#1c4b6b');
        } else {
          bgGrad.addColorStop(0, '#0a101c');
          bgGrad.addColorStop(1, '#131c2e');
        }
        g.fillStyle = bgGrad;
        g.fillRect(startX, y, cardWidth, cardHeight);

        if (active) {
          const borderAlpha = 0.5 + 0.5 * Math.sin(pulse * Math.PI * 2);
          g.strokeStyle = `rgba(126, 229, 255, ${borderAlpha.toFixed(2)})`;
          g.lineWidth = 2;
          g.strokeRect(startX + 1, y + 1, cardWidth - 2, cardHeight - 2);
        }

        g.fillStyle = '#e5f4ff';
        g.font = '600 22px "Space Mono", monospace';
        g.fillText(entry.title, startX + padding, y + padding + 8);

        g.fillStyle = '#9ab8d1';
        g.font = '14px "Space Mono", monospace';
        const meta = `${entry.year} · ${entry.difficulty} · BASIC: ${entry.basicSource}`;
        g.fillText(meta, startX + padding, y + padding + 30);

        g.fillStyle = '#c5d8ea';
        g.font = '16px "Space Mono", monospace';
        const summary = entry.summary;
        wrapText(g, summary, startX + padding, y + padding + 52, cardWidth - padding * 2, 18);
      });

      g.fillStyle = '#6bdcff';
      g.font = '14px "Space Mono", monospace';
      g.textAlign = 'right';
      g.fillText('Enter ↵ to choose mode · Arrow Keys to navigate · Esc to quit game', stage.width - 48, stage.height - 32);
      if (modePickerActive) {
        const currentEntry = ctx.manifest[selected];
        if (currentEntry) renderModePicker(g, stage, currentEntry, modeIndex);
      }
      g.restore();
    },
    debugSnapshot() {
      return {
        scene: 'menu',
        selected,
        selectedGameId: ctx.manifest[selected]?.id ?? null,
        modePickerActive,
        modeIndex,
      };
    },
  };
}

function wrapText(
  g: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(' ');
  let line = '';
  let offsetY = 0;
  words.forEach(word => {
    const trial = `${line}${word} `;
    if (g.measureText(trial).width > maxWidth && line) {
      g.fillText(line, x, y + offsetY);
      line = `${word} `;
      offsetY += lineHeight;
    } else {
      line = trial;
    }
  });
  if (line) g.fillText(line.trimEnd(), x, y + offsetY);
}

function renderModePicker(
  g: CanvasRenderingContext2D,
  stage: { width: number; height: number },
  entry: GameManifestEntry,
  modeIndex: number,
) {
  const options: Array<{ label: string; detail: string; available: boolean }> = [
    { label: 'Reimagined', detail: 'Modern canvas remake', available: true },
    { label: 'Retro BASIC', detail: entry.retro ? 'Text-mode original' : 'Unavailable for this game', available: Boolean(entry.retro) },
  ];
  const width = Math.min(520, stage.width * 0.8);
  const height = 150;
  const x = (stage.width - width) / 2;
  const y = stage.height * 0.55;
  g.save();
  g.fillStyle = 'rgba(2, 6, 12, 0.94)';
  g.fillRect(x, y, width, height);
  g.strokeStyle = '#6bdcff';
  g.lineWidth = 2;
  g.strokeRect(x, y, width, height);
  const optionWidth = width / options.length;
  options.forEach((opt, idx) => {
    const ox = x + idx * optionWidth;
    if (idx === modeIndex) {
      g.fillStyle = 'rgba(14, 44, 72, 0.8)';
      g.fillRect(ox + 8, y + 40, optionWidth - 16, 90);
      g.strokeStyle = '#8cf1ff';
      g.strokeRect(ox + 8, y + 40, optionWidth - 16, 90);
    }
    g.fillStyle = opt.available ? '#e6fbff' : '#6b7a8f';
    g.font = '20px "Space Mono", monospace';
    g.textAlign = 'center';
    g.fillText(opt.label, ox + optionWidth / 2, y + 70);
    g.font = '14px "Space Mono", monospace';
    g.fillText(opt.detail, ox + optionWidth / 2, y + 100);
  });
  g.fillStyle = '#7de3ff';
  g.textAlign = 'center';
  g.font = '14px "Space Mono", monospace';
  g.fillText('Select mode with ← →, Enter to confirm, Esc to cancel', stage.width / 2, y + height + 20);
  g.restore();
}
