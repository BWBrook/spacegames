import type { AudioManager } from '../core/audio';
import type { InputManager } from '../core/input';
import type { Stage } from '../core/stage';

export type SourcePlatform = 'c64-basic' | 'bbc-micro' | 'bbc-dfs';

export type SourceRole = 'transcription' | 'intro' | 'game' | 'disk-image' | 'catalog';

export interface SourceRef {
  id: string;
  label: string;
  path: string;
  platform: SourcePlatform;
  role: SourceRole;
  dfsName?: string;
}

export interface GameManifestEntry {
  id: string;
  title: string;
  summary: string;
  year: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  sources: SourceRef[];
  loader: () => Promise<GameModule>;
  retro?: {
    loader: () => Promise<RetroModule>;
  };
}

export interface GameContext {
  stage: Stage;
  input: InputManager;
  audio: AudioManager;
  manifest: GameManifestEntry;
}

export interface GameInstance {
  enter?(): void;
  update(dt: number): void;
  render(): void;
  exit?(): void;
  debugSnapshot?(): unknown;
  debugAction?(action: string, payload?: unknown): unknown;
}

export type GameFactory = (ctx: GameContext) => GameInstance;

export interface GameModule {
  createGame: GameFactory;
}

export type GameMode = 'modern' | 'retro';

export interface RetroContext {
  stage: Stage;
  audio: AudioManager;
  manifest: GameManifestEntry;
}

export type RetroFactory = (ctx: RetroContext) => GameInstance;

export interface RetroModule {
  createRetroGame: RetroFactory;
}
