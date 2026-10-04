<script lang="ts">
  // A logo and photos (with a main one beside the headline): the same
  // questions for a new website and for a change to one. On a change, the
  // site's current photos (`existing`) can be removed or re-described too.
  import PhotoPicker, { type ExistingPhoto } from '../../components/forms/PhotoPicker.svelte';

  let {
    logo = $bindable([]),
    photos = $bindable([]),
    descriptions = $bindable([]),
    main = $bindable(null),
    existing = $bindable(),
    fresh = false,
  }: {
    logo?: File[];
    photos?: File[];
    descriptions?: string[];
    main?: string | null;
    existing?: ExistingPhoto[];
    /** A new website: the first photo starts as the main one, and "no main photo" means a drawing instead. */
    fresh?: boolean;
  } = $props();
  const noMainLabel = fresh ? 'No main photo (use a simple drawing instead)' : 'Keep my main photo as it is';
</script>

<span class="label">{fresh ? 'Your logo' : 'A new logo'}</span>
<PhotoPicker label="logo" bind:photos={logo} max={1} describe={false} />
<span class="label">Your photos</span>
{#if fresh}<p class="hint">Your place, your products and your team make the biggest difference. Pick your best as the main photo.</p>{/if}
{#if existing}
  <PhotoPicker label="photos" bind:photos bind:descriptions bind:existing pickMain bind:main {noMainLabel} />
{:else}
  <PhotoPicker label="photos" bind:photos bind:descriptions pickMain autoMain={fresh} bind:main {noMainLabel} />
{/if}

<style>
  .label {
    font-weight: 700;
  }
  .hint {
    margin: 0;
    font-size: 0.92rem;
    color: var(--ink-soft);
  }
</style>
