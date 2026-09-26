<script lang="ts">
  // A drawn flower head, optionally on a stem with two leaves. The painted
  // edges come from the #painted filter defined once in the layout.
  import { petalPath, rings } from './bloom';

  let {
    petals,
    petal,
    centre,
    stem = false,
    label,
  }: { petals: number; petal: string; centre: string; stem?: boolean; label?: string } = $props();

  const shape = $derived(rings(petals));
</script>

<svg
  class="bloom"
  viewBox={stem ? '-60 -60 120 210' : '-60 -60 120 120'}
  role={label ? 'img' : undefined}
  aria-label={label}
  aria-hidden={label ? undefined : 'true'}
>
  {#if stem}
    <g class="stem">
      <path d="M0 0 C 4 50 -6 100 2 148" fill="none" stroke-width="3.5" stroke-linecap="round" />
      <path class="leaf" d="M1 92 C 22 78 38 82 44 70 C 30 66 12 72 1 92 Z" />
      <path class="leaf" d="M-1 118 C -22 104 -38 108 -44 96 C -30 92 -12 98 -1 118 Z" />
    </g>
  {/if}
  <g filter="url(#painted)">
    {#each shape.outer as angle (angle)}
      <path d={petalPath(shape.width)} fill={petal} transform="rotate({angle})" />
    {/each}
    {#each shape.inner as angle (angle)}
      <path d={petalPath(shape.width * 0.7, 32)} fill={petal} transform="rotate({angle})" class="inner" />
    {/each}
    <circle r={petals > 8 ? 10 : 8} fill={centre} />
  </g>
</svg>

<style>
  .bloom {
    display: block;
    width: 100%;
    height: auto;
    max-width: 100%;
    overflow: visible;
  }
  path {
    opacity: 0.84;
  }
  .inner {
    filter: brightness(0.88);
  }
  .stem path {
    stroke: var(--leaf);
  }
  .stem .leaf {
    fill: var(--leaf);
    stroke: none;
  }
</style>
