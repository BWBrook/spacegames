export class AudioManager {
  ctx: AudioContext | null = null;
  cache = new Map<string, AudioBuffer>();

  unlock() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx?.state === 'suspended') {
      return this.ctx.resume();
    }
    return Promise.resolve();
  }

  async load(url: string): Promise<AudioBuffer> {
    if (!this.ctx) throw new Error('Audio not unlocked yet');
    if (this.cache.has(url)) return this.cache.get(url)!;
    const res = await fetch(url);
    const buf = await res.arrayBuffer();
    const decoded = await this.ctx.decodeAudioData(buf);
    this.cache.set(url, decoded);
    return decoded;
  }

  play(buffer: AudioBuffer, when = 0, gain = 0.5) {
    if (!this.ctx) throw new Error('Audio not unlocked yet');
    const src = this.ctx.createBufferSource();
    const g = this.ctx.createGain();
    g.gain.value = gain;
    src.buffer = buffer;
    src.connect(g).connect(this.ctx.destination);
    src.start(this.ctx.currentTime + when);
  }
}
