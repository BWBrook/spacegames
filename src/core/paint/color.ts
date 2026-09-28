/** Colour helpers for painting in hex, the form the art study's palettes are measured in. */

function channels(hex: string): [number, number, number] {
  const value = hex.replace('#', '');
  const full = value.length === 3 ? value.split('').map(c => c + c).join('') : value;
  const n = Number.parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex([r, g, b]: [number, number, number]) {
  return `#${[r, g, b].map(c => Math.round(Math.max(0, Math.min(255, c))).toString(16).padStart(2, '0')).join('')}`;
}

/** Linear blend from `a` to `b`. */
export function mix(a: string, b: string, t: number) {
  const ca = channels(a);
  const cb = channels(b);
  return toHex([0, 1, 2].map(i => ca[i]! + (cb[i]! - ca[i]!) * t) as [number, number, number]);
}

/** Positive amounts lighten towards white, negative darken towards black. */
export function shade(hex: string, amount: number) {
  return amount >= 0 ? mix(hex, '#ffffff', amount) : mix(hex, '#000000', -amount);
}

export function alpha(hex: string, a: number) {
  const [r, g, b] = channels(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
