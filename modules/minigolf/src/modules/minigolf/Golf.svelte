<script lang="ts">
  // The mini golf game: the 3D hole (graphics, Course.svelte) with the
  // scorecard, aim and power sliders, and buttons as page elements (UI). The
  // physics are in golf.ts. Drag on the green to putt, or use the sliders and
  // the Putt button (keyboards and screen readers).
  import { onMount } from 'svelte';
  import { Canvas } from '@threlte/core';
  import { WebGLRenderer } from 'three';
  import Course from './Course.svelte';
  import { newBall, putt, toPar, type Hole } from './golf';
  import { readBest, saveBest } from '../../lib/store';

  let { holes, title }: { holes: Hole[]; title: string } = $props();

  const BEST = 'minigolf-best';
  let index = $state(0);
  const hole = $derived(holes[index]);
  let ball = $state(newBall(holes[0]));
  let strokes = $state<number[]>(holes.map(() => 0));
  let phase = $state<'aim' | 'rolling' | 'sunk' | 'done'>('aim');
  let aim = $state({ angle: 0, power: 0.4, dragging: false });
  let message = $state('');
  let best = $state<number | null>(null);
  let resting = { x: 0, z: 0 };
  const total = $derived(strokes.reduce((a, b) => a + b, 0));
  const totalPar = holes.reduce((a, h) => a + h.par, 0);

  // The 3D walls and flag use the site's own theme colours.
  let colours = $state({ accent: '#0d737a', highlight: '#ffd2b8', ink: '#15303a' });
  onMount(() => {
    const css = getComputedStyle(document.documentElement);
    const read = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
    colours = { accent: read('--accent', '#0d737a'), highlight: read('--highlight', '#ffd2b8'), ink: read('--ink', '#15303a') };
    best = readBest(BEST);
  });

  /** Aim and power as the sliders show them (degrees and percent). */
  const degrees = $derived(Math.round((((aim.angle * 180) / Math.PI) % 360 + 360) % 360));

  function hit() {
    if (phase !== 'aim') return;
    resting = { x: ball.x, z: ball.z };
    putt(ball, aim.angle, aim.power);
    strokes[index]++;
    phase = 'rolling';
    message = '';
  }

  function stopped() {
    if (ball.sunk) {
      const n = strokes[index];
      message = n === 1 ? 'Hole in one!' : `In for ${n} (${toPar(n, hole.par) === 'E' ? 'par' : toPar(n, hole.par)}).`;
      phase = index === holes.length - 1 ? finish() : 'sunk';
      return;
    }
    // Somehow off the green: back to where it was, no extra stroke.
    if (!onGreen(ball.x, ball.z)) {
      Object.assign(ball, { x: resting.x, z: resting.z });
      message = 'Off the green! Back where it was.';
    }
    phase = 'aim';
  }

  function finish(): 'done' {
    best = saveBest(BEST, total, true).best;
    return 'done';
  }

  function nextHole() {
    index++;
    ball = newBall(hole);
    aim = { angle: 0, power: 0.4, dragging: false };
    phase = 'aim';
    message = '';
  }

  function restart() {
    index = 0;
    strokes = holes.map(() => 0);
    ball = newBall(holes[0]);
    aim = { angle: 0, power: 0.4, dragging: false };
    phase = 'aim';
    message = '';
  }

  function onGreen(x: number, z: number) {
    let inside = false;
    const e = hole.edge;
    for (let i = 0, j = e.length - 1; i < e.length; j = i++) {
      if (e[i][1] > z !== e[j][1] > z && x < ((e[j][0] - e[i][0]) * (z - e[i][1])) / (e[j][1] - e[i][1]) + e[i][0]) inside = !inside;
    }
    return inside;
  }
</script>

