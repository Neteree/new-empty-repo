<script lang="ts">
  import { resolve } from '$app/paths';
  import Bloom from './Bloom.svelte';
  import type { Product } from './products';

  let { product }: { product: Product } = $props();

  const fromPrice = $derived(Math.min(...product.options.map((option) => option.price)));
</script>

<a class="card" href={resolve('/product/[slug]', { slug: product.slug })}>
  <div class="arch">
    <Bloom stem petals={product.bloom.petals} petal={product.bloom.petal} centre={product.bloom.centre} />
  </div>
  <h3>{product.name}</h3>
  <p class="blurb">{product.blurb}</p>
  <p class="tag"><span class="price">${fromPrice}</span><span>{product.options.length > 1 ? 'and up' : ''}</span></p>
</a>

<style>
  .card {
    display: block;
    text-decoration: none;
  }

  .arch {
    background: var(--grain), var(--blush);
    border-radius: 999px 999px 1rem 1rem;
    aspect-ratio: 3 / 4;
    max-width: 100%;
    display: grid;
    place-items: center;
    padding: 1.75rem 1.5rem 0.75rem;
    margin-bottom: 1rem;
    overflow: hidden;
  }

  .arch :global(.bloom) {
    width: auto;
    height: 100%;
    transition: transform 0.6s ease;
  }

  .card:hover .arch :global(.bloom) {
    transform: rotate(-4deg);
  }

  h3 {
    font-size: 1.5rem;
  }

  .card:hover h3 {
    color: var(--peony);
  }

  .blurb {
    margin: 0.2rem 0 0.8rem;
    color: var(--ink-soft);
    font-size: 0.97rem;
  }

  .tag {
    display: inline-flex;
    align-items: baseline;
    gap: 0.45rem;
    margin: 0;
    padding: 0.3rem 0.9rem 0.3rem 1.4rem;
    background: var(--grain), var(--kraft);
    color: var(--tag-ink);
    clip-path: polygon(0.7rem 0, 100% 0, 100% 100%, 0.7rem 100%, 0 50%);
    transform: rotate(-2deg);
    font-size: 0.85rem;
    white-space: nowrap;
  }

  .price {
    font-family: var(--script);
    font-size: 1.8rem;
    line-height: 1;
  }
</style>
