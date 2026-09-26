<script lang="ts">
  // Riso-print illustration: a yellow halftone layer printed slightly out of
  // register under a blue line layer, like a two-colour risograph poster.
  import type { Art } from '../data/bakes';

  let { art, label }: { art: Art; label?: string } = $props();

  const id = $props.id();

  const scallop = Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2;
    return `${Math.cos(a) * 44},${Math.sin(a) * 44}`;
  });

  const shapes: Record<Art, { body: string; lines: string; dots?: [number, number, number][] }> = {
    loaf: {
      body: 'M-58 12 C -58 -34 58 -34 58 12 C 58 34 -58 34 -58 12 Z',
      lines: 'M-30 -12 L -8 6 M -6 -18 L 16 0 M 18 -16 L 38 0',
    },
    croissant: {
      body: 'M-62 18 C -46 -36 46 -36 62 18 C 34 2 -34 2 -62 18 Z',
      lines: 'M-36 -6 L -26 12 M -13 -18 L -8 5 M 13 -18 L 8 5 M 36 -6 L 26 12',
    },
    bun: {
      body: 'M0 -44 C 26 -44 44 -26 44 0 C 44 26 26 44 0 44 C -26 44 -44 26 -44 0 C -44 -26 -26 -44 0 -44 Z',
      lines: 'M0 0 C 10 -2 12 12 0 14 C -16 16 -18 -8 0 -12 C 22 -16 26 18 0 26 C -28 32 -32 -18 0 -24',
    },
    cookie: {
      body: 'M0 -44 C 26 -44 44 -26 44 0 C 44 26 26 44 0 44 C -26 44 -44 26 -44 0 C -44 -26 -26 -44 0 -44 Z',
      lines: 'M-30 30 C -22 36 -10 40 0 40',
      dots: [[-16, -14, 6], [14, -20, 5], [18, 10, 6], [-8, 18, 5], [-22, 4, 4], [4, -2, 4]],
    },
    baguette: {
      body: 'M-72 16 C -76 0 60 -30 70 -16 C 76 -2 -60 30 -72 16 Z',
      lines: 'M-46 2 L -34 14 M -20 -4 L -8 8 M 6 -10 L 18 2 M 32 -16 L 44 -4',
    },
    tart: {
      body: `M${scallop.join(' L ')} Z`,
      lines: 'M0 -30 C 16 -30 30 -16 30 0 C 30 16 16 30 0 30 C -16 30 -30 16 -30 0 C -30 -16 -16 -30 0 -30 Z',
      dots: [[-12, -10, 5], [10, -12, 5], [14, 10, 5], [-10, 12, 5], [0, 0, 5]],
    },
  };

  const shape = $derived(shapes[art]);
</script>

<svg class="bake-art" viewBox="-80 -60 160 120" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : 'true'}>
  <defs>
    <pattern id="{id}-dots" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(28)">
      <circle cx="2.5" cy="2.5" r="1.9" class="dot" />
    </pattern>
  </defs>
  <g transform="translate(5 5)">
    <path d={shape.body} class="tint" />
    <path d={shape.body} fill="url(#{id}-dots)" />
  </g>
  <path d={shape.body} class="line" />
  <path d={shape.lines} class="line" />
  {#if shape.dots}
    {#each shape.dots as [x, y, r] (`${x},${y}`)}
      <circle cx={x} cy={y} {r} class="chip" />
    {/each}
  {/if}
</svg>

<style>
  .bake-art {
    display: block;
    width: 100%;
    height: auto;
    overflow: visible;
  }
  .tint {
    fill: var(--yellow);
    opacity: 0.45;
  }
  .dot {
    fill: var(--yellow);
  }
  .line {
    fill: none;
    stroke: var(--blue);
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .chip {
    fill: var(--blue);
  }
</style>
