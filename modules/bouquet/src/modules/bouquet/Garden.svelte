<script lang="ts">
  // The flower game's 3D garden: a bed of flowers to tap. Goes inside a
  // Threlte <Canvas>; tapping a flower calls onpick with its id.
  import { T, useTask, useThrelte } from '@threlte/core';
  import { Group, Raycaster, Vector2 } from 'three';
  import FlowerShape from './Flower.svelte';
  import { flowerAt, type Plant } from './game';

  let { garden, colours, onpick }: { garden: (Plant | null)[]; colours: string[]; onpick: (id: number) => void } = $props();

  const { camera, renderer, size } = useThrelte();
  // Pull back on a narrow (phone) screen so the whole bed fits.
  const back = $derived($size.width / $size.height < 1.15 ? 1.35 : 1);
  let bed = $state<Group>();

  // New flowers grow in over a moment.
  useTask((delta) => {
    for (const plant of garden) if (plant && plant.grow < 1) plant.grow = Math.min(1, plant.grow + delta * 2.5);
  });

  // A tap finds the flower under it (its id is on the flower's group).
  $effect(() => {
    const canvas = renderer.domElement;
    const ray = new Raycaster();
    const tap = (event: PointerEvent) => {
      if (!bed) return;
      const box = canvas.getBoundingClientRect();
      ray.setFromCamera(new Vector2(((event.clientX - box.left) / box.width) * 2 - 1, -((event.clientY - box.top) / box.height) * 2 + 1), camera.current);
      for (const hit of ray.intersectObject(bed, true)) {
        let object: typeof hit.object | null = hit.object;
        while (object && object.userData.id === undefined) object = object.parent;
        if (object) return onpick(object.userData.id);
      }
    };
    canvas.addEventListener('pointerdown', tap);
    return () => canvas.removeEventListener('pointerdown', tap);
  });
</script>

<T.PerspectiveCamera makeDefault position={[0, 3.1 * back, 3.1 * back]} rotation.x={-0.78} fov={45} />
<T.HemisphereLight args={['#ffffff', '#6a8f6a', 1.6]} />
<T.DirectionalLight position={[2, 4, 3]} intensity={1.8} />

<!-- The bed of soil the flowers grow in. -->
<T.Mesh position.y={-0.5} scale={[4.2, 0.1, 3.1]}>
  <T.BoxGeometry />
  <T.MeshStandardMaterial color="#6b4a33" roughness={1} />
</T.Mesh>

<T.Group bind:ref={bed}>
  {#each garden as plant, spot (plant?.id ?? `empty-${spot}`)}
    {#if plant}
      <FlowerShape flower={flowerAt(spot, colours[plant.kind], plant.id)} scale={plant.grow} id={plant.id} />
    {/if}
  {/each}
</T.Group>
