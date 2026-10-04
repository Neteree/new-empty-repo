<script lang="ts" module>
  export interface ExistingPhoto {
    file: string;
    src: string;
    original: string;
    alt: string;
    removed: boolean;
  }
</script>

<script lang="ts">
  // Choosing photos to upload: each chosen photo shows a small preview and can
  // be removed, and choosing again adds to the list instead of replacing it.
  // With `max` 1 (a logo), choosing again swaps the photo. `existing` photos
  // (already on the client's site) are listed the same way, above new ones.
  // With `pickMain`, one photo can be chosen as the main photo beside the
  // headline: `main` is 'existing:<file>', 'new:<index>' or null for none.
  let {
    label,
    photos = $bindable([]),
    descriptions = $bindable([]),
    existing = $bindable([]),
    max = 12,
    describe = true,
    pickMain = false,
    main = $bindable(null),
    noMainLabel = 'No main photo',
    autoMain = false,
  }: {
    label: string;
    photos?: File[];
    descriptions?: string[];
    existing?: ExistingPhoto[];
    max?: number;
    describe?: boolean;
    pickMain?: boolean;
    main?: string | null;
    noMainLabel?: string;
    /** Pick the first photo as the main one when photos are first chosen. */
    autoMain?: boolean;
  } = $props();
  const uid = $props.id();
  const group = `main-${uid}`;

  let previews = $state<string[]>([]);
  $effect(() => {
    const urls = photos.map((file) => URL.createObjectURL(file));
    previews = urls;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  });

  function add(event: Event & { currentTarget: HTMLInputElement }) {
    const chosen = [...(event.currentTarget.files ?? [])];
    event.currentTarget.value = '';
    if (!chosen.length) return;
    if (max === 1) {
      photos = chosen.slice(0, 1);
      descriptions = [''];
    } else {
      if (autoMain && main === null && !photos.length) main = 'new:0';
      photos = [...photos, ...chosen];
      descriptions = [...descriptions, ...chosen.map(() => '')];
    }
  }

  function remove(index: number) {
    if (main === `new:${index}`) main = null;
    else if (main?.startsWith('new:') && Number(main.slice(4)) > index) main = `new:${Number(main.slice(4)) - 1}`;
    photos = photos.filter((_, i) => i !== index);
    descriptions = descriptions.filter((_, i) => i !== index);
  }
</script>

<div class="picker">
  {#if photos.length || existing.length}
    <ul>
      {#each existing as current, i (current.file)}
        <li class:removed={current.removed}>
          <img src={current.src} alt="" width="64" height="64" />
          <label class="describe">
            <span>What’s in photo {i + 1}?{#if current.removed}{' '}<span class="optional">(being removed)</span>{/if}</span>
            <input maxlength="150" bind:value={current.alt} disabled={current.removed} />
          </label>
          {#if pickMain && !current.removed}
            <label class="main"><input type="radio" name={group} value="existing:{current.file}" bind:group={main} aria-label="Make photo {i + 1} the main photo" /> Main photo</label>
          {/if}
          <button type="button" onclick={() => { current.removed = !current.removed; if (main === `existing:${current.file}`) main = null; }} aria-label="{current.removed ? 'Keep' : 'Remove'} photo {i + 1}">
            {current.removed ? 'Keep' : 'Remove'}
          </button>
        </li>
      {/each}
      {#each photos as photo, i (photo)}
        <li>
          {#if previews[i]}<img src={previews[i]} alt="" width="64" height="64" />{/if}
          {#if describe}
            <label class="describe">
              <span>What’s in photo {existing.length + i + 1}? <span class="optional">(optional)</span></span>
              <input maxlength="150" bind:value={descriptions[i]} />
            </label>
          {:else}
            <span class="name">{photo.name}</span>
          {/if}
          {#if pickMain}
            <label class="main"><input type="radio" name={group} value="new:{i}" bind:group={main} aria-label="Make photo {existing.length + i + 1} the main photo" /> Main photo</label>
          {/if}
          <button type="button" onclick={() => remove(i)} aria-label="Remove {describe ? `photo ${existing.length + i + 1}` : photo.name}">Remove</button>
        </li>
      {/each}
    </ul>
    {#if pickMain}
      <label class="main"><input type="radio" name={group} value={null} bind:group={main} /> {noMainLabel}</label>
    {/if}
  {/if}
  <label class="choose">
    {photos.length ? (max === 1 ? `Change ${label}` : `Add more ${label}`) : `Choose ${label}`}
    <input type="file" accept="image/jpeg,image/png,image/webp" multiple={max > 1} onchange={add} />
  </label>
</div>

<style>
  .picker {
    display: grid;
    gap: 0.6rem;
  }
  .choose {
    position: relative;
    justify-self: start;
    border: 2px solid var(--ink);
    border-radius: 0.4rem;
    padding: 0.5rem 0.9rem;
    font-weight: 600;
    cursor: pointer;
  }
  .choose:focus-within {
    outline: 3px solid var(--ink);
    outline-offset: 2px;
  }
  .choose input {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
    overflow: hidden;
  }
  ul {
    display: grid;
    gap: 0.6rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li.removed img {
    opacity: 0.4;
  }
  li {
    display: grid;
    grid-template-columns: 4rem 1fr;
    align-items: start;
    gap: 0.4rem 0.75rem;
  }
  li img {
    grid-row: span 2;
  }
  li button,
  li .main {
    grid-column: 2;
    justify-self: start;
  }
  .main {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-weight: 600;
    font-size: 0.92rem;
    cursor: pointer;
  }
  .main input {
    width: 1.1rem;
    height: 1.1rem;
    accent-color: var(--accent);
  }
  img {
    width: 4rem;
    height: 4rem;
    object-fit: cover;
    border-radius: 0.3rem;
  }
  .describe {
    display: grid;
    gap: 0.25rem;
    min-width: 0;
    font-weight: 600;
    font-size: 0.92rem;
    overflow-wrap: anywhere;
  }
  .describe input {
    width: 100%;
    border: 2px solid var(--ink);
    border-radius: 0.4rem;
    background: var(--paper);
    padding: 0.5rem 0.7rem;
    font-weight: 400;
  }
  .optional {
    font-weight: 400;
    color: var(--ink-soft);
  }
  .name {
    min-width: 0;
    overflow-wrap: anywhere;
  }
  button {
    border: 2px solid var(--ink);
    border-radius: 0.4rem;
    background: none;
    padding: 0.35rem 0.7rem;
    font-weight: 600;
    cursor: pointer;
  }
</style>
