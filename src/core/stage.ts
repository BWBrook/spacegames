export class Stage {
  readonly ctx: CanvasRenderingContext2D;
  width = 0;
  height = 0;
  dpr = 1;

  private resizeHandler = () => this.resize();

  constructor(public readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D context unavailable');
    this.ctx = ctx;
    window.addEventListener('resize', this.resizeHandler, { passive: true });
    this.resize();
  }

  resize() {
    this.dpr = Math.max(1, window.devicePixelRatio || 1);
    this.width = this.canvas.clientWidth;
    this.height = this.canvas.clientHeight;
    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = false;
  }

  clear(color = '#050505') {
    this.ctx.save();
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.restore();
  }

  dispose() {
    window.removeEventListener('resize', this.resizeHandler);
  }
}
