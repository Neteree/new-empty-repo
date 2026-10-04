<script lang="ts">
  // The top of every section and page: a small note, the heading and an
  // optional intro. `level` 1 makes it the page's title (on pages of their
  // own, like a game or a form). With no title, `hiddenTitle` keeps a heading
  // for screen readers only (a section that speaks for itself, like highlights).
  let {
    note = '',
    title = '',
    intro = '',
    id,
    hiddenTitle = '',
    level = 2,
  }: { note?: string; title?: string; intro?: string; id?: string; hiddenTitle?: string; level?: 1 | 2 } = $props();
  const tag = $derived(`h${level}`);
</script>

{#if title}
  <div class="section-head">
    {#if note}<p class="hand-note">{note}</p>{/if}
    <svelte:element this={tag} {id}>{title}</svelte:element>
    {#if intro}<p class="intro">{intro}</p>{/if}
  </div>
{:else if hiddenTitle}
  <svelte:element this={tag} {id} class="visually-hidden">{hiddenTitle}</svelte:element>
{/if}
