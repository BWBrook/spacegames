import type { Scene, SceneContext } from '../core/sceneManager';
import type {
  GameInstance,
  GameManifestEntry,
  GameModule,
  GameMode,
  RetroInstance,
  RetroModule,
} from '../games/types';

interface GameplayPayload {
  game: GameManifestEntry;
  mode?: GameMode;
}

export function createGameplayScene(ctx: SceneContext): Scene {
  let loading = false;
  let error: string | null = null;
  let entry: GameManifestEntry | null = null;
  let modernGame: GameInstance | null = null;
  let retroGame: RetroInstance | null = null;
  let currentMode: GameMode = 'modern';
  let requestId = 0;

  async function load(entryToLoad: GameManifestEntry, mode: GameMode) {
    loading = true;
    error = null;
    modernGame?.exit?.();
    retroGame?.exit?.();
    modernGame = null;
    retroGame = null;
    const token = ++requestId;
    try {
      if (mode === 'retro') {
        if (!entryToLoad.retro) throw new Error('Retro mode not available for this game.');
        const module: RetroModule = await entryToLoad.retro.loader();
        if (token !== requestId) return;
        const instance = module.createRetroGame({
          stage: ctx.stage,
          audio: ctx.audio,
          manifest: entryToLoad,
        });
        retroGame = instance;
        instance.enter?.();
      } else {
        const module: GameModule = await entryToLoad.loader();
        if (token !== requestId) return;
        const instance = module.createGame({
          stage: ctx.stage,
          input: ctx.input,
          audio: ctx.audio,
          manifest: entryToLoad,
        });
        modernGame = instance;
        instance.enter?.();
      }
    } catch (err) {
      if (token === requestId) {
        error = err instanceof Error ? err.message : 'Unknown error while loading game';
      }
    } finally {
      if (token === requestId) loading = false;
    }
  }

  return {
    enter(payload?: GameplayPayload) {
      const next = payload?.game;
      if (!next) {
        ctx.goto('menu');
        return;
      }
      entry = next;
      currentMode = payload?.mode ?? 'modern';
      load(next, currentMode);
    },
    update(dt: number) {
      if (ctx.input.consumePress('Escape')) {
        ctx.goto('menu');
        return;
      }
      if (currentMode === 'retro') retroGame?.update(dt);
      else modernGame?.update(dt);
    },
    render() {
      const { stage } = ctx;
      if (currentMode === 'retro' ? retroGame : modernGame) {
        if (currentMode === 'retro') retroGame?.render();
        else modernGame?.render();
      } else {
        stage.clear('#060b16');
        const g = stage.ctx;
        g.save();
        g.fillStyle = '#8ecbff';
        g.font = '600 32px "Space Mono", monospace';
        const label = loading ? 'Loading...' : 'Unable to start game';
        g.textAlign = 'center';
        g.fillText(label, stage.width / 2, stage.height / 2);
        if (error) {
          g.font = '16px "Space Mono", monospace';
          g.fillStyle = '#ff9f89';
          wrapMultiline(g, error, stage.width / 2, stage.height / 2 + 32, stage.width * 0.6, 20);
        }
        g.restore();
      }

      // HUD overlay
      const g = ctx.stage.ctx;
      g.save();
      g.fillStyle = 'rgba(3, 8, 15, 0.65)';
      g.fillRect(0, 0, ctx.stage.width, 48);
      g.fillStyle = '#c9efff';
      g.font = '700 18px "Space Mono", monospace';
      g.textAlign = 'left';
      const modeLabel = currentMode === 'retro' ? 'Retro' : 'Reimagined';
      const title = entry ? `${entry.title} (${entry.year}) · ${modeLabel}` : '—';
      g.fillText(title, 16, 30);
      g.textAlign = 'right';
      g.font = '14px "Space Mono", monospace';
      g.fillStyle = '#8dd5ff';
      g.fillText('Esc ↩ menu', ctx.stage.width - 16, 28);
      g.restore();
    },
    exit() {
      modernGame?.exit?.();
      retroGame?.exit?.();
      modernGame = null;
      retroGame = null;
      entry = null;
    },
  };
}

function wrapMultiline(
  g: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(' ');
  let line = '';
  let offset = 0;
  for (const word of words) {
    const trial = `${line}${word} `;
    if (g.measureText(trial).width > maxWidth && line) {
      g.fillText(line, x, y + offset);
      line = `${word} `;
      offset += lineHeight;
    } else {
      line = trial;
    }
  }
  if (line) g.fillText(line.trimEnd(), x, y + offset);
}
