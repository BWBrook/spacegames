import type { GameFactory } from '../types';

interface Star {
  x: number;
  y: number;
  speed: number;
  size: number;
  hue: number;
}

const STAR_COUNT = 80;

export const createGame: GameFactory = ({ stage, manifest }) => {
  const ctx = stage.ctx;
  const stars: Star[] = Array.from({ length: STAR_COUNT }, () => spawnStar(stage.width, stage.height));
  let timer = 0;

  function spawnStar(width: number, height: number): Star {
    const safeW = Math.max(1, width);
    const safeH = Math.max(1, height);
    return {
      x: Math.random() * safeW,
      y: Math.random() * safeH,
      speed: 20 + Math.random() * 60,
      size: 0.4 + Math.random() * 1.5,
      hue: 180 + Math.random() * 80,
    };
  }

  function drawBackdrop() {
    const gradient = ctx.createLinearGradient(0, 0, 0, stage.height);
    gradient.addColorStop(0, '#050d1a');
    gradient.addColorStop(1, '#021d37');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, stage.width, stage.height);
  }

  return {
    enter() {
      timer = 0;
    },
    update(dt: number) {
      timer += dt;
      for (const star of stars) {
        star.y += star.speed * dt;
        if (star.y > stage.height) {
          Object.assign(star, spawnStar(stage.width, 0));
        }
      }
    },
    render() {
      drawBackdrop();
      ctx.save();
      ctx.fillStyle = 'white';
      for (const star of stars) {
        ctx.fillStyle = `hsla(${star.hue}, 70%, 80%, 0.6)`;
        ctx.fillRect(star.x, star.y, star.size * stage.dpr, star.size * stage.dpr);
      }

      ctx.fillStyle = '#9be7ff';
      ctx.font = '600 36px "Space Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`Coming Soon`, stage.width / 2, stage.height * 0.35);

      ctx.fillStyle = '#eef7ff';
      ctx.font = '700 56px "Space Mono", monospace';
      ctx.fillText(manifest.title, stage.width / 2, stage.height * 0.45);

      ctx.fillStyle = '#8eb5c7';
      ctx.font = '20px "Space Mono", monospace';
      const text = 'We will reimagine the original BASIC guessing game here soon.';
      ctx.fillText(text, stage.width / 2, stage.height * 0.55);

      ctx.font = '16px "Space Mono", monospace';
      ctx.fillStyle = '#5ec4ff';
      ctx.fillText(`BASIC source: ${manifest.basicSource}`, stage.width / 2, stage.height * 0.65);
      ctx.restore();
    },
    exit() {
      /* nothing yet */
    },
  };
};

export default { createGame };
