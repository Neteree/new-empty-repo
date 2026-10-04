<script lang="ts">
  // Opening hours picked day by day: tick the days you're open and choose the
  // times from lists, so nobody has to type them. Days in a row with the same
  // times are joined into one line ("Monday to Friday", "9am – 5pm"), in the
  // { days, times } shape the starter's site.json and scripts/changes.js use.
  // `hours` is empty until at least one day is open and every time makes sense.
  type Row = { days: string; times: string };
  let { hours = $bindable<Row[]>([]), id, invalid = false }: { hours?: Row[]; id: string; invalid?: boolean } = $props();

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  // Every half hour from 5am to midnight, as minutes after midnight.
  const TIMES = Array.from({ length: 39 }, (_, i) => 300 + i * 30);

  function label(minutes: number) {
    const h = Math.floor(minutes / 60) % 24;
    const m = minutes % 60;
    if (minutes === 1440) return 'Midnight';
    if (minutes === 720) return '12pm';
    const hour = h % 12 || 12;
    return `${hour}${m ? `:${String(m).padStart(2, '0')}` : ''}${h < 12 ? 'am' : 'pm'}`;
  }

  let days = $state(DAYS.map(() => ({ open: false, from: 540, to: 1020 })));

  /** Opening a day starts it with the times of the nearest open day before it. */
  function toggle(i: number) {
    if (!days[i].open) return;
    const before = days.slice(0, i).findLast((d) => d.open) ?? days.find((d, j) => j !== i && d.open);
    if (before) Object.assign(days[i], { from: before.from, to: before.to });
  }

  function copyToAll() {
    const first = days.find((d) => d.open);
    if (first) for (const d of days) if (d.open) Object.assign(d, { from: first.from, to: first.to });
  }

  const wrong = $derived(days.map((d) => d.open && d.to <= d.from));
  const openCount = $derived(days.filter((d) => d.open).length);

  function daysLabel(start: number, end: number) {
    if (start === end) return DAYS[start];
    if (end === start + 1) return `${DAYS[start]} and ${DAYS[end]}`;
    return `${DAYS[start]} to ${DAYS[end]}`;
  }

  $effect(() => {
    if (!openCount || wrong.some(Boolean)) {
      hours = [];
      return;
    }
    const times = days.map((d) => (d.open ? `${label(d.from)} – ${label(d.to)}` : 'Closed'));
    const rows: Row[] = [];
    let start = 0;
    for (let i = 1; i <= DAYS.length; i++) {
      if (i === DAYS.length || times[i] !== times[start]) {
        rows.push({ days: daysLabel(start, i - 1), times: times[start] });
        start = i;
      }
    }
    hours = rows;
  });
</script>

<div class="hours" role="group" aria-labelledby="{id}-label">
  {#each DAYS as day, i (day)}
    <div class="day" class:open={days[i].open}>
      <label class="name">
        <input type="checkbox" bind:checked={days[i].open} onchange={() => toggle(i)} aria-invalid={invalid && !openCount} />
        {day}
      </label>
      {#if days[i].open}
        <select aria-label="{day} opens" bind:value={days[i].from} aria-invalid={wrong[i]}>
          {#each TIMES.slice(0, -1) as t (t)}<option value={t}>{label(t)}</option>{/each}
        </select>
        <span class="to" aria-hidden="true">to</span>
        <select aria-label="{day} closes" bind:value={days[i].to} aria-invalid={wrong[i]}>
          {#each TIMES.slice(1) as t (t)}<option value={t}>{label(t)}</option>{/each}
        </select>
      {:else}
        <span class="closed">Closed</span>
      {/if}
    </div>
    {#if wrong[i]}<p class="error">{day} closes before it opens.</p>{/if}
  {/each}
  {#if openCount > 1}
    <button class="copy" type="button" onclick={copyToAll}>Use the first day’s times for every open day</button>
  {/if}
</div>

<style>
  .hours {
    display: grid;
    gap: 0.5rem;
  }
  .day {
    display: grid;
    grid-template-columns: 9rem 7rem auto 7rem;
    justify-content: start;
    align-items: center;
    gap: 0.5rem;
    min-height: 2.9rem;
  }
  .name {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    cursor: pointer;
  }
  .name input {
    width: 1.2rem;
    height: 1.2rem;
    accent-color: var(--accent);
  }
  select {
    width: 100%;
    border: 2px solid var(--ink);
    border-radius: 0.4rem;
    background: var(--paper);
    color: var(--ink);
    padding: 0.5rem 0.4rem;
    font: inherit;
  }
  [aria-invalid='true'] {
    border-color: var(--error);
  }
  .to {
    color: var(--ink-soft);
  }
  .closed {
    grid-column: 2 / -1;
    color: var(--ink-soft);
  }
  .error {
    margin: 0;
    color: var(--error);
    font-size: 0.92rem;
    font-weight: 600;
  }
  .copy {
    justify-self: start;
    border: 2px solid var(--ink);
    border-radius: 0.4rem;
    background: none;
    color: var(--ink);
    padding: 0.4rem 0.8rem;
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }
  @media (max-width: 26rem) {
    .day {
      grid-template-columns: 1fr auto 1fr;
    }
    .name,
    .closed {
      grid-column: 1 / -1;
    }
    .closed {
      margin-top: -0.6rem;
      padding-left: 1.7rem;
    }
  }
</style>
