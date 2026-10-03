<script lang="ts">
  // The 3D mini golf hole: green, walls, bumpers, cup, ball and the aiming
  // line. Goes inside a Threlte <Canvas>. Rolling the ball is golf.ts; this
  // draws it, moves it each frame, and turns a drag on the green into a putt
  // (pull back from the ball and let go).
  import { T, useTask, useThrelte } from '@threlte/core';
  import { Plane, Raycaster, Shape, Vector2, Vector3 } from 'three';
  import { BALL, CUP, bounds, step, walls, type Ball, type Hole } from './golf';

  let {
    hole,
    ball,
    aim = $bindable(),
    canPutt,
    colours,
    onputt,
    onstop,
  }: {
    hole: Hole;
    ball: Ball;
    aim: { angle: number; power: number; dragging: boolean };
    canPutt: boolean;
    colours: { accent: string; highlight: string; ink: string };
    onputt: () => void;
    onstop: () => void;
  } = $props();

  const { camera, renderer, size } = useThrelte();
  const segments = $derived(walls(hole));
  const green = $derived.by(() => {
    const shape = new Shape();
    hole.edge.forEach(([x, z], i) => (i ? shape.lineTo(x, -z) : shape.moveTo(x, -z)));
    return shape;
  });

  // Fit the whole hole in view, whatever the screen shape.
  const view = $derived.by(() => {
    const b = bounds(hole);
    const aspect = $size.width / Math.max(1, $size.height);
    const distance = Math.max(b.depth * 1.15, (b.width * 1.25) / aspect) * 1.28;
    return { x: b.cx, y: distance * 0.85, z: b.cz + distance * 0.5, look: -Math.atan2(0.85, 0.5) };
  });

  // Roll the ball each frame; tell the game when it stops or drops in.
  let rolling = false;
  useTask((delta) => {
    const was = rolling;
    step(ball, hole, segments, Math.min(delta, 0.05));
    rolling = !ball.sunk && (ball.vx !== 0 || ball.vz !== 0);
    if (was && !rolling) onstop();
  });

  // Drag back from the ball to aim; let go to putt.
  $effect(() => {
    const canvas = renderer.domElement;
    const ray = new Raycaster();
    const ground = new Plane(new Vector3(0, 1, 0), 0);
    const spot = new Vector3();
    const groundAt = (event: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      ray.setFromCamera(new Vector2(((event.clientX - box.left) / box.width) * 2 - 1, -((event.clientY - box.top) / box.height) * 2 + 1), camera.current);
      return ray.ray.intersectPlane(ground, spot);
    };
    const move = (event: PointerEvent) => {
      if (!aim.dragging) return;
      const point = groundAt(event);
      if (!point) return;
      const dx = ball.x - point.x;
      const dz = ball.z - point.z;
      aim.angle = Math.atan2(dx, -dz);
      aim.power = Math.min(1, Math.hypot(dx, dz) / 1.8);
    };
    const down = (event: PointerEvent) => {
      if (!canPutt) return;
      aim.dragging = true;
      canvas.setPointerCapture(event.pointerId);
      move(event);
    };
    const up = () => {
      if (!aim.dragging) return;
      aim.dragging = false;
      if (aim.power > 0.03) onputt();
    };
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    return () => {
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', up);
    };
  });
</script>

<T.PerspectiveCamera makeDefault position={[view.x, view.y, view.z]} rotation.x={view.look} fov={45} />
<T.HemisphereLight args={['#ffffff', '#4a6a4a', 1.5]} />
<T.DirectionalLight position={[3, 6, 4]} intensity={1.6} />

<!-- The green -->
<T.Mesh rotation.x={-Math.PI / 2}>
  <T.ShapeGeometry args={[green]} />
  <T.MeshStandardMaterial color="#3f9d5a" roughness={0.95} />
</T.Mesh>

<!-- Walls around the edge -->
{#each hole.edge.map((p, i) => [p, hole.edge[(i + 1) % hole.edge.length]]) as [[ax, az], [bx, bz]], i (i)}
  <T.Mesh position={[(ax + bx) / 2, 0.08, (az + bz) / 2]} rotation.y={-Math.atan2(bz - az, bx - ax)}>
    <T.BoxGeometry args={[Math.hypot(bx - ax, bz - az) + 0.08, 0.16, 0.08]} />
    <T.MeshStandardMaterial color={colours.accent} />
  </T.Mesh>
{/each}

<!-- Blocks and bumpers -->
{#each hole.blocks as [x, z, w, d], i (i)}
  <T.Mesh position={[x + w / 2, 0.08, z + d / 2]}>
    <T.BoxGeometry args={[w, 0.16, d]} />
    <T.MeshStandardMaterial color={colours.accent} />
  </T.Mesh>
{/each}
{#each hole.bumpers as [x, z, r], i (i)}
  <T.Mesh position={[x, 0.1, z]}>
    <T.CylinderGeometry args={[r, r, 0.2, 24]} />
    <T.MeshStandardMaterial color={colours.highlight} />
  </T.Mesh>
{/each}

<!-- The cup and flag -->
<T.Mesh position={[hole.cup[0], 0.002, hole.cup[1]]}>
  <T.CylinderGeometry args={[CUP, CUP, 0.004, 24]} />
  <T.MeshBasicMaterial color="#1b2a20" />
</T.Mesh>
{#if !ball.sunk}
  <T.Mesh position={[hole.cup[0], 0.35, hole.cup[1]]}>
    <T.CylinderGeometry args={[0.012, 0.012, 0.7, 6]} />
    <T.MeshStandardMaterial color={colours.ink} />
  </T.Mesh>
  <T.Mesh position={[hole.cup[0] + 0.12, 0.6, hole.cup[1]]} scale={[0.24, 0.14, 0.01]}>
    <T.BoxGeometry />
    <T.MeshStandardMaterial color={colours.highlight} />
  </T.Mesh>
{/if}

<!-- The ball (half sunk once it's in), and the aiming line -->
<T.Mesh position={[ball.x, ball.sunk ? 0 : BALL, ball.z]}>
  <T.SphereGeometry args={[BALL, 20, 14]} />
  <T.MeshStandardMaterial color="#ffffff" roughness={0.4} />
</T.Mesh>
{#if canPutt && aim.power > 0.03}
  {@const length = 0.25 + aim.power * 1.6}
  <T.Mesh
    position={[ball.x + (Math.sin(aim.angle) * length) / 2, 0.02, ball.z - (Math.cos(aim.angle) * length) / 2]}
    rotation.y={-aim.angle}
  >
    <T.BoxGeometry args={[0.04, 0.01, length]} />
    <T.MeshBasicMaterial color="#ffffff" transparent opacity={0.85} />
  </T.Mesh>
{/if}
