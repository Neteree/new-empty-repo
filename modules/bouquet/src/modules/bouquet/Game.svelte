<script lang="ts">
  // The flower game: the 3D garden (graphics, Garden.svelte) with the order,
  // timer, score and buttons as page elements (UI). The rules are in game.ts.
  // Tap the flowers each order asks for; the buttons under the garden do the
  // same, for keyboards and screen readers.
  import { Canvas } from '@threlte/core';
  import { WebGLRenderer } from 'three';
  import Garden from './Garden.svelte';
  import { isDone, newOrder, replant, SPOTS, stillNeeded, type Order, type Plant } from './game';
  import type { Bouquet } from './bouquet';

  let { game }: { game: Bouquet['game'] } = $props();
  const kinds = $derived(game.flowers.length);
  const colours = $derived(game.flowers.map((f) => f.colour));

  const BEST = 'flower-game-best';
  const PENALTY = 3;
  let phase = $state<'ready' | 'playing' | 'over'>('ready');
  let timeLeft = $state(0);
  let score = $state(0);
  let best = $state(0);
  let order = $state<Order>({ who: '', wants: [], picked: [] });
  let garden = $state<(Plant | null)[]>(Array(SPOTS).fill(null));
  let message = $state('');
  let wrong = $state(false);
  let ids = 0;
  let timer: ReturnType<typeof setInterval> | undefined;

  $effect(() => {
    try {
      best = Number(localStorage.getItem(BEST)) || 0;
    } catch {}
    return () => clearInterval(timer);
  });

  function start() {
    score = 0;
    message = '';
    timeLeft = game.seconds;
    order = newOrder(kinds, game.customers, 0);
    garden = replant(Array(SPOTS).fill(null), order, kinds, () => ++ids);
    phase = 'playing';
    let last = performance.now();
    clearInterval(timer);
    timer = setInterval(() => {
      const now = performance.now();
      timeLeft = Math.max(0, timeLeft - (now - last) / 1000);
      last = now;
      if (timeLeft === 0) finish();
    }, 100);
  }

  function finish() {
    clearInterval(timer);
    phase = 'over';
    message = '';
    if (score > best) {
      best = score;
      try {
        localStorage.setItem(BEST, String(best));
      } catch {}
    }
  }

  function pickPlant(id: number) {
    if (phase !== 'playing') return;
    const spot = garden.findIndex((plant) => plant?.id === id);
    const plant = garden[spot];
    if (!plant || plant.grow < 0.6) return;
    const name = game.flowers[plant.kind].name.toLowerCase();
    if (stillNeeded(order)[plant.kind] === 0) {
      timeLeft = Math.max(0, timeLeft - PENALTY);
      message = `${order.who} didn’t ask for ${name}. −${PENALTY} seconds.`;
      wrong = true;
      setTimeout(() => (wrong = false), 400);
      return;
    }
    order.picked[plant.kind]++;
    garden[spot] = null;
    if (isDone(order)) {
      score++;
      message = `${order.who}’s bunch is ready!`;
      order = newOrder(kinds, game.customers, score);
    } else {
      message = `Picked a ${name} one.`;
    }
    garden = replant(garden, order, kinds, () => ++ids);
  }

  /** The buttons pick a grown flower of that kind. */
  function pickKind(kind: number) {
    const plant = garden.find((p) => p && p.kind === kind && p.grow >= 0.6);
    if (plant) pickPlant(plant.id);
  }
</script>

