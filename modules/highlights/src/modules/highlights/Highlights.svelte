<script lang="ts">
  // Highlights as a row of short cards.
  import type { Highlight } from './highlights';

  let { items }: { items: Highlight[] } = $props();
</script>

<ul class="highlights">
  {#each items as item, i (i)}
    <li>
      <h3>{item.title}</h3>
      <p>{item.text}</p>
    </li>
  {/each}
</ul>

<style>
  .highlights {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
    gap: 1.25rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    padding: 1.3rem 1.4rem;
    border: 2px solid var(--ink);
    border-top: 6px solid var(--accent);
    border-radius: 0.8rem;
  }

  h3 {
    font-size: 1.35rem;
    margin-bottom: 0.4rem;
  }

  p {
    margin: 0;
    color: var(--ink-soft);
  }
</style>
