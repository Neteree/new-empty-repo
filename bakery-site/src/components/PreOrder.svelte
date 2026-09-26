<script lang="ts">
  import { onMount } from 'svelte';
  import BakeArt from './BakeArt.svelte';
  import { bakes, weekend, MAX_EACH, type Bake, type Tag } from '../data/bakes';
  import { order, restoreOnce } from '../lib/order.svelte';

  onMount(restoreOnce);

  let filter = $state<Tag | 'all'>('all');
  let placed = $state(false);

  const filters: { id: Tag | 'all'; label: string }[] = [
    { id: 'all', label: 'Everything' },
    { id: 'vegan', label: 'Vegan' },
    { id: 'gluten-free', label: 'Gluten-free' },
  ];

  const shown = $derived(bakes.filter((bake) => filter === 'all' || bake.tags.includes(filter)));
  const dayLabel = $derived(weekend.days.find((d) => d.id === order.day)?.label ?? '');

  function availability(bake: Bake): 'available' | 'not-today' | 'sold-out' {
    if (!bake.days.includes(order.day)) return 'not-today';
    if (bake.soldOut?.includes(order.day)) return 'sold-out';
    return 'available';
  }

  const money = (n: number) => `$${n.toFixed(2)}`;
</script>

<div class="pre-order">
  <div class="controls">
    <div class="days" role="radiogroup" aria-label="Pickup day">
      {#each weekend.days as day (day.id)}
        <button
          type="button"
          role="radio"
          aria-checked={order.day === day.id}
          class:active={order.day === day.id}
          onclick={() => { order.setDay(day.id); placed = false; }}
        >
          {day.label}
        </button>
      {/each}
    </div>
    <div class="filters" role="group" aria-label="Dietary filter">
      {#each filters as f (f.id)}
        <button type="button" aria-pressed={filter === f.id} class:active={filter === f.id} onclick={() => (filter = f.id)}>
          {f.label}
        </button>
      {/each}
    </div>
  </div>

  <div class="layout">
    <ul class="menu">
      {#each shown as bake (bake.id)}
        {@const status = availability(bake)}
        {@const qty = order.quantities[bake.id] ?? 0}
        <li class="item" class:unavailable={status !== 'available'}>
          <div class="art">
            <BakeArt art={bake.art} />
            {#if bake.note && status === 'available'}<span class="hand">{bake.note}</span>{/if}
            {#if status === 'sold-out'}<span class="stamp">Sold out</span>{/if}
          </div>
          <div class="info">
            <h3>{bake.name}</h3>
            <p>{bake.description}</p>
            <p class="meta">
              <span class="price">{money(bake.price)}</span>
              {#each bake.tags as tag (tag)}<span class="tag">{tag === 'vegan' ? 'Vegan' : 'Gluten-free'}</span>{/each}
            </p>
          </div>
          <div class="action">
            {#if status === 'not-today'}
              <span class="note">{bake.days.includes('sat') ? 'Saturday only' : 'Sunday only'}</span>
            {:else if status === 'sold-out'}
              <span class="note">Gone for {dayLabel.split(' ')[0]}</span>
            {:else if qty === 0}
              <button class="add" type="button" onclick={() => { order.setQty(bake.id, 1); placed = false; }}>
                Add <span class="visually-hidden">{bake.name}</span>
              </button>
            {:else}
              <span class="stepper">
                <button type="button" aria-label="One fewer {bake.name}" onclick={() => order.setQty(bake.id, qty - 1)}>−</button>
                <span class="qty" aria-live="polite">{qty}</span>
                <button type="button" aria-label="One more {bake.name}" disabled={qty >= MAX_EACH} onclick={() => order.setQty(bake.id, qty + 1)}>+</button>
              </span>
            {/if}
          </div>
        </li>
      {:else}
        <li class="empty-filter">Nothing matches that filter this weekend.</li>
      {/each}
    </ul>

    <aside class="ticket" aria-label="Your pre-order">
      <p class="ticket-head">Pre-order ticket</p>
      {#if placed}
        <div class="placed" role="status">
          <p class="big">Order received!</p>
          <p>
            In the real shop you'd now pay and get a confirmation email. This is a demo, so nothing
            has been ordered or charged.
          </p>
          <button class="button" type="button" onclick={() => { order.clear(); placed = false; }}>Start a new order</button>
        </div>
      {:else if order.count === 0}
        <p class="empty">Nothing yet. Add a few things from the bench.</p>
      {:else}
        <ul class="lines">
          {#each order.lines as line (line.bake.id)}
            <li><span>{line.qty} × {line.bake.name}</span><span>{money(line.qty * line.bake.price)}</span></li>
          {/each}
        </ul>
        <label class="pickup" for="pickup">
          Pickup on {dayLabel}
          <select id="pickup" bind:value={order.pickup} onchange={() => order.save()}>
            {#each weekend.pickupTimes as time (time)}<option value={time}>{time}</option>{/each}
          </select>
        </label>
        <p class="total"><span>Total</span><span>{money(order.total)}</span></p>
        <p class="fine">Order by {weekend.orderBy}. Prices include GST.</p>
        <button class="button" type="button" onclick={() => (placed = true)}>Place pre-order</button>
      {/if}
    </aside>
  </div>
</div>

<style>
  .controls {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .days,
  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .controls button {
    border: 2px solid var(--ink);
    background: var(--paper);
    border-radius: 999px;
    padding: 0.45rem 1.1rem;
    font-weight: 700;
    cursor: pointer;
  }

  .days button.active {
    background: var(--blue);
    border-color: var(--blue);
    color: var(--on-blue);
  }

  .filters button {
    border-width: 1.5px;
    font-weight: 500;
  }

  .filters button.active {
    background: var(--yellow);
    border-color: var(--yellow);
    color: #16213e;
  }

  .layout {
    display: grid;
    grid-template-columns: minmax(0, 1.7fr) minmax(0, 1fr);
    gap: 2rem 3rem;
    align-items: start;
  }

  .menu {
    list-style: none;
    margin: 0;
    padding: 0;
    border-top: 2px solid var(--ink);
  }

  .item {
    display: grid;
    grid-template-columns: 7.5rem minmax(0, 1fr) auto;
    gap: 1rem 1.5rem;
    align-items: center;
    padding-block: 1.25rem;
    border-bottom: 1.5px dashed var(--rule);
  }

  .item.unavailable .art :global(.bake-art),
  .item.unavailable .info {
    opacity: 0.45;
  }

  .art {
    position: relative;
  }

  .hand {
    position: absolute;
    right: -0.6rem;
    top: -0.8rem;
    font-family: var(--hand);
    font-size: 1.15rem;
    line-height: 1;
    color: var(--blue);
    transform: rotate(-6deg);
    white-space: nowrap;
  }

  .stamp {
    position: absolute;
    inset: 50% auto auto 50%;
    transform: translate(-50%, -50%) rotate(-12deg);
    border: 2px solid var(--blue);
    color: var(--blue);
    padding: 0.1rem 0.5rem;
    font-weight: 800;
    text-transform: uppercase;
    font-size: 0.75rem;
    letter-spacing: 0.08em;
    background: var(--paper);
  }

  .info h3 {
    font-size: 1.35rem;
  }

  .info p {
    margin: 0.2rem 0 0;
    color: var(--ink-soft);
  }

  .meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
  }

  .price {
    font-weight: 700;
    color: var(--ink);
    font-variant-numeric: tabular-nums;
  }

  .tag {
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.05rem 0.5rem;
    border-radius: 999px;
    background: var(--yellow);
    color: #16213e;
  }

  .add {
    border: 2px solid var(--ink);
    background: var(--ink);
    color: var(--paper);
    border-radius: 999px;
    padding: 0.5rem 1.2rem;
    font-weight: 700;
    cursor: pointer;
  }

  .add:hover {
    background: var(--blue);
    border-color: var(--blue);
  }

  .stepper {
    display: inline-flex;
    align-items: center;
    border: 2px solid var(--ink);
    border-radius: 999px;
  }

  .stepper button {
    width: 2.3rem;
    height: 2.3rem;
    border: none;
    background: none;
    font-size: 1.15rem;
    font-weight: 700;
    cursor: pointer;
  }

  .stepper button:disabled {
    opacity: 0.3;
    cursor: default;
  }

  .qty {
    min-width: 1.4rem;
    text-align: center;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .note {
    font-family: var(--hand);
    font-size: 1.2rem;
    color: var(--ink-soft);
    white-space: nowrap;
  }

  .empty-filter {
    padding-block: 2rem;
    color: var(--ink-soft);
  }

  /* The order summary looks like a paper order ticket with a torn top edge. */
  .ticket {
    position: sticky;
    top: calc(env(safe-area-inset-top, 0px) + 1rem);
    background: var(--ticket);
    color: #16213e;
    padding: 1.75rem 1.5rem 1.5rem;
    box-shadow: 0 16px 30px -18px rgb(22 33 62 / 0.45);
    clip-path: polygon(0 6px, 4% 0, 8% 6px, 12% 0, 16% 6px, 20% 0, 24% 6px, 28% 0, 32% 6px, 36% 0, 40% 6px, 44% 0, 48% 6px, 52% 0, 56% 6px, 60% 0, 64% 6px, 68% 0, 72% 6px, 76% 0, 80% 6px, 84% 0, 88% 6px, 92% 0, 96% 6px, 100% 0, 100% 100%, 0 100%);
    display: grid;
    gap: 1rem;
  }

  .ticket-head {
    margin: 0;
    font-family: var(--hand);
    font-size: 1.6rem;
    line-height: 1;
    color: #2350c8;
  }

  .empty {
    margin: 0;
    color: #4b5470;
  }

  .lines {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.4rem;
    font-variant-numeric: tabular-nums;
  }

  .lines li,
  .total {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
  }

  .pickup {
    display: grid;
    gap: 0.35rem;
    font-weight: 700;
    border-top: 1.5px dashed #b9bfd0;
    padding-top: 0.9rem;
  }

  select {
    border: 2px solid #16213e;
    border-radius: 0.5rem;
    background: #fff;
    color: #16213e;
    padding: 0.45rem 0.6rem;
    font-weight: 500;
  }

  .total {
    margin: 0;
    font-family: var(--display);
    font-size: 1.5rem;
    font-weight: 800;
    border-top: 2px solid #16213e;
    padding-top: 0.75rem;
  }

  .fine {
    margin: 0;
    font-size: 0.85rem;
    color: #4b5470;
  }

  .ticket .button {
    width: 100%;
  }

  .placed {
    display: grid;
    gap: 0.75rem;
  }

  .placed p {
    margin: 0;
  }

  .big {
    font-family: var(--display);
    font-size: 1.6rem;
    font-weight: 800;
  }

  @media (max-width: 56rem) {
    .layout {
      grid-template-columns: 1fr;
    }

    .ticket {
      position: static;
    }
  }

  @media (max-width: 34rem) {
    .item {
      grid-template-columns: 5.5rem minmax(0, 1fr);
    }

    .action {
      grid-column: 2;
    }
  }
</style>
