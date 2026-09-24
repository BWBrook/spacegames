const CAPTURED_KEYS = new Set([
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Enter',
  'Escape',
  'Backspace',
  ' ',
]);

export class InputManager {
  private down = new Set<string>();
  private queue = new Set<string>();
  private frame = new Set<string>();

  private blurHandler = () => {
    this.clear();
  };

  private visibilityHandler = () => {
    if (document.visibilityState !== 'visible') this.clear();
  };

  private shouldCapture(event: KeyboardEvent) {
    if (event.metaKey || event.ctrlKey || event.altKey) return false;
    if (!CAPTURED_KEYS.has(event.key)) return false;
    const target = event.target;
    if (!(target instanceof HTMLElement)) return true;
    if (target.isContentEditable) return false;
    return !['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(target.tagName);
  }

  private keyDown = (event: KeyboardEvent) => {
    if (this.shouldCapture(event)) event.preventDefault();
    const key = event.key;
    this.down.add(key);
    if (!event.repeat) this.queue.add(key);
  };

  private keyUp = (event: KeyboardEvent) => {
    if (this.shouldCapture(event)) event.preventDefault();
    const key = event.key;
    this.down.delete(key);
    this.frame.delete(key);
  };

  constructor() {
    window.addEventListener('keydown', this.keyDown);
    window.addEventListener('keyup', this.keyUp);
    window.addEventListener('blur', this.blurHandler);
    document.addEventListener('visibilitychange', this.visibilityHandler);
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
    window.removeEventListener('blur', this.blurHandler);
    document.removeEventListener('visibilitychange', this.visibilityHandler);
    this.clear();
  }

  private clear() {
    this.down.clear();
    this.queue.clear();
    this.frame.clear();
  }
}
