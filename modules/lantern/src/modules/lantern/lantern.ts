// Lantern Market's rules, as plain functions with no page code, so the game
// can be played by the page, by the playtest bots (check.js) and replayed
// exactly from a seed. The game in progress is one plain object (`Game`),
// which saves to browser storage as it is. Wording a client might change
// (stops, patrons, card names, gem colours) is in lantern.json.
//
// The rules are kept exactly as playtested: check.js replays recorded games
// and fails if any turn comes out differently.
import data from './lantern.json' with { type: 'json' };
import { randomOn, seedFrom } from '../../lib/game/random.ts';
import { DIRS, flower, hexPoints, neighbours, pixel, rotate, type Cube } from '../../lib/game/hex.ts';

/* ---------- constants ---------- */
export const SZ = 30;
export const BELT_LEN = 9;
export const GEM_CAP = 15;
export const GOLD = 5;
export const STOPS: { name: string; goal: number }[] = data.stops;
export const GEMS: { name: string; ink: string; light: string; tint: string }[] = data.gems;
export const GEM_NAMES = GEMS.map((g) => g.name);
export const PERKS: Record<string, string> = data.perks;
const NAMES: string[] = data.patrons;
const CARD_DEFS = data.cards as Record<string, { name: string; perk?: string }[]>;

