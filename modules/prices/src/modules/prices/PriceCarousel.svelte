<script lang="ts">
  // Price list items in one row that swipes sideways, a card each: its photo
  // (or its name on a coloured panel), name and price. The arrows sit beside
  // the section heading (`head`).
  import type { Snippet } from 'svelte';
  import Picture from '../../components/Picture.svelte';
  import Carousel from '../../components/Carousel.svelte';
  import BuyButton from '../../components/BuyButton.svelte';
  import type { ShownItem } from './shown';

  let { items, askText, head }: { items: ShownItem[]; askText: string; head: Snippet } = $props();
</script>

<Carousel label="Our range" {head}>
  {#each items as item (item.id)}
    <li class="slide">
      {#if item.image}<Picture image={item.image} />{:else}<p class="blank" aria-hidden="true">{item.name}</p>{/if}
      <div class="text">
        <p class="name">{item.name}</p>
        <p class="price">{item.price || askText}</p>
        {#if item.description}<p class="description">{item.description}</p>{/if}
        {#if item.link}<p class="buy"><BuyButton href={item.link} name={item.name} /></p>{/if}
      </div>
    </li>
  {/each}
</Carousel>

<style>
  .slide {
    width: min(17rem, 75vw);
    display: flex;
    flex-direction: column;
    border: var(--frame);
    border-radius: var(--radius);
    overflow: hidden;
    background: var(--paper);
  }

  .slide :global(img),
  .blank {
    display: block;
    width: 100%;
    height: auto;
    aspect-ratio: 4 / 5;
    object-fit: cover;
  }

  .blank {
    margin: 0;
    display: grid;
    place-items: center;
    padding: 1rem;
    text-align: center;
    background: color-mix(in srgb, var(--highlight) 45%, var(--paper));
    color: var(--ink);
    font-family: var(--display);
    font-style: italic;
    font-size: 1.5rem;
  }

  .text {
    display: grid;
    gap: 0.2rem;
    padding: 0.9rem 1rem 1.1rem;
  }

  .text p {
    margin: 0;
  }

  .name {
    font-family: var(--display);
    font-weight: var(--display-weight);
    font-size: 1.35rem;
    line-height: 1.15;
    color: var(--ink);
  }

  .price,
  .description {
    color: var(--ink-soft);
    font-size: 0.95rem;
  }

  .buy {
    margin: 0.5rem 0 0;
  }
</style>