<div class="golf">
  <div class="bar">
    <span>Hole <b>{index + 1}</b> of {holes.length}</span>
    <span>Par <b>{hole.par}</b></span>
    <span>Strokes <b>{strokes[index]}</b></span>
    <span>Total <b>{total}</b></span>
  </div>
  <p class="hole-name">{hole.name}</p>

  <div class="green-box">
    <div class="scene" role="img" aria-label="A 3D mini golf hole: {hole.name}, par {hole.par}">
      {#key index}
        <Canvas createRenderer={(canvas) => new WebGLRenderer({ canvas, alpha: true, antialias: true })}>
          <Course {hole} {ball} bind:aim canPutt={phase === 'aim'} {colours} onputt={hit} onstop={stopped} />
        </Canvas>
      {/key}
    </div>
    {#if phase === 'sunk' || phase === 'done'}
      <div class="overlay">
        <p class="big">{message}</p>
        {#if phase === 'done'}
          <p>Round over: {total} strokes ({toPar(total, totalPar)} for the course).{best === total ? ' Your best round yet.' : ''}</p>
          <button class="button" type="button" onclick={restart}>Play again</button>
        {:else}
          <button class="button" type="button" onclick={nextHole}>Next hole</button>
        {/if}
      </div>
    {/if}
  </div>

  <p class="message" role="status">{phase === 'aim' || phase === 'rolling' ? message : ''}</p>

  <div class="controls">
    <label>
      Aim <span class="value">{degrees}°</span>
      <input type="range" min="0" max="359" value={degrees} disabled={phase !== 'aim'} oninput={(e) => (aim.angle = (Number(e.currentTarget.value) * Math.PI) / 180)} />
    </label>
    <label>
      Power <span class="value">{Math.round(aim.power * 100)}%</span>
      <input type="range" min="5" max="100" value={Math.round(aim.power * 100)} disabled={phase !== 'aim'} oninput={(e) => (aim.power = Number(e.currentTarget.value) / 100)} />
    </label>
    <button class="button" type="button" disabled={phase !== 'aim'} onclick={hit}>Putt</button>
  </div>

  <table class="card">
    <caption>Scorecard{best !== null ? ` · best round ${best}` : ''}</caption>
    <thead>
      <tr><th scope="row">Hole</th>{#each holes as _, i (i)}<th scope="col">{i + 1}</th>{/each}<th scope="col">Total</th></tr>
    </thead>
    <tbody>
      <tr><th scope="row">Par</th>{#each holes as h, i (i)}<td>{h.par}</td>{/each}<td>{totalPar}</td></tr>
      <tr><th scope="row">You</th>{#each strokes as n, i (i)}<td class:now={i === index}>{n || '–'}</td>{/each}<td>{total || '–'}</td></tr>
    </tbody>
  </table>
</div>

<style>
  .golf {
    display: grid;
    gap: 1rem;
    max-width: 56rem;
  }
  .bar {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem 1.6rem;
    font-size: 1.1rem;
  }
  .bar b {
    font-family: var(--display);
    font-size: 1.6rem;
    color: var(--accent);
    font-variant-numeric: tabular-nums;
  }
  .hole-name {
    margin: -0.5rem 0 0;
    font-weight: 700;
    color: var(--ink-soft);
  }
  .green-box {
    position: relative;
    aspect-ratio: 4 / 3;
    border: var(--frame);
    border-radius: 1rem;
    overflow: hidden;
    background: radial-gradient(circle at 50% 30%, var(--paper), color-mix(in srgb, var(--highlight) 45%, var(--paper)));
    box-shadow: var(--lift-l);
  }
  @media (max-width: 40rem) {
    .green-box {
      aspect-ratio: 3 / 4;
    }
  }
  .scene {
    position: absolute;
    inset: 0;
    /* Dragging on the green aims the putt, so it doesn't scroll the page. */
    touch-action: none;
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
    background: color-mix(in srgb, var(--paper) 80%, transparent);
  }
  .overlay p {
    margin: 0;
    max-width: 32ch;
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
  .controls {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: 1rem 1.5rem;
  }
  .controls label {
    display: grid;
    gap: 0.3rem;
    flex: 1 1 12rem;
    font-weight: 700;
  }
  .value {
    font-weight: 400;
    color: var(--ink-soft);
  }
  .controls input {
    min-height: 2.75rem;
    accent-color: var(--accent);
  }
  .controls .button:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .card {
    border-collapse: collapse;
    width: 100%;
    max-width: 30rem;
    font-variant-numeric: tabular-nums;
  }
  .card caption {
    text-align: left;
    font-weight: 700;
    margin-bottom: 0.4rem;
  }
  .card th,
  .card td {
    border: 1.5px solid var(--rule);
    padding: 0.35rem 0.5rem;
    text-align: center;
  }
  .card th[scope='row'] {
    text-align: left;
  }
  .card .now {
    background: color-mix(in srgb, var(--highlight) 50%, transparent);
    font-weight: 700;
  }
</style>
