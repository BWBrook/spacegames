import type { GameManifestEntry, GameModule, RetroModule } from './types';

async function resolveModule<T>(promise: Promise<T>): Promise<GameModule> {
  const mod = (await promise) as unknown as Partial<GameModule> & { default?: Partial<GameModule> };
  if (mod?.createGame) return { createGame: mod.createGame };
  if (mod?.default?.createGame) return { createGame: mod.default.createGame } as GameModule;
  throw new Error('Module missing createGame export');
}

export const games: GameManifestEntry[] = [
  {
    id: 'starship-takeoff',
    title: 'Starship Take-Off',
    summary: 'Calibrate launch thrust to punch through unpredictable gravity wells.',
    year: 1980,
    difficulty: 'Easy',
    basicSource: 'basic/starship_takeoff.bas',
    status: 'Prototype',
    loader: () => resolveModule(import('./starship-takeoff')),
    retro: {
      description: 'Original BASIC guessing game rendered in a retro terminal.',
      loader: () => resolveRetroModule(import('./starship-takeoff/retro')),
    },
  },
];

async function resolveRetroModule<T>(promise: Promise<T>): Promise<RetroModule> {
  const mod = (await promise) as unknown as Partial<RetroModule> & { default?: Partial<RetroModule> };
  if (mod?.createRetroGame) return { createRetroGame: mod.createRetroGame };
  if (mod?.default && 'createRetroGame' in mod.default!) {
    const candidate = mod.default as Partial<RetroModule>;
    if (candidate.createRetroGame) return { createRetroGame: candidate.createRetroGame };
  }
  throw new Error('Module missing createRetroGame export');
}
