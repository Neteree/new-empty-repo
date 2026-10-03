<script lang="ts">
  // The interactive part: the 3D canvas (graphics) plus a real button (UI).
  // Drag the canvas to turn the bunch; "New bunch" draws another.
  import { Canvas } from '@threlte/core';
  import { WebGLRenderer } from 'three';
  import Flowers from './Flowers.svelte';
  import { bunch } from './bouquet';

  let { count, colours }: { count: number; colours: string[] } = $props();

  let seed = $state(1);
  const flowers = $derived(bunch(seed, count, colours));
  let turn = $state(0);
  let dragging: number | null = null;

  function down(event: PointerEvent) {
    dragging = event.clientX;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }
  function move(event: PointerEvent) {
    if (dragging === null) return;
    turn += (event.clientX - dragging) * 0.01;
    dragging = event.clientX;
  }
</script>

<div class="bouquet">
  <div
    class="window"
    role="img"
    aria-label="A 3D drawing of a bunch of flowers"
    onpointerdown={down}
    onpointermove={move}
    onpointerup={() => (dragging = null)}
    onpointercancel={() => (dragging = null)}
  >
    <Canvas createRenderer={(canvas) => new WebGLRenderer({ canvas, alpha: true, antialias: true })}>
      <Flowers {flowers} {turn} />
    </Canvas>
  </div>
  <button class="button" type="button" onclick={() => (seed += 1)}>New bunch</button>
</div>

<style>
  .bouquet {
    display: grid;
    gap: 1.25rem;
    justify-items: start;
  }
  .window {
    width: 100%;
    aspect-ratio: 16 / 9;
    border: 2px solid var(--ink);
    border-radius: 1rem;
    overflow: hidden;
    background: radial-gradient(circle at 50% 40%, var(--paper), color-mix(in srgb, var(--highlight) 55%, var(--paper)));
    box-shadow: 8px 8px 0 var(--highlight);
    cursor: grab;
    touch-action: pan-y;
  }
  @media (max-width: 40rem) {
    .window {
      aspect-ratio: 1;
    }
  }
</style>
