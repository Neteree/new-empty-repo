<script lang="ts">
  // Price list as tabs: one per group, showing the group's photo beside its
  // list. lib/tabs.ts switches them; without it every group shows in turn.
  import Picture from '../../components/Picture.svelte';
  import type { Group } from './shown';

  let { groups, askText }: { groups: Group[]; askText: string } = $props();
</script>

<div class="tabs" data-tabs>
  <div class="bar" role="tablist" aria-label="Groups" hidden>
    {#each groups as group, i (group.category)}
      <button type="button" role="tab" id={`price-tab-${i}`} aria-controls={`price-panel-${i}`} aria-selected={i === 0}>{group.category || 'Prices'}</button>
    {/each}
  </div>
  {#each groups as group, i (group.category)}
    <div class="panel" class:no-photo={!group.photo} role="tabpanel" id={`price-panel-${i}`} aria-labelledby={`price-tab-${i}`}>
      <h3 class="panel-title">{group.category}</h3>
      {#if group.photo}<Picture image={group.photo} />{/if}
      <ul>
        {#each group.list as item (item.id)}
          <li><span>{item.name}</span><em>{item.price || askText}</em></li>
        {/each}
      </ul>
    </div>
  {/each}
</div>

<style>
  .tabs {
    display: grid;
    gap: 1.5rem;
  }

  .bar {
    display: flex;
    overflow-x: auto;
    border-bottom: 1px solid var(--rule);
  }

  .bar[hidden] {
    display: none;
  }

  .bar button {
    background: none;
    border: 0;
    border-bottom: 2px solid transparent;
    padding: 0.7rem 1rem;
    color: var(--ink-soft);
    font: inherit;
    white-space: nowrap;
    cursor: pointer;
  }

  .bar button[aria-selected='true'] {
    color: var(--ink);
    border-bottom-color: var(--accent);
  }

  .panel {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 1.5rem 2rem;
    align-items: center;
  }

  .panel[hidden] {
    display: none;
  }

  .panel.no-photo {
    grid-template-columns: minmax(0, 1fr);
    max-width: 36rem;
  }

  .panel-title {
    grid-column: 1 / -1;
    font-size: 1.5rem;
  }

  :global([data-tabs-ready]) .panel-title {
    display: none;
  }

  .panel :global(img) {
    display: block;
    width: 100%;
    height: auto;
    aspect-ratio: 4 / 3;
    object-fit: cover;
    border-radius: var(--radius);
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  li {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--rule);
    color: var(--ink);
  }

  em {
    font-style: normal;
    color: var(--accent);
    font-size: 0.95rem;
    text-align: right;
  }

  @media (max-width: 40rem) {
    .panel {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
