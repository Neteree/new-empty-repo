<script lang="ts">
  // The 3D scene: a bunch of flowers (see bunch() in bouquet.ts, and
  // Flower.svelte for one flower). Goes inside any Threlte <Canvas>.
  import { T } from '@threlte/core';
  import type { Flower } from './bouquet';
  import FlowerShape from './Flower.svelte';

  // `turn` is how far the bunch has been turned (by dragging); it doesn't move on its own.
  let { flowers, turn = 0 }: { flowers: Flower[]; turn?: number } = $props();

  // Step the camera back for a wide bunch, so it always fits the window, even
  // on a square phone screen. It looks slightly down at the middle of the flowers.
  const reach = $derived(Math.max(...flowers.map((f) => Math.hypot(f.x, f.z) + 0.42 * f.size)));
  const distance = $derived(Math.max(2.6, reach * 3.1));
</script>

<T.PerspectiveCamera makeDefault position={[0, 1.1, distance]} rotation.x={-Math.atan2(0.75, distance)} fov={40} />
<T.HemisphereLight args={['#ffffff', '#6a8f6a', 1.6]} />
<T.DirectionalLight position={[2, 4, 3]} intensity={1.8} />

<T.Group rotation.y={turn}>
  {#each flowers as flower, i (i)}
    <FlowerShape {flower} />
  {/each}
</T.Group>
