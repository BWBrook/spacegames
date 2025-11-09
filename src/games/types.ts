import type { AudioManager } from '../core/audio';
import type { InputManager } from '../core/input';
import type { Stage } from '../core/stage';

export interface GameManifestEntry {
  id: string;
  title: string;
  summary: string;
  year: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  basicSource: string;
  thumbnail?: string;
  status?: string;
  loader: () => Promise<GameModule>;
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
}

export type GameFactory = (ctx: GameContext) => GameInstance;

export interface GameModule {
  createGame: GameFactory;
}
