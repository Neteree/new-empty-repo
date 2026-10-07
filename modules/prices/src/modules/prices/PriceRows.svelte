<script lang="ts">
  // Price list as magazine rows: each group's photo beside its name and list,
  // alternating sides. A group without a photo is a row of text only.
  import Picture from '../../components/Picture.svelte';
  import BuyButton from '../../components/BuyButton.svelte';
  import type { Group } from './shown';

  let { groups, askText }: { groups: Group[]; askText: string } = $props();
</script>

<div class="rows">
  {#each groups as group (group.category)}
    <div class="row" class:no-photo={!group.photo}>
      {#if group.photo}<Picture image={group.photo} />{/if}
      <div class="text">
        {#if group.category}<h3>{group.category}</h3>{/if}
        <ul>
          {#each group.list as item (item.id)}
            <li><span>{item.name}</span>{#if item.price || group.priced}<em>{item.price || askText}</em>{/if}{#if item.link}<BuyButton href={item.link} name={item.name} small />{/if}</li>
          {/each}
        </ul>
        {#if !group.priced}<p class="ask">{askText}</p>{/if}
      </div>
    </div>
  {/each}
</div>

<style>
  .rows {
    display: grid;
    border: var(--frame);
    border-radius: var(--radius);
    overflow: hidden;
  }

  .row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    align-items: center;
  }

  .row + .row {
    border-top: var(--frame);
  }

  .row:nth-child(even) :global(img) {
    order: 2;
  }

  .row.no-photo {
    grid-template-columns: minmax(0, 1fr);
  }

  .row :global(img) {
    display: block;
    width: 100%;
    height: 100%;
    min-height: 16rem;
    aspect-ratio: 16 / 10;
    object-fit: cover;
  }

  .text {
    display: grid;
    gap: 0.75rem;
    padding: clamp(1.25rem, 4vw, 2.5rem);
  }

  h3 {
    font-size: clamp(1.5rem, 3vw, 2rem);
    margin: 0;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem 1.25rem;
  }

  li {
    display: flex;
    gap: 0.5rem;
    color: var(--ink-soft);
  }

  em {
    font-style: normal;
    color: var(--accent);
  }

  .ask {
    margin: 0;
    color: var(--accent);
    font-weight: 600;
  }

  @media (max-width: 40rem) {
    .row {
      grid-template-columns: minmax(0, 1fr);
    }
    .row:nth-child(even) :global(img) {
      order: 0;
    }
    .row :global(img) {
      min-height: 0;
    }
  }
</style>
