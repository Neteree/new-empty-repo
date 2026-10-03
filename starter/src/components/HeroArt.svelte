<script lang="ts">
  // Decorative art beside the headline when a site has no hero photo yet, so the
  // top of the page never looks empty. Drawn in the theme's own colours (so it
  // suits every look and dark mode) around the business's initial. It's not a
  // picture of the business, so there's nothing misleading about it.
  let { name }: { name: string } = $props();

  const initial = $derived(name.replace(/^(the|te)\s+/i, '').trim().charAt(0).toUpperCase());
  const dots = Array.from({ length: 5 }, (_, row) => Array.from({ length: 5 }, (_, col) => [40 + col * 22, 300 + row * 18])).flat();
</script>

<svg class="hero-art" viewBox="0 0 400 400" aria-hidden="true" focusable="false">
  <circle class="sun" cx="300" cy="110" r="78"></circle>
  <path class="arch" d="M110 360 V190 a95 95 0 0 1 190 0 V360 Z"></path>
  <path class="arch-inner" d="M135 360 V196 a70 70 0 0 1 140 0 V360 Z"></path>
  <text class="initial" x="205" y="300" text-anchor="middle">{initial}</text>
  {#each dots as [x, y] (`${x},${y}`)}<circle class="dot" cx={x} cy={y} r="3.5"></circle>{/each}
  <path class="wave" d="M20 380 q30 -18 60 0 t60 0 t60 0 t60 0 t60 0 t60 0"></path>
  <path class="spark" d="M330 250 l6 16 16 6 -16 6 -6 16 -6 -16 -16 -6 16 -6 z"></path>
</svg>

<style>
  .hero-art {
    width: 100%;
    max-width: 26rem;
    height: auto;
    justify-self: center;
  }
  @media (max-width: 52rem) {
    .hero-art {
      max-width: 15rem;
    }
  }
  .sun {
    fill: var(--highlight);
  }
  .arch {
    fill: var(--accent);
  }
  .arch-inner {
    fill: var(--paper);
  }
  .initial {
    fill: var(--accent);
    font-family: var(--display);
    font-weight: var(--display-weight);
    font-size: 150px;
  }
  .dot {
    fill: var(--ink-soft);
    opacity: 0.45;
  }
  .wave {
    fill: none;
    stroke: var(--ink);
    stroke-width: 3;
    stroke-linecap: round;
  }
  .spark {
    fill: var(--ink);
  }
</style>
