<script lang="ts">
  // The "Build your site" list: tick what you want, see its price, fill in
  // what you can now (or later), and "Something else?" for anything that
  // isn't listed yet. Used by the new-website form and the change form, so
  // both work the same way. A form can give its own questions for an item
  // (`bodies`, by item id); list sections (reviews, questions…) ask for their
  // fields from their descriptions. On the change form, what the site already
  // has (`owned`) opens its changes (`changeBody`) instead of a tick: tap the
  // row to open or close it. A search box narrows the list (by name,
  // description and any `keywords`, such as the changes an item has).
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
    busy = () => false,
    keywords = () => '',
  }: {
    groups: { title?: string; items: Item[] }[];
    build: Build;
    priceText: (item: Item) => string;
    bodies?: Partial<Record<string, Snippet>>;
    id?: string;
    owned?: (item: Item) => boolean;
    changeBody?: Snippet<[Item]>;
    onchange?: (item: Item) => void;
    busy?: (item: Item) => boolean;
    keywords?: (item: Item) => string;
  } = $props();

  let query = $state('');
  const words = $derived(query.toLowerCase().split(/\s+/).filter(Boolean));
  const matches = (item: Item) => {
    const text = `${item.label} ${item.text} ${keywords(item)}`.toLowerCase();
    return words.every((word) => text.includes(word));
  };
  const shown = $derived(groups.map((group) => ({ ...group, items: group.items.filter(matches) })));

  function openChanges(item: Item) {
    if (build.open === item.id) build.open = '';
    else {
      onchange(item);
      build.open = item.id;
    }
  }

  /** Opens an item's questions (a list section starts with one empty row). */
  function openItem(item: Item) {
    const def = listDef(item);
    if (def && !build.rows[item.id]?.length) build.rows[item.id] = [blankRow(def)];
    build.open = item.id;
  }
  function toggle(item: Item) {
    if (item.locked) return;
    build.chosen[item.id] = !build.chosen[item.id];
    if (build.chosen[item.id]) openItem(item);
    else if (build.open === item.id) build.open = '';
  }
</script>

<div class="search">
  <label for="{id}-search">Find something</label>
  <input id="{id}-search" type="search" placeholder="Like hours, prices or reviews" bind:value={query} />
</div>
{#if shown.every((group) => !group.items.length)}
  <p class="hint">Nothing matches “{query.trim()}”. Tell me about it under “Something else?” below.</p>
{/if}
{#each shown as group, g (g)}
  {#if group.items.length && group.title}<h3 class="group">{group.title}</h3>{/if}
  {#if group.items.length}
  <ul class="items">
    {#each group.items as item (item.id)}
      {@const def = listDef(item)}
      {@const own = bodies[item.id]}
      {#if owned(item) && changeBody}
        <li class="item" class:on={busy(item)}>
          <button type="button" class="item-head has" aria-expanded={build.open === item.id} onclick={() => openChanges(item)}>
            <span class="item-name">{item.label}<span class="item-text">{busy(item) && build.open !== item.id ? 'Your changes are saved. Tap to see them.' : item.text}</span></span>
            <span class="item-price">{priceText(item)}<span class="chevron" aria-hidden="true"></span></span>
          </button>
          {#if build.open === item.id}
            <div class="item-body">
              {@render changeBody(item)}
              <button class="later" type="button" onclick={() => (build.open = '')}>Done</button>
            </div>
          {/if}
        </li>
      {:else}
        <li class="item" class:on={build.chosen[item.id]}>
          <label class="item-head">
            <input type="checkbox" checked={build.chosen[item.id]} disabled={item.locked} onchange={() => toggle(item)} />
            <span class="item-name">{item.label}<span class="item-text">{item.text}</span></span>
            <span class="item-price">{priceText(item)}</span>
          </label>
          {#if build.chosen[item.id] && !item.locked}
            {#if build.open === item.id}
              <div class="item-body">
                {#if own}
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
                <button class="later" type="button" onclick={() => (build.open = '')}>Done, or add later</button>
              </div>
            {:else}
              <button class="later" type="button" onclick={() => openItem(item)}>Fill in now</button>
            {/if}
          {/if}
        </li>
      {/if}
    {/each}
  </ul>
  {/if}
{/each}
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
  .item-head {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 0.7rem;
    align-items: start;
    font-weight: 700;
    cursor: pointer;
  }
  .custom .item-head {
    grid-template-columns: 1fr auto;
    cursor: default;
  }
  /* A row on the change form: the whole row opens and closes its changes. */
  button.item-head {
    grid-template-columns: 1fr auto;
    width: 100%;
    border: 0;
    background: none;
    padding: 0;
    color: inherit;
    font: inherit;
    font-weight: 700;
    text-align: left;
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
  .search {
    display: grid;
    gap: 0.35rem;
  }
  .search label {
    font-weight: 700;
  }
  .item-head input {
    width: 1.2rem;
    height: 1.2rem;
    margin-top: 0.15rem;
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
