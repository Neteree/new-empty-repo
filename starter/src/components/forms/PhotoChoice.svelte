<script lang="ts">
  // Pick one photo for something on the site (a price list item, a past
  // project): a new upload, or one already on the site. With `noneLabel` the
  // first choice is no photo (or no change); without it a photo is required.
  import PhotoPicker, { type ExistingPhoto } from './PhotoPicker.svelte';

  let {
    name,
    choice = $bindable(''),
    files = $bindable([]),
    alt = $bindable(''),
    gallery,
    canUpload,
    legend = 'Photo',
    noneLabel = '',
  }: {
    /** Unique name for the radio group, e.g. 'r-pphoto-2'. */
    name: string;
    /** '' for none, 'new' for an upload, 'gallery:<file>' for a photo already on the site. */
    choice: string;
    files: File[];
    alt: string;
    gallery: ExistingPhoto[];
    canUpload: boolean;
    legend?: string;
    noneLabel?: string;
  } = $props();
</script>

{#if gallery.length || canUpload}
  <fieldset class="group">
    <legend>{legend}{#if noneLabel} <span class="optional">(optional)</span>{/if}</legend>
    <div class="checks">
      {#if noneLabel}<label><input type="radio" {name} value="" bind:group={choice} /> {noneLabel}</label>{/if}
      {#if canUpload}<label><input type="radio" {name} value="new" bind:group={choice} /> A new photo</label>{/if}
    </div>
    {#if gallery.length}
      <p class="hint">{canUpload || noneLabel ? 'Or one already on your site:' : 'Choose one already on your site:'}</p>
      <div class="thumbs">
        {#each gallery as current (current.file)}
          <label class="thumb">
            <input type="radio" {name} value="gallery:{current.file}" bind:group={choice} />
            <img src={current.src} alt={current.alt || 'A photo on your site'} width="64" height="64" />
          </label>
        {/each}
      </div>
    {/if}
    {#if choice === 'new'}
      <PhotoPicker label="photo" bind:photos={files} max={1} describe={false} />
      <div class="field">
        <label for="{name}-alt">What’s in the photo? <span class="optional">(optional)</span></label>
        <input id="{name}-alt" maxlength="150" bind:value={alt} />
      </div>
    {/if}
  </fieldset>
{:else if !noneLabel}
  <p class="hint">Email me the photo after you send this, and say what it’s for.</p>
{/if}

<style>
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
  input:not([type='radio']) {
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
  .thumbs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .thumb {
    position: relative;
    cursor: pointer;
  }
  .thumb input {
    position: absolute;
    opacity: 0;
    width: 1px;
    height: 1px;
  }
  .thumb img {
    display: block;
    width: 4rem;
    height: 4rem;
    object-fit: cover;
    border-radius: 0.3rem;
    border: 3px solid transparent;
  }
  .thumb input:checked + img {
    border-color: var(--accent);
  }
  .thumb input:focus-visible + img {
    outline: 3px solid var(--highlight);
    outline-offset: 2px;
  }
  .optional {
    font-weight: 400;
    color: var(--ink-soft);
  }
</style>
