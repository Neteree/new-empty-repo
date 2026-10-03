<script lang="ts">
  // The 3D scene: a bunch of flowers made from simple shapes (see bunch() in
  // bouquet.ts). Goes inside any Threlte <Canvas>.
  import { T, useTask } from '@threlte/core';
  import type { Flower } from './bouquet';

  let { flowers, turn = 0, spin = true }: { flowers: Flower[]; turn?: number; spin?: boolean } = $props();

  let auto = $state(0);
  useTask((delta) => {
    if (spin) auto += delta * 0.3;
  });
</script>

<T.PerspectiveCamera makeDefault position={[0, 1.3, 3.4]} fov={40} oncreate={(ref) => ref.lookAt(0, 0.9, 0)} />
<T.HemisphereLight args={['#ffffff', '#6a8f6a', 1.6]} />
<T.DirectionalLight position={[2, 4, 3]} intensity={1.8} />

<T.Group rotation.y={auto + turn}>
  {#each flowers as f, i (i)}
    <T.Group position={[f.x, -0.45, f.z]} rotation.z={f.lean} scale={f.size * 0.8}>
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
