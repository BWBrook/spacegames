import type { GameManifestEntry } from './types';

export const games: GameManifestEntry[] = [
  {
    id: 'starship-takeoff',
    title: 'Starship Take-Off',
    summary: 'Calibrate launch thrust to punch through unpredictable gravity wells.',
    year: 1980,
    difficulty: 'Easy',
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
    loader: () => import('./starship-takeoff'),
    retro: {
      loader: () => import('./starship-takeoff/retro'),
    },
  },
  {
    id: 'intergalactic-games',
    title: 'Intergalactic Games',
    summary: 'Tune angle, speed, and broadcast lock to win the orbital TV rights race.',
    year: 1980,
    difficulty: 'Medium',
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
    loader: () => import('./intergalactic-games'),
    retro: {
      loader: () => import('./intergalactic-games/retro'),
    },
  },
];