/* ---------- board: 7 districts of 7 hexes ---------- */
export const CENTERS: Cube[] = (() => {
  const c: Cube[] = [[0, 0, 0]];
  let v: Cube = [2, 1, -3];
  for (let i = 0; i < 6; i++) {
    c.push(v);
    v = rotate(v);
  }
  return c;
})();
export interface Cell { d: number; px: number; py: number }
const CUBES = CENTERS.flatMap((c) => flower(c));
export const CELLS: Cell[] = CUBES.map((c, i) => {
  const [px, py] = pixel(c, SZ);
  return { d: Math.floor(i / 7), px, py };
});
export const N_CELLS = CELLS.length;
export const NB = neighbours(CUBES);
export const DIST_CELLS = CENTERS.map((_, d) => CELLS.map((c, i) => (c.d === d ? i : -1)).filter((i) => i >= 0));
/** Outlines between districts, as one SVG path. */
export const DBORDER = (() => {
  let d = '';
  CELLS.forEach((c, i) =>
    DIRS.forEach((o, k) => {
      const j = NB[i][k];
      if (j >= 0 && (CELLS[j].d === c.d || j < i)) return;
      const [nx, ny] = pixel(o, SZ);
      const a = Math.atan2(ny, nx);
      const p1 = [c.px + SZ * Math.cos(a - Math.PI / 6), c.py + SZ * Math.sin(a - Math.PI / 6)];
      const p2 = [c.px + SZ * Math.cos(a + Math.PI / 6), c.py + SZ * Math.sin(a + Math.PI / 6)];
      d += `M${p1[0].toFixed(1)} ${p1[1].toFixed(1)}L${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }),
  );
  return d;
})();
/** Where each outer district's number chip sits, just outside the board. */
export const CHIP_POS = CENTERS.map((_, d) => {
  if (!d) return null;
  const c = CELLS[DIST_CELLS[d][0]], len = Math.hypot(c.px, c.py), u = [c.px / len, c.py / len];
  return [c.px + u[0] * SZ * 3.15, c.py + u[1] * SZ * 3.15];
});
export const VB = (() => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const add = (x: number, y: number, r: number) => { x0 = Math.min(x0, x - r); y0 = Math.min(y0, y - r); x1 = Math.max(x1, x + r); y1 = Math.max(y1, y + r); };
  CELLS.forEach((c) => add(c.px, c.py, SZ));
  CHIP_POS.forEach((p) => p && add(p[0], p[1], 22));
  return { x: x0 - 4, y: y0 - 4, w: x1 - x0 + 8, h: y1 - y0 + 8 };
})();
export const HEX_CELL = hexPoints(SZ - 1.2), HEX_TILE = hexPoints(25), HEX_TILE_SH = hexPoints(25, 0, 3);
export { hexPoints };

/* ---------- gem shapes (a different shape per colour, so colour isn't the only clue) ---------- */
export const OCT = Array.from({ length: 8 }, (_, k) => { const a = Math.PI / 8 + k * Math.PI / 4; return (0.9 * Math.cos(a)).toFixed(3) + ',' + (0.9 * Math.sin(a)).toFixed(3); }).join(' ');
export const STAR = Array.from({ length: 10 }, (_, k) => { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 0.42 : 0.98; return (r * Math.cos(a)).toFixed(3) + ',' + (r * Math.sin(a)).toFixed(3); }).join(' ');
export const gemPath = (c: number) => [
  '<circle r=".82"/>',
  '<rect x="-.7" y="-.7" width="1.4" height="1.4" rx=".14"/>',
  `<polygon points="${OCT}"/>`,
  '<polygon points="0,-.92 .9,.72 -.9,.72"/>',
  '<polygon points="0,-.97 .72,0 0,.97 -.72,0"/>',
  `<polygon points="${STAR}"/>`,
][c];
export const gemIcon = (c: number) => `<svg class="gi" viewBox="-1 -1 2 2" aria-hidden="true" fill="${GEMS[c].light}">${gemPath(c)}</svg>`;
/** A tile's SVG markup, centred on 0,0. */
export const tileSvg = (t: Tile) => {
  const face = `<polygon class="tf-sh" points="${HEX_TILE_SH}"/><polygon class="tf" points="${HEX_TILE}"/>`;
  if (t.c < 0) return face + `<g transform="translate(0,-1) scale(15)" fill="#d99a16" stroke="#8a5a00" stroke-width=".06">${gemPath(5)}</g>`;
  return face + `<text class="tn" y="5" fill="${GEMS[t.c].ink}">${t.n}</text><g transform="translate(0,15) scale(4.4)" fill="${GEMS[t.c].ink}">${gemPath(t.c)}</g>`;
};
export const tileName = (t: Tile) => (t.c < 0 ? 'Joker' : `${GEM_NAMES[t.c]} ${t.n}`);

/* ---------- the game ---------- */
/** A tile: colour 0 to 4 (or -1 for a joker) and number 1 to 7. */
export interface Tile { id: number; c: number; n: number }
export interface Card { id: string; tier: number; name: string; perk: string | null; bonus: number; cost: number[]; pts: number }
export interface Patron {
  id: number; kind: string; name: string; reward: number; label: string; hint: string;
  left: number; max: number; c?: number; n?: number; v?: number; k?: number; need?: number; got?: number;
}
export interface Meld { type: 'run' | 'set'; color?: number; num?: number; values: number[]; cells: number[] }
export interface DistrictEvent { type: 'cake' | 'bloom'; color?: number; cells: number[]; d: number }
export interface Resolution { melds: Meld[]; events: DistrictEvent[]; cleared: number[]; pts: number; mult: number }

export type Game = ReturnType<typeof blankGame>;
const blankGame = (seed: number, daily: string | null) => ({
  v: 1, seed, daily, rs: seed | 0, nextId: 1,
  board: Array(N_CELLS).fill(null) as (Tile | null)[], bag: [] as Tile[], belt: [] as Tile[], sel: null as number | null,
  gems: [0, 0, 0, 0, 0, 0], bonus: [0, 0, 0, 0, 0], owned: [] as Card[],
  perks: { window: 0, patience: 0, guard: 0, harbor: 0, swapcap: 0, joker: 0, wok: 0, steamer: 0 } as Record<string, number>,
  swaps: 2, patrons: [] as Patron[], patronWait: 2, prestige: 0, score: 0, hearts: 3, stop: 0, turn: 0,
  dice: null as { a: number; b: number; sum: number; note: string; n: number } | null,
  over: null as null | 'win' | 'hearts' | 'full', terrains: [] as number[], tokens: [] as number[],
  market: {} as Record<number, (Card | null)[]>, decks: {} as Record<number, Card[]>, log: [] as string[],
  stats: { melds: 0, longest: 0, served: 0, blooms: 0, cakes: 0, lost: 0, cardPts: 0 },
  streak: 0, boughtTurn: false,
});

// The game being played. use() switches to a saved one.
let S: Game;
let R: ReturnType<typeof randomOn>;
export function use(game: Game) {
  S = game;
  R = randomOn(S);
  return S;
}
const rand = () => R.random();
const randInt = (n: number) => R.int(n);
const pick = <T>(a: T[]) => R.pick(a);
const shuffle = <T>(a: T[]) => R.shuffle(a);
/** The seed for a day's daily market. */
export const dailySeed = (date: string) => seedFrom('lantern-' + date);

function refillBag() {
  const bag: Tile[] = [];
  for (let c = 0; c < 5; c++) for (let n = 1; n <= 7; n++) for (let k = 0; k < 2; k++) bag.push({ id: S.nextId++, c, n });
  for (let k = 0; k < 2 + 2 * S.perks.joker; k++) bag.push({ id: S.nextId++, c: -1, n: 0 });
  S.bag = shuffle(bag);
}
function draw(): Tile { if (!S.bag.length) refillBag(); return S.bag.pop()!; }

function makeCard(tier: number, def: { name: string; perk?: string }, i: number, bonus: number): Card {
  const total = tier === 1 ? 3 + randInt(2) : tier === 2 ? 6 + randInt(3) : 9 + randInt(3);
  const others = shuffle([0, 1, 2, 3, 4].filter((c) => c !== bonus));
  const nc = tier === 1 ? 1 + randInt(2) : tier === 2 ? 2 + randInt(2) : 3;
  const cols = others.slice(0, nc), cost = [0, 0, 0, 0, 0];
  cols.forEach((c) => (cost[c] = 1));
  for (let k = nc; k < total; k++) cost[pick(cols)]++;
  let pts;
  if (tier === 1) pts = 0;
  else if (tier === 2) pts = def.perk ? 0 : 1;
  else pts = def.perk ? 1 : 2 + randInt(2);
  return { id: `t${tier}-${i}`, tier, name: def.name, perk: def.perk || null, bonus, cost, pts };
}

export function newGame(seed: number, daily: string | null = null): Game {
  use(blankGame(seed, daily));
  const t = shuffle([0, 1, 2, 3, 4, randInt(5)]);
  S.terrains = [-1, ...t];
  S.tokens = [0, ...shuffle([4, 5, 6, 8, 9, 10])];
  refillBag();
  let placed = 0, guard = 0;
  while (placed < 10 && guard++ < 600) {
    const i = randInt(N_CELLS);
    if (S.board[i]) continue;
    const tl = draw();
    S.board[i] = tl;
    if (findMelds(S.board, i).length) { S.board[i] = null; S.bag.unshift(tl); } else placed++;
  }
  for (let k = 0; k < BELT_LEN; k++) S.belt.push(draw());
  [1, 2, 3].forEach((tier) => {
    const bonuses = shuffle(Array.from({ length: CARD_DEFS[tier].length }, (_, i) => i % 5));
    const deck = shuffle(CARD_DEFS[tier].map((def, i) => makeCard(tier, def, i, bonuses[i])));
    S.market[tier] = deck.splice(0, 3);
    S.decks[tier] = deck;
  });
  S.patrons.push(makePatron('anyRun'), makePatron('setNum'));
  addLog(`Welcome to ${STOPS[0].name}. Earn ${STOPS[0].goal} prestige to move on.`);
  return S;
}

/* ---------- melds ---------- */
function asRun(ts: Tile[]) {
  const nj: [Tile, number][] = [];
  ts.forEach((t, i) => { if (t.c >= 0) nj.push([t, i]); });
  if (!nj.length) return null;
  const c = nj[0][0].c;
  if (nj.some(([t]) => t.c !== c)) return null;
  for (const dir of [1, -1]) {
    const s = nj[0][0].n - dir * nj[0][1];
    if (!nj.every(([t, i]) => t.n === s + dir * i)) continue;
    const end = s + dir * (ts.length - 1);
    if (Math.min(s, end) >= 1 && Math.max(s, end) <= 7) return { type: 'run' as const, color: c, values: ts.map((_, i) => s + dir * i) };
  }
  return null;
}
function asSet(ts: Tile[]) {
  if (ts.length > 5) return null;
  const nj = ts.filter((t) => t.c >= 0);
  if (!nj.length) return null;
  const n = nj[0].n;
  if (nj.some((t) => t.n !== n)) return null;
  if (new Set(nj.map((t) => t.c)).size !== nj.length) return null;
  return { type: 'set' as const, num: n, values: ts.map(() => n) };
}
const evalMeld = (ts: Tile[]) => (ts.length < 3 ? null : asRun(ts) || asSet(ts));
function segment(board: (Tile | null)[], i: number, ax: number) {
  const back: number[] = [];
  let j = NB[i][ax + 3];
  while (j >= 0 && board[j]) { back.push(j); j = NB[j][ax + 3]; }
  const fwd: number[] = [];
  j = NB[i][ax];
  while (j >= 0 && board[j]) { fwd.push(j); j = NB[j][ax]; }
  return { seg: [...back.reverse(), i, ...fwd], p: back.length };
}
export function findMelds(board: (Tile | null)[], i: number): Meld[] {
  const out: Meld[] = [];
  for (let ax = 0; ax < 3; ax++) {
    const { seg, p } = segment(board, i, ax);
    let found: Meld | null = null;
    for (let len = seg.length; len >= 3 && !found; len--) {
      for (let st = Math.max(0, p - len + 1); st <= Math.min(p, seg.length - len); st++) {
        const cells = seg.slice(st, st + len), m = evalMeld(cells.map((k) => board[k]!));
        if (m) { found = { ...m, cells }; break; }
      }
    }
    if (found) out.push(found);
  }
  return out;
}
function districtEvent(board: (Tile | null)[], d: number): DistrictEvent | null {
  const cs = DIST_CELLS[d];
  if (cs.some((k) => !board[k])) return null;
  const nj = cs.map((k) => board[k]!).filter((t) => t.c >= 0);
  if (nj.every((t) => t.c === nj[0].c)) return { type: 'cake', color: nj.length ? nj[0].c : GOLD, cells: cs, d };
  if (new Set(nj.map((t) => t.n)).size === nj.length) return { type: 'bloom', cells: cs, d };
  return null;
}
const meldPoints = (m: Meld) => m.values.reduce((a, b) => a + b, 0) * (m.cells.length - 2);
/** What a move clears and scores, without changing anything. */
export function resolve(board: (Tile | null)[], positions: number[]): Resolution {
  const melds: Meld[] = [], seen = new Set<string>();
  positions.forEach((i) => {
    if (!board[i]) return;
    findMelds(board, i).forEach((m) => { const key = m.cells.slice().sort((a, b) => a - b).join(','); if (!seen.has(key)) { seen.add(key); melds.push(m); } });
  });
  const events: DistrictEvent[] = [];
  new Set(positions.map((i) => CELLS[i].d)).forEach((d) => { const e = districtEvent(board, d); if (e) events.push(e); });
  const cleared = new Set<number>();
  melds.forEach((m) => m.cells.forEach((c) => cleared.add(c)));
  events.forEach((e) => e.cells.forEach((c) => cleared.add(c)));
  const k = melds.length + events.length, mult = k > 1 ? 1 + 0.5 * (k - 1) : 1;
  const base = melds.reduce((a, m) => a + meldPoints(m), 0) + events.reduce((a, e) => a + (e.type === 'bloom' ? 150 : 120), 0);
  return { melds, events, cleared: [...cleared], pts: Math.round(base * mult), mult };
}
export const describeMeld = (m: Meld) => (m.type === 'run' ? `${GEM_NAMES[m.color!]} run ${m.values.join('-')}` : `Set of ${m.num}s ×${m.cells.length}`);

/* ---------- patrons ---------- */
function patronPool() {
  const s = S.stop, P: [string, number][] = [['runColor', 3], ['setNum', 3]];
  if (s <= 1) P.push(['anyRun', s ? 1 : 2.5], ['anySet', s ? 1 : 2.5]);
  if (s >= 1) P.push(['highSum', 2], ['meldLen', 2], ['bus', 1.5]);
  if (s >= 2) P.push(['runLen', 2], ['setLen', 1.5], ['combo', 1.2]);
  if (s >= 3) P.push(['bloom', 0.8]);
  return P;
}
function makePatron(kind: string): Patron {
  const s = Math.min(S.stop, 4), p = { id: S.nextId++, kind, name: pick(NAMES) } as Patron;
  let extra = 0;
  switch (kind) {
    case 'anyRun': p.reward = 1; p.label = 'Any run'; p.hint = 'Same colour, numbers in a row, like 3-4-5'; break;
    case 'anySet': p.reward = 1; p.label = 'Any set'; p.hint = 'Same number, all different colours'; break;
    case 'runColor': extra = 2; p.c = randInt(5); p.reward = 2; p.label = `Run in ${GEM_NAMES[p.c]}`; p.hint = 'Same colour, numbers in a row'; break;
    case 'setNum': extra = 2; p.n = 1 + randInt(7); p.reward = 2; p.label = `Set of ${p.n}s`; p.hint = 'Same number, all different colours'; break;
    case 'highSum': p.v = [14, 14, 16, 18, 18][s]; p.reward = 3; p.label = `Meld worth ${p.v}+`; p.hint = 'Add up the numbers in one meld'; break;
    case 'meldLen': p.k = s >= 3 ? 5 : 4; p.reward = p.k === 5 ? 4 : 3; p.label = `Any meld of ${p.k}+`; p.hint = 'A run or set at least this long'; extra = p.k === 5 ? 3 : 0; break;
    case 'bus': p.c = randInt(5); p.need = 6; p.got = 0; p.reward = 3; p.label = `Tour bus: ${p.need} ${GEM_NAMES[p.c]}`; p.hint = 'Clear tiles of this colour, any meld'; extra = 5; break;
    case 'runLen': p.k = s >= 3 ? 5 : 4; p.reward = p.k === 5 ? 4 : 3; p.label = `Run of ${p.k}+`; p.hint = 'One colour, a long staircase'; extra = p.k === 5 ? 3 : 1; break;
    case 'setLen': p.k = s >= 4 ? 5 : 4; p.reward = p.k === 5 ? 5 : 3; p.label = `Set of ${p.k} colours`; p.hint = `Same number in ${p.k} colours`; extra = p.k === 5 ? 4 : 2; break;
    case 'combo': p.reward = 4; p.label = 'Two melds in one move'; p.hint = 'One tile that finishes two lines'; extra = 2; break;
    case 'bloom': p.reward = 5; p.label = 'Bloom or Cake'; p.hint = 'Fill a district: 1 to 7 once each, or one colour'; extra = 8; break;
  }
  p.max = p.left = [16, 15, 15, 14, 14][s] + extra + 2 * S.perks.patience;
  return p;
}
function addPatron() {
  const active = new Set(S.patrons.map((p) => p.label));
  for (let tries = 0; tries < 20; tries++) {
    const pool = patronPool(), total = pool.reduce((a, [, w]) => a + w, 0);
    let r = rand() * total, kind = pool[0][0];
    for (const [k, w] of pool) { r -= w; if (r <= 0) { kind = k; break; } }
    const p = makePatron(kind);
    if (!active.has(p.label)) { S.patrons.push(p); return p; }
  }
  return null;
}
function meldServes(p: Patron, m: Meld) {
  const len = m.cells.length;
  switch (p.kind) {
    case 'anyRun': return m.type === 'run';
    case 'anySet': return m.type === 'set';
    case 'runColor': return m.type === 'run' && m.color === p.c;
    case 'setNum': return m.type === 'set' && m.num === p.n;
    case 'highSum': return m.values.reduce((a, b) => a + b, 0) >= p.v!;
    case 'meldLen': return len >= p.k!;
    case 'runLen': return m.type === 'run' && len >= p.k!;
    case 'setLen': return m.type === 'set' && len >= p.k!;
  }
  return false;
}
export const busGain = (p: Patron, res: Resolution, board: (Tile | null)[]) => res.cleared.filter((i) => board[i] && board[i]!.c === p.c).length;
/** The patrons a move would serve. */
export function matchPatrons(res: Resolution, board: (Tile | null)[]) {
  const served: Patron[] = [], used = new Set<number>();
  [...S.patrons].sort((a, b) => b.reward - a.reward).forEach((p) => {
    if (p.kind === 'combo') { if (res.melds.length + res.events.length >= 2) served.push(p); }
    else if (p.kind === 'bloom') { if (res.events.length) served.push(p); }
    else if (p.kind === 'bus') { if (p.got! + busGain(p, res, board) >= p.need!) served.push(p); }
    else {
      const mi = res.melds.findIndex((m, idx) => !used.has(idx) && meldServes(p, m));
      if (mi >= 0) { used.add(mi); served.push(p); }
    }
  });
  return served;
}

/* ---------- economy ---------- */
export const gemTotal = () => S.gems.reduce((a, b) => a + b, 0);
function addGems(gain: number[]) {
  let lost = 0;
  gain.forEach((n, c) => { for (let k = 0; k < n; k++) { if (gemTotal() < GEM_CAP) S.gems[c]++; else lost++; } });
  return lost;
}
const swapCap = () => 5 + 2 * S.perks.swapcap;
export const windowSize = () => Math.min(5, 3 + S.perks.window);
export const tradeRate = () => (S.perks.harbor ? 3 : 4);
function cardNeed(card: Card) {
  // Discounts never take a card below 2, 4 or 6 gems (by tier).
  const need = card.cost.map((v, c) => Math.max(0, v - S.bonus[c]));
  let deficit = card.tier * 2 - need.reduce((a, b) => a + b, 0);
  while (deficit > 0) {
    let best = -1;
    for (let c = 0; c < 5; c++) if (need[c] < card.cost[c] && (best < 0 || card.cost[c] - need[c] > card.cost[best] - need[best])) best = c;
    if (best < 0) break;
    need[best]++; deficit--;
  }
  return need;
}
export function cardPrice(card: Card) {
  const pay = [0, 0, 0, 0, 0, 0], need = cardNeed(card);
  let short = 0;
  for (let c = 0; c < 5; c++) {
    const use = Math.min(need[c], S.gems[c]);
    pay[c] = use; short += need[c] - use;
  }
  pay[GOLD] = short;
  return { pay, need, ok: short <= S.gems[GOLD] && !S.boughtTurn, short: short - S.gems[GOLD] };
}

/* ---------- moves ---------- */
/** Applies a resolved move: patrons, gems, swaps, prestige, score; clears the tiles. */
export function commit(res: Resolution) {
  const served = matchPatrons(res, S.board);
  S.patrons.forEach((p) => { if (p.kind === 'bus' && !served.includes(p)) p.got! += busGain(p, res, S.board); });
  const gain = [0, 0, 0, 0, 0, 0];
  res.cleared.forEach((i) => { const t = S.board[i]!; gain[t.c >= 0 ? t.c : GOLD]++; });
  res.events.forEach(() => { gain[GOLD] += 2; });
  const lost = addGems(gain);
  let sg = res.melds.filter((m) => m.cells.length >= 5).length + res.events.length;
  const before = S.swaps;
  S.swaps = Math.min(swapCap(), S.swaps + sg);
  sg = S.swaps - before;
  let pres = S.perks.wok * res.melds.filter((m) => m.cells.length >= 5).length;
  served.forEach((p) => {
    pres += p.reward; S.score += 25 * p.reward; S.stats.served++;
    S.streak = (S.streak || 0) + 1;
    if (S.streak >= 3) { S.streak = 0; if (S.hearts < 3) { S.hearts++; addLog('Three happy patrons in a row: +1 lantern'); } }
  });
  S.patrons = S.patrons.filter((p) => !served.includes(p));
  S.prestige += pres; S.score += res.pts;
  S.stats.melds += res.melds.length;
  res.melds.forEach((m) => { S.stats.longest = Math.max(S.stats.longest, m.cells.length); });
  res.events.forEach((e) => { if (e.type === 'bloom') S.stats.blooms++; else S.stats.cakes++; });
  res.cleared.forEach((i) => { S.board[i] = null; });
  if (res.cleared.length) {
    const parts = res.melds.map(describeMeld).concat(res.events.map((e) => (e.type === 'bloom' ? 'Bloom' : `${GEM_NAMES[e.color!]} cake`)));
    addLog(`${parts.join(' + ')}: +${res.pts} points${gainText(gain)}`);
  }
  served.forEach((p) => addLog(`Served ${p.name} (${p.label}): +${p.reward} prestige`));
  if (sg) addLog(`+${sg} swap${sg > 1 ? 's' : ''}`);
  if (lost) addLog(`Gem bag full: ${lost} gem${lost > 1 ? 's' : ''} lost (holds ${GEM_CAP})`);
  return { served, gain, pres, sg, lost };
}
const gainText = (gain: number[]) => { const s = gain.map((n, c) => (n ? ` ${n}${gemIcon(c)}` : '')).join(''); return s ? ',' + s : ''; };
/** Takes the dish at counter slot k; the belt moves on and a new dish comes out. */
export function takeFromBelt(k: number) { S.belt.splice(k, 1); S.belt.push(draw()); S.belt.push(S.belt.shift()!); }
/** The belt moves on without taking anything. */
export function passBelt() { S.belt.push(S.belt.shift()!); addLog('Passed. The belt moved on'); }
/** After every move: dice and gems, patrons' patience, new patrons, stops, game over. */
export function endTurn() {
  S.turn++;
  S.boughtTurn = false;
  const out = { expired: [] as Patron[], arrived: null as Patron | null, reached: [] as { name: string; goal: number }[] };
  const a = 1 + randInt(6), b = 1 + randInt(6), sum = a + b, prod = [0, 0, 0, 0, 0, 0];
  let note;
  if (sum === 7) {
    if (S.perks.guard) { prod[GOLD] = 1; note = `Rolled 7. Raccoon Gate kept the raccoon out: +1 ${gemIcon(GOLD)}`; }
    else {
      let best = -1;
      for (let c = 0; c < 5; c++) if (S.gems[c] > 0 && (best < 0 || S.gems[c] > S.gems[best])) best = c;
      if (best >= 0) { S.gems[best]--; note = `Rolled 7. The raccoon stole 1 ${gemIcon(best)}`; }
      else note = 'Rolled 7. The raccoon found nothing to steal';
    }
  } else {
    const hits: string[] = [];
    S.tokens.forEach((tk, d) => {
      if (tk !== sum) return;
      const t = S.terrains[d], n = DIST_CELLS[d].filter((i) => S.board[i] && S.board[i]!.c === t).length;
      const amt = 1 + (n >= 2 ? 1 : 0) + S.perks.steamer;
      prod[t] += amt; hits.push(`${amt}${gemIcon(t)}`);
    });
    note = hits.length ? `Rolled ${sum}: ${hits.join(' ')}` : `Rolled ${sum}: no district has that number`;
  }
  const lost = addGems(prod);
  if (lost) note += ` (${lost} lost, bag full)`;
  S.dice = { a, b, sum, note, n: S.turn };
  addLog(note);
  S.patrons.forEach((p) => { p.left--; });
  S.patrons.filter((p) => p.left <= 0).forEach((p) => {
    S.hearts--; S.stats.lost++; S.streak = 0; out.expired.push(p);
    addLog(`${p.name} gave up waiting: −1 lantern`);
  });
  S.patrons = S.patrons.filter((p) => p.left > 0);
  if (S.patrons.length < 3) {
    S.patronWait--;
    if (S.patronWait <= 0) { out.arrived = addPatron(); S.patronWait = S.patrons.length < 2 ? 1 : 2; }
  }
  out.reached = checkStops();
  checkOver();
  return out;
}
export function checkStops() {
  const reached: { name: string; goal: number }[] = [];
  while (S.stop < STOPS.length && S.prestige >= STOPS[S.stop].goal) {
    reached.push(STOPS[S.stop]);
    S.stop++;
    S.hearts = Math.min(3, S.hearts + 1);
    if (S.stop < STOPS.length) addLog(`Arrived at ${STOPS[S.stop - 1].name}. Next stop: ${STOPS[S.stop].name}. +1 lantern`);
  }
  if (S.stop >= STOPS.length && !S.over) S.over = 'win';
  return reached;
}
export function checkOver() {
  if (S.over) return;
  if (S.hearts <= 0) S.over = 'hearts';
  else if (S.board.every(Boolean) && S.swaps === 0) S.over = 'full';
}
export function buyCard(tier: number, idx: number) {
  const card = S.market[tier][idx];
  if (!card || S.over) return false;
  const pr = cardPrice(card);
  if (!pr.ok) return false;
  pr.pay.forEach((n, c) => { S.gems[c] -= n; });
  S.bonus[card.bonus]++;
  S.prestige += card.pts; S.stats.cardPts = (S.stats.cardPts || 0) + card.pts;
  S.owned.push(card);
  S.boughtTurn = true;
  if (card.perk) {
    S.perks[card.perk]++;
    if (card.perk === 'swapcap') S.swaps = Math.min(swapCap(), S.swaps + 2);
    if (card.perk === 'joker') for (let k = 0; k < 2; k++) S.bag.splice(randInt(S.bag.length + 1), 0, { id: S.nextId++, c: -1, n: 0 });
  }
  S.market[tier][idx] = S.decks[tier].pop() || null;
  addLog(`Bought ${card.name}${card.pts ? `: +${card.pts} prestige` : ''}`);
  checkStops();
  return true;
}
export function trade(give: number, get: number) {
  const rate = tradeRate();
  if (S.over || give === get || S.gems[give] < rate) return false;
  S.gems[give] -= rate; S.gems[get]++;
  addLog(`Traded ${rate}${gemIcon(give)} for 1${gemIcon(get)}`);
  return true;
}
export function addLog(html: string) { S.log.unshift(html); S.log.length = Math.min(S.log.length, 8); }

/* ---------- whole moves, for bots and tests (the page plays them with animation) ---------- */
/** Places counter dish k on hex i: the whole move, end of turn included. */
export function place(k: number, i: number) {
  const t = S.belt[k];
  S.board[i] = t;
  const res = resolve(S.board, [i]);
  const out = commit(res);
  takeFromBelt(k);
  S.sel = null;
  return { res, ...out, turn: endTurn() };
}
export function pass() {
  S.sel = null;
  passBelt();
  return endTurn();
}
/** What placing tile t on hex i would do, without doing it. */
export function preview(t: Tile, i: number) {
  S.board[i] = t;
  const r = resolve(S.board, [i]);
  const served = matchPatrons(r, S.board);
  S.board[i] = null;
  return { r, served };
}
