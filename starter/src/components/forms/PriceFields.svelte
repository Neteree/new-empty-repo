<script lang="ts" module>
  export type Pricing = 'one' | 'from' | 'sizes' | 'ask';
  export interface PriceChange {
    kind: string;
    name: string;
    description: string;
    category: string;
    price: string;
    pricing: Pricing;
    sizes: { label: string; price: string }[];
    available: boolean;
    footnote: string;
    /** '' for no photo change, 'gallery:<file>' for a current photo, 'new' for an upload. */
    itemPhoto: string;
    itemPhotoFile: File[];
    itemPhotoAlt: string;
  }
  const priceOk = (value: string) => Number(value.replace(/[$,\s]/g, '')) > 0;

  /** What's missing from a price list change, or '' when it's complete. */
  export function priceProblem(c: PriceChange): string {
    if (c.kind === 'price-note') return c.footnote.trim() ? '' : 'Write the note, like “Prices include GST.”';
    if (!c.name.trim()) return 'Choose or fill in the item.';
    if (c.kind === 'price-add' || c.kind === 'price-change') {
      if ((c.pricing === 'one' || c.pricing === 'from') && !priceOk(c.price)) return 'Fill in a price.';
      if (c.pricing === 'sizes' && !(c.sizes.length && c.sizes.every((s) => s.label.trim() && priceOk(s.price)))) return 'Give each size a name and a price.';
      if (c.itemPhoto === 'new' && !c.itemPhotoFile.length) return 'Choose the photo, or pick “No photo”.';
    }
    return '';
  }

  /** The changes in the shape the starter's scripts/changes.js takes; `upload` is the photo's number in the upload list. */
  export function priceChanges(c: PriceChange, upload: () => number) {
    const name = c.name.trim();
    const pricing =
      c.pricing === 'sizes'
        ? { sizes: c.sizes.map((s) => ({ label: s.label.trim(), price: s.price.trim() })) }
        : c.pricing === 'ask'
          ? { price: '' }
          : { price: c.price.trim(), from: c.pricing === 'from' };
    const photo = c.itemPhoto.startsWith('gallery:')
      ? { gallery: c.itemPhoto.slice(8) }
      : c.itemPhoto === 'new' && c.itemPhotoFile.length
        ? { upload: upload(), ...(c.itemPhotoAlt.trim() ? { alt: c.itemPhotoAlt.trim() } : {}) }
        : null;
    switch (c.kind) {
      case 'price-add':
        return [{ type: 'price-add', name, ...pricing, ...(c.description.trim() ? { description: c.description.trim() } : {}), ...(c.category.trim() ? { category: c.category.trim() } : {}), ...(photo ? { photo } : {}) }];
      case 'price-change':
        return [
          { type: 'price-change', name, ...pricing, ...(c.description.trim() ? { description: c.description.trim() } : {}) },
          ...(photo ? [{ type: 'price-photo', name, ...photo }] : []),
        ];
      case 'price-remove':
        return [{ type: 'price-remove', name }];
      case 'price-available':
        return [{ type: 'price-available', name, available: c.available }];
      default:
        return [{ type: 'price-note', footnote: c.footnote.trim() }];
    }
  }
</script>

<script lang="ts">
  // The fields for one price list change on the request form: add, change,
  // remove, hide or show an item, or the note under the list. With the
  // client's site linked, items are picked from their list and photos from
  // their gallery.
  import type { ExistingPhoto } from './PhotoPicker.svelte';
  import PhotoChoice from './PhotoChoice.svelte';

  let {
    change = $bindable(),
    i,
    items,
    gallery,
    canUpload,
  }: { change: PriceChange; i: number; items: { name: string; available: boolean }[]; gallery: ExistingPhoto[]; canUpload: boolean } = $props();

  const choices = $derived(
    change.kind === 'price-available' ? items : items.filter((item) => item.available),
  );
</script>

