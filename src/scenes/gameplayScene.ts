import type { Scene, SceneContext } from '../core/sceneManager';
import type {
  GameInstance,
  GameManifestEntry,
  GameModule,
  GameMode,
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
  let activeGame: GameInstance | null = null;
  let currentMode: GameMode = 'modern';
  let requestId = 0;

  async function load(entryToLoad: GameManifestEntry, mode: GameMode) {
    loading = true;
    error = null;
    activeGame?.exit?.();
    activeGame = null;
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
        activeGame = instance;
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
        activeGame = instance;
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
      activeGame?.update(dt);
    },
    render() {
      const { stage } = ctx;
      if (activeGame) {
        activeGame.render();
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

      renderEscapeChip(ctx.stage.ctx, ctx.stage.width, ctx.stage.height);
    },
    exit() {
      requestId += 1;
      activeGame?.exit?.();
      activeGame = null;
      loading = false;
      entry = null;
    },
    debugSnapshot() {
      return {
        scene: 'gameplay',
        mode: currentMode,
        loading,
        error,
        gameId: entry?.id ?? null,
        game:
          activeGame?.debugSnapshot?.() ?? null,
      };
    },
    debugAction(action: string, payload?: unknown) {
      return activeGame?.debugAction?.(action, payload) ?? null;
    },
  };
}

function renderEscapeChip(g: CanvasRenderingContext2D, width: number, height: number) {
  const chipWidth = 148;
  const chipHeight = 28;
  const x = width - chipWidth - 18;
  const y = height - chipHeight - 18;
  g.save();
  g.fillStyle = 'rgba(4, 10, 18, 0.8)';
  g.fillRect(x, y, chipWidth, chipHeight);
  g.strokeStyle = 'rgba(107, 220, 255, 0.55)';
  g.strokeRect(x, y, chipWidth, chipHeight);
  g.fillStyle = '#8dd5ff';
  g.font = '14px "Space Mono", monospace';
  g.textAlign = 'center';
  g.fillText('Esc to menu', x + chipWidth / 2, y + 18);
  g.restore();
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
