<script lang="ts">
  // A new website, in four steps after "What can I help with?": their
  // business, "Build your site" (one list: what's included and the add-ons,
  // with prices from the price list, and "Something else?" for anything that
  // doesn't exist yet), a look, then contact details. Every question inside
  // the list can be left for later. It sends the answers the starter's
  // scripts/onboard.js turns into a site, plus the quote; nothing is built
  // until Cameron has checked it. Answers are kept in the browser until sent.
  import { onMount } from 'svelte';
  import { site } from '../../site.config';
  import { looks } from '../../lib/catalogue';
  import { send, canUpload } from '../../lib/send';
  import { money } from '../../lib/money';
  import { load, save, clear } from '../../lib/store';
  import lists from '../../data/lists.json';
  import PhotoPicker from '../../components/forms/PhotoPicker.svelte';
  import HoursPicker from '../../components/forms/HoursPicker.svelte';
  import data from './start.json';

  type Item = { id: string; label: string; text: string; on?: boolean; locked?: boolean; module?: string; price?: string };
  type ListDef = { key: string; noun: string; fields: Record<string, { label: string; kind?: string; required?: boolean; example?: string }> };

  let { prices, onback, asked = [] }: { prices: Record<string, number>; onback: () => void; asked?: string[] } = $props();

  const items = data.items as Item[];
  const priceOf = (item: Item) => (item.price ? prices[item.price] : undefined);
  const base = $derived(prices[data.base]);
  // Items whose price list entry is missing aren't offered (the price list is the source of truth).
  const offered = $derived(items.filter((item) => !item.price || priceOf(item) !== undefined));
  const listDef = (item: Item) => (item.module ? ((lists as Record<string, ListDef>)[item.module] ?? null) : null);
  /** The fields a person can fill in for a list section here (photos come later). */
  const textFields = (def: ListDef) => Object.entries(def.fields).filter(([, f]) => !f.kind || ['text', 'long', 'quote'].includes(f.kind));

  const DRAFT = 'start-new-site';
  const blank = () => ({
    name: '',
    suburb: '',
    city: 'Auckland',
    about: '',
    chosen: Object.fromEntries(items.map((item) => [item.id, Boolean(item.on)])) as Record<string, boolean>,
    open: '' as string,
    headline: '',
    standout: '',
    visit: '',
    noHours: false,
    hours: [] as { days: string; times: string }[],
    address: '',
    sitePhone: '',
    instagram: '',
    facebook: '',
    enquiryTypes: '',
    rows: {} as Record<string, Record<string, string>[]>,
    preOrder: false,
    quote: false,
    pageText: '',
    custom: '',
    theme: '',
    email: '',
    phone: '',
    notes: '',
  });
  let a = $state(blank());
  // Photos can't be kept in the browser between visits, so they live outside the draft.
  let logos = $state<File[]>([]);
  let photos = $state<File[]>([]);
  let photoDescriptions = $state<string[]>([]);
  let mainPhoto = $state<string | null>(null);
  let botcheck = $state(false);
  let status = $state<'idle' | 'sending' | 'sent' | 'failed'>('idle');
  let failure = $state('');
  let ready = false;

  onMount(() => {
    const draft = load<ReturnType<typeof blank>>(DRAFT);
    if (draft) a = { ...blank(), ...draft, chosen: { ...blank().chosen, ...draft.chosen } };
    // Add-ons named in the link (e.g. ?modules=food from an older email) start ticked.
    for (const module of asked) {
      const item = items.find((i) => i.module === module);
      if (item) a.chosen[item.id] = true;
    }
    ready = true;
  });
  $effect(() => {
    const snapshot = $state.snapshot(a);
    if (ready && status !== 'sent') save(DRAFT, snapshot);
  });

  const steps = ['Your business', 'Build your site', 'Your look', 'Your details'] as const;
  let step = $state(0);
  let tried = $state([false, false, false, false]);
  let heading = $state<HTMLElement>();

  const errors = $derived({
    name: a.name.trim() ? '' : 'Enter your business name.',
    suburb: a.suburb.trim() ? '' : 'Enter your suburb or area.',
    city: a.city.trim() ? '' : 'Enter your town or city.',
    about: a.about.trim().length >= 20 ? '' : 'Tell customers a little about what you do (a sentence or two).',
    theme: a.theme ? '' : 'Choose a look.',
    photos: photoProblem(),
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email) ? '' : 'Enter an email address like you@example.com.',
  });
  const stepFields = [['name', 'suburb', 'city', 'about'], ['photos'], ['theme'], ['email']] as const;
  const stepValid = (i: number) => stepFields[i].every((field) => !errors[field]);

  function photoProblem() {
    const all = [...logos, ...photos];
    if (photos.length > 12) return 'Please choose up to 12 photos.';
    const wrong = all.find((file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type));
    if (wrong) return `“${wrong.name}” isn’t a JPG, PNG or WebP photo.`;
    const big = all.find((file) => file.size > 15 * 1024 * 1024);
    return big ? `“${big.name}” is too big. Photos can be up to 15 MB each.` : '';
  }

  /** The quote: the base site, each ticked add-on, and whether something needs quoting. */
  const quote = $derived.by(() => {
    const lines = offered.filter((item) => a.chosen[item.id] && priceOf(item) !== undefined).map((item) => ({ label: item.label, price: priceOf(item)! }));
    const total = (base ?? 0) + lines.reduce((sum, line) => sum + line.price, 0);
    return { lines, total, custom: a.custom.trim() };
  });
  const totalText = $derived(`${money(quote.total)}${quote.custom ? ' + quote' : ''}`);

  function go(to: number) {
    step = to;
    requestAnimationFrame(() => heading?.focus());
  }
  function next() {
    tried[step] = true;
    if (stepValid(step)) go(step + 1);
  }
  function back() {
    if (step === 0) onback();
    else go(step - 1);
  }
  const blankRow = (def: ListDef) => Object.fromEntries(textFields(def).map(([name]) => [name, '']));
  /** Opens an item's questions (a list section starts with one empty row). */
  function openItem(item: Item) {
    const def = listDef(item);
    if (def && !a.rows[item.id]?.length) a.rows[item.id] = [blankRow(def)];
    a.open = item.id;
  }
  function toggle(item: Item) {
    if (item.locked) return;
    a.chosen[item.id] = !a.chosen[item.id];
    if (a.chosen[item.id]) openItem(item);
    else if (a.open === item.id) a.open = '';
  }

  /** The answers in the shape the starter's onboarding script expects. */
  function clientJson() {
    const chosen = offered.filter((item) => a.chosen[item.id]);
    const filledRows = (item: Item) => {
      const def = listDef(item)!;
      const fields = textFields(def);
      return (a.rows[item.id] ?? [])
        .map((row) => Object.fromEntries(fields.map(([name]) => [name, (row[name] ?? '').trim()]).filter(([, v]) => v)))
        .filter((row) => fields.every(([name, f]) => !f.required || row[name]));
    };
    const listContent = Object.fromEntries(chosen.filter((item) => listDef(item)).map((item) => [item.module!, filledRows(item)]).filter(([, rows]) => (rows as unknown[]).length));
    return {
      onboarding: 1,
      name: a.name.trim(),
      suburb: a.suburb.trim(),
      city: a.city.trim(),
      about: a.about.trim(),
      headline: a.chosen.wording ? a.headline.trim() : '',
      standout: a.chosen.wording ? a.standout.trim() : '',
      visit: a.chosen.finding ? a.visit.trim() : '',
      address: a.chosen.finding ? a.address.trim() : '',
      sitePhone: a.chosen.finding ? a.sitePhone.trim() : '',
      instagram: a.chosen.finding ? a.instagram.trim() : '',
      facebook: a.chosen.finding ? a.facebook.trim() : '',
      hours: a.chosen.finding && !a.noHours ? a.hours : [],
      noHours: !a.chosen.finding || a.noHours || !a.hours.length,
      enquiryTypes: a.enquiryTypes.split('\n').map((line) => line.trim()).filter(Boolean),
      theme: a.theme,
      modules: chosen.filter((item) => item.module).map((item) => item.module!),
      lists: listContent,
      preOrder: Boolean(a.chosen.menu && a.preOrder),
      quote: Boolean(a.chosen.booking && a.quote),
      extras: [
        ...(a.chosen.page ? [`Extra page${a.pageText.trim() ? `: ${a.pageText.trim()}` : ''}`] : []),
        ...(a.chosen.news ? ['News you edit yourself'] : []),
        ...(quote.custom ? [`Something else: ${quote.custom}`] : []),
      ],
      estimate: { total: quote.total, lines: quote.lines, custom: quote.custom },
      contact: { email: a.email.trim(), phone: a.phone.trim() },
      photoDescriptions: canUpload ? photos.map((_, i) => (photoDescriptions[i] ?? '').trim()) : [],
      heroPhoto: canUpload && mainPhoto?.startsWith('new:') ? Number(mainPhoto.slice(4)) : -1,
    };
  }

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    tried[step] = true;
    if (step < steps.length - 1) return next();
    if (!stepValid(step) || status === 'sending') return;
    if (!site.formKey && !site.intakeUrl) {
      status = 'sent';
      return;
    }
    status = 'sending';
    failure = '';
    const answers = clientJson();
    try {
      await send({
        kind: 'onboarding',
        subject: `New website: ${answers.name}`,
        fields: {
          name: answers.name,
          email: answers.contact.email,
          phone: answers.contact.phone || '-',
          where: `${answers.suburb}, ${answers.city}`,
          chosen: [...quote.lines.map((line) => `${line.label} ${money(line.price)}`), ...answers.extras].join('; ') || 'The base site',
          estimate: totalText,
          notes: a.notes.trim() || '-',
        },
        payload: answers,
        block: 'CLIENT',
        logo: canUpload ? (logos[0] ?? null) : null,
        photos: canUpload ? photos : [],
        botcheck,
      });
      status = 'sent';
      clear(DRAFT);
    } catch (error) {
      failure = error instanceof Error ? error.message : '';
      status = 'failed';
    }
  }
