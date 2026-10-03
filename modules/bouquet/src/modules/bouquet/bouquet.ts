// The 3D bouquet's settings, typed. The data lives in bouquet.json.
import data from './bouquet.json';

interface Bouquet {
  /** Wording for the section on the home page. */
  section: { note: string; title: string; intro: string };
  /** How many flowers in the bunch. */
  flowers: number;
  /** Petal colours to pick from (any CSS colour). */
  colours: string[];
}

export const bouquet = data as Bouquet;

/** A small seeded random generator, so the same seed always draws the same bunch. */
export function seeded(seed: number) {
  let h = seed >>> 0 || 1;
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export interface Flower {
  x: number;
  z: number;
  height: number;
  lean: number;
  size: number;
  petals: number;
  layers: number;
  petal: string;
  centre: string;
  cup: number;
}

const CENTRES = ['#f6c94c', '#7a4a1f', '#ffe08a', '#3a2a14'];

/** The flowers in a bunch: plain data, so any renderer can draw them. */
export function bunch(seed: number, count: number, colours: string[]): Flower[] {
  const r = seeded(seed);
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + r();
    const spread = count === 1 ? 0 : 0.3 + r() * 0.35;
    return {
      x: Math.cos(angle) * spread,
      z: Math.sin(angle) * spread,
      height: 1.1 + r() * 0.7,
      lean: (r() - 0.5) * 0.5,
      size: 0.8 + r() * 0.5,
      petals: 5 + Math.floor(r() * 8),
      layers: r() < 0.5 ? 2 : 1,
      petal: colours[Math.floor(r() * colours.length)] ?? '#f7a8c4',
      centre: CENTRES[Math.floor(r() * CENTRES.length)],
      cup: 0.2 + r() * 0.5,
    };
  });
}
