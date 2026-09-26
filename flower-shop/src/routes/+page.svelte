<script lang="ts">
  import ProductCard from '$lib/ProductCard.svelte';
  import { categories, products, type Category, FREE_DELIVERY_FROM } from '$lib/products';

  let chosen = $state<Category | 'all'>('all');

  const shown = $derived(chosen === 'all' ? products : products.filter((p) => p.category === chosen));
</script>

<svelte:head>
  <title>Stem &amp; Loam Shop</title>
  <meta name="description" content="Order seasonal flowers from Stem & Loam, delivered across central Auckland." />
</svelte:head>

<section class="intro">
  <p class="kicker">Order online</p>
  <h1>Seasonal flowers, delivered <em>on Thursday</em></h1>
  <p class="lede">
    Choose a bunch, add a card message, and we'll deliver across central Auckland or have it ready
    to collect. Free delivery on orders over ${FREE_DELIVERY_FROM}.
  </p>
</section>

<div class="filters" role="group" aria-label="Filter products">
  {#each categories as category (category.id)}
    <button
      type="button"
      class:active={chosen === category.id}
      aria-pressed={chosen === category.id}
      onclick={() => (chosen = category.id)}
    >
      {category.label}
    </button>
  {/each}
</div>

<ul class="grid">
  {#each shown as product (product.slug)}
    <li><ProductCard {product} /></li>
  {/each}
</ul>

<style>
  .intro {
    max-width: 42rem;
    padding-block: clamp(1.5rem, 5vw, 3rem) 2rem;
  }

  h1 {
    font-size: clamp(2.4rem, 5.5vw, 4rem);
    font-weight: 350;
    margin-block: 0.4rem 1rem;
  }

  h1 em {
    font-family: var(--script);
    font-style: normal;
    font-size: 1.2em;
    color: var(--peony);
  }

  .lede {
    color: var(--ink-soft);
    font-size: 1.12rem;
    margin: 0;
    max-width: 52ch;
  }

  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    margin-bottom: 2.25rem;
  }

  .filters button {
    border: 1px solid var(--rule);
    background: var(--paper-raised);
    border-radius: 999px;
    padding: 0.45rem 1.1rem;
    cursor: pointer;
    color: var(--ink-soft);
  }

  .filters button.active {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
  }

  .grid {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr));
    gap: 2.75rem 1.75rem;
  }
</style>
