<script lang="ts">
  // A pop-up for games: how to play, game over, "start again?". Uses the
  // browser's own <dialog>, so Esc closes it and focus stays inside.
  import type { Snippet } from 'svelte';

  let {
    open = $bindable(false),
    title,
    children,
    actions,
    onclose,
  }: { open?: boolean; title: string; children: Snippet; actions?: Snippet; onclose?: () => void } = $props();

  const uid = $props.id();
  let dialog: HTMLDialogElement;

  $effect(() => {
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  });
</script>

<dialog
  bind:this={dialog}
  class="game-dialog"
  aria-labelledby="{uid}-title"
  onclose={() => {
    open = false;
    onclose?.();
  }}
>
  <div class="body">
    <h2 id="{uid}-title">{title}</h2>
    {@render children()}
    {#if actions}<div class="actions">{@render actions()}</div>{/if}
  </div>
</dialog>

<style>
  .game-dialog {
    width: min(36rem, calc(100vw - 2rem));
    max-height: calc(100dvh - 2rem);
    padding: 0;
    border: 2px solid var(--ink);
    border-radius: 1rem;
    background: var(--paper);
    color: var(--ink);
    box-shadow: 8px 8px 0 var(--accent);
  }

  .game-dialog::backdrop {
    background: rgb(0 0 0 / 0.6);
  }

  .body {
    display: grid;
    gap: 0.9rem;
    padding: clamp(1.1rem, 4vw, 1.6rem);
  }

  h2 {
    font-size: clamp(1.5rem, 5vw, 2rem);
    color: var(--accent);
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    justify-content: flex-end;
  }
</style>
