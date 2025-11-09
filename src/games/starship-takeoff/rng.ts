export function mulberry32(seed: number) {
  return function rng() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomRange(rng: () => number, min: number, max: number) {
  return min + rng() * (max - min);
}

export function randomInt(rng: () => number, min: number, max: number) {
  return Math.floor(randomRange(rng, min, max + 1));
}
