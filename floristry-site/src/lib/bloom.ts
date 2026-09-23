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
