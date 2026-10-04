// Runs bots through a game many times and checks the results stay inside
// agreed limits, so a rules change can't quietly make a game unwinnable or
// trivial. Used by a game module's check.js (run by npm run check).

export interface Limits<R> {
  /** A name for each limit and a test over all the games' results. */
  [name: string]: (results: R[]) => boolean;
}

export function playtest<R>(games: number, play: (game: number) => R, limits: Limits<R>): { results: R[]; failed: string[] } {
  const results = Array.from({ length: games }, (_, game) => play(game));
  const failed = Object.entries(limits)
    .filter(([, ok]) => !ok(results))
    .map(([name]) => name);
  return { results, failed };
}

export const average = <R>(results: R[], value: (r: R) => number) => results.reduce((a, r) => a + value(r), 0) / results.length;