<div class="game">
  <div class="bar" aria-live="off">
    <span>Time <b>{Math.ceil(timeLeft)}</b></span>
    <span>Bunches <b>{score}</b></span>
    <span>Best <b>{best}</b></span>
  </div>

  {#if phase === 'playing'}
    <div class="order" class:wrong>
      <p class="who">{order.who} wants</p>
      <ul>
        {#each game.flowers as flower, kind (flower.name)}
          {#if order.wants[kind]}
            <li>
              <span class="dot" style="background: {flower.colour}" aria-hidden="true"></span>
              {flower.name}
              <b>{order.picked[kind]} of {order.wants[kind]}</b>
            </li>
          {/if}
        {/each}
      </ul>
    </div>
  {/if}

  <div class="garden">
    <div class="scene" role="img" aria-label="A 3D garden bed of flowers to pick">
      <Canvas createRenderer={(canvas) => new WebGLRenderer({ canvas, alpha: true, antialias: true })}>
        <Garden {garden} {colours} onpick={pickPlant} />
      </Canvas>
    </div>
    {#if phase !== 'playing'}
      <div class="overlay">
        {#if phase === 'over'}
          <p class="big">Time’s up!</p>
          <p>You made {score} bunch{score === 1 ? '' : 'es'}.{score > 0 && score === best ? ' That’s your best yet.' : ''}</p>
        {:else}
          <p class="big">{game.title}</p>
          <p>{game.seconds} seconds. Tap the flowers each customer asks for.</p>
        {/if}
        <button class="button" type="button" onclick={start}>{phase === 'over' ? 'Play again' : 'Start'}</button>
      </div>
    {/if}
  </div>

  <p class="message" role="status">{message}</p>

  {#if phase === 'playing'}
    <div class="pickers">
      {#each game.flowers as flower, kind (flower.name)}
        <button type="button" onclick={() => pickKind(kind)}>
          <span class="dot" style="background: {flower.colour}" aria-hidden="true"></span>
          Pick {flower.name.toLowerCase()}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .game {
    display: grid;
    gap: 1rem;
    max-width: 52rem;
  }
  .bar {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1.75rem;
    font-size: 1.1rem;
  }
  .bar b {
    font-family: var(--display);
    font-size: 1.6rem;
    color: var(--accent);
    font-variant-numeric: tabular-nums;
  }
  .order {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem 1.25rem;
    padding: 0.75rem 1rem;
    border: 2px solid var(--ink);
    border-radius: 0.8rem;
    background: var(--paper);
  }
  .order.wrong {
    animation: shake 0.35s;
    border-color: var(--error);
  }
  @keyframes shake {
    25% { transform: translateX(-6px); }
    75% { transform: translateX(6px); }
  }
  .who {
    margin: 0;
    font-weight: 700;
  }
  .order ul {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem 1.1rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .order li {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
  .order li b {
    color: var(--ink-soft);
    font-weight: 600;
  }
  .dot {
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
    border: 2px solid var(--ink);
    flex: none;
  }
  .garden {
    position: relative;
    aspect-ratio: 4 / 3;
    border: 2px solid var(--ink);
    border-radius: 1rem;
    overflow: hidden;
    background: radial-gradient(circle at 50% 30%, var(--paper), color-mix(in srgb, var(--highlight) 55%, var(--paper)));
    box-shadow: 8px 8px 0 var(--highlight);
    touch-action: manipulation;
  }
  @media (max-width: 40rem) {
    .garden {
      aspect-ratio: 1;
    }
  }
  .scene {
    position: absolute;
    inset: 0;
  }
  .overlay {
    position: absolute;
    inset: 0;
    display: grid;
    place-content: center;
    justify-items: center;
    gap: 0.75rem;
    padding: 1.5rem;
    text-align: center;
    background: color-mix(in srgb, var(--paper) 82%, transparent);
  }
  .overlay p {
    margin: 0;
    max-width: 30ch;
  }
  .big {
    font-family: var(--display);
    font-weight: var(--display-weight);
    font-size: clamp(1.8rem, 6vw, 2.6rem);
  }
  .message {
    min-height: 1.6em;
    margin: 0;
    font-weight: 600;
  }
  .pickers {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
  }
  .pickers button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 2.75rem;
    padding: 0.4rem 0.9rem;
    border: 2px solid var(--ink);
    border-radius: 999px;
    background: var(--paper);
    font-weight: 700;
    cursor: pointer;
  }
</style>
