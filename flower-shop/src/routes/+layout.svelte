<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import { cart } from '$lib/cart.svelte';

  let { children } = $props();

  onMount(() => cart.restore());
</script>

<svg class="defs" width="0" height="0" aria-hidden="true">
  <filter id="painted" x="-15%" y="-15%" width="130%" height="130%">
    <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" seed="7" result="noise" />
    <feDisplacementMap in="SourceGraphic" in2="noise" scale="7" xChannelSelector="R" yChannelSelector="G" />
  </filter>
</svg>

<div class="page">
  <header class="masthead">
    <a class="wordmark" href={resolve('/')}>Stem &amp; Loam</a>
    <nav aria-label="Main">
      <a href={resolve('/')}>Shop</a>
      <a class="cart-link" href={resolve('/cart')}>
        Cart
        <span class="count" aria-label="{cart.count} items">{cart.count}</span>
      </a>
    </nav>
  </header>

  {@render children()}

  <footer class="footer">
    <p class="sign">With love from the flower bench,<br /><span>Stem &amp; Loam</span></p>
    <p class="demo">A demo shop built with SvelteKit. No payment is ever taken.</p>
  </footer>
</div>

<style>
  .defs {
    position: absolute;
  }

  .page {
    max-width: 72rem;
    margin: 0 auto;
    padding-inline: clamp(1rem, 4vw, 2.5rem);
    padding-block: 0 2.5rem;
  }

  .masthead {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem 2rem;
    padding-block: 1.5rem;
  }

  .wordmark {
    font-family: var(--script);
    font-size: 2.3rem;
    line-height: 1;
    text-decoration: none;
  }

  nav {
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }

  nav a {
    text-decoration: none;
    color: var(--ink-soft);
  }

  nav a:hover {
    color: var(--peony);
  }

  .cart-link {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
  }

  .count {
    min-width: 1.6rem;
    height: 1.6rem;
    padding-inline: 0.4rem;
    border-radius: 999px;
    background: var(--peony);
    color: var(--peony-ink);
    font-size: 0.85rem;
    font-weight: 600;
    display: inline-grid;
    place-items: center;
    font-variant-numeric: tabular-nums;
  }

  .footer {
    margin-top: 5rem;
    padding-top: 2.5rem;
    border-top: 1px solid var(--rule);
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: end;
    gap: 1rem 2rem;
  }

  .sign {
    margin: 0;
    font-family: var(--display);
    font-style: italic;
    color: var(--ink-soft);
  }

  .sign span {
    font-family: var(--script);
    font-style: normal;
    font-size: 2.4rem;
    line-height: 1.2;
    color: var(--ink);
  }

  .demo {
    margin: 0;
    font-size: 0.85rem;
    color: var(--ink-soft);
  }
</style>
