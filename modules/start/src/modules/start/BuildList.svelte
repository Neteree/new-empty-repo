<script lang="ts">
  // The "Build your site" list: tick what you want, see its price, fill in
  // what you can now (or later), and "Something else?" for anything that
  // isn't listed yet. Used by the new-website form and the change form's
  // "Add to your site", so both work the same way. A form can give its own
  // questions for an item (`bodies`, by item id); list sections (reviews,
  // questions…) ask for their fields from their descriptions.
  import type { Snippet } from 'svelte';
  import { type Build, type Item, blankRow, listDef, textFields } from './build';

  let {
    groups,
    build = $bindable(),
    priceText,
    bodies = {},
    id = 'b',
  }: {
    groups: { title?: string; items: Item[] }[];
    build: Build;
    priceText: (item: Item) => string;
    bodies?: Partial<Record<string, Snippet>>;
    id?: string;
  } = $props();

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

{#each groups as group, g (g)}
  {#if group.title}<h3 class="group">{group.title}</h3>{/if}
  <ul class="items">
    {#each group.items as item (item.id)}
      {@const def = listDef(item)}
      {@const own = bodies[item.id]}
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
    {/each}
  </ul>
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
