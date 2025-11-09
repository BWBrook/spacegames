import type { Scene } from '../core/sceneManager';
import type { SceneContext } from '../core/sceneManager';
import type { GameManifestEntry } from '../games/types';

export function createMenuScene(ctx: SceneContext): Scene {
  let selected = 0;
  let pulse = 0;

  function moveSelection(delta: number) {
    const { manifest } = ctx;
    if (!manifest.length) return;
    selected = (selected + delta + manifest.length) % manifest.length;
  }

  function launchGame(entry: GameManifestEntry | undefined) {
    if (!entry) return;
    ctx.goto('gameplay', { game: entry });
  }

  return {
    update(dt: number) {
      pulse = (pulse + dt) % 1;
      const { manifest, input } = ctx;
      if (!manifest.length) return;
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
      g.fillText('Enter ↵ to launch · Arrow Keys to navigate · Esc to quit game', stage.width - 48, stage.height - 32);
      g.restore();
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
