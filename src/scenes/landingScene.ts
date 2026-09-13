import type { Scene, SceneContext } from '../core/sceneManager';
import { buildLanding } from '../landing/landing';

let built = false;

/** The anthology menu. Lives in the DOM; the canvas is idle while it is shown. */
export function createLandingScene(ctx: SceneContext): Scene {
  const root = document.getElementById('landing')!;
  if (!built) {
    buildLanding({
      root,
      manifest: ctx.manifest,
      onSelect: async (entry, mode) => {
        await ctx.audio.unlock();
        ctx.goto('gameplay', { game: entry, mode });
      },
    });
    built = true;
  }

  return {
    enter() {
      root.hidden = false;
      const first = root.querySelector<HTMLButtonElement>('button');
      first?.focus({ preventScroll: true });
    },
    exit() {
      root.hidden = true;
    },
    update() {},
    render() {},
    debugSnapshot() {
      return { scene: 'menu' };
    },
  };
}
