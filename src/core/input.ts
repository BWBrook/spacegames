export class InputManager {
  private down = new Set<string>();
  private queue = new Set<string>();
  private frame = new Set<string>();

  private keyDown = (event: KeyboardEvent) => {
    const key = event.key;
    this.down.add(key);
    if (!event.repeat) this.queue.add(key);
  };

  private keyUp = (event: KeyboardEvent) => {
    const key = event.key;
    this.down.delete(key);
    this.frame.delete(key);
  };

  constructor() {
    window.addEventListener('keydown', this.keyDown);
    window.addEventListener('keyup', this.keyUp);
  }

  beginFrame() {
    this.frame = new Set(this.queue);
    this.queue.clear();
  }

  isDown(key: string) {
    return this.down.has(key);
  }

  consumePress(key: string) {
    if (this.frame.has(key)) {
      this.frame.delete(key);
      return true;
    }
    return false;
  }

  dispose() {
    window.removeEventListener('keydown', this.keyDown);
    window.removeEventListener('keyup', this.keyUp);
    this.down.clear();
    this.queue.clear();
    this.frame.clear();
  }
}
