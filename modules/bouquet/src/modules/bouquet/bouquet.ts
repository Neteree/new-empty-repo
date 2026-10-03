// The 3D bouquet's settings, typed. The data lives in bouquet.json.
import data from './bouquet.json';

interface Bouquet {
  /** Wording for the section on the home page. */
  section: { note: string; title: string; intro: string };
  /** How many flowers in the bunch. */
  flowers: number;
  /** Petal colours to pick from (any CSS colour). */
  colours: string[];
  /** The flower game on game.html. */
  game: {
    title: string;
    intro: string;
    /** Length of a game. */
    seconds: number;
    /** The kinds of flower in the game, each with a name customers ask for. */
    flowers: { name: string; colour: string }[];
    /** Names of the (made-up) customers placing orders. */
    customers: string[];
  };
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
  size: number;
  petals: number;
  layers: number;
  petal: string;
  centre: string;
  cup: number;
}

const CENTRES = ['#f6c94c', '#7a4a1f', '#ffe08a', '#3a2a14'];
/** How far a flower reaches from its stem (petals and leaves), at size 1. */
const REACH = 0.42;

/**
 * The flowers in a bunch: plain data, so any renderer can draw them. Stems
 * stand upright and each flower is placed so nothing touches another flower
 * (its petals, leaves and stem stay clear of every other one).
 */
export function bunch(seed: number, count: number, colours: string[]): Flower[] {
  const r = seeded(seed);
  const placed: Flower[] = [];
  for (let i = 0; i < count; i++) {
    const size = 0.6 + r() * 0.25;
    const reach = REACH * size;
    let x = 0;
    let z = 0;
    // Try spots close to the middle first, moving outwards until one is clear.
    for (let tries = 0; tries < 400; tries++) {
      const angle = r() * Math.PI * 2;
      const distance = placed.length ? Math.sqrt(r()) * (0.2 + tries * 0.01) : 0;
      x = Math.cos(angle) * distance;
      z = Math.sin(angle) * distance;
      if (placed.every((f) => Math.hypot(f.x - x, f.z - z) >= REACH * f.size + reach + 0.02)) break;
    }
    placed.push({
      x,
      z,
      height: 1.1 + r() * 0.7,
      size,
      petals: 5 + Math.floor(r() * 8),
      layers: r() < 0.5 ? 2 : 1,
      petal: colours[Math.floor(r() * colours.length)] ?? '#f7a8c4',
      centre: CENTRES[Math.floor(r() * CENTRES.length)],
      cup: 0.2 + r() * 0.5,
    });
  }
  return placed;
}