</script>

{#if status === 'sent'}
  <div class="sent" role="status">
    <p class="big">Thanks, that’s everything I need.</p>
    {#if site.formKey || site.intakeUrl}
      <p>I’ll check it and send you a quote. Nothing to pay now, and nothing is built until you’ve said yes.</p>
    {:else}
      <p>This form isn't connected yet, so nothing was sent.</p>
    {/if}
  </div>
{:else}
  <form novalidate onsubmit={submit}>
    <div class="progress">
      <p class="step-count" aria-live="polite">Step {step + 2} of {steps.length + 1}</p>
      <h2 class="step-title" tabindex="-1" bind:this={heading}>{steps[step]}</h2>
      <progress max={steps.length + 1} value={step + 2} aria-hidden="true"></progress>
    </div>

    {#if step === 0}
      <div class="field">
        <label for="n-name">Business name</label>
        <input id="n-name" autocomplete="organization" bind:value={a.name} aria-invalid={tried[0] && !!errors.name} aria-describedby="n-name-err" />
        {#if tried[0] && errors.name}<p class="error" id="n-name-err">{errors.name}</p>{/if}
      </div>
      <div class="row">
        <div class="field">
          <label for="n-suburb">Suburb or area</label>
          <input id="n-suburb" bind:value={a.suburb} aria-invalid={tried[0] && !!errors.suburb} aria-describedby="n-suburb-err" />
          {#if tried[0] && errors.suburb}<p class="error" id="n-suburb-err">{errors.suburb}</p>{/if}
        </div>
        <div class="field">
          <label for="n-city">Town or city</label>
          <input id="n-city" autocomplete="address-level2" bind:value={a.city} aria-invalid={tried[0] && !!errors.city} aria-describedby="n-city-err" />
          {#if tried[0] && errors.city}<p class="error" id="n-city-err">{errors.city}</p>{/if}
        </div>
      </div>
      <div class="field">
        <label for="n-about">What you do, in a sentence or two</label>
        <p class="hint" id="n-about-hint">The way you’d tell a new customer. It goes near the top of your site.</p>
        <textarea id="n-about" rows="3" bind:value={a.about} aria-invalid={tried[0] && !!errors.about} aria-describedby="n-about-hint n-about-err"></textarea>
        {#if tried[0] && errors.about}<p class="error" id="n-about-err">{errors.about}</p>{/if}
      </div>
    {:else if step === 1}
      <p class="hint">Tick what you need. Anything you can fill in now, or leave it for later.</p>
      {#each [true, false] as included (included)}
        <h3 class="group">{included ? 'Included' : 'Add-ons'}</h3>
        <ul class="items">
          {#each offered.filter((item) => !item.price === included) as item (item.id)}
            {@const def = listDef(item)}
            <li class="item" class:on={a.chosen[item.id]}>
              <label class="item-head">
                <input type="checkbox" checked={a.chosen[item.id]} disabled={item.locked} onchange={() => toggle(item)} />
                <span class="item-name">{item.label}<span class="item-text">{item.text}</span></span>
                <span class="item-price">{item.price ? `+${money(priceOf(item)!)}` : 'Included'}</span>
              </label>
              {#if a.chosen[item.id] && !item.locked}
                {#if a.open === item.id}
                  <div class="item-body">
                    {#if item.id === 'wording'}
                      <div class="field"><label for="n-headline">A headline</label><p class="hint" id="n-headline-hint">A few punchy words, like “Bread worth the ferry ride.” Leave it blank and I’ll suggest one.</p><input id="n-headline" bind:value={a.headline} aria-describedby="n-headline-hint" /></div>
                      <div class="field"><label for="n-standout">What sets you apart, in a few words</label><input id="n-standout" placeholder="family run since 1998" bind:value={a.standout} /></div>
                    {:else if item.id === 'finding'}
                      <div class="field"><label for="n-visit">Where customers find you</label><p class="hint" id="n-visit-hint">Your address and any tips, or the areas you cover if you come to them.</p><textarea id="n-visit" rows="2" bind:value={a.visit} aria-describedby="n-visit-hint"></textarea></div>
                      <div class="field">
                        <span class="label">Opening hours</span>
                        <label class="tick"><input type="checkbox" bind:checked={a.noHours} /> No opening hours (people don’t visit at set times)</label>
                        {#if !a.noHours}<HoursPicker id="n-hours" bind:hours={a.hours} invalid={false} />{/if}
                      </div>
                      <div class="field"><label for="n-address">Street address for a map link</label><input id="n-address" placeholder="12 Main Road, Green Bay, Auckland" bind:value={a.address} /></div>
                      <div class="field"><label for="n-site-phone">Phone number for customers</label><p class="hint" id="n-site-phone-hint">Shown on your site so people can tap to call.</p><input id="n-site-phone" type="tel" bind:value={a.sitePhone} aria-describedby="n-site-phone-hint" /></div>
                      <div class="row">
                        <div class="field"><label for="n-instagram">Instagram</label><input id="n-instagram" placeholder="@yourbusiness" bind:value={a.instagram} /></div>
                        <div class="field"><label for="n-facebook">Facebook page</label><input id="n-facebook" placeholder="facebook.com/yourbusiness" bind:value={a.facebook} /></div>
                      </div>
                    {:else if item.id === 'photos'}
                      {#if canUpload}
                        <span class="label">Your logo</span>
                        <PhotoPicker label="logo" bind:photos={logos} max={1} describe={false} />
                        <span class="label">Your photos</span>
                        <p class="hint">Your place, your products and your team make the biggest difference. Pick your best as the main photo.</p>
                        <PhotoPicker label="photos" bind:photos bind:descriptions={photoDescriptions} pickMain autoMain bind:main={mainPhoto} noMainLabel="No main photo (use a simple drawing instead)" />
                        {#if tried[1] && errors.photos}<p class="error" role="alert">{errors.photos}</p>{/if}
                      {:else}
                        <p class="hint">After you send this, email me your logo and any photos.</p>
                      {/if}
                    {:else if def}
                      {#each a.rows[item.id] ?? [] as row, r (r)}
                        <div class="row">
                          {#each textFields(def) as [name, f] (name)}
                            <div class="field">
                              <label for="n-{item.id}-{r}-{name}">{f.label}</label>
                              <input id="n-{item.id}-{r}-{name}" placeholder={f.example ?? ''} bind:value={row[name]} />
                            </div>
                          {/each}
                        </div>
                      {/each}
                      <button class="small" type="button" onclick={() => a.rows[item.id].push(blankRow(def))}>Add another {def.noun}</button>
                    {:else if item.id === 'work'}
                      <p class="hint">Send photos of a few past jobs after this, with a line about each, or add them later.</p>
                    {:else if item.id === 'menu'}
                      <label class="tick"><input type="checkbox" bind:checked={a.preOrder} /> Customers can order ahead for pickup</label>
                      <p class="hint">I’ll ask for your menu after this.</p>
                    {:else if item.id === 'prices' || item.id === 'shop'}
                      <p class="hint">I’ll ask for your {item.id === 'shop' ? 'products' : 'prices'} after this.</p>
                    {:else if item.id === 'booking'}
                      <label class="tick"><input type="radio" name="n-booking" value={false} bind:group={a.quote} /> Bookings: customers ask for a day and time</label>
                      <label class="tick"><input type="radio" name="n-booking" value={true} bind:group={a.quote} /> Quotes: customers describe a job and you price it</label>
                    {:else if item.id === 'page'}
                      <div class="field"><label for="n-page">What goes on it?</label><textarea id="n-page" rows="2" bind:value={a.pageText}></textarea></div>
                    {:else}
                      <p class="hint">Nothing to fill in now.</p>
                    {/if}
                    <button class="later" type="button" onclick={() => (a.open = '')}>Done, or add later</button>
                  </div>
                {:else}
                  <button class="later" type="button" onclick={() => openItem(item)}>Fill in now</button>
                {/if}
              {/if}
            </li>
          {/each}
        </ul>
      {/each}
      <div class="item custom" class:on={!!a.custom.trim()}>
        <label for="n-custom" class="item-head"><span class="item-name">Something else?<span class="item-text">Anything that isn’t listed, even a game. I’ll quote it.</span></span><span class="item-price">Quoted</span></label>
        <textarea id="n-custom" rows="2" bind:value={a.custom}></textarea>
      </div>
      {#if a.chosen.contact}
        <div class="field">
          <label for="n-enquiries">What customers usually contact you about <span class="optional">(optional)</span></label>
          <p class="hint" id="n-enquiries-hint">One per line, like “A quote” or “Booking a table”. These become choices on your contact form.</p>
          <textarea id="n-enquiries" rows="2" bind:value={a.enquiryTypes} aria-describedby="n-enquiries-hint"></textarea>
        </div>
      {/if}
    {:else if step === 2}
      <fieldset class="looks">
        <legend class="visually-hidden">Choose a look</legend>
        {#each looks as option (option.id)}
          <label class="look" class:chosen={a.theme === option.id}>
            <input type="radio" name="n-theme" value={option.id} bind:group={a.theme} />
            <svg class="swatches" viewBox="0 0 66 20" aria-hidden="true">{#each option.swatches as colour, k (k)}<rect x={k * 23} width="20" height="20" rx="10" fill={colour} stroke="currentColor" stroke-opacity="0.3" />{/each}</svg>
            <span class="look-name">{option.name}</span>
            <span class="look-text">{option.text}</span>
          </label>
        {/each}
      </fieldset>
      {#if tried[2] && errors.theme}<p class="error">{errors.theme}</p>{/if}
    {:else}
      <p class="hint">Only I see these. They aren’t shown on your site.</p>
      <div class="row">
        <div class="field">
          <label for="n-email">Your email</label>
          <input id="n-email" type="email" autocomplete="email" bind:value={a.email} aria-invalid={tried[3] && !!errors.email} aria-describedby="n-email-err" />
          {#if tried[3] && errors.email}<p class="error" id="n-email-err">{errors.email}</p>{/if}
        </div>
        <div class="field">
          <label for="n-phone">Your phone <span class="optional">(optional)</span></label>
          <input id="n-phone" type="tel" autocomplete="tel" bind:value={a.phone} />
        </div>
      </div>
      <div class="field">
        <label for="n-notes">Anything else I should know? <span class="optional">(optional)</span></label>
        <textarea id="n-notes" rows="3" bind:value={a.notes}></textarea>
      </div>
      <div class="summary">
        <p class="label">Your quote</p>
        <ul>
          {#if base !== undefined}<li><span>Your website</span><span>{money(base)}</span></li>{/if}
          {#each quote.lines as line (line.label)}<li><span>{line.label}</span><span>{money(line.price)}</span></li>{/each}
          {#if quote.custom}<li><span>Something else</span><span>Quoted</span></li>{/if}
        </ul>
        <p class="hint">A starting point. I’ll confirm the price before any work starts.</p>
      </div>
    {/if}

    <input class="botcheck" type="checkbox" tabindex="-1" aria-hidden="true" bind:checked={botcheck} />
    <div class="nav">
      <button class="button ghost" type="button" onclick={back}>Back</button>
      {#if step < steps.length - 1}
        <button class="button" type="submit">Next</button>
      {:else}
        <button class="button" type="submit" disabled={status === 'sending'}>{status === 'sending' ? 'Sending…' : 'Send for a quote'}</button>
      {/if}
      {#if base !== undefined && step > 0}<p class="total" aria-live="polite">Total <b>{totalText}</b></p>{/if}
    </div>
    {#if status === 'failed'}<p class="error" role="alert">{failure || "Sorry, that didn't send."} Please try again in a moment.</p>{/if}
    {#if !site.formKey && !site.intakeUrl}<p class="note">Not connected yet: this form doesn't send anything.</p>{/if}
  </form>
{/if}

<style>
  form {
    display: grid;
    gap: 1.4rem;
  }
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
  .row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
    gap: 1rem;
  }
  .field {
    display: grid;
    gap: 0.35rem;
  }
  label,
  .label {
    font-weight: 700;
  }
  .hint {
    margin: 0;
    font-size: 0.92rem;
    color: var(--ink-soft);
  }
  .optional {
    font-weight: 400;
    color: var(--ink-soft);
  }
  input:not([type='checkbox']):not([type='radio']),
  textarea {
    width: 100%;
    border: 2px solid var(--ink);
    border-radius: 0.5rem;
    background: var(--paper);
    padding: 0.6rem 0.75rem;
  }
  [aria-invalid='true'] {
    border-color: var(--error) !important;
  }
  .error {
    margin: 0;
    color: var(--error);
    font-size: 0.9rem;
    font-weight: 600;
  }
  .group {
    font-size: 0.85rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--ink-soft);
    margin-top: 0.4rem;
  }
  .items {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.6rem;
  }
  .item {
    border: 2px solid var(--rule);
    border-radius: 0.8rem;
    padding: 0.8rem 0.9rem;
    display: grid;
    gap: 0.6rem;
    transition: border-color 0.15s;
  }
  .item.on {
    border-color: var(--accent);
  }
  .item-head {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 0.7rem;
    align-items: start;
    cursor: pointer;
  }
  .custom .item-head {
    grid-template-columns: 1fr auto;
    cursor: default;
  }
  .item-head input {
    width: 1.2rem;
    height: 1.2rem;
    margin-top: 0.15rem;
    accent-color: var(--accent);
  }
  .item-name {
    display: grid;
    gap: 0.1rem;
  }
  .item-text {
    font-weight: 400;
    font-size: 0.9rem;
    color: var(--ink-soft);
  }
  .item-price {
    font-weight: 700;
    white-space: nowrap;
  }
  .item-body {
    display: grid;
    gap: 0.9rem;
    padding-top: 0.6rem;
    border-top: 1.5px dashed var(--rule);
  }
  .tick {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
  }
  .later,
  .small {
    justify-self: start;
    border: none;
    background: none;
    padding: 0;
    font-weight: 700;
    color: var(--accent);
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }
  .looks {
    border: 0;
    margin: 0;
    padding: 0;
    min-width: 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
    gap: 0.8rem;
  }
  .look {
    display: grid;
    gap: 0.3rem;
    border: 2px solid var(--rule);
    border-radius: 0.8rem;
    padding: 0.9rem;
    cursor: pointer;
  }
  .look.chosen {
    border-color: var(--accent);
  }
  .look:has(input:focus-visible) {
    outline: 3px solid var(--accent);
    outline-offset: 2px;
  }
  .look input {
    position: absolute;
    opacity: 0;
    width: 1px;
    height: 1px;
  }
  .swatches {
    width: 5.3rem;
    height: 1.6rem;
  }
  .look-name {
    font-size: 1.15rem;
  }
  .look-text {
    font-weight: 400;
    font-size: 0.9rem;
    color: var(--ink-soft);
  }
  .summary ul {
    list-style: none;
    margin: 0.5rem 0;
    padding: 0;
    border-top: 2px solid var(--ink);
  }
  .summary li {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding-block: 0.5rem;
    border-bottom: 1.5px dashed var(--rule);
    font-variant-numeric: tabular-nums;
  }
  /* Back, Next and the total stay in view while the list scrolls. */
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
  .total {
    margin: 0 0 0 auto;
    font-variant-numeric: tabular-nums;
  }
  .botcheck {
    display: none;
  }
  .note {
    margin: 0;
    font-size: 0.85rem;
    color: var(--ink-soft);
  }
  .sent {
    display: grid;
    gap: 0.75rem;
  }
  .sent p {
    margin: 0;
  }
  .big {
    font-family: var(--display);
    font-size: 1.8rem;
  }
</style>
