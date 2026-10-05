<script lang="ts">
  // A row of slides that scrolls sideways and snaps to each one. The arrows
  // sit beside the `head` (usually the section heading) when there is one,
  // otherwise under the slides; optional thumbnails sit centred underneath.
  // Swiping and scrolling work without JavaScript; lib/carousel.ts (loaded on
  // every page) wires up the arrows and thumbnails, and hides the arrows when
  // everything already fits. The parent renders the slides (<li>s) and styles them.
  import type { Snippet } from 'svelte';

  let { label, children, head, thumbs }: { label: string; children: Snippet; head?: Snippet; thumbs?: Snippet } = $props();
</script>

{#snippet arrows()}
  <div class="arrows">
    <button type="button" class="arrow" data-go="-1" aria-label="Previous">←</button>
    <button type="button" class="arrow" data-go="1" aria-label="Next">→</button>
  </div>
{/snippet}

<div class="carousel" data-carousel>
  {#if head}
    <div class="head">
      <div class="head-text">{@render head()}</div>
      {@render arrows()}
    </div>
  {/if}
  <ul class="track" tabindex="0" aria-label={label}>
    {@render children()}
  </ul>
  {#if thumbs}<div class="thumbs">{@render thumbs()}</div>{/if}
  {#if !head}<div class="foot">{@render arrows()}</div>{/if}
</div>

<style>
  .carousel {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 1.25rem;
    min-width: 0;
  }

  .head {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 1rem;
    min-width: 0;
  }

  .head-text {
    min-width: 0;
  }

  .head-text :global(.section-head) {
    margin-bottom: 0;
  }

  .foot {
    display: flex;
    justify-content: flex-end;
  }

  .track {
    position: relative;
    list-style: none;
    margin: 0;
    padding: 0 0 0.25rem;
    display: flex;
    gap: 1rem;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scroll-behavior: smooth;
    scrollbar-width: none;
  }

  .track::-webkit-scrollbar {
    display: none;
  }

  .track > :global(li) {
    flex: 0 0 auto;
    scroll-snap-align: start;
  }

  .arrows {
    display: flex;
    flex: none;
    gap: 0.5rem;
  }

  :global([data-fits]) .arrows {
    visibility: hidden;
  }

  .arrow {
    width: 2.75rem;
    height: 2.75rem;
    border: var(--frame);
    border-radius: var(--button-radius);
    background: var(--paper);
    color: var(--ink);
    font-size: 1.1rem;
    cursor: pointer;
  }

  .arrow:hover {
    background: var(--ink);
    color: var(--paper);
  }

  .thumbs {
    display: flex;
    justify-content: safe center;
    gap: 0.4rem;
    min-width: 0;
    overflow-x: auto;
    scrollbar-width: none;
    padding: 2px;
  }

  .thumbs > :global(*) {
    flex: 0 0 auto;
  }

  /* Phones swipe; the next slide peeking in shows there's more. */
  @media (max-width: 40rem) {
    .arrows {
      display: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .track {
      scroll-behavior: auto;
    }
  }
</style>