{#if change.kind === 'price-note'}
  <div class="field">
    <label for="r-footnote-{i}">Note under your price list</label>
    <input id="r-footnote-{i}" placeholder="Prices include GST. Delivery extra." bind:value={change.footnote} />
  </div>
{:else}
  <div class="field">
    {#if change.kind === 'price-add'}
      <label for="r-pname-{i}">Name</label>
      <input id="r-pname-{i}" placeholder="Seasonal bouquet" bind:value={change.name} />
    {:else if choices.length}
      <label for="r-pname-{i}">Which item?</label>
      <select id="r-pname-{i}" bind:value={change.name}>
        <option value="" disabled>Choose one</option>
        {#each choices as item (item.name)}<option value={item.name}>{item.name}{item.available ? '' : ' (hidden)'}</option>{/each}
      </select>
    {:else}
      <label for="r-pname-{i}">Item name, as it is on your price list</label>
      <input id="r-pname-{i}" bind:value={change.name} />
    {/if}
  </div>

  {#if change.kind === 'price-available'}
    <div class="checks">
      <label><input type="radio" name="r-avail-{i}" value={false} bind:group={change.available} /> Hide it for now</label>
      <label><input type="radio" name="r-avail-{i}" value={true} bind:group={change.available} /> Show it again</label>
    </div>
  {/if}

  {#if change.kind === 'price-add' || change.kind === 'price-change'}
    <fieldset class="group">
      <legend>{change.kind === 'price-add' ? 'Price' : 'New price'}</legend>
      <div class="checks">
        <label><input type="radio" name="r-pricing-{i}" value="one" bind:group={change.pricing} /> One price</label>
        <label><input type="radio" name="r-pricing-{i}" value="from" bind:group={change.pricing} /> “From” a price</label>
        <label><input type="radio" name="r-pricing-{i}" value="sizes" bind:group={change.pricing} /> Sizes</label>
        <label><input type="radio" name="r-pricing-{i}" value="ask" bind:group={change.pricing} /> “Ask us”</label>
      </div>
      {#if change.pricing === 'one' || change.pricing === 'from'}
        <div class="field">
          <label for="r-pprice-{i}">{change.pricing === 'from' ? 'Starting price' : 'Price'}</label>
          <input id="r-pprice-{i}" inputmode="decimal" placeholder="$65" bind:value={change.price} />
        </div>
      {:else if change.pricing === 'sizes'}
        {#each change.sizes as size, j (j)}
          <div class="size">
            <input aria-label="Size {j + 1} name" placeholder={['Small', 'Medium', 'Large'][j] ?? 'Size'} bind:value={size.label} />
            <input aria-label="Size {j + 1} price" inputmode="decimal" placeholder="$45" bind:value={size.price} />
            {#if change.sizes.length > 1}
              <button class="small" type="button" aria-label="Remove size {j + 1}" onclick={() => change.sizes.splice(j, 1)}>×</button>
            {/if}
          </div>
        {/each}
        <button class="small" type="button" onclick={() => change.sizes.push({ label: '', price: '' })}>Add a size</button>
      {/if}
    </fieldset>

    <div class="field">
      <label for="r-pdesc-{i}">{change.kind === 'price-add' ? 'Short description' : 'New description'} <span class="optional">(optional)</span></label>
      <input id="r-pdesc-{i}" bind:value={change.description} />
    </div>
    {#if change.kind === 'price-add'}
      <div class="field">
        <label for="r-pcat-{i}">Group <span class="optional">(optional)</span></label>
        <input id="r-pcat-{i}" placeholder="Bouquets" bind:value={change.category} />
      </div>
    {/if}

    <PhotoChoice name="r-pphoto-{i}" bind:choice={change.itemPhoto} bind:files={change.itemPhotoFile} bind:alt={change.itemPhotoAlt} {gallery} {canUpload} noneLabel={change.kind === 'price-add' ? 'No photo' : 'Keep as it is'} />
  {/if}
{/if}

<style>
  /* Same field styles as the request form around it. */
  .field {
    display: grid;
    gap: 0.35rem;
  }
  label {
    font-weight: 600;
  }
  .hint {
    margin: 0;
    font-size: 0.92rem;
    color: var(--ink-soft);
  }
  input:not([type='radio']):not([type='checkbox']),
  select {
    width: 100%;
    border: 2px solid var(--ink);
    border-radius: 0.4rem;
    background: var(--paper);
    padding: 0.65rem 0.8rem;
  }
  .checks {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1.5rem;
  }
  .checks label {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-weight: 500;
  }
  .small {
    justify-self: start;
    border: 2px solid var(--ink);
    border-radius: 0.4rem;
    background: none;
    padding: 0.4rem 0.8rem;
    font-weight: 600;
    cursor: pointer;
  }
  .group {
    display: grid;
    gap: 0.7rem;
    margin: 0;
    padding: 0;
    border: none;
    min-width: 0;
  }
  legend {
    font-family: inherit;
    font-size: inherit;
    font-weight: 700;
    padding: 0;
    margin-bottom: 0.4rem;
  }
  .size {
    display: grid;
    grid-template-columns: 1fr 1fr auto;
    gap: 0.5rem;
  }
  .optional {
    font-weight: 400;
    color: var(--ink-soft);
  }
</style>
