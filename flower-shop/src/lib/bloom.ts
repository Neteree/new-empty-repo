// Shared drawing helpers for the illustrated flowers.

export interface BloomStyle {
  petals: number;
  petal: string;
  centre: string;
}

/** A teardrop petal pointing up from the flower's centre. */
export function petalPath(width: number, length = 47): string {
  const w = width;
  return `M0 -6 C ${w} -${length * 0.4} ${w * 0.85} -${length * 0.85} 0 -${length} C -${w * 0.85} -${length * 0.85} -${w} -${length * 0.4} 0 -6 Z`;
}

/** Rotation angles for the outer ring and, on fuller flowers, an offset inner ring. */
export function rings(petals: number) {
  const step = 360 / petals;
  const outer = Array.from({ length: petals }, (_, i) => i * step);
  const inner = petals > 8 ? outer.map((angle) => angle + step / 2) : [];
  const width = Math.min(22, (80 / petals) * 1.9);
  return { outer, inner, width };
}

/** Lighten (positive amount) or darken (negative amount) a hex colour; amount is -1..1. */
export function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const channels = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const target = amount < 0 ? 0 : 255;
    return Math.round(c + (target - c) * Math.abs(amount));
  });
  return `#${channels.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}
