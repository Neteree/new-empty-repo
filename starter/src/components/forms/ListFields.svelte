<script module lang="ts">
  // Fields for adding to, or removing from, any list section (reviews,
  // questions, highlights, steps, past work…), built from the section's
  // description in src/data/lists.json (see scripts/lists.js). A new list
  // section needs nothing here.
  import lists from '../../data/lists.json';

  export interface ListField { label: string; kind?: 'text' | 'long' | 'quote' | 'stars' | 'link' | 'photo'; required?: boolean; example?: string }
  export interface ListDef { module: string; type: string; key: string; id: string; noun: string; plural: string; add: string; remove: string; find?: string; hint?: string; ordered?: boolean; fields: Record<string, ListField> }
  export interface ListChange { kind: string; item: Record<string, string>; position: string; itemPhoto: string; itemPhotoFile: File[]; itemPhotoAlt: string }

  const defs = Object.values(lists) as ListDef[];

  /** The request form's choices: an add and a remove for every list section. */
  export const listKinds = defs.flatMap((def) => [
    { id: `${def.type}-add`, label: def.add, module: def.module },
    { id: `${def.type}-remove`, label: def.remove, module: def.module },
  ]);

  /** The list section and whether it's an add, for a change kind like 'faq-add'. */
  export function listOf(kind: string): { def: ListDef; add: boolean } | null {
    const def = defs.find((d) => kind === `${d.type}-add` || kind === `${d.type}-remove`);
    return def ? { def, add: kind.endsWith('-add') } : null;
  }

  /** What's missing, or ''. A photo is only required when there's a way to give one here. */
  export function listProblem(c: ListChange, photoPossible: boolean): string {
    const found = listOf(c.kind);
    if (!found) return '';
    const { def, add } = found;
    const value = (name: string) => (c.item[name] ?? '').trim();
    if (!add) return value(def.id) ? '' : `Fill in the ${def.fields[def.id].label.toLowerCase()}, exactly as it is on your site.`;
    const missing = Object.entries(def.fields).filter(([name, f]) => f.required && f.kind !== 'photo' && !value(name)).map(([, f]) => f.label.toLowerCase());
    if (missing.length) return `Fill in: ${missing.join('; ')}.`;
    const link = Object.entries(def.fields).find(([name, f]) => f.kind === 'link' && value(name) && !/^https:\/\//.test(value(name)));
    if (link) return 'Links should start https://, or leave it empty.';
    const photo = Object.values(def.fields).find((f) => f.kind === 'photo');
    if (photo?.required && photoPossible && (!c.itemPhoto || (c.itemPhoto === 'new' && !c.itemPhotoFile.length))) return `Choose the ${photo.label.toLowerCase()}.`;
    return '';
  }

  /** The change in the shape scripts/changes.js takes; `upload` numbers a new photo. */
  export function listChange(c: ListChange, upload: () => number) {
    const { def, add } = listOf(c.kind)!;
    const value = (name: string) => (c.item[name] ?? '').trim();
    if (!add) return { type: c.kind, [def.id]: value(def.id) };
    const change: Record<string, unknown> = { type: c.kind };
    for (const [name, f] of Object.entries(def.fields)) {
      if (f.kind === 'photo') {
        const alt = c.itemPhotoAlt.trim();
        if (c.itemPhoto.startsWith('gallery:')) change[name] = { gallery: c.itemPhoto.slice(8), ...(alt ? { alt } : {}) };
        else if (c.itemPhoto === 'new' && c.itemPhotoFile.length) change[name] = { upload: upload(), ...(alt ? { alt } : {}) };
      } else if (value(name)) change[name] = f.kind === 'stars' ? Number(value(name)) : value(name);
    }
    if (def.ordered && Number(c.position) >= 1) change.position = Number(c.position);
    return change;
  }

  /** Photos this change uploads, in order. */
  export const listUploads = (c: ListChange) => (listOf(c.kind)?.add && c.itemPhoto === 'new' ? c.itemPhotoFile : []);
</script>

<script lang="ts">
  import type { ExistingPhoto } from './PhotoPicker.svelte';
  import PhotoChoice from './PhotoChoice.svelte';

  let { change = $bindable(), i, gallery, canUpload }: { change: ListChange; i: number; gallery: ExistingPhoto[]; canUpload: boolean } = $props();
  const found = $derived(listOf(change.kind));
</script>

{#if found}
  {@const { def, add } = found}
  {#if add}
    {#if def.hint}<p class="hint">{def.hint}</p>{/if}
    {#each Object.entries(def.fields) as [name, f] (name)}
      {#if f.kind === 'photo'}
        <PhotoChoice name="r-l{i}-{name}" legend={f.label} bind:choice={change.itemPhoto} bind:files={change.itemPhotoFile} bind:alt={change.itemPhotoAlt} {gallery} {canUpload} noneLabel={f.required ? '' : 'No photo'} />
      {:else}
        <div class="field">
          <label for="r-l{i}-{name}">{f.label}{#if !f.required} <span class="optional">(optional)</span>{/if}</label>
          {#if f.kind === 'long' || f.kind === 'quote'}
            <textarea id="r-l{i}-{name}" rows="3" bind:value={change.item[name]}></textarea>
          {:else if f.kind === 'stars'}
            <select id="r-l{i}-{name}" bind:value={change.item[name]}>
              <option value="">No stars</option>
              {#each [5, 4, 3, 2, 1] as n (n)}<option value={String(n)}>{n} out of 5</option>{/each}
            </select>
          {:else}
            <input id="r-l{i}-{name}" type={f.kind === 'link' ? 'url' : 'text'} placeholder={f.example ?? (f.kind === 'link' ? 'https://' : '')} bind:value={change.item[name]} />
          {/if}
        </div>
      {/if}
    {/each}
    {#if def.ordered}
      <div class="field">
        <label for="r-l{i}-position">Which number in the list <span class="optional">(optional, last if blank)</span></label>
        <input id="r-l{i}-position" inputmode="numeric" bind:value={change.position} />
      </div>
    {/if}
  {:else}
    <div class="field">
      <label for="r-l{i}-{def.id}">{def.find ?? `Its ${def.fields[def.id].label.toLowerCase()}, as it is on your site`}</label>
      <input id="r-l{i}-{def.id}" bind:value={change.item[def.id]} />
    </div>
  {/if}
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
  input,
  select,
  textarea {
    width: 100%;
    border: 2px solid var(--ink);
    border-radius: 0.4rem;
    background: var(--paper);
    padding: 0.65rem 0.8rem;
  }
  .optional {
    font-weight: 400;
    color: var(--ink-soft);
  }
</style>
