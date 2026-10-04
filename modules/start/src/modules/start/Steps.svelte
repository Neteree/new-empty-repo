<script lang="ts">
  // The steps of a Get started path: "Step 2 of 5", the step's title and a
  // progress bar, then the step itself, then Back, Next (or Send on the last
  // step) and an optional total, kept in view at the bottom. Next and Send
  // submit the form, so the form checks the step before moving on. Step 1 is
  // "What can I help with?", so a path's steps count from 2.
  import type { Snippet } from 'svelte';

  let {
    steps,
    step,
    send,
    sending = false,
    onback,
    total = '',
    children,
  }: {
    steps: readonly string[];
    step: number;
    send: string;
    sending?: boolean;
    onback: () => void;
    total?: string;
    children: Snippet;
  } = $props();

  let heading = $state<HTMLElement>();
  // Each new step's title takes the focus, so screen readers announce it.
  $effect(() => {
    void step;
    requestAnimationFrame(() => heading?.focus());
  });
</script>

<div class="progress">
  <p class="step-count" aria-live="polite">Step {step + 2} of {steps.length + 1}</p>
  <h2 class="step-title" tabindex="-1" bind:this={heading}>{steps[step]}</h2>
  <progress max={steps.length + 1} value={step + 2} aria-hidden="true"></progress>
</div>

{@render children()}

<div class="nav">
  <button class="button ghost" type="button" onclick={onback}>Back</button>
  {#if step < steps.length - 1}
    <button class="button" type="submit">Next</button>
  {:else}
    <button class="button" type="submit" disabled={sending}>{sending ? 'Sending…' : send}</button>
  {/if}
  {#if total}<p class="total" aria-live="polite">{total}</p>{/if}
</div>

<style>
  .progress {
    display: grid;
    gap: 0.4rem;
  }
  .step-count {
    margin: 0;
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ink-soft);
  }
  .step-title {
    font-size: clamp(1.6rem, 5vw, 2.2rem);
    outline: none;
  }
  progress {
    width: 100%;
    height: 6px;
    border: 0;
    border-radius: 3px;
    background: var(--rule);
    accent-color: var(--accent);
    appearance: none;
  }
  progress::-webkit-progress-bar {
    background: var(--rule);
    border-radius: 3px;
  }
  progress::-webkit-progress-value {
    background: var(--accent);
    border-radius: 3px;
  }
  progress::-moz-progress-bar {
    background: var(--accent);
    border-radius: 3px;
  }
  /* Back, Next and the total stay in view while the step scrolls. */
  .nav {
    position: sticky;
    bottom: 0;
    z-index: 1;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.8rem;
    padding-block: 0.8rem;
    background: var(--paper);
    border-top: 1.5px solid var(--rule);
  }
  .button.ghost {
    background: none;
    color: var(--ink);
    border: 2px solid var(--ink);
    box-shadow: none;
  }
  .button:disabled {
    opacity: 0.6;
    cursor: wait;
  }
  .total {
    margin: 0 0 0 auto;
    font-variant-numeric: tabular-nums;
  }
</style>
