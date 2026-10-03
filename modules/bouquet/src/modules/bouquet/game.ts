// The flower game's rules, as plain functions on plain data, so they can be
// tested and drawn any way (Garden.svelte draws them in 3D, Game.svelte shows
// the order and score as page elements).
import { type Flower } from './bouquet';

/** One flower growing in the garden: which kind it is, and how grown (0 to 1). */
export interface Plant {
  id: number;
  kind: number;
  grow: number;
}

/** What a customer wants: how many of each kind (by index), and what's been picked so far. */
export interface Order {
  who: string;
  wants: number[];
  picked: number[];
}

/** The garden is a grid of spots, so flowers never touch. */
export const COLUMNS = 4;
export const ROWS = 3;
export const SPOTS = COLUMNS * ROWS;

const pick = <T>(list: T[], random: () => number) => list[Math.floor(random() * list.length)];

/** A new order of 3 to 5 flowers (more as the game goes on), in up to 3 kinds. */
export function newOrder(kinds: number, customers: string[], made: number, random = Math.random): Order {
  const size = Math.min(5, 3 + Math.floor(made / 3));
  const wants = Array(kinds).fill(0);
  const allowed = Array.from({ length: kinds }, (_, i) => i).sort(() => random() - 0.5).slice(0, 3);
  for (let i = 0; i < size; i++) wants[pick(allowed, random)]++;
  return { who: pick(customers, random), wants, picked: Array(kinds).fill(0) };
}

/** How many more of each kind the order still needs. */
export const stillNeeded = (order: Order) => order.wants.map((n, i) => Math.max(0, n - order.picked[i]));
export const isDone = (order: Order) => stillNeeded(order).every((n) => n === 0);

/**
 * Plants new flowers in empty spots (null). There are always enough of what
 * the order still needs, so it can always be finished; the rest are random.
 */
export function replant(garden: (Plant | null)[], order: Order, kinds: number, nextId: () => number, random = Math.random): (Plant | null)[] {
  const result = [...garden];
  const have = Array(kinds).fill(0);
  for (const plant of result) if (plant) have[plant.kind]++;
  const owed = stillNeeded(order).flatMap((n, kind) => Array(Math.max(0, n - have[kind])).fill(kind));
  for (let spot = 0; spot < result.length; spot++) {
    if (result[spot]) continue;
    const kind = owed.length ? owed.shift()! : Math.floor(random() * kinds);
    result[spot] = { id: nextId(), kind, grow: 0 };
  }
  return result;
}

/** Where a spot is in the garden, and the flower's shape there. */
export function flowerAt(spot: number, colour: string, id: number): Flower {
  const column = spot % COLUMNS;
  const row = Math.floor(spot / COLUMNS);
  // A little variety from the id, so replanted flowers don't all look the same.
  const vary = (n: number) => ((id * 9301 + n * 49297) % 233280) / 233280;
  return {
    x: (column - (COLUMNS - 1) / 2) * 0.95,
    z: (row - (ROWS - 1) / 2) * 0.9,
    height: 0.9 + vary(1) * 0.4,
    size: 0.8,
    petals: 5 + Math.floor(vary(2) * 7),
    layers: vary(3) < 0.5 ? 2 : 1,
    petal: colour,
    centre: ['#f6c94c', '#7a4a1f', '#ffe08a'][Math.floor(vary(4) * 3)],
    cup: 0.2 + vary(5) * 0.4,
  };
}
