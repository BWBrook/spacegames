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
    sources: [
      {
        id: 'starship-simple-transcription',
        label: 'Simple BASIC transcription',
        path: 'basic/starship_takeoff.bas',
        platform: 'c64-basic',
        role: 'transcription',
      },
      {
        id: 'starship-bbc-intro',
        label: 'BBC Micro intro',
        path: 'basic/bbc/usborne-computer-space-games/01.bas',
        platform: 'bbc-micro',
        role: 'intro',
        dfsName: '$.01',
      },
      {
        id: 'starship-bbc-game',
        label: 'BBC Micro game',
        path: 'basic/bbc/usborne-computer-space-games/01ST.bas',
        platform: 'bbc-micro',
        role: 'game',
        dfsName: '$.01ST',
      },
      {
        id: 'usborne-spacegames-ssd',
        label: 'Usborne Computer Space Games DFS disk image',
        path: 'assets-src/Disc999-ComputerSpaceGamesUsborne.ssd',
        platform: 'bbc-dfs',
        role: 'disk-image',
      },
      {
        id: 'usborne-spacegames-catalog',
        label: 'Extracted DFS catalogue',
        path: 'basic/bbc/usborne-computer-space-games/catalog.json',
        platform: 'bbc-dfs',
        role: 'catalog',
      },
    ],
    status: 'Prototype',
    loader: () => resolveModule(import('./starship-takeoff')),
    retro: {
      description: 'Original BASIC guessing game rendered in a retro terminal.',
      loader: () => resolveRetroModule(import('./starship-takeoff/retro')),
    },
  },
  {
    id: 'intergalactic-games',
    title: 'Intergalactic Games',
    summary: 'Tune angle, speed, and broadcast lock to win the orbital TV rights race.',
    year: 1980,
    difficulty: 'Medium',
    basicSource: 'basic/bbc/usborne-computer-space-games/02IG.bas',
    sources: [
      {
        id: 'intergalactic-bbc-intro',
        label: 'BBC Micro intro',
        path: 'basic/bbc/usborne-computer-space-games/02.bas',
        platform: 'bbc-micro',
        role: 'intro',
        dfsName: '$.02',
      },
      {
        id: 'intergalactic-bbc-game',
        label: 'BBC Micro game',
        path: 'basic/bbc/usborne-computer-space-games/02IG.bas',
        platform: 'bbc-micro',
        role: 'game',
        dfsName: '$.02IG',
      },
      {
        id: 'usborne-spacegames-ssd',
        label: 'Usborne Computer Space Games DFS disk image',
        path: 'assets-src/Disc999-ComputerSpaceGamesUsborne.ssd',
        platform: 'bbc-dfs',
        role: 'disk-image',
      },
      {
        id: 'usborne-spacegames-catalog',
        label: 'Extracted DFS catalogue',
        path: 'basic/bbc/usborne-computer-space-games/catalog.json',
        platform: 'bbc-dfs',
        role: 'catalog',
      },
    ],
    status: 'Prototype',
    loader: () => resolveModule(import('./intergalactic-games')),
    retro: {
      description: 'Original angle-and-speed satellite launch game rendered in a retro terminal.',
      loader: () => resolveRetroModule(import('./intergalactic-games/retro')),
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
