// Seeded random numbers for games, so a game can be replayed exactly (the
// same seed gives the same tiles, rolls and orders), saved and resumed, and
// shared as a "daily" game everyone plays the same. The seed's state is a
// plain number, so it saves with the rest of the game.

/** The next number from 0 up to (not including) 1, and the new state. Mulberry32. */
export function next(state: number): [number, number] {
  const a = (state + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, a];
}

/** A random source that keeps its state on an object (e.g. the saved game), under `rs`. */
export function randomOn(holder: { rs: number }) {
  const random = () => {
    const [value, state] = next(holder.rs);
    holder.rs = state;
    return value;
  };
  const int = (n: number) => Math.floor(random() * n);
  return {
    random,
    int,
    pick: <T>(list: T[]): T => list[int(list.length)],
    shuffle<T>(list: T[]): T[] {
      for (let i = list.length - 1; i > 0; i--) {
        const j = int(i + 1);
        [list[i], list[j]] = [list[j], list[i]];
      }
      return list;
    },
  };
}

/** A seed from text (FNV-1a), e.g. a date for the daily game. */
export function seedFrom(text: string): number {
  let h = 2166136261;
  for (const ch of text) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Today's date in New Zealand (YYYY-MM-DD), so the daily game changes at NZ midnight. */
export const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' });

/** A fresh seed for a new random game. */
export const freshSeed = () => Math.floor(Math.random() * 2 ** 31);
