// What a game remembers in the player's own browser: best scores, a game in
// progress and settings like sound. Browser storage can be missing or blocked
// (private windows, previews), so every read and write is allowed to fail
// quietly and the game still works, just without remembering.

const read = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const write = (key: string, value: string | null) => {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {}
};

/** The best score so far, or null if there isn't one. */
export function readBest(key: string): number | null {
  const n = Number(read(key));
  return read(key) !== null && Number.isFinite(n) ? n : null;
}

/** Records a finished game's score. `lowerIsBetter` for golf-style scores. */
export function saveBest(key: string, score: number, lowerIsBetter = false): { best: number; isNew: boolean } {
  const best = readBest(key);
  const isNew = best === null || (lowerIsBetter ? score < best : score > best);
  if (isNew) write(key, String(score));
  return { best: isNew ? score : best, isNew };
}

/** A saved game in progress, or null. */
export function loadGame<T>(key: string): T | null {
  try {
    return JSON.parse(read(key) ?? 'null') as T | null;
  } catch {
    return null;
  }
}

export const saveGame = (key: string, state: unknown) => write(key, JSON.stringify(state));
export const clearGame = (key: string) => write(key, null);

/** An on/off setting such as sound or hints. */
export function readSetting(key: string, fallback: boolean): boolean {
  const value = read(key);
  return value === null ? fallback : value === '1';
}

export const saveSetting = (key: string, on: boolean) => write(key, on ? '1' : '0');
