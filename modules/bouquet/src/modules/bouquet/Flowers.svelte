<script lang="ts">
  // The 3D scene: a bunch of flowers made from simple shapes (see bunch() in
  // bouquet.ts). Goes inside any Threlte <Canvas>.
  import { T } from '@threlte/core';
  import type { Flower } from './bouquet';

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
  {#each flowers as f, i (i)}
    <T.Group position={[f.x, -0.45, f.z]} scale={f.size}>
      <T.Mesh position.y={f.height / 2}>
        <T.CylinderGeometry args={[0.03, 0.04, f.height, 8]} />
        <T.MeshStandardMaterial color="#4f8a4a" />
      </T.Mesh>
      <T.Mesh position={[0.12, f.height * 0.35, 0]} rotation.z={-0.8} scale={[0.22, 0.05, 0.1]}>
        <T.SphereGeometry args={[1, 12, 8]} />
        <T.MeshStandardMaterial color="#5f9e55" />
      </T.Mesh>
      <T.Group position.y={f.height} rotation.x={0.35}>
        {#each Array.from({ length: f.layers }) as _, layer (layer)}
          {#each Array.from({ length: f.petals }) as _, p (p)}
            <T.Group rotation.y={(p / f.petals) * Math.PI * 2 + layer * 0.4}>
              <T.Mesh
                position={[0.2 - layer * 0.06, 0.02 + layer * 0.04, 0]}
                rotation.z={f.cup + layer * 0.35}
                scale={[0.22 - layer * 0.04, 0.035, 0.11 - layer * 0.015]}
              >
                <T.SphereGeometry args={[1, 16, 10]} />
                <T.MeshStandardMaterial color={f.petal} roughness={0.6} />
              </T.Mesh>
            </T.Group>
          {/each}
        {/each}
        <T.Mesh position.y={0.05} scale={[0.09, 0.06, 0.09]}>
          <T.SphereGeometry args={[1, 16, 10]} />
          <T.MeshStandardMaterial color={f.centre} roughness={0.9} />
        </T.Mesh>
      </T.Group>
    </T.Group>
  {/each}
</T.Group>
