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
  // A drag only turns the bunch once it's clearly sideways; an up-or-down
  // swipe is left to the page, so scrolling past on a phone never turns it.
  let start: { x: number; y: number } | null = null;
  let turning = false;
  let last = 0;

  function down(event: PointerEvent) {
    start = { x: event.clientX, y: event.clientY };
    turning = false;
  }
  function move(event: PointerEvent) {
    if (!start) return;
    if (!turning) {
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      if (Math.hypot(dx, dy) < 8) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        start = null;
        return;
      }
      turning = true;
      last = event.clientX;
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    }
    turn += (event.clientX - last) * 0.01;
    last = event.clientX;
  }
  function end() {
    start = null;
    turning = false;
  }
  function key(event: KeyboardEvent) {
    if (event.key === 'ArrowLeft') turn -= 0.3;
    else if (event.key === 'ArrowRight') turn += 0.3;
    else return;
    event.preventDefault();
  }
</script>

<div class="bouquet">
  <div
    class="window"
    role="img"
    aria-label="A 3D drawing of a bunch of flowers. Drag sideways or use the arrow keys to turn it."
    tabindex="0"
    onpointerdown={down}
    onpointermove={move}
    onpointerup={end}
    onpointercancel={end}
    onkeydown={key}
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
