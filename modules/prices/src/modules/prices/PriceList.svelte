<script lang="ts">
  // The price list, grouped by category in the order they first appear. A
  // group with any photos shows as cards (items without a photo are text-only
  // cards); one without is a plain list. "Ask us" is said once: above the
  // list when nothing has a price, under a group's heading when only that
  // group has none, and on an item only beside priced ones. A plain group of
  // just names (occasions, services) shows them as a row of tags.
  import type { Picture as PictureData } from '../../lib/images';
  import Picture from '../../components/Picture.svelte';

  interface Item {
    id: string;
    name: string;
    description?: string;
    category?: string;
    /** The price as shown, e.g. 'From $120', or '' for none (see priceText in prices.ts). */
    price: string;
    image: PictureData | null;
  }
  let { items, askText = 'Ask us', footnote = '' }: { items: Item[]; askText?: string; footnote?: string } = $props();

  const groups = $derived.by(() => {
    const map = new Map<string, Item[]>();
    for (const item of items) map.set(item.category ?? '', [...(map.get(item.category ?? '') ?? []), item]);
    return [...map].map(([category, list]) => ({
      category,
      list,
      priced: list.some((item) => item.price),
      cards: list.some((item) => item.image),
      tags: !list.some((item) => item.price || item.image || item.description),
    }));
  });
  const anyPriced = $derived(items.some((item) => item.price));
  /** An item's price, or "Ask us" when its group has other prices. */
  const shown = (item: Item, priced: boolean) => item.price || (priced ? askText : '');
</script>

{#if !anyPriced}<p class="ask">{askText}</p>{/if}
<div class="groups">
  {#each groups as { category, list, priced, cards, tags } (category)}
    <div class="group">
      {#if category}<h3>{category}</h3>{/if}
      {#if anyPriced && !priced}<p class="ask">{askText}</p>{/if}
      {#if tags}
        <ul class="tags">
          {#each list as item (item.id)}<li>{item.name}</li>{/each}
        </ul>
      {:else if cards}
        <ul class="cards">
          {#each list as item (item.id)}
            <li class="card">
              {#if item.image}<Picture image={item.image} />{/if}
              <div class="card-text">
                <p class="name">{item.name}</p>
                {#if shown(item, priced)}<p class="price">{shown(item, priced)}</p>{/if}
                {#if item.description}<p class="description">{item.description}</p>{/if}
              </div>
            </li>
          {/each}
        </ul>
      {:else}
        <ul class="list">
          {#each list as item (item.id)}
            <li class="item">
              <div class="line">
                <span class="name">{item.name}</span>
                {#if shown(item, priced)}
                  <span class="dots" aria-hidden="true"></span>
                  <span class="price">{shown(item, priced)}</span>
                {/if}
              </div>
              {#if item.description}<p class="description">{item.description}</p>{/if}
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {/each}
</div>
{#if footnote}<p class="footnote">{footnote}</p>{/if}

<style>
  .groups {
    display: grid;
    gap: 2.5rem;
  }

  .group h3 {
    font-size: 1.5rem;
    margin-bottom: 0.9rem;
  }

  .group .ask {
    margin-top: -0.5rem;
  }

  .ask {
    margin: 0 0 0.9rem;
    font-weight: 700;
    color: var(--accent);
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    max-width: 44rem;
  }

  .tags li {
    border: 2px solid var(--ink);
    border-radius: 999px;
    padding: 0.35rem 0.9rem;
    background: var(--paper);
    font-weight: 600;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
    gap: 1.5rem;
  }

  .card {
    display: flex;
    flex-direction: column;
    border: 2px solid var(--ink);
    border-radius: 1rem;
    overflow: hidden;
    background: var(--paper);
    box-shadow: 6px 6px 0 var(--highlight);
  }

  .card :global(img) {
    display: block;
    width: 100%;
    height: auto;
    aspect-ratio: 4 / 3;
    object-fit: cover;
  }

  .card-text {
    display: grid;
    align-content: start;
    gap: 0.3rem;
    padding: 1rem 1.1rem 1.2rem;
  }

  .card-text p {
    margin: 0;
  }

  .name {
    font-weight: 700;
  }

  .card .name {
    font-family: var(--display);
    font-weight: var(--display-weight);
    font-size: 1.3rem;
    line-height: 1.15;
  }

  .price {
    font-weight: 700;
    color: var(--accent);
    font-variant-numeric: tabular-nums;
  }

  .description {
    margin: 0;
    color: var(--ink-soft);
  }

  .list {
    max-width: 44rem;
    border-top: 2px solid var(--ink);
  }

  .item {
    display: grid;
    gap: 0.25rem;
    padding-block: 0.9rem;
    border-bottom: 1.5px dashed var(--rule);
  }

  .line {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.25rem 0.5rem;
  }

  .dots {
    flex: 1;
    min-width: 1.5rem;
    border-bottom: 2px dotted var(--rule);
    transform: translateY(-0.25rem);
  }

  .list .price {
    color: var(--ink);
  }

  .footnote {
    margin: 1.5rem 0 0;
    color: var(--ink-soft);
    font-size: 0.95rem;
  }
</style>
