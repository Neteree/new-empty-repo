<script lang="ts">
  import { onMount } from 'svelte';
  import { order, restoreOnce } from './order.svelte';

  let { href }: { href: string } = $props();

  onMount(restoreOnce);
</script>

<a class="badge" {href}>
  Pre-order
  <span class="count">{order.count}<span class="visually-hidden"> items in your order</span></span>
</a>

<style>
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.45rem 0.55rem 0.45rem 1rem;
    border: 2px solid var(--ink);
    border-radius: 999px;
    font-weight: 700;
    text-decoration: none;
    background: var(--paper);
  }
  .badge:hover {
    background: var(--highlight);
    color: var(--on-highlight);
  }
  .count {
    min-width: 1.7rem;
    height: 1.7rem;
    padding-inline: 0.4rem;
    border-radius: 999px;
    background: var(--accent);
    color: var(--on-accent);
    display: inline-grid;
    place-items: center;
    font-size: 0.85rem;
    font-variant-numeric: tabular-nums;
  }
</style>
