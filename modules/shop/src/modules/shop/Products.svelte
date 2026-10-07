<script lang="ts">
  // Product cards, each with a "Buy" button to its Stripe payment link.
  import type { Picture as PictureData } from '../../lib/images';
  import Picture from '../../components/Picture.svelte';
  import BuyButton from '../../components/BuyButton.svelte';

  interface Item {
    id: string;
    name: string;
    description: string;
    price: string;
    link: string;
    soldOut: boolean;
    image: PictureData | null;
  }
  let { items, footnote = '' }: { items: Item[]; footnote?: string } = $props();
</script>

<ul class="products">
  {#each items as item (item.id)}
    <li class:sold-out={item.soldOut}>
      {#if item.image}<Picture image={item.image} />{/if}
      <div class="text">
        <h3>{item.name}</h3>
        <p class="price">{item.price}</p>
        {#if item.description}<p class="description">{item.description}</p>{/if}
        {#if item.soldOut}
          <p class="out">Sold out for now</p>
        {:else if item.link}
          <BuyButton href={item.link} name={item.name} />
        {:else}
          <a class="button" href="#enquire">Ask us<span class="visually-hidden"> about {item.name}</span></a>
        {/if}
      </div>
    </li>
  {/each}
</ul>
{#if footnote}<p class="footnote">{footnote}</p>{/if}

<style>
  .products {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
    gap: 1.5rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li {
    display: flex;
    flex-direction: column;
    border: var(--frame);
    border-radius: 1rem;
    overflow: hidden;
    background: var(--paper);
    box-shadow: var(--lift);
  }
  li :global(img) {
    display: block;
    width: 100%;
    height: auto;
    aspect-ratio: 1;
    object-fit: cover;
  }
  .text {
    display: grid;
    align-content: start;
    gap: 0.4rem;
    flex: 1;
    padding: 1.1rem 1.2rem 1.3rem;
  }
  .text p,
  h3 {
    margin: 0;
  }
  h3 {
    font-size: 1.35rem;
  }
  .price {
    font-weight: 700;
    color: var(--accent);
    font-size: 1.15rem;
  }
  .description {
    color: var(--ink-soft);
  }
  .text .button {
    justify-self: start;
    margin-top: 0.6rem;
  }
  .out {
    margin-top: 0.6rem !important;
    font-weight: 700;
    color: var(--ink-soft);
  }
  .sold-out :global(img) {
    opacity: 0.55;
  }
  .footnote {
    margin: 1.5rem 0 0;
    color: var(--ink-soft);
    font-size: 0.95rem;
  }
</style>
