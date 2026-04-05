import { InputManager } from './input';
import { Stage } from './stage';
import { AudioManager } from './audio';
import type { GameManifestEntry } from '../games/types';

export interface SceneContext {
  stage: Stage;
  input: InputManager;
  audio: AudioManager;
  manifest: GameManifestEntry[];
  goto: (scene: string, payload?: unknown) => void;
}

export interface Scene {
  enter?(payload?: unknown): void;
  exit?(): void;
  update(dt: number): void;
  render(): void;
  debugSnapshot?(): unknown;
  debugAction?(action: string, payload?: unknown): unknown;
}

type SceneFactory = (context: SceneContext) => Scene;

export class SceneManager {
  private factories = new Map<string, SceneFactory>();
  private active: Scene | null = null;
  private activeName = '';
  private context: SceneContext;

  constructor(base: Omit<SceneContext, 'goto'>) {
    this.context = {
      ...base,
      goto: (scene: string, payload?: unknown) => this.goto(scene, payload),
    };
  }

  register(name: string, factory: SceneFactory) {
    this.factories.set(name, factory);
  }

  goto(name: string, payload?: unknown) {
    const factory = this.factories.get(name);
    if (!factory) throw new Error(`Scene "${name}" is not registered`);
    this.active?.exit?.();
    this.active = factory(this.context);
    this.activeName = name;
    this.active.enter?.(payload);
  }

  update(dt: number) {
    this.active?.update(dt);
  }

  render() {
    this.active?.render();
  }

  current() {
    return this.activeName;
  }

  debugSnapshot() {
    return this.active?.debugSnapshot?.() ?? { scene: this.activeName };
  }

  debugAction(action: string, payload?: unknown) {
    return this.active?.debugAction?.(action, payload) ?? null;
  }
}
