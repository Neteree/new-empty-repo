<script lang="ts">
  // One 3D flower made from simple shapes: stem, leaf, petals and centre. Used
  // by the bouquet and the flower game. Goes inside a Threlte <Canvas>.
  import { T } from '@threlte/core';
  import type { Flower } from './bouquet';

  let { flower: f, scale = 1, id }: { flower: Flower; scale?: number; id?: number } = $props();
</script>

<T.Group position={[f.x, -0.45, f.z]} scale={f.size * scale} userData={{ id }}>
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
    {#if id !== undefined}
      <!-- An invisible ball around the head, so a flower is easy to tap. -->
      <T.Mesh scale={0.5}>
        <T.SphereGeometry args={[1, 8, 6]} />
        <T.MeshBasicMaterial transparent opacity={0} depthWrite={false} />
      </T.Mesh>
    {/if}
  </T.Group>
</T.Group>
