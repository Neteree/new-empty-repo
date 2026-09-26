<script lang="ts">
  import { resolve } from '$app/paths';
  import Bloom from '$lib/Bloom.svelte';
  import { cart } from '$lib/cart.svelte';

  let { data } = $props();

  const product = $derived(data.product);

  let optionIndex = $state(0);
  let qty = $state(1);
  let message = $state('');
  let added = $state(false);

  // Start fresh when moving from one product to another.
  $effect(() => {
    product.slug;
    optionIndex = 0;
    qty = 1;
    message = '';
    added = false;
  });

  const option = $derived(product.options[optionIndex]);

  function addToCart() {
    cart.add({
      slug: product.slug,
      option: option.label,
      unitPrice: option.price,
      qty,
      message: message.trim(),
    });
    added = true;
  }
</script>

<svelte:head>
  <title>{product.name} · Stem &amp; Loam Shop</title>
  <meta name="description" content={product.blurb} />
</svelte:head>

<a class="back" href={resolve('/')}>← All flowers</a>

<article class="product">
  <div class="arch">
    <Bloom stem petals={product.bloom.petals} petal={product.bloom.petal} centre={product.bloom.centre} label={`Illustration of ${product.name}`} />
  </div>

  <div class="details">
    <h1>{product.name}</h1>
    <p class="description">{product.description}</p>

    <form onsubmit={(event) => { event.preventDefault(); addToCart(); }}>
      <fieldset class="options">
        <legend>Size</legend>
        {#each product.options as choice, i (choice.label)}
          <label class:chosen={optionIndex === i}>
            <input type="radio" name="option" value={i} bind:group={optionIndex} />
            <span class="option-label">{choice.label}</span>
            <span class="option-price">${choice.price}</span>
          </label>
        {/each}
      </fieldset>

      <div class="row">
        <label class="qty" for="qty">
          Quantity
          <span class="stepper">
            <button type="button" aria-label="One fewer" onclick={() => (qty = Math.max(1, qty - 1))}>−</button>
            <input id="qty" type="number" min="1" max="20" bind:value={qty} />
            <button type="button" aria-label="One more" onclick={() => (qty = Math.min(20, qty + 1))}>+</button>
          </span>
        </label>
      </div>

      <label class="message" for="message">
        <span>Card message <span class="optional">(optional)</span></span>
        <textarea id="message" rows="3" maxlength="200" placeholder="Happy birthday, love from all of us" bind:value={message}></textarea>
      </label>

      <div class="buy">
        <button class="button" type="submit">Add to cart · ${option.price * qty}</button>
        <p class="status" role="status">
          {#if added}
            Added. <a href={resolve('/cart')}>View your cart</a>
          {/if}
        </p>
      </div>
    </form>

    <p class="care"><strong>Care:</strong> {product.care}</p>
  </div>
</article>

<style>
  .back {
    color: var(--ink-soft);
    text-decoration: none;
  }

  .back:hover {
    color: var(--peony);
  }

  .product {
    display: grid;
    grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
    gap: 2.5rem 4rem;
    align-items: start;
    margin-top: 1.75rem;
  }

  .arch {
    background: var(--grain), var(--blush);
    border-radius: 999px 999px 1.5rem 1.5rem;
    aspect-ratio: 3 / 4;
    max-width: 100%;
    display: grid;
    place-items: center;
    padding: 3rem 2.5rem 1rem;
    overflow: hidden;
  }

  .arch :global(.bloom) {
    width: auto;
    height: 100%;
  }

  h1 {
    font-size: clamp(2.4rem, 5vw, 3.6rem);
  }

  .description {
    color: var(--ink-soft);
    font-size: 1.1rem;
    margin: 0.75rem 0 1.75rem;
    max-width: 50ch;
  }

  form {
    display: grid;
    gap: 1.5rem;
  }

  .options {
    border: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.6rem;
  }

  legend,
  .qty,
  .message {
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  .options label {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.8rem 1rem;
    border: 1px solid var(--rule);
    border-radius: 0.75rem;
    background: var(--paper-raised);
    cursor: pointer;
  }

  .options label.chosen {
    border-color: var(--peony);
    box-shadow: inset 0 0 0 1px var(--peony);
  }

  .options input {
    accent-color: var(--peony);
  }

  .option-label {
    flex: 1;
  }

  .option-price {
    font-family: var(--display);
    font-size: 1.2rem;
  }

  .qty {
    display: grid;
    gap: 0.5rem;
    width: fit-content;
  }

  .stepper {
    display: inline-flex;
    align-items: center;
    border: 1px solid var(--rule);
    border-radius: 999px;
    background: var(--paper-raised);
    overflow: hidden;
  }

  .stepper button {
    width: 2.6rem;
    height: 2.6rem;
    border: none;
    background: none;
    font-size: 1.2rem;
    cursor: pointer;
  }

  .stepper input {
    width: 3rem;
    text-align: center;
    border: none;
    background: none;
    font-weight: 600;
    -moz-appearance: textfield;
    appearance: textfield;
  }

  .message {
    display: grid;
    gap: 0.5rem;
  }

  .message .optional {
    font-weight: 400;
    color: var(--ink-soft);
  }

  textarea {
    width: 100%;
    border: 1px solid var(--rule);
    border-radius: 0.75rem;
    background: var(--paper-raised);
    padding: 0.75rem 1rem;
    resize: vertical;
    font-weight: 400;
  }

  .buy {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem 1.25rem;
  }

  .status {
    margin: 0;
    color: var(--leaf);
    font-weight: 600;
  }

  .care {
    margin-top: 2rem;
    padding-top: 1.25rem;
    border-top: 1px solid var(--rule);
    color: var(--ink-soft);
  }

  @media (max-width: 46rem) {
    .product {
      grid-template-columns: 1fr;
    }

    .arch {
      width: min(18rem, 80%);
      margin-inline: auto;
    }
  }
</style>
