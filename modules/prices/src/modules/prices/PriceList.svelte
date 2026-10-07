<script lang="ts">
  // The price list, with its heading, in one of four layouts (section.layout
  // in prices.json):
  // - cards: grouped by category; a group with photos shows as cards, one
  //   without as a plain list, one of just names as tags. "Ask us" is said
  //   once: above the list when nothing has a price, under a group's heading
  //   when only that group has none, and on an item only beside priced ones.
  // - carousel: every item from the groups with photos in one row that swipes
  //   sideways (arrows beside the heading); other groups follow as usual.
  // - tabs: a tab per group, showing its photo and its list.
  // - rows: a big photo beside each group, alternating sides.
  import Picture from '../../components/Picture.svelte';
  import SectionHead from '../../components/SectionHead.svelte';
  import BuyButton from '../../components/BuyButton.svelte';
  import PriceCarousel from './PriceCarousel.svelte';
  import PriceTabs from './PriceTabs.svelte';
  import PriceRows from './PriceRows.svelte';
  import { groupItems, type Layout, type ShownItem } from './shown';

  let {
    items,
    head,
    askText = 'Ask us',
    footnote = '',
    layout = 'cards',
  }: { items: ShownItem[]; head: { note: string; title: string; intro: string }; askText?: string; footnote?: string; layout?: Layout } = $props();

  const groups = $derived(groupItems(items));
  // The carousel takes the groups with photos; the rest show as usual below it.
  const rest = $derived(layout === 'carousel' ? groups.filter((group) => !group.cards) : groups);
  const anyPriced = $derived(items.some((item) => item.price));
  /**
   * On phones cards sit two to a row, and the last photo card takes the whole
   * row when there's an odd one out, so no row is left with a gap. (An item
   * without a photo is always a short card across the row, never a blank box.)
   */
  const wide = (list: ShownItem[], item: ShownItem) => {
    const photos = list.filter((each) => each.image);
    return photos.length % 2 === 1 && photos.at(-1) === item;
  };
  /** An item's price, or "Ask us" when its group has other prices. */
  const shown = (item: ShownItem, priced: boolean) => item.price || (priced ? askText : '');
</script>

{#snippet heading()}<SectionHead note={head.note} title={head.title} intro={head.intro} />{/snippet}

{#if layout === 'carousel'}
  <PriceCarousel items={groups.filter((group) => group.cards).flatMap((group) => group.list)} {askText} head={heading} />
{:else}
  {@render heading()}
{/if}

{#if layout === 'tabs'}
  <PriceTabs {groups} {askText} />
{:else if layout === 'rows'}
  <PriceRows {groups} {askText} />
{:else}
{#if !anyPriced && layout === 'cards'}<p class="ask">{askText}</p>{/if}
<div class="groups" class:after-carousel={layout === 'carousel'}>
  {#each rest as { category, list, priced, cards, tags } (category)}
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
            <li class="card" class:wide={wide(list, item)} class:no-photo={!item.image}>
              {#if item.image}<Picture image={item.image} />{/if}
              <div class="card-text">
                <p class="name">{item.name}</p>
                {#if shown(item, priced)}<p class="price">{shown(item, priced)}</p>{/if}
                {#if item.description}<p class="description">{item.description}</p>{/if}
                {#if item.link}<p class="buy"><BuyButton href={item.link} name={item.name} /></p>{/if}
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
                {#if item.link}<BuyButton href={item.link} name={item.name} small />{/if}
              </div>
              {#if item.description}<p class="description">{item.description}</p>{/if}
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {/each}
</div>
{/if}
{#if footnote}<p class="footnote">{footnote}</p>{/if}

<style>
  .groups {
    display: grid;
    gap: 2.5rem;
  }

  .after-carousel {
    margin-top: 2.5rem;
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
    border: var(--frame);
    border-radius: var(--button-radius);
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
    border: var(--frame);
    border-radius: var(--radius);
    overflow: hidden;
    background: var(--paper);
    box-shadow: var(--lift);
  }

  .card.no-photo {
    grid-column: 1 / -1;
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

  .card-text .buy {
    margin-top: 0.5rem;
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

  /* Phones: two cards a row with smaller type, so photos don't fill the screen one by one. */
  @media (max-width: 40rem) {
    .cards {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.75rem;
    }
    .card {
      border-radius: var(--radius-s);
      box-shadow: var(--lift-s);
    }
    .card.wide {
      grid-column: 1 / -1;
    }
    .card.wide :global(img) {
      aspect-ratio: 2 / 1;
    }
    .card-text {
      padding: 0.6rem 0.75rem 0.75rem;
    }
    .card .name {
      font-size: 1.05rem;
    }
    .card .description {
      font-size: 0.9rem;
    }
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
