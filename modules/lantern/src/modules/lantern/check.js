// Lantern Market's own checks, run by npm run check:
// 1. Same game: replays games recorded from the playtested original
//    (same-game.json) and fails if any turn comes out differently. Change the
//    rules on purpose? Re-record with `node src/modules/lantern/check.js --record`.
// 2. Playtest: a simple bot plays 30 games; the results must stay inside the
//    limits below, so a change can't make the game unwinnable or trivial.
//    (A smarter bot that looks one move ahead wins about 1 game in 6.)
import { readFileSync, writeFileSync } from 'node:fs';
import * as game from './lantern.ts';
import { playtest, average } from '../../lib/game/playtest.ts';

const fnv = (s) => { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16); };
const digest = (S) =>
  fnv(JSON.stringify({ t: S.turn, sc: S.score, p: S.prestige, h: S.hearts, st: S.stop, g: S.gems, sw: S.swaps, rs: S.rs, b: S.board.map((x) => (x ? x.id : 0)), be: S.belt.map((x) => x.id), pa: S.patrons.map((p) => [p.id, p.left, p.got ?? -1, p.label]), o: S.over, bo: S.bonus, m: [1, 2, 3].map((t) => S.market[t].map((c) => (c ? c.id : 0))) }));

/** A simple bot: buys the first card it can afford, then makes the move that clears and serves most. */
function play(seed, maxTurns, record) {
  const S = game.newGame(seed);
  const trace = [digest(S)];
  while (!S.over && S.turn < maxTurns) {
    outer: for (const t of [1, 2, 3]) for (let i = 0; i < 3; i++) { const c = S.market[t][i]; if (c && game.cardPrice(c).ok) { game.buyCard(t, i); break outer; } }
    if (S.over) break;
    let best = null;
    for (let k = 0; k < game.windowSize(); k++) for (let i = 0; i < game.N_CELLS; i++) {
      if (S.board[i]) continue;
      const { r, served } = game.preview(S.belt[k], i);
      const v = r.cleared.length * 10 + served.reduce((a, p) => a + p.reward * 30, 0);
      if (!best || v > best.v) best = { v, k, i };
    }
    if (best && (best.v > 0 || S.board.filter(Boolean).length < 40)) game.place(best.k, best.i);
    else game.pass();
    if (record) trace.push(digest(S));
  }
  return { trace, S };
}

const file = new URL('./same-game.json', import.meta.url);
if (process.argv.includes('--record')) {
  const games = Object.fromEntries([11, 2024, 777777].map((seed) => [seed, play(seed, 120, true).trace]));
  writeFileSync(file, JSON.stringify(games));
  console.log('Recorded new reference games.');
  process.exit(0);
}

const problems = [];
for (const [seed, expected] of Object.entries(JSON.parse(readFileSync(file, 'utf8')))) {
  const { trace } = play(Number(seed), 120, true);
  const turn = expected.findIndex((d, i) => d !== trace[i]);
  if (turn >= 0 || trace.length !== expected.length) problems.push(`game ${seed} plays differently from turn ${turn >= 0 ? turn : Math.min(trace.length, expected.length)}`);
}

const { results, failed } = playtest(
  30,
  (g) => { const { S } = play(1000 + g * 7919, 250, false); return { turns: S.turn, stop: S.stop, prestige: S.prestige, melds: S.stats.melds, served: S.stats.served }; },
  {
    'games last 20 to 120 turns on average': (r) => { const a = average(r, (x) => x.turns); return a >= 20 && a <= 120; },
    'the bot reaches the second stop in at least a quarter of games': (r) => r.filter((x) => x.stop >= 1).length >= r.length * 0.25,
    'the simple bot never wins (the game needs planning)': (r) => r.every((x) => x.stop < 5),
    'one clear every 3 to 9 turns on average': (r) => { const a = average(r, (x) => x.turns / Math.max(1, x.melds)); return a >= 3 && a <= 9; },
  },
);
problems.push(...failed.map((f) => `playtest: ${f}`));
const summary = `${results.length} bot games: ${average(results, (x) => x.turns).toFixed(0)} turns, stop ${average(results, (x) => x.stop).toFixed(1)}, ${average(results, (x) => x.prestige).toFixed(1)} prestige on average`;
if (problems.length) {
  console.error(`Lantern Market:\n- ${problems.join('\n- ')}\n(${summary})`);
  process.exit(1);
}
console.log(`Lantern Market: same game as the original, and ${summary}.`);
