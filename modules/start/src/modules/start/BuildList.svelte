<script lang="ts">
  // The "Build your site" list: tick what you want, see its price, fill in
  // what you can now (or later), and "Something else?" for anything that
  // isn't listed yet. Used by the new-website form and the change form, so
  // both work the same way. A form can give its own questions for an item
  // (`bodies`, by item id); list sections (reviews, questions…) ask for their
  // fields from their descriptions. On the change form, ticking what the site
  // already has (`owned`) starts its changes (`changeBody`). Only the box
  // ticks or unticks; the rest of the row opens and closes it. A search box
  // narrows the list (by name,
  // description and any `keywords`, such as the changes an item has). With
  // `tabs`, each group is a tab instead of a heading.
  import type { Snippet } from 'svelte';
  import { type Build, type Item, blankRow, listDef, textFields } from './build';

  let {
    groups,
    build = $bindable(),
    priceText,
    bodies = {},
    id = 'b',
    owned = () => false,
    changeBody,
    onchange = () => {},
    onclear = () => {},
    keywords = () => '',
    tabs = false,
    tab = $bindable(0),
  }: {
    groups: { title?: string; items: Item[] }[];
    build: Build;
    priceText: (item: Item) => string;
    bodies?: Partial<Record<string, Snippet>>;
    id?: string;
    owned?: (item: Item) => boolean;
    changeBody?: Snippet<[Item]>;
    onchange?: (item: Item) => void;
    onclear?: (item: Item) => void;
    keywords?: (item: Item) => string;
    tabs?: boolean;
    tab?: number;
  } = $props();

  let query = $state('');
  const words = $derived(query.toLowerCase().split(/\s+/).filter(Boolean));
  const matches = (item: Item) => {
    const text = `${item.label} ${item.text} ${keywords(item)}`.toLowerCase();
    return words.every((word) => text.includes(word));
  };
  const filtered = $derived(groups.map((group) => ({ ...group, items: group.items.filter(matches) })));
  const shown = $derived(tabs ? [filtered[tab] ?? filtered[0]] : filtered);
  /** How many things are picked or changed in a group (shown on its tab). */
  const picked = (group: { items: Item[] }) => group.items.filter((item) => build.chosen[item.id]).length;
  function moveTab(event: KeyboardEvent) {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    tab = (tab + step + groups.length) % groups.length;
    (document.getElementById(`${id}-tab-${tab}`) as HTMLElement | null)?.focus();
  }

  /** Opens an item's questions (a list section starts with one empty row). */
  function openItem(item: Item) {
    const def = listDef(item);
    if (def && !build.rows[item.id]?.length) build.rows[item.id] = [blankRow(def)];
    build.open = item.id;
  }
  function toggle(item: Item) {
    if (item.locked) return;
    const on = (build.chosen[item.id] = !build.chosen[item.id]);
    if (owned(item) && changeBody) (on ? onchange : onclear)(item);
    if (on) openItem(item);
  }
</script>

<div class="search">
  <label for="{id}-search">Find something</label>
  <input id="{id}-search" type="search" placeholder="Like hours, prices or reviews" bind:value={query} />
