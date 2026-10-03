<script lang="ts">
  // The interactive part: the 3D canvas (graphics) plus real controls (UI): a
  // slider to turn the bunch and a "New bunch" button. On a phone, touching
  // the canvas just scrolls the page, so turning never fights scrolling; with
  // a mouse you can also drag the canvas.
  import { Canvas } from '@threlte/core';
  import { WebGLRenderer } from 'three';
  import Flowers from './Flowers.svelte';
  import { bunch } from './bouquet';

  let { count, colours }: { count: number; colours: string[] } = $props();

  let seed = $state(1);
  const flowers = $derived(bunch(seed, count, colours));
  /** How far the bunch is turned, in degrees. */
  let degrees = $state(0);
  let last: number | null = null;

  function down(event: PointerEvent) {
    if (event.pointerType !== 'mouse') return;
    last = event.clientX;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }
  function move(event: PointerEvent) {
    if (last === null) return;
    degrees = (((degrees + (event.clientX - last) * 0.6) % 360) + 360) % 360;
    last = event.clientX;
  }
</script>

<div class="bouquet">
  <div
    class="window"
    role="img"
    aria-label="A 3D drawing of a bunch of flowers"
    onpointerdown={down}
    onpointermove={move}
    onpointerup={() => (last = null)}
    onpointercancel={() => (last = null)}
  >
    <Canvas createRenderer={(canvas) => new WebGLRenderer({ canvas, alpha: true, antialias: true })}>
      <Flowers {flowers} turn={(degrees * Math.PI) / 180} />
    </Canvas>
  </div>
  <div class="controls">
    <label class="turn">
      Turn it
      <input type="range" min="0" max="359" bind:value={degrees} />
    </label>
    <button class="button" type="button" onclick={() => (seed += 1)}>New bunch</button>
  </div>
</div>

<style>
  .bouquet {
    display: grid;
    gap: 1.25rem;
  }
  .window {
    width: 100%;
    aspect-ratio: 16 / 9;
    border: 2px solid var(--ink);
    border-radius: 1rem;
    overflow: hidden;
    background: radial-gradient(circle at 50% 40%, var(--paper), color-mix(in srgb, var(--highlight) 55%, var(--paper)));
    box-shadow: 8px 8px 0 var(--highlight);
  }
  @media (pointer: fine) {
    .window {
      cursor: grab;
    }
  }
  @media (max-width: 40rem) {
    .window {
      aspect-ratio: 1;
    }
  }
  .controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1rem 1.5rem;
  }
  .turn {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex: 1 1 18rem;
    max-width: 34rem;
    font-weight: 700;
    font-size: 1.1rem;
  }
  /* A big, easy-to-grab slider in the theme's colours. */
  .turn input {
    flex: 1;
    height: 3rem;
    margin: 0;
    background: none;
    appearance: none;
    cursor: pointer;
  }
  .turn input::-webkit-slider-runnable-track {
    height: 0.75rem;
    border-radius: 999px;
    background: var(--rule);
    border: 2px solid var(--ink);
  }
  .turn input::-moz-range-track {
    height: 0.75rem;
    border-radius: 999px;
    background: var(--rule);
    border: 2px solid var(--ink);
  }
  .turn input::-webkit-slider-thumb {
    appearance: none;
    width: 2.25rem;
    height: 2.25rem;
    margin-top: calc(-1.125rem + 0.25rem);
    border-radius: 50%;
    background: var(--accent);
    border: 3px solid var(--paper);
    box-shadow: 0 0 0 2px var(--ink), 3px 3px 0 var(--highlight);
  }
  .turn input::-moz-range-thumb {
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 50%;
    background: var(--accent);
    border: 3px solid var(--paper);
    box-shadow: 0 0 0 2px var(--ink), 3px 3px 0 var(--highlight);
  }
</style>
