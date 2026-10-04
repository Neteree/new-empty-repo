<script lang="ts">
  // The plain menu (no pre-ordering), grouped by each item's category in the
  // order they first appear; items without one go first.
  import type { Bake } from './menu';
  import { moneyFor } from '../../lib/money';

  let { items }: { items: Bake[] } = $props();

  const money = $derived(moneyFor(items.map((item) => item.price)));
  const tagLabel = { vegan: 'Vegan', 'gluten-free': 'Gluten-free' };

  const groups = $derived.by(() => {
    const map = new Map<string, Bake[]>();
    for (const item of items) map.set(item.category ?? '', [...(map.get(item.category ?? '') ?? []), item]);
    return [...map];
  });
</script>

<div class="menu">
  {#each groups as [category, list] (category)}
    <div class="group">
      {#if category}<h3>{category}</h3>{/if}
      <ul>
        {#each list as item (item.id)}
          <li class={['item', { 'sold-out': item.soldOut?.length }]}>
            <div class="line">
              <span class="name">{item.name}</span>
              <span class="dots" aria-hidden="true"></span>
              <span class="price">{money(item.price)}</span>
            </div>
            <p class="description">{item.description}</p>
            {#if item.tags.length > 0 || item.soldOut?.length}
              <p class="tags">
                {#each item.tags as tag (tag)}<span class="tag">{tagLabel[tag]}</span>{/each}
                {#if item.soldOut?.length}<span class="tag out">Sold out</span>{/if}
              </p>
            {/if}
          </li>
        {/each}
      </ul>
    </div>
  {/each}
</div>

<style>
  .menu {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
    gap: 2rem 3rem;
  }

  .group h3 {
    font-size: 1.5rem;
    margin-bottom: 0.75rem;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
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
    align-items: baseline;
    gap: 0.5rem;
  }

  .name {
    font-weight: 700;
  }

  .dots {
    flex: 1;
    border-bottom: 2px dotted var(--rule);
    transform: translateY(-0.25rem);
  }

  .price {
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .description {
    margin: 0;
    color: var(--ink-soft);
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin: 0.2rem 0 0;
  }

  .tag {
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.05rem 0.5rem;
    border-radius: 999px;
    background: var(--highlight);
    color: var(--on-highlight);
  }

  .tag.out {
    background: none;
    border: 1px solid var(--ink-soft);
    color: var(--ink-soft);
  }

  .sold-out .name,
  .sold-out .price {
    color: var(--ink-soft);
  }
</style>
