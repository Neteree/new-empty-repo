<script lang="ts">
  // Lantern Market, the page side: board, belt, patrons, dice, gems, market
  // and log as page elements, with the rules in lantern.ts. Colours and fonts
  // come from the site's theme (the gem colours are game data in lantern.json).
  // The game saves itself in the browser after every move.
  import { onMount } from 'svelte';
  import { flip } from 'svelte/animate';
  import * as game from './lantern';
  import { CELLS, NB, DIST_CELLS, GEMS, GEM_NAMES, STOPS, PERKS, GOLD, GEM_CAP, VB, CHIP_POS, DBORDER, HEX_CELL, HEX_TILE, HEX_TILE_SH, OCT, STAR, SZ, hexPoints, type Tile, type Resolution, type Patron, type Card } from './lantern';
  import data from './lantern.json';
  import GameDialog from '../../components/game/GameDialog.svelte';
  import { loadGame, saveGame, readBest, saveBest, readSetting, saveSetting } from '../../lib/game/store';
  import { freshSeed, today } from '../../lib/game/random';
  import { tone, arpeggio } from '../../lib/game/sound';

  const SAVE = 'lantern-save-v1', BEST = 'lantern-best';

  let S = $state(game.newGame(freshSeed()));
  game.use(S);

  let busy = $state(false);
  let swapMode = $state(false);
  let swapFrom = $state<number | null>(null);
  let hintsOn = $state(true);
  let soundOn = $state(true);
  let hover = $state<number | null>(null);
  let armed = $state<number | null>(null);
  let lastPointer = 'mouse';
  let message = $state('');
  let dropped = $state<number | null>(null);
  let flash = $state<number[]>([]);
  let clearing = $state<number[]>([]);
  let rolling = $state(false);
  let dialog = $state<'how' | 'new' | 'end' | null>(null);
  let best = $state<number | null>(null);
  let newBest = $state(false);
  let tradeGive = $state(0);
  let tradeGet = $state(1);
  let fx: HTMLDivElement;
  let svg: SVGSVGElement;
  let fast = false;
  let reduced = false;

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, fast ? 0 : reduced ? ms * 0.3 : ms));

  function start(next: game.Game) {
    S = next;
    game.use(S);
    swapMode = false; swapFrom = null; hover = null; armed = null; busy = false; message = '';
    save();
  }
  const save = () => saveGame(SAVE, $state.snapshot(S));

  onMount(() => {
    reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    soundOn = readSetting('lantern-sound', true);
    hintsOn = readSetting('lantern-hints', true);
    best = readBest(BEST);
    const saved = loadGame<game.Game>(SAVE);
    if (saved && saved.v === 1 && !saved.over && Array.isArray(saved.board) && saved.board.length === game.N_CELLS) start(saved);
    else save();
    // For the site checks and bots.
    (window as any).lantern = { get S() { return S; }, set fast(v: boolean) { fast = v; }, placeAt, passTurn, selectBelt, wait: () => new Promise((r) => { const t = () => (busy ? setTimeout(t, 5) : r(null)); t(); }) };
  });

  /* sound */
  const sfx = {
    pick: () => soundOn && !fast && tone(660, 0.05, 'triangle', 0.04),
    place: () => soundOn && !fast && tone(330, 0.08, 'triangle', 0.07),
    clear: (k: number) => soundOn && !fast && arpeggio([523, 659, 784, 988, 1175, 1319, 1568].slice(0, Math.min(7, k + 1))),
    serve: () => { if (soundOn && !fast) { tone(988, 0.09, 'square', 0.03); tone(1319, 0.18, 'square', 0.03, 0.08); } },
    angry: () => soundOn && !fast && tone(140, 0.3, 'sawtooth', 0.04),
    dice: () => { if (soundOn && !fast) for (let i = 0; i < 4; i++) tone(200 + Math.random() * 300, 0.03, 'square', 0.02, i * 0.04); },
    stop: () => soundOn && !fast && arpeggio([392, 523, 659, 784], 0.11, 'triangle', 0.05),
    nope: () => soundOn && !fast && tone(180, 0.1, 'square', 0.03),
  };

  /* what the board would do: worked out on a copy, so nothing changes */
  function simulate(t: Tile, i: number) {
    const board = $state.snapshot(S.board) as (Tile | null)[];
    board[i] = t;
    const r = game.resolve(board, [i]);
    return { r, served: game.matchPatrons(r, board), board };
  }
  const win = $derived(S.perks.window >= 0 ? game.windowSize() : 3);
  const hints = $derived.by(() => {
    if (S.sel == null || swapMode) return [];
    const t = $state.snapshot(S.belt[S.sel]) as Tile, board = $state.snapshot(S.board) as (Tile | null)[], out: { i: number; r: Resolution }[] = [];
    for (let i = 0; i < game.N_CELLS; i++) {
      if (board[i]) continue;
      board[i] = t;
      const r = game.resolve(board, [i]);
      board[i] = null;
      if (r.cleared.length) out.push({ i, r });
    }
    return out;
  });
  const preview = $derived(hover != null && S.sel != null && !swapMode && !S.board[hover] && !busy ? { i: hover, t: S.belt[S.sel], ...simulate($state.snapshot(S.belt[S.sel]) as Tile, hover) } : null);

  function previewText(r: Resolution, served: Patron[], board: (Tile | null)[]) {
    if (!r.cleared.length) return 'No meld here. The dish just sits on the counter.';
    const parts = r.melds.map(game.describeMeld).concat(r.events.map((e) => (e.type === 'bloom' ? 'Bloom: 1 to 7' : `${GEM_NAMES[e.color!]} cake`)));
    let s = `${parts.join(' + ')} · <b>+${r.pts}</b>`;
    if (r.mult > 1) s += ` combo ×${r.mult}`;
    if (served.length) s += ` · serves ${served.map((p) => p.name).join(', ')}`;
    else {
      const bus = S.patrons.filter((p) => p.kind === 'bus' && game.busGain(p, r, board));
      if (bus.length) s += ` · tour bus +${game.busGain(bus[0], r, board)}`;
    }
    return s;
  }
  const status = $derived.by(() => {
    if (message) return message;
    if (preview) return previewText(preview.r, preview.served, preview.board) + (lastPointer === 'touch' && armed === preview.i ? ' · <b>Tap again to place</b>' : '');
    if (S.over) return 'The market has closed. Start a new market to play again.';
    if (swapMode) return swapFrom == null ? `Swap: pick a tile to move (${S.swaps} left). Esc cancels.` : 'Now pick a neighbouring hex to swap or slide into.';
    if (S.sel == null) {
      if (S.turn < 3) return `Pick a dish from the counter (the lit slots, keys 1–${win}). Line up 3+ as a <b>run</b> (one colour, 3-4-5) or a <b>set</b> (one number, different colours).`;
      if (S.board.filter(Boolean).length >= 42) return 'The counter is nearly full. Clear some space, or the market closes when it fills and you have no swaps.';
      return `Pick a dish from the counter (keys 1–${win}).`;
    }
    const h = hints.length;
    return h ? `Choose a hex. ${h} spot${h > 1 ? 's' : ''} would make a meld${hintsOn ? ' (glowing dots)' : ''}.` : 'Choose a hex. This dish makes no meld yet, so place it to set one up.';
  });

  /* effects */
  function cellPoint(i: number): [number, number] {
    const c = CELLS[i], r = svg.getBoundingClientRect(), w = fx.getBoundingClientRect();
    return [((c.px - VB.x) / VB.w) * r.width + r.left - w.left, ((c.py - VB.y) / VB.h) * r.height + r.top - w.top];
  }
  function floatText(x: number, y: number, html: string) {
    if (fast) return;
    const f = document.createElement('div');
    f.className = 'float';
    f.innerHTML = html;
    f.style.left = `${x}px`;
    f.style.top = `${y}px`;
    fx.appendChild(f);
    f.animate([{ transform: 'translate(-50%,-30%) scale(.6)', opacity: 0 }, { transform: 'translate(-50%,-50%) scale(1.08)', opacity: 1, offset: 0.25 }, { transform: 'translate(-50%,-140%) scale(1)', opacity: 0 }], { duration: reduced ? 900 : 1300, easing: 'ease-out' }).onfinish = () => f.remove();
  }
  function burst(res: Resolution, tiles: (Tile | null)[]) {
    if (fast) return;
    clearing = res.cleared;
    if (!reduced) {
      res.cleared.forEach((i) => {
        const [x, y] = cellPoint(i), t = tiles[i], col = GEMS[t && t.c >= 0 ? t.c : GOLD].light;
        for (let k = 0; k < 7; k++) {
          const sp = document.createElement('span');
          sp.className = 'spark';
          sp.style.left = `${x}px`;
          sp.style.top = `${y}px`;
          sp.style.background = col;
          fx.appendChild(sp);
          const a = Math.random() * Math.PI * 2, d = 26 + Math.random() * 34;
          sp.animate([{ transform: 'none', opacity: 1 }, { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d}px) rotate(${Math.random() * 360}deg) scale(.4)`, opacity: 0 }], { duration: 560 + Math.random() * 200, easing: 'cubic-bezier(.2,.7,.3,1)' }).onfinish = () => sp.remove();
        }
      });
    }
    const pts = res.cleared.map(cellPoint), cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
    const word = res.events.some((e) => e.type === 'bloom') ? 'Bloom!' : res.events.length ? 'Cake!' : res.melds.length > 1 ? 'Combo!' : res.melds[0].type === 'run' ? 'Run!' : 'Set!';
    floatText(cx, cy, `${word}<small>+${res.pts}</small>`);
  }

  /* turns */
  async function playResolution(res: Resolution) {
    if (res.cleared.length) {
      flash = res.cleared;
      await sleep(230);
      burst(res, $state.snapshot(S.board) as (Tile | null)[]);
      sfx.clear(res.cleared.length);
      await sleep(330);
    }
    const out = game.commit(res);
    flash = [];
    clearing = [];
    return out;
  }
  async function placeAt(i: number) {
    if (busy || S.over || S.sel == null || S.board[i]) return;
    busy = true; hover = null; armed = null; message = '';
    const k = S.sel;
    S.board[i] = S.belt[k];
    dropped = i;
    sfx.place();
    const res = game.resolve(S.board, [i]);
    if (res.cleared.length) await sleep(160);
    const out = await playResolution(res);
    if (out.served.length) sfx.serve();
    game.takeFromBelt(k);
    S.sel = null;
    dropped = null;
    finishTurn();
  }
  async function passTurn() {
    if (busy || S.over) return;
    busy = true; hover = null; armed = null; message = '';
    S.sel = null;
    game.passBelt();
    finishTurn();
  }
  function finishTurn() {
    const out = game.endTurn();
    sfx.dice();
    if (out.expired.length) sfx.angry();
    if (out.reached.length) sfx.stop();
    busy = false;
    rolling = !fast && !reduced;
    setTimeout(() => (rolling = false), 460);
    save();
    if (out.reached.length && !S.over && !fast) {
      const w = fx.getBoundingClientRect(), st = out.reached[out.reached.length - 1];
      floatText(w.width / 2, w.height / 2, `${st.name}<small>Next: ${STOPS[S.stop].name}</small>`);
    }
    if (S.over) endGame();
  }
  async function doSwap(a: number, b: number) {
    if (busy || S.swaps <= 0) return;
    busy = true; message = '';
    [S.board[a], S.board[b]] = [S.board[b], S.board[a]];
    S.swaps--; swapMode = false; swapFrom = null;
    game.addLog('Swapped two hexes');
    dropped = S.board[a] ? a : b;
    const res = game.resolve(S.board, [a, b].filter((i) => S.board[i]));
    if (res.cleared.length) {
      await sleep(180);
      const out = await playResolution(res);
      if (out.served.length) sfx.serve();
    }
    dropped = null;
    game.checkStops();
    game.checkOver();
    busy = false;
    save();
    if (S.over) endGame();
  }
  function endGame() {
    const result = saveBest(BEST, S.score);
    newBest = result.isNew && S.score > 0;
    best = result.best;
    dialog = 'end';
  }
  function selectBelt(k: number) {
    if (busy || S.over || k >= win || k >= S.belt.length) return;
    swapMode = false; swapFrom = null; message = '';
    S.sel = S.sel === k ? null : k;
    armed = null;
    sfx.pick();
  }
  function onCell(i: number, viaKey: boolean) {
    if (busy || S.over) return;
    message = '';
    if (swapMode) {
      if (swapFrom == null) {
        if (S.board[i]) swapFrom = i;
        else { sfx.nope(); message = 'Pick a hex with a tile on it first.'; }
      } else if (i === swapFrom) swapFrom = null;
      else if (NB[swapFrom].includes(i)) doSwap(swapFrom, i);
      else if (S.board[i]) swapFrom = i;
      return;
    }
    if (S.sel == null) { message = S.board[i] ? 'That hex is taken. Pick a dish from the counter, then an empty hex.' : 'Pick a dish from the counter first.'; sfx.nope(); return; }
    if (S.board[i]) { sfx.nope(); return; }
    if (!viaKey && lastPointer === 'touch' && armed !== i) { armed = i; hover = i; return; }
    placeAt(i);
  }
  function buy(tier: number, idx: number) {
    if (busy || S.over) return;
    const card = S.market[tier][idx]!;
    const pr = game.cardPrice(card);
    if (S.boughtTurn) { sfx.nope(); message = 'One purchase per turn. Place a dish or pass, then buy again.'; return; }
    if (!pr.ok) { sfx.nope(); message = `${card.name} needs ${pr.short} more gem${pr.short > 1 ? 's' : ''}. Gold covers any colour.`; return; }
    game.buyCard(tier, idx);
    sfx.serve();
    message = '';
    save();
    if (S.over) endGame();
  }
  function doTrade() {
    if (busy || !game.trade(tradeGive, tradeGet)) return;
    sfx.pick();
    save();
  }
  function toggleSwap() {
    if (busy || S.over) return;
    if (!swapMode && S.swaps <= 0) { message = 'No swaps left. Melds of 5 or more, Blooms and Cakes earn more.'; return; }
    swapMode = !swapMode; swapFrom = null; S.sel = null; message = '';
  }
  function toggleHints() { hintsOn = !hintsOn; saveSetting('lantern-hints', hintsOn); }
  function toggleSound() { soundOn = !soundOn; saveSetting('lantern-sound', soundOn); if (soundOn) sfx.pick(); }
  function newMarket(kind: 'random' | 'daily') {
    dialog = null;
    const date = today();
    start(kind === 'daily' ? game.newGame(game.dailySeed(date), date) : game.newGame(freshSeed()));
  }
  function onKey(e: KeyboardEvent) {
    if (dialog || e.metaKey || e.ctrlKey || e.altKey) return;
    if ((e.target as HTMLElement).matches?.('select, input, textarea')) return;
    const n = Number(e.key);
    if (n >= 1 && n <= 5) { selectBelt(n - 1); return; }
    const k = e.key.toLowerCase();
    if (k === 'escape') { S.sel = null; swapMode = false; swapFrom = null; armed = null; message = ''; }
    else if (k === 'p') passTurn();
    else if (k === 's') toggleSwap();
    else if (k === 'h') toggleHints();
  }
  function cellKey(e: KeyboardEvent, i: number) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onCell(i, true); return; }
    const dirs: Record<string, number[]> = { ArrowRight: [0], ArrowLeft: [3], ArrowUp: [1, 2], ArrowDown: [5, 4] };
    if (!dirs[e.key]) return;
    e.preventDefault();
    for (const k of dirs[e.key]) {
      const j = NB[i][k];
      if (j >= 0) { svg.querySelector<SVGGElement>(`[data-i="${j}"]`)?.focus(); break; }
    }
  }

  /* display helpers */
  const districtName = (d: number) => (d === 0 ? 'Hearth (centre)' : `${GEM_NAMES[S.terrains[d]]} district ${S.tokens[d]}`);
  const FACETS = ['5,40 30,20 25,40', '25,40 30,20 40,40', '30,20 50,20 40,40', '50,20 60,40 40,40', '50,20 70,20 60,40', '70,20 75,40 60,40', '70,20 95,40 75,40', '5,40 25,40 50,95', '25,40 40,40 50,95', '40,40 60,40 50,95', '60,40 75,40 50,95', '75,40 95,40 50,95'];
  const FACET_ORDER = [9, 3, 2, 4, 8, 10, 1, 5, 7, 11, 0, 6];
  const PIPS: Record<number, number[]> = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
  const goal = $derived(STOPS[Math.min(S.stop, STOPS.length - 1)].goal);
  const facetsLit = $derived.by(() => {
    const prevGoal = S.stop ? STOPS[Math.min(S.stop, STOPS.length) - 1].goal : 0;
    const frac = S.over === 'win' ? 1 : Math.max(0, Math.min(1, (S.prestige - prevGoal) / (goal - prevGoal)));
    return Math.floor(frac * 12 + 1e-9);
  });
  const patience = (p: Patron) => { const f = p.left / p.max; return f <= 0.25 || p.left <= 2 ? 'low' : f <= 0.5 ? 'mid' : 'ok'; };
  const initials = (name: string) => name.split(/[\s-]/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const totalGems = $derived(S.gems.reduce((a, b) => a + b, 0));
  const rate = $derived(S.perks.harbor ? 3 : 4);
  const perkCards = $derived(S.owned.filter((c) => c.perk).map((c) => c.name));
  const cardLabel = (card: Card, ok: boolean) => `${card.name}. Gives −1 ${GEM_NAMES[card.bonus]} on future cards${card.pts ? `, ${card.pts} prestige` : ''}${card.perk ? `, ${PERKS[card.perk]}` : ''}. ${ok ? 'Buy' : 'Not enough gems'}.`;
  const endTitle = $derived(S.over === 'win' ? 'You reached the Grand Bazaar!' : S.over === 'hearts' ? 'The lanterns went out' : 'The counter is full');
</script>

<svelte:window onkeydown={onKey} />

{#snippet gem(c: number)}
  {#if c === 0}<circle r=".82" />
  {:else if c === 1}<rect x="-.7" y="-.7" width="1.4" height="1.4" rx=".14" />
  {:else if c === 2}<polygon points={OCT} />
  {:else if c === 3}<polygon points="0,-.92 .9,.72 -.9,.72" />
  {:else if c === 4}<polygon points="0,-.97 .72,0 0,.97 -.72,0" />
  {:else}<polygon points={STAR} />{/if}
{/snippet}
{#snippet icon(c: number)}<svg class="gi" viewBox="-1 -1 2 2" aria-hidden="true" fill={GEMS[c].light}>{@render gem(c)}</svg>{/snippet}
{#snippet tile(t: Tile)}
  <polygon class="tf-sh" points={HEX_TILE_SH} /><polygon class="tf" points={HEX_TILE} />
  {#if t.c < 0}
    <g transform="translate(0,-1) scale(15)" fill={GEMS[GOLD].light} stroke={GEMS[GOLD].ink} stroke-width=".06">{@render gem(5)}</g>
  {:else}
    <text class="tn" y="5" fill={GEMS[t.c].ink}>{t.n}</text>
    <g transform="translate(0,15) scale(4.4)" fill={GEMS[t.c].ink}>{@render gem(t.c)}</g>
  {/if}
{/snippet}

<div class="market">
  <div class="hud">
    <div class="hud-item">
      <svg class="meter" viewBox="0 10 100 90" aria-hidden="true">
        {#each FACETS as f, i (i)}<polygon class="facet" points={f} fill={FACET_ORDER.indexOf(i) < facetsLit ? GEMS[Math.min(S.stop, 4) % 5].light : 'transparent'} />{/each}
      </svg>
      <div><div class="hud-label">Prestige</div><div class="hud-val">{S.prestige} / {goal}</div></div>
    </div>
    <div class="hud-item">
      <div>
        <div class="hud-label">Lanterns</div>
        <div class="lanterns" role="img" aria-label="{S.hearts} of 3 lanterns lit">
          {#each [0, 1, 2] as k (k)}<svg viewBox="0 0 20 26" class={k < S.hearts ? 'on' : 'off'} aria-hidden="true"><path d="M8 0h4v3H8zM4 4h12l2.5 4.5v9L16 22H4l-2.5-4.5v-9zM7 22.5h6V26H7z" /></svg>{/each}
        </div>
      </div>
    </div>
    <div class="hud-item"><div><div class="hud-label">Score</div><div class="hud-val">{S.score.toLocaleString('en-NZ')}</div></div></div>
    <div class="hud-item"><div><div class="hud-label">Turn</div><div class="hud-val">{S.turn}</div></div></div>
    <div class="tools">
      <button class="pill" type="button" onclick={() => (dialog = 'how')}>How to play</button>
      <button class="pill" class:on={soundOn} type="button" aria-pressed={soundOn} onclick={toggleSound}>{soundOn ? 'Sound on' : 'Sound off'}</button>
      <button class="pill" type="button" onclick={() => (S.over || S.turn === 0 ? newMarket('random') : (dialog = 'new'))}>New market</button>
    </div>
  </div>

  <div class="layout">
    <div class="side left">
      <section class="panel" aria-labelledby="lm-patrons">
        <h2 id="lm-patrons">Patrons <small>serve before they leave</small></h2>
        <ul class="tickets">
          {#each S.patrons as p (p.id)}
            {@const lvl = patience(p)}
            <li class="ticket" class:low={lvl === 'low'}>
              <div class="t-head"><span class="avatar">{initials(p.name)}</span><span class="t-name">{p.name}</span><span class="t-reward">+{p.reward}<span class="visually-hidden"> prestige</span> ✦</span></div>
              <div class="t-label">{#if p.c != null}{@render icon(p.c)}{/if}{p.label}</div>
              <div class="t-hint">{p.hint}</div>
              {#if p.kind === 'bus'}<div class="t-hint">Aboard: {p.got} of {p.need}</div>{/if}
              <div class="patience"><svg viewBox="0 0 100 6" preserveAspectRatio="none" aria-hidden="true"><rect width={(p.left / p.max) * 100} height="6" rx="3" fill={GEMS[lvl === 'ok' ? 2 : lvl === 'mid' ? 3 : 0].ink} /></svg></div>
              <div class="t-left"><span>Patience</span><span>{p.left} turn{p.left === 1 ? '' : 's'}</span></div>
            </li>
          {/each}
          {#each Array(Math.max(0, 3 - S.patrons.length)) as _, k (k)}<li class="ticket empty">{S.over ? 'Closed' : 'Next patron on the way'}</li>{/each}
        </ul>
      </section>
      <section class="panel journey-sign" aria-labelledby="lm-journey">
        <h2 id="lm-journey">The journey <small>prestige to travel</small></h2>
        <ol class="journey">
          {#each STOPS as st, i (st.name)}
            <li class="stop" class:done={i < S.stop} class:here={i === S.stop}>
              <span class="dot" aria-hidden="true"></span>
              <span>{st.name}{#if i === S.stop}<span class="visually-hidden"> (next stop)</span>{:else if i < S.stop}<span class="visually-hidden"> (reached)</span>{/if}</span>
              <span class="goal">{st.goal}</span>
            </li>
          {/each}
        </ol>
      </section>
    </div>

    <div class="counter">
      <div class="board-wrap">
        <svg bind:this={svg} class="board" viewBox="{VB.x.toFixed(1)} {VB.y.toFixed(1)} {VB.w.toFixed(1)} {VB.h.toFixed(1)}" role="group" aria-label="Market board: 49 hexes in 7 districts" onpointerdown={(e) => (lastPointer = e.pointerType || 'mouse')} onpointerleave={() => { if (lastPointer !== 'touch') hover = null; }}>
          {#each CELLS as c, i (i)}
            {@const t = S.board[i]}
            {@const terr = S.terrains[c.d]}
            <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
            <g
              class="cell"
              class:full={t && !swapMode}
              class:swap-from={swapMode && swapFrom === i}
              class:swap-to={swapMode && swapFrom != null && NB[swapFrom].includes(i)}
              data-i={i}
              tabindex="0"
              role="button"
              aria-label="{districtName(c.d)}: {t ? game.tileName(t) : 'empty'}"
              transform="translate({c.px.toFixed(2)} {c.py.toFixed(2)})"
              onclick={() => onCell(i, false)}
              onkeydown={(e) => cellKey(e, i)}
              onfocus={() => (hover = i)}
              onpointerenter={(e) => { if (e.pointerType !== 'touch') hover = i; }}
            >
              <polygon class="cb" points={HEX_CELL} fill={terr < 0 ? GEMS[GOLD].tint : GEMS[terr].tint} />
              {#if t}<g class="tile" class:drop={dropped === i} class:flash={flash.includes(i)} class:clearing={clearing.includes(i)}>{@render tile(t)}</g>{/if}
            </g>
          {/each}
          <path class="dborder" d={DBORDER} />
          {#each CHIP_POS as pos, d (d)}
            {#if pos}
              {@const tk = S.tokens[d]}
              {@const hot = tk === 6 || tk === 8}
              {@const pips = 6 - Math.abs(7 - tk)}
              <g class="chip" class:rolled={S.dice?.sum === tk} transform="translate({pos[0].toFixed(1)} {pos[1].toFixed(1)})">
                <title>{districtName(d)}: makes {GEM_NAMES[S.terrains[d]]} when {tk} is rolled</title>
                <circle class="c1" r="19" stroke={GEMS[S.terrains[d]].light} />
                <text class:hot y="4">{tk}</text>
                {#each Array(pips) as _, k (k)}<circle class="pip" class:hot cx={(k - (pips - 1) / 2) * 4.2} cy="10" r="1.5" />{/each}
              </g>
            {/if}
          {/each}
          {#if hintsOn}
            {#each hints as h (h.i)}<circle class="hint" cx={CELLS[h.i].px.toFixed(1)} cy={CELLS[h.i].py.toFixed(1)} r={h.r.cleared.length >= 5 || h.r.melds.length + h.r.events.length > 1 ? 8 : 6} />{/each}
          {/if}
          {#if preview}
            <g class="tile ghost" transform="translate({CELLS[preview.i].px.toFixed(2)} {CELLS[preview.i].py.toFixed(2)})">{@render tile(preview.t)}</g>
            {#each preview.r.cleared as ci (ci)}<polygon class="ov-out" points={hexPoints(SZ - 3, CELLS[ci].px, CELLS[ci].py)} />{/each}
          {/if}
        </svg>
        <div class="fx" bind:this={fx}></div>
      </div>
      <div class="status" aria-live="polite"><span>{@html status}</span></div>
      <section class="belt-sign" aria-labelledby="lm-belt">
        <div class="belt-head"><h2 id="lm-belt">The hotpot belt</h2><span>Counter takes the first {win}</span></div>
        <div class="belt">
          <div class="window" style:grid-column="1 / span {win}" aria-hidden="true"></div>
          {#each S.belt as t, k (t.id)}
            {@const live = k < win && !S.over}
            <button
              type="button"
              class="btile"
              class:live
              class:sel={S.sel === k}
              style:grid-column={k + 1}
              disabled={!live}
              aria-pressed={S.sel === k}
              aria-label="{game.tileName(t)}{live ? `, counter slot ${k + 1}` : `, ${k - win + 1} step${k - win ? 's' : ''} from the counter`}"
              onclick={() => selectBelt(k)}
              animate:flip={{ duration: fast || reduced ? 0 : 320 }}
            >
              <svg viewBox="-27 -27 54 57" aria-hidden="true">{@render tile(t)}</svg>
              {#if live}<span class="key" aria-hidden="true">{k + 1}</span>{/if}
            </button>
          {/each}
        </div>
        <p class="belt-foot">Dishes you skip loop back round. The belt moves one step every turn.</p>
      </section>
      <div class="actions">
        <button class="pill" type="button" disabled={!!S.over} onclick={passTurn}>Pass turn</button>
        <button class="pill" class:on={swapMode} type="button" disabled={!!S.over || (S.swaps === 0 && !swapMode)} onclick={toggleSwap}>{swapMode ? 'Cancel swap' : `Swap (${S.swaps})`}</button>
        <button class="pill" class:on={hintsOn} type="button" aria-pressed={hintsOn} onclick={toggleHints}>{hintsOn ? 'Hints on' : 'Hints off'}</button>
      </div>
    </div>

    <div class="side right">
      <section class="panel" aria-labelledby="lm-dice">
        <h2 id="lm-dice">Dice <small>districts produce gems</small></h2>
        {#if S.dice}
          <div class="dice-row">
            {#each [S.dice.a, S.dice.b] as v, j (j)}
              <div class="die" class:rolling role="img" aria-label="{v}">{#each Array(9) as _, k (k)}<i class:p={PIPS[v].includes(k)}></i>{/each}</div>
            {/each}
            <div class="dice-text">{@html S.dice.note}</div>
          </div>
        {:else}
          <p class="dice-text">The dice roll after every turn. Districts whose chip matches the total make gems of their colour, plus 1 more if two or more tiles of that colour sit inside. A 7 brings the raccoon.</p>
        {/if}
      </section>
      <section class="panel" aria-labelledby="lm-gems">
        <h2 id="lm-gems">Gems <small>{totalGems} of {GEM_CAP} · {S.swaps} swap{S.swaps === 1 ? '' : 's'}</small></h2>
        <div class="gems">
          {#each S.gems as n, c (c)}
            <div class="gem" title="{GEM_NAMES[c]}{c < 5 ? `: your cards take ${S.bonus[c]} off every ${GEM_NAMES[c]} price` : ': wild, pays for any colour'}">
              {@render icon(c)}<b>{n}</b><small>{c < 5 ? (S.bonus[c] ? `−${S.bonus[c]} off` : GEM_NAMES[c]) : 'wild'}</small>
            </div>
          {/each}
        </div>
        <div class="trade">
          <label for="lm-trade-give">Trade</label>
          <select id="lm-trade-give" bind:value={tradeGive}>{#each [0, 1, 2, 3, 4] as c (c)}<option value={c}>{rate} {GEM_NAMES[c]}</option>{/each}</select>
          <span>for 1</span>
          <select id="lm-trade-get" aria-label="Gem to receive" bind:value={tradeGet}>{#each [0, 1, 2, 3, 4] as c (c)}<option value={c}>{GEM_NAMES[c]}</option>{/each}</select>
          <button class="pill" type="button" disabled={!!S.over || S.gems[tradeGive] < rate || tradeGive === tradeGet} onclick={doTrade}>Trade</button>
        </div>
      </section>
      <section class="panel" aria-labelledby="lm-market">
        <h2 id="lm-market">Stall market <small>{S.boughtTurn ? 'bought this turn' : 'one card per turn, no turn used'}</small></h2>
        {#each [1, 2, 3] as tier (tier)}
          <div class="tier">
            <div class="tier-head"><span>{['', 'Stalls', 'Upgrades', 'Landmarks'][tier]}</span><span>{S.decks[tier].length} in deck</span></div>
            <div class="cards">
              {#each S.market[tier] as card, idx (card?.id ?? `empty-${idx}`)}
                {#if !card}
                  <div class="card empty">Sold out</div>
                {:else}
                  {@const pr = game.cardPrice(card)}
                  {@const ok = pr.ok && !S.over}
                  <button type="button" class="card" class:afford={ok} aria-disabled={!ok} aria-label={cardLabel(card, ok)} onclick={() => buy(tier, idx)}>
                    <span class="c-top">{@render icon(card.bonus)}<span class="c-name">{card.name}</span>{#if card.pts}<span class="c-pts">{card.pts}</span>{/if}</span>
                    {#if card.perk}<span class="c-perk">{PERKS[card.perk]}</span>{/if}
                    <span class="c-cost">
                      {#each card.cost as v, c (c)}{#if v}<span class="cost">{@render icon(c)}<b>{pr.need[c]}</b>{#if pr.need[c] < v}<s>{v}</s>{/if}</span>{/if}{/each}
                    </span>
                  </button>
                {/if}
              {/each}
            </div>
          </div>
        {/each}
        <p class="owned">
          {#if S.owned.length}Your stall: <b>{S.owned.length} card{S.owned.length > 1 ? 's' : ''}</b>{#if perkCards.length} · {perkCards.join(', ')}{/if}
          {:else}Each card permanently takes 1 gem of its colour off future cards. Gold is wild.{/if}
        </p>
      </section>
      <section class="panel" aria-labelledby="lm-log">
        <h2 id="lm-log">Market log</h2>
        <ul class="log">{#each S.log as line, i (i)}<li>{@html line}</li>{/each}</ul>
      </section>
    </div>
  </div>
</div>

<GameDialog open={dialog === 'how'} title="How to play" onclose={() => (dialog = null)}>
  <ol class="rules">
    <li><b>Pick a dish</b> from the lit counter slots on the belt, then put it on any empty hex. Dishes you skip loop round and come back.</li>
    <li><b>Make melds.</b> Three or more tiles in a straight line clear when they form a <b>run</b> (one colour, numbers in a row, like 3-4-5) or a <b>set</b> (one number, all different colours). The gold star is a joker and stands in for anything.</li>
    <li><b>Serve patrons.</b> Each wants a particular meld. If their patience runs out you lose a lantern, and losing all three closes the market. Serve three in a row to relight one.</li>
    <li><b>Collect gems.</b> Cleared tiles become gems of their colour. After every turn the dice roll, and the district with that number chip makes gems of its colour, plus 1 more if two or more tiles of that colour sit inside. On a 7 the raccoon steals your most common gem.</li>
    <li><b>Upgrade the stall.</b> You can buy one card per turn without using the turn. Cards cost gems and take 1 gem of their colour off every later card (never below 2, 4 or 6 gems, depending on the tier). Some give prestige or perks. Gold is wild, and you can trade 4 of one colour for 1 of another.</li>
    <li><b>Fill a district</b> (the seven hexes inside a gold border) with 1 to 7, each number once, for a <b>Bloom</b>, or with a single colour for a <b>Cake</b>. Both are worth big points.</li>
    <li><b>Travel.</b> Prestige from patrons and cards takes you through five stops, and each stop adds harder orders. Reach the Grand Bazaar to win. Each new stop relights a lantern.</li>
  </ol>
  <p class="muted"><b>Pass</b> moves the belt without placing, but patrons still lose patience. <b>Swap</b> moves a tile one hex, into a neighbour or an empty spot. You earn swaps from melds of 5 or more, Blooms and Cakes. If the board fills and you have no swaps left, the market closes.</p>
  <p class="muted">Keys: 1 to 5 pick a dish, arrows or Tab move between hexes, Enter places, P passes, S swaps, H toggles hints, Esc cancels.</p>
  {#snippet actions()}<button class="button" type="button" onclick={() => (dialog = null)}>Back to the market</button>{/snippet}
</GameDialog>

<GameDialog open={dialog === 'new'} title="Open a new market?" onclose={() => (dialog = null)}>
  <p>Your current market (turn {S.turn}, {S.prestige} prestige) will end.</p>
  <p class="muted">The daily market gives everyone the same tiles and board today.</p>
  {#snippet actions()}
    <button class="pill" type="button" onclick={() => (dialog = null)}>Keep playing</button>
    <button class="pill" type="button" onclick={() => newMarket('daily')}>Daily market</button>
    <button class="button" type="button" onclick={() => newMarket('random')}>New random market</button>
  {/snippet}
</GameDialog>

<GameDialog open={dialog === 'end'} title={endTitle} onclose={() => (dialog = null)}>
  <p>
    {#if S.over === 'win'}Five stops in {S.turn} turns.{:else if S.over === 'hearts'}Too many patrons gave up waiting. You got as far as {S.stop ? STOPS[S.stop - 1].name : 'the start of the journey'}.{:else}There was no empty hex left and no swaps to make room.{/if}
    {#if S.daily} Daily market for {S.daily}.{/if}
  </p>
  <div class="stats">
    <div><b>{S.score.toLocaleString('en-NZ')}</b><span>score{newBest ? ', a new best' : best ? `, best ${best.toLocaleString('en-NZ')}` : ''}</span></div>
    <div><b>{S.prestige}</b><span>prestige</span></div>
    <div><b>{S.stop}/5</b><span>stops reached</span></div>
    <div><b>{S.stats.melds}</b><span>melds</span></div>
    <div><b>{S.stats.served}</b><span>patrons served</span></div>
    <div><b>{S.stats.blooms + S.stats.cakes}</b><span>blooms and cakes</span></div>
  </div>
  {#snippet actions()}
    <button class="pill" type="button" onclick={() => (dialog = null)}>Look at the board</button>
    <button class="pill" type="button" onclick={() => newMarket('daily')}>Daily market</button>
    <button class="button" type="button" onclick={() => newMarket('random')}>New market</button>
  {/snippet}
</GameDialog>

<style>
  /* Surfaces are the theme's paper lifted a little towards its ink. */
  .market {
    --panel: color-mix(in srgb, var(--ink) 8%, var(--paper));
    --panel-2: color-mix(in srgb, var(--ink) 13%, var(--paper));
    --tile-shade: color-mix(in srgb, var(--ticket-rule) 60%, var(--ticket-ink));
    display: grid;
    gap: 16px;
  }

  .market :global(.gi) {
    display: inline-block;
    width: 1em;
    height: 1em;
    vertical-align: -0.12em;
  }

  .hud {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 18px;
    align-items: center;
  }

  .hud-item {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .hud-label {
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ink-soft);
  }

  .hud-val {
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    font-size: 17px;
  }

  .meter {
    width: 44px;
    height: 44px;
    flex: none;
  }

  .facet {
    stroke: var(--rule);
    stroke-width: 1.2;
    transition: fill 0.5s;
  }

  .lanterns {
    display: flex;
    gap: 4px;
  }

  .lanterns svg {
    width: 18px;
    height: 24px;
  }

  .lanterns .on {
    fill: var(--accent);
  }

  .lanterns .off {
    fill: none;
    stroke: var(--ink-soft);
    stroke-width: 1.5;
  }

  .tools {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-left: auto;
  }

  .pill {
    border: 1px solid var(--rule);
    background: var(--panel);
    color: var(--ink);
    border-radius: 999px;
    padding: 8px 14px;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    line-height: 1.1;
  }

  .pill:hover {
    border-color: var(--highlight);
  }

  .pill.on {
    border-color: var(--highlight);
  }

  .pill[disabled] {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .layout {
    display: grid;
    gap: 16px;
    grid-template-columns: minmax(0, 1fr);
  }

  @media (min-width: 1060px) {
    .layout {
      grid-template-columns: 272px minmax(0, 1fr) 336px;
      align-items: start;
    }
  }

  .side {
    display: grid;
    gap: 16px;
    min-width: 0;
  }

  .panel {
    background: var(--panel);
    border: 1px solid var(--rule);
    border-radius: 14px;
    padding: 14px;
    min-width: 0;
  }

  .panel h2,
  .belt-head h2 {
    font-family: var(--display);
    font-weight: var(--display-weight);
    font-size: 14px;
    letter-spacing: 0.04em;
    color: var(--highlight);
    margin: 0 0 10px;
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
  }

  .panel h2 small {
    font-family: var(--body);
    font-size: 12px;
    letter-spacing: 0;
    color: var(--ink-soft);
    font-weight: 400;
  }

  /* patrons */
  .tickets {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 10px;
  }

  .ticket {
    background: var(--ticket);
    color: var(--ticket-ink);
    border-radius: 6px 6px 10px 10px;
    padding: 10px 12px;
    box-shadow: 0 2px 0 var(--tile-shade);
    min-width: 0;
  }

  .t-head {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .avatar {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    font-size: 11px;
    font-weight: 700;
    color: var(--ticket);
    background: var(--ticket-ink);
    flex: none;
  }

  .t-name {
    font-size: 13px;
    color: var(--ticket-soft);
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .t-reward {
    font-family: var(--hand);
    font-weight: 700;
    font-size: 13px;
    color: var(--on-highlight);
    background: var(--highlight);
    border-radius: 999px;
    padding: 1px 8px;
    white-space: nowrap;
  }

  .t-label {
    font-family: var(--hand);
    font-weight: 700;
    font-size: 18px;
    line-height: 1.15;
    margin: 6px 0 2px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .t-label :global(.gi) {
    width: 15px;
    height: 15px;
    filter: drop-shadow(0 0 1px var(--ticket-ink));
  }

  .t-hint,
  .t-left {
    font-size: 12.5px;
    color: var(--ticket-soft);
  }

  .patience {
    height: 6px;
    border-radius: 3px;
    background: var(--ticket-rule);
    margin-top: 8px;
    overflow: hidden;
  }

  .patience svg {
    display: block;
    width: 100%;
    height: 100%;
  }

  .t-left {
    display: flex;
    justify-content: space-between;
    margin-top: 4px;
    font-variant-numeric: tabular-nums;
  }

  .ticket.low {
    animation: wiggle 1.2s ease-in-out infinite;
  }

  .ticket.empty {
    background: transparent;
    border: 1.5px dashed var(--rule);
    color: var(--ink-soft);
    box-shadow: none;
    font-size: 13px;
    display: grid;
    place-items: center;
    min-height: 64px;
  }

  @keyframes wiggle {
    0%, 90%, 100% { transform: none; }
    93% { transform: rotate(-1.2deg); }
    96% { transform: rotate(1.2deg); }
  }

  /* journey */
  .journey {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .stop {
    display: grid;
    grid-template-columns: 20px 1fr auto;
    gap: 10px;
    align-items: center;
    padding: 5px 0;
    font-size: 14px;
  }

  .stop .dot {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid var(--rule);
    background: var(--paper);
  }

  .stop.done .dot {
    background: var(--highlight);
    border-color: var(--highlight);
  }

  .stop.here .dot {
    border-color: var(--accent);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 25%, transparent);
  }

  .stop.here {
    font-weight: 700;
  }

  .stop .goal,
  .stop.done {
    color: var(--ink-soft);
  }

  .stop .goal {
    font-variant-numeric: tabular-nums;
    font-size: 13px;
  }

  /* board */
  .counter {
    display: grid;
    gap: 12px;
    min-width: 0;
  }

  .board-wrap {
    position: relative;
    width: 100%;
    max-width: 640px;
    margin-inline: auto;
  }

  .board {
    display: block;
    width: 100%;
    height: auto;
    touch-action: manipulation;
    user-select: none;
    overflow: visible;
  }

  .cell {
    cursor: pointer;
    outline: none;
  }

  .cb {
    stroke: color-mix(in srgb, var(--ink) 10%, transparent);
    stroke-width: 1;
    transition: stroke 0.15s;
  }

  .cell:hover .cb,
  .cell:focus-visible .cb {
    stroke: var(--highlight);
    stroke-width: 2.5;
  }

  .cell.full {
    cursor: default;
  }

  .cell.swap-from .cb {
    stroke: var(--accent);
    stroke-width: 3.5;
  }

  .cell.swap-to .cb {
    stroke: var(--highlight);
    stroke-width: 2;
    stroke-dasharray: 4 3;
  }

  .dborder {
    fill: none;
    stroke: color-mix(in srgb, var(--highlight) 60%, transparent);
    stroke-width: 2.6;
    stroke-linecap: round;
    pointer-events: none;
  }

  .tile {
    transform-box: fill-box;
    transform-origin: center;
    pointer-events: none;
  }

  .market :global(.tf) {
    fill: var(--ticket);
    stroke: var(--ticket-rule);
    stroke-width: 1;
  }

  .market :global(.tf-sh) {
    fill: var(--tile-shade);
  }

  .market :global(.tn) {
    font-family: var(--hand);
    font-weight: 700;
    font-size: 25px;
    text-anchor: middle;
  }

  .tile.drop {
    animation: drop 0.3s cubic-bezier(0.2, 0.9, 0.3, 1.35);
  }

  .tile.flash :global(.tf) {
    stroke: var(--highlight);
    stroke-width: 3.5;
  }

  .tile.clearing {
    animation: pop 0.34s ease-in forwards;
  }

  .tile.ghost {
    opacity: 0.55;
  }

  @keyframes drop {
    from { transform: translateY(-12px) scale(1.15); opacity: 0.3; }
    to { transform: none; opacity: 1; }
  }

  @keyframes pop {
    to { transform: scale(1.45); opacity: 0; }
  }

  .chip .c1 {
    fill: var(--ticket);
    stroke-width: 3.5;
  }

  .chip text {
    font-family: var(--hand);
    font-weight: 700;
    text-anchor: middle;
    font-size: 17px;
    fill: var(--ticket-ink);
  }

  .chip .pip {
    fill: var(--ticket-ink);
  }

  .chip .hot {
    fill: var(--ticket-accent);
  }

  .chip.rolled .c1 {
    filter: drop-shadow(0 0 8px var(--highlight));
  }

  .hint {
    fill: var(--accent);
    pointer-events: none;
    animation: breathe 1.6s ease-in-out infinite;
    transform-box: fill-box;
    transform-origin: center;
  }

  @keyframes breathe {
    50% { opacity: 0.35; transform: scale(0.7); }
  }

  .ov-out {
    fill: none;
    stroke: var(--highlight);
    stroke-width: 3;
    pointer-events: none;
  }

  .fx {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: visible;
  }

  .fx :global(.spark) {
    position: absolute;
    width: 8px;
    height: 8px;
    border-radius: 2px;
    margin: -4px 0 0 -4px;
  }

  .fx :global(.float) {
    position: absolute;
    transform: translate(-50%, -50%);
    font-family: var(--display);
    font-size: clamp(16px, 2.4vw, 22px);
    color: var(--highlight);
    text-shadow: 0 2px 0 var(--paper), 0 0 14px var(--accent);
    white-space: nowrap;
  }

  .fx :global(.float small) {
    display: block;
    font-family: var(--body);
    font-weight: 700;
    font-size: 13px;
    color: var(--ink);
    text-align: center;
  }

  .status {
    min-height: 44px;
    text-align: center;
    font-size: 14.5px;
    background: var(--panel);
    border: 1px solid var(--rule);
    border-radius: 10px;
    padding: 10px 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 4px 8px;
  }

  .status :global(b) {
    color: var(--highlight);
  }

  /* belt */
  .belt-sign {
    display: grid;
    gap: 8px;
  }

  .belt-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
    font-size: 12px;
    color: var(--ink-soft);
  }

  .belt-head h2 {
    margin: 0;
    font-size: 13px;
  }

  .belt {
    display: grid;
    grid-template-columns: repeat(9, minmax(0, 1fr));
    gap: 5px;
    padding: 8px;
    border-radius: 12px;
    background: repeating-linear-gradient(90deg, var(--panel) 0 10px, var(--panel-2) 10px 20px);
    border: 1px solid var(--rule);
  }

  .belt .window {
    grid-row: 1;
    border-radius: 9px;
    background: color-mix(in srgb, var(--accent) 14%, transparent);
    border: 1.5px solid color-mix(in srgb, var(--accent) 60%, transparent);
    margin: -4px;
  }

  .btile {
    grid-row: 1;
    border: 0;
    background: none;
    padding: 0;
    cursor: pointer;
    position: relative;
    border-radius: 8px;
    transition: transform 0.15s;
  }

  .btile svg {
    display: block;
    width: 100%;
    height: auto;
  }

  .btile[disabled] {
    cursor: default;
    opacity: 0.55;
  }

  .btile.live:hover {
    transform: translateY(-3px);
  }

  .btile.sel {
    transform: translateY(-6px);
  }

  .btile.sel svg {
    filter: drop-shadow(0 0 7px var(--accent));
  }

  .btile .key {
    position: absolute;
    top: -2px;
    right: 0;
    font-size: 10px;
    font-weight: 700;
    color: var(--highlight);
  }

  .belt-foot {
    margin: 0;
    font-size: 12px;
    color: var(--ink-soft);
  }

  .actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: center;
  }

  /* right side */
  .dice-row {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .die {
    width: 38px;
    height: 38px;
    border-radius: 8px;
    background: var(--ticket);
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(3, 1fr);
    padding: 5px;
    flex: none;
    box-shadow: 0 2px 0 var(--tile-shade);
  }

  .die i {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--ticket-ink);
    place-self: center;
    visibility: hidden;
  }

  .die i.p {
    visibility: visible;
  }

  .die.rolling {
    animation: roll 0.45s ease-out;
  }

  @keyframes roll {
    0% { transform: rotate(-40deg) scale(0.7); }
    60% { transform: rotate(12deg) scale(1.05); }
    100% { transform: none; }
  }

  .dice-text {
    font-size: 13.5px;
    min-width: 0;
    margin: 0;
  }

  .gems {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .gem {
    display: flex;
    align-items: center;
    gap: 7px;
    background: var(--paper);
    border-radius: 10px;
    padding: 7px 9px;
    min-width: 0;
  }

  .gem :global(.gi) {
    width: 18px;
    height: 18px;
    flex: none;
  }

  .gem b {
    font-variant-numeric: tabular-nums;
    font-size: 16px;
  }

  .gem small {
    color: var(--ink-soft);
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .trade {
    display: flex;
    gap: 6px;
    align-items: center;
    flex-wrap: wrap;
    margin-top: 10px;
    font-size: 13px;
  }

  .trade select {
    background: var(--paper);
    color: var(--ink);
    border: 1px solid var(--rule);
    border-radius: 8px;
    padding: 6px 8px;
  }

  .tier {
    display: grid;
    gap: 8px;
    margin-top: 10px;
  }

  .tier-head {
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ink-soft);
    display: flex;
    justify-content: space-between;
  }

  .cards {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .card {
    display: flex;
    flex-direction: column;
    gap: 6px;
    text-align: left;
    background: var(--paper);
    color: var(--ink);
    border: 1px solid var(--rule);
    border-radius: 10px;
    padding: 8px;
    cursor: pointer;
    min-width: 0;
    min-height: 96px;
  }

  .card.afford {
    border-color: var(--highlight);
  }

  .card[aria-disabled='true'] {
    cursor: not-allowed;
  }

  .card.empty {
    display: grid;
    place-items: center;
    color: var(--ink-soft);
    font-size: 12px;
    cursor: default;
  }

  .c-top {
    display: flex;
    gap: 6px;
    align-items: flex-start;
  }

  .c-top :global(.gi) {
    width: 16px;
    height: 16px;
    flex: none;
    margin-top: 1px;
  }

  .c-name {
    font-weight: 700;
    font-size: 12.5px;
    line-height: 1.2;
    flex: 1;
    min-width: 0;
  }

  .c-pts {
    font-family: var(--hand);
    font-weight: 700;
    font-size: 15px;
    color: var(--highlight);
    line-height: 1;
  }

  .c-perk {
    font-size: 11.5px;
    color: var(--highlight);
    line-height: 1.25;
  }

  .c-cost {
    display: flex;
    flex-wrap: wrap;
    gap: 3px 7px;
    margin-top: auto;
    font-size: 13px;
  }

  .cost {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    font-variant-numeric: tabular-nums;
  }

  .cost :global(.gi) {
    width: 12px;
    height: 12px;
  }

  .cost s {
    color: var(--ink-soft);
    font-size: 11px;
  }

  .owned {
    font-size: 12.5px;
    color: var(--ink-soft);
    margin: 10px 0 0;
  }

  .owned b {
    color: var(--ink);
  }

  .log {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 5px;
    font-size: 13px;
    color: var(--ink-soft);
  }

  .log li:first-child {
    color: var(--ink);
  }

  .rules {
    margin: 0;
    padding-left: 20px;
    display: grid;
    gap: 8px;
  }

  .muted {
    color: var(--ink-soft);
    font-size: 13.5px;
    margin: 0;
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .stats div {
    background: var(--panel);
    border-radius: 10px;
    padding: 8px 10px;
  }

  .stats b {
    display: block;
    font-size: 20px;
    font-variant-numeric: tabular-nums;
  }

  .stats span {
    font-size: 12px;
    color: var(--ink-soft);
  }

  /* Phones: patrons in a compact row above the board, the journey after it. */
  @media (max-width: 1059px) {
    .left {
      display: contents;
    }

    .left .panel:first-child {
      order: 1;
    }

    .counter {
      order: 2;
    }

    .journey-sign {
      order: 3;
    }

    .right {
      order: 4;
    }

    .tickets {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
    }

    .ticket {
      padding: 8px;
    }

    .ticket .t-hint,
    .ticket .t-name {
      display: none;
    }

    .t-label {
      font-size: 15px;
    }

    .t-head {
      justify-content: space-between;
    }

    .t-reward {
      font-size: 12px;
      padding: 1px 6px;
    }

    .tools {
      margin-left: 0;
    }
  }

  @media (max-width: 520px) {
    .card {
      padding: 6px;
      min-height: 88px;
    }

    .c-name {
      font-size: 11.5px;
    }

    .belt {
      gap: 3px;
      padding: 6px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .ticket.low,
    .hint,
    .tile.drop,
    .die.rolling {
      animation: none;
    }
  }
</style>