</div>
{#if tabs}
  <div class="tabs" role="tablist" tabindex="-1" onkeydown={moveTab}>
    {#each groups as group, g (g)}
      {@const count = picked(group)}
      <button type="button" role="tab" id="{id}-tab-{g}" aria-selected={tab === g} aria-controls="{id}-panel" tabindex={tab === g ? 0 : -1} onclick={() => (tab = g)}>
        {group.title}{#if count}<span class="count">{count}</span>{/if}
      </button>
    {/each}
  </div>
{/if}
<div class="panel" id="{id}-panel" role={tabs ? 'tabpanel' : undefined} aria-labelledby={tabs ? `${id}-tab-${tab}` : undefined}>
{#if shown.every((group) => !group.items.length)}
  {@const elsewhere = tabs ? filtered.map((group, g) => ({ ...group, g })).filter((group) => group.g !== tab && group.items.length) : []}
  {#if elsewhere.length}
    {#each elsewhere as other (other.g)}
      <p class="hint">Not here, but {other.items.length} under <button class="later" type="button" onclick={() => (tab = other.g)}>{other.title}</button>.</p>
    {/each}
  {:else}
    <p class="hint">Nothing matches “{query.trim()}”. Tell me about it under “Something else?” below.</p>
  {/if}
{/if}
{#each shown as group, g (g)}
  {#if group.items.length && group.title && !tabs}<h3 class="group">{group.title}</h3>{/if}
  {#if group.items.length}
  <ul class="items">
    {#each group.items as item (item.id)}
      {@const def = listDef(item)}
      {@const own = bodies[item.id]}
      {@const changing = owned(item) && changeBody}
      {@const open = build.open === item.id}
      <li class="item" class:on={build.chosen[item.id]}>
        <div class="item-head">
          <input type="checkbox" aria-label={item.label} checked={build.chosen[item.id]} disabled={item.locked} onchange={() => toggle(item)} />
          {#if item.locked}
            <span class="item-row">
              <span class="item-name">{item.label}<span class="item-text">{item.text}</span></span>
              <span class="item-price">{priceText(item)}</span>
            </span>
          {:else}
            <button type="button" class="item-row" aria-expanded={open} onclick={() => (open ? (build.open = '') : openItem(item))}>
              <span class="item-name">{item.label}<span class="item-text">{item.text}</span></span>
              <span class="item-price">{priceText(item)}<span class="chevron" aria-hidden="true"></span></span>
            </button>
          {/if}
        </div>
        {#if open}
          <div class="item-body">
            {#if !build.chosen[item.id]}
              <p class="hint">Tick the box to {changing ? 'choose what to change' : 'include it'}.</p>
            {/if}
            {#if changing}
              {#if build.chosen[item.id]}{@render changeBody(item)}{/if}
            {:else if own}
              {@render own()}
            {:else if def}
              {#each build.rows[item.id] ?? [] as row, r (r)}
                <div class="row">
                  {#each textFields(def) as [name, f] (name)}
                    <div class="field">
                      <label for="{id}-{item.id}-{r}-{name}">{f.label}</label>
                      <input id="{id}-{item.id}-{r}-{name}" placeholder={f.example ?? ''} bind:value={row[name]} />
                    </div>
                  {/each}
                </div>
              {/each}
              <button class="small" type="button" onclick={() => build.rows[item.id].push(blankRow(def))}>Add another {def.noun}</button>
            {:else if item.id === 'work'}
              <p class="hint">Send photos of a few past jobs after this, with a line about each, or add them later.</p>
            {:else if item.id === 'menu'}
              <label class="tick"><input type="checkbox" bind:checked={build.preOrder} /> Customers can order ahead for pickup</label>
              <p class="hint">I’ll ask for your menu after this.</p>
            {:else if item.id === 'prices' || item.id === 'shop'}
              <p class="hint">I’ll ask for your {item.id === 'shop' ? 'products' : 'prices'} after this.</p>
            {:else if item.id === 'booking'}
              <label class="tick"><input type="radio" name="{id}-booking" value={false} bind:group={build.quote} /> Bookings: customers ask for a day and time</label>
              <label class="tick"><input type="radio" name="{id}-booking" value={true} bind:group={build.quote} /> Quotes: customers describe a job and you price it</label>
            {:else if item.id === 'page'}
              <div class="field"><label for="{id}-page">What goes on it?</label><textarea id="{id}-page" rows="2" bind:value={build.pageText}></textarea></div>
            {:else}
              <p class="hint">Nothing to fill in now.</p>
            {/if}
            <button class="later" type="button" onclick={() => (build.open = '')}>Done</button>
          </div>
        {/if}
      </li>
    {/each}
  </ul>
  {/if}
{/each}
</div>
<div class="item custom" class:on={!!build.custom.trim()}>
  <label for="{id}-custom" class="item-head"><span class="item-name">Something else?<span class="item-text">Anything that isn’t listed, even a game. I’ll quote it.</span></span><span class="item-price">Quoted</span></label>
  <textarea id="{id}-custom" rows="2" bind:value={build.custom}></textarea>
</div>

<style>
  .group {
    font-size: 0.85rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--ink-soft);
    margin-top: 0.4rem;
  }
  .items {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.6rem;
  }
  .item {
    border: 2px solid var(--rule);
    border-radius: 0.8rem;
    padding: 0.8rem 0.9rem;
    display: grid;
    gap: 0.6rem;
    transition: border-color 0.15s;
  }
  .item.on {
    border-color: var(--accent);
  }
  /* The box ticks; the rest of the row opens and closes it. */
  .item-head {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.8rem;
    align-items: start;
    font-weight: 700;
  }
  .custom .item-head {
    grid-template-columns: 1fr auto;
  }
  .item-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 0.7rem;
    align-items: start;
    width: 100%;
    border: 0;
    background: none;
    padding: 0;
    color: inherit;
    font: inherit;
    font-weight: 700;
    text-align: left;
    cursor: pointer;
  }
  span.item-row {
    cursor: default;
  }
  .chevron {
    display: inline-block;
    width: 0.5rem;
    height: 0.5rem;
    margin-left: 0.6rem;
    border-right: 2px solid currentColor;
    border-bottom: 2px solid currentColor;
    transform: translateY(-0.2rem) rotate(45deg);
    transition: transform 0.15s;
  }
  [aria-expanded='true'] .chevron {
    transform: translateY(0.05rem) rotate(-135deg);
  }
  .tabs {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: 1fr;
    gap: 0.3rem;
    padding: 0.3rem;
    border: 2px solid var(--rule);
    border-radius: 0.8rem;
  }
  [role='tab'] {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    border: 0;
    border-radius: 0.55rem;
    background: none;
    padding: 0.6rem 0.5rem;
    color: inherit;
    font: inherit;
    font-weight: 700;
    cursor: pointer;
  }
  [role='tab'][aria-selected='true'] {
    background: var(--accent);
    color: var(--paper);
  }
  .count {
    min-width: 1.4rem;
    border-radius: 1rem;
    padding: 0 0.35rem;
    background: var(--accent);
    color: var(--paper);
    font-size: 0.8rem;
  }
  [aria-selected='true'] .count {
    background: var(--paper);
    color: var(--ink);
  }
  .panel {
    display: grid;
    gap: 0.6rem;
  }
  .search {
    display: grid;
    gap: 0.35rem;
  }
  .search label {
    font-weight: 700;
  }
  .item-head input {
    width: 1.4rem;
    height: 1.4rem;
    margin-top: 0.05rem;
    cursor: pointer;
    accent-color: var(--accent);
  }
  .item-name {
    display: grid;
    gap: 0.1rem;
  }
  .item-text {
    font-weight: 400;
    font-size: 0.9rem;
    color: var(--ink-soft);
  }
  .item-price {
    white-space: nowrap;
  }
  .item-body {
    display: grid;
    gap: 0.9rem;
    padding-top: 0.6rem;
    border-top: 1.5px dashed var(--rule);
  }
  .row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
    gap: 1rem;
  }
  .field {
    display: grid;
    gap: 0.35rem;
  }
  .field label {
    font-weight: 700;
  }
  .hint {
    margin: 0;
    font-size: 0.92rem;
    color: var(--ink-soft);
  }
  input:not([type='checkbox']):not([type='radio']),
  textarea {
    width: 100%;
    border: 2px solid var(--ink);
    border-radius: 0.5rem;
    background: var(--paper);
    padding: 0.6rem 0.75rem;
  }
  .tick {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
  }
  .later,
  .small {
    justify-self: start;
    border: none;
    background: none;
    padding: 0;
    font-weight: 700;
    color: var(--accent);
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }
</style>
