<script lang="ts">
  import { resolve } from '$app/paths';
  import Bloom from '$lib/Bloom.svelte';
  import { cart } from '$lib/cart.svelte';
  import { DELIVERY_FEE, FREE_DELIVERY_FROM, findProduct } from '$lib/products';

  let fulfilment = $state<'delivery' | 'collect'>('delivery');
  let checkedOut = $state(false);

  const deliveryFee = $derived(
    fulfilment === 'collect' || cart.subtotal >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE,
  );
  const total = $derived(cart.subtotal + deliveryFee);
  const toFreeDelivery = $derived(Math.max(0, FREE_DELIVERY_FROM - cart.subtotal));
  // GST is 15% and prices include it, so the GST share is 3/23 of the total.
  const gst = $derived(Math.round((total * 3) / 23 * 100) / 100);
</script>

<svelte:head>
  <title>Your cart · Stem &amp; Loam Shop</title>
</svelte:head>

<h1>Your cart</h1>

{#if checkedOut}
  <section class="notice" role="status">
    <p class="kicker">Thank you</p>
    <h2>This is where payment would happen</h2>
    <p>
      On a live site, this button opens a secure checkout run by Stripe or Shopify, which takes the
      payment and sends the order to the shop. This is a demo, so nothing has been charged.
    </p>
    <div class="notice-actions">
      <button class="button" type="button" onclick={() => { cart.clear(); checkedOut = false; }}>Empty the cart</button>
      <button class="button quiet" type="button" onclick={() => (checkedOut = false)}>Back to the cart</button>
    </div>
  </section>
{:else if cart.lines.length === 0}
  <section class="empty">
    <p>Your cart is empty.</p>
    <a class="button" href={resolve('/')}>Browse this week's flowers</a>
  </section>
{:else}
  <div class="layout">
    <ul class="lines">
      {#each cart.lines as line (cart.keyOf(line))}
        {@const product = findProduct(line.slug)}
        {#if product}
          <li class="line">
            <a class="thumb" href={resolve('/product/[slug]', { slug: product.slug })} aria-label={product.name}>
              <Bloom petals={product.bloom.petals} petal={product.bloom.petal} centre={product.bloom.centre} />
            </a>
            <div class="line-info">
              <h2>{product.name}</h2>
              <p class="option">{line.option} · ${line.unitPrice} each</p>
              {#if line.message}<p class="card-message">“{line.message}”</p>{/if}
            </div>
            <div class="line-controls">
              <span class="stepper">
                <button type="button" aria-label="One fewer {product.name}" onclick={() => cart.setQty(cart.keyOf(line), line.qty - 1)}>−</button>
                <span class="qty" aria-live="polite">{line.qty}</span>
                <button type="button" aria-label="One more {product.name}" onclick={() => cart.setQty(cart.keyOf(line), line.qty + 1)}>+</button>
              </span>
              <span class="line-total">${line.qty * line.unitPrice}</span>
              <button class="remove" type="button" onclick={() => cart.remove(cart.keyOf(line))}>Remove</button>
            </div>
          </li>
        {/if}
      {/each}
    </ul>

    <aside class="summary" aria-label="Order summary">
      <fieldset>
        <legend>How would you like it?</legend>
        <label>
          <input type="radio" name="fulfilment" value="delivery" bind:group={fulfilment} />
          Delivery on Thursday, central Auckland
        </label>
        <label>
          <input type="radio" name="fulfilment" value="collect" bind:group={fulfilment} />
          Collect from the shop, Tuesday to Saturday
        </label>
      </fieldset>

      <dl>
        <div><dt>Flowers</dt><dd>${cart.subtotal}</dd></div>
        <div>
          <dt>{fulfilment === 'collect' ? 'Collection' : 'Delivery'}</dt>
          <dd>{deliveryFee === 0 ? 'Free' : `$${deliveryFee}`}</dd>
        </div>
        <div class="total"><dt>Total</dt><dd>${total}</dd></div>
      </dl>
      <p class="fine">Includes ${gst.toFixed(2)} GST.</p>
      {#if fulfilment === 'delivery' && toFreeDelivery > 0}
        <p class="nudge">Add ${toFreeDelivery} more for free delivery.</p>
      {/if}
      <button class="button checkout" type="button" onclick={() => (checkedOut = true)}>Go to checkout</button>
    </aside>
  </div>
{/if}

<style>
  h1 {
    font-size: clamp(2.4rem, 5vw, 3.4rem);
    margin-block: 1rem 2rem;
  }

  .layout {
    display: grid;
    grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
    gap: 2rem 3rem;
    align-items: start;
  }

  .lines {
    list-style: none;
    margin: 0;
    padding: 0;
    border-top: 1px solid var(--rule);
  }

  .line {
    display: grid;
    grid-template-columns: 5rem minmax(0, 1fr) auto;
    gap: 1rem 1.25rem;
    align-items: center;
    padding-block: 1.25rem;
    border-bottom: 1px solid var(--rule);
  }

  .thumb {
    display: block;
    background: var(--grain), var(--blush);
    border-radius: 999px 999px 0.6rem 0.6rem;
    padding: 0.8rem 0.6rem 0.5rem;
  }

  .line-info h2 {
    font-size: 1.35rem;
  }

  .option,
  .card-message {
    margin: 0.15rem 0 0;
    color: var(--ink-soft);
    font-size: 0.95rem;
  }

  .card-message {
    font-family: var(--display);
    font-style: italic;
  }

  .line-controls {
    display: flex;
    flex-direction: column;
    align-items: end;
    gap: 0.4rem;
  }

  .stepper {
    display: inline-flex;
    align-items: center;
    border: 1px solid var(--rule);
    border-radius: 999px;
    background: var(--paper-raised);
  }

  .stepper button {
    width: 2.2rem;
    height: 2.2rem;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 1.1rem;
  }

  .qty {
    min-width: 1.5rem;
    text-align: center;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  .line-total {
    font-family: var(--display);
    font-size: 1.25rem;
    font-variant-numeric: tabular-nums;
  }

  .remove {
    border: none;
    background: none;
    padding: 0;
    color: var(--ink-soft);
    text-decoration: underline;
    cursor: pointer;
    font-size: 0.85rem;
  }

  .summary {
    background: var(--grain), var(--blush);
    border-radius: 1.5rem;
    padding: 1.75rem;
    display: grid;
    gap: 1rem;
  }

  fieldset {
    border: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.6rem;
  }

  legend {
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  fieldset label {
    display: flex;
    gap: 0.6rem;
    align-items: baseline;
    cursor: pointer;
  }

  fieldset input {
    accent-color: var(--peony);
  }

  dl {
    margin: 0;
  }

  dl div {
    display: flex;
    justify-content: space-between;
    padding-block: 0.45rem;
    border-bottom: 1px solid var(--rule);
  }

  dd {
    margin: 0;
    font-variant-numeric: tabular-nums;
  }

  .total {
    font-family: var(--display);
    font-size: 1.4rem;
    border-bottom: none;
  }

  .fine,
  .nudge {
    margin: 0;
    font-size: 0.9rem;
    color: var(--ink-soft);
  }

  .nudge {
    color: var(--peony);
    font-weight: 600;
  }

  .checkout {
    width: 100%;
  }

  .empty,
  .notice {
    display: grid;
    gap: 1rem;
    justify-items: start;
    max-width: 38rem;
  }

  .empty p {
    margin: 0;
    color: var(--ink-soft);
  }

  .notice {
    background: var(--grain), var(--blush);
    border-radius: 1.5rem;
    padding: 2rem;
  }

  .notice h2 {
    font-size: 2rem;
  }

  .notice p {
    margin: 0;
  }

  .notice-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  @media (max-width: 52rem) {
    .layout {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 30rem) {
    .line {
      grid-template-columns: 4rem minmax(0, 1fr);
    }

    .line-controls {
      grid-column: 1 / -1;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }
  }
</style>
