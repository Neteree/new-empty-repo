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
  import ContactFields from './ContactFields.svelte';
  import HoursFields from './HoursFields.svelte';
  import PhotosFields from './PhotosFields.svelte';
  import BuildList from './BuildList.svelte';
  import Steps from './Steps.svelte';
  import { type Item, blankBuild, filledRows, listDef } from './build';
  import data from './start.json';

  let { prices, onback, asked = [] }: { prices: Record<string, number>; onback: () => void; asked?: string[] } = $props();

  const items = data.items as Item[];
  const priceOf = (item: Item) => (item.price ? prices[item.price] : undefined);
  const base = $derived(prices[data.base]);
  // Items whose price list entry is missing aren't offered (the price list is the source of truth).
  const offered = $derived(items.filter((item) => !item.changeOnly && (!item.price || priceOf(item) !== undefined)));

  const DRAFT = 'start-new-site';
  const blank = () => ({
    name: '',
    suburb: '',
    city: 'Auckland',
    about: '',
    build: blankBuild(items),
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
    if (draft?.build) a = { ...blank(), ...draft, build: { ...blank().build, ...draft.build, chosen: { ...blank().build.chosen, ...draft.build.chosen } } };
    // Add-ons named in the link (e.g. ?modules=food from an older email) start ticked.
    for (const module of asked) {
      const item = items.find((i) => i.module === module);
      if (item) a.build.chosen[item.id] = true;
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
    const lines = offered.filter((item) => a.build.chosen[item.id] && priceOf(item) !== undefined).map((item) => ({ label: item.label, price: priceOf(item)! }));
    const total = (base ?? 0) + lines.reduce((sum, line) => sum + line.price, 0);
    return { lines, total, custom: a.build.custom.trim() };
  });
  const totalText = $derived(`${money(quote.total)}${quote.custom ? ' + quote' : ''}`);

  function next() {
    tried[step] = true;
    if (stepValid(step)) step += 1;
  }
  function back() {
    if (step === 0) onback();
    else step -= 1;
  }
  /** The answers in the shape the starter's onboarding script expects. */
  function clientJson() {
    const { build } = a;
    const chosen = offered.filter((item) => build.chosen[item.id]);
    const listContent = Object.fromEntries(chosen.filter((item) => listDef(item)).map((item) => [item.module!, filledRows(build, item)]).filter(([, rows]) => rows.length));
    return {
      onboarding: 1,
      name: a.name.trim(),
      suburb: a.suburb.trim(),
      city: a.city.trim(),
      about: a.about.trim(),
      headline: build.chosen.wording ? a.headline.trim() : '',
      standout: build.chosen.wording ? a.standout.trim() : '',
      visit: build.chosen.finding ? a.visit.trim() : '',
      address: build.chosen.finding ? a.address.trim() : '',
      sitePhone: build.chosen.finding ? a.sitePhone.trim() : '',
      instagram: build.chosen.finding ? a.instagram.trim() : '',
      facebook: build.chosen.finding ? a.facebook.trim() : '',
      hours: build.chosen.finding && !a.noHours ? a.hours : [],
      noHours: !build.chosen.finding || a.noHours || !a.hours.length,
      enquiryTypes: a.enquiryTypes.split('\n').map((line) => line.trim()).filter(Boolean),
      theme: a.theme,
      modules: chosen.filter((item) => item.module).map((item) => item.module!),
      lists: listContent,
      preOrder: Boolean(build.chosen.menu && build.preOrder),
      quote: Boolean(build.chosen.booking && build.quote),
      extras: [
        ...(build.chosen.page ? [`Extra page${build.pageText.trim() ? `: ${build.pageText.trim()}` : ''}`] : []),
        ...(build.chosen.news ? ['News you edit yourself'] : []),
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
    <Steps {steps} {step} send="Send for a quote" sending={status === 'sending'} onback={back} total={base !== undefined && step > 0 ? `Total ${totalText}` : ''}>

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
      {#snippet wordingBody()}
        <div class="field"><label for="n-headline">A headline</label><p class="hint" id="n-headline-hint">A few punchy words, like “Bread worth the ferry ride.” Leave it blank and I’ll suggest one.</p><input id="n-headline" bind:value={a.headline} aria-describedby="n-headline-hint" /></div>
        <div class="field"><label for="n-standout">What sets you apart, in a few words</label><input id="n-standout" placeholder="family run since 1998" bind:value={a.standout} /></div>
      {/snippet}
      {#snippet findingBody()}
        <div class="field"><label for="n-visit">Where customers find you</label><p class="hint" id="n-visit-hint">Your address and any tips, or the areas you cover if you come to them.</p><textarea id="n-visit" rows="2" bind:value={a.visit} aria-describedby="n-visit-hint"></textarea></div>
        <HoursFields id="n-hours" bind:hours={a.hours} bind:none={a.noHours} />
        <ContactFields id="n" bind:phone={a.sitePhone} bind:address={a.address} bind:instagram={a.instagram} bind:facebook={a.facebook} />
      {/snippet}
      {#snippet photosBody()}
        {#if canUpload}
          <PhotosFields fresh bind:logo={logos} bind:photos bind:descriptions={photoDescriptions} bind:main={mainPhoto} />
          {#if tried[1] && errors.photos}<p class="error" role="alert">{errors.photos}</p>{/if}
        {:else}
          <p class="hint">After you send this, email me your logo and any photos.</p>
        {/if}
      {/snippet}
      <BuildList
        id="n"
        bind:build={a.build}
        groups={[{ title: 'Included', items: offered.filter((item) => !item.price) }, { title: 'Add-ons', items: offered.filter((item) => item.price) }]}
        priceText={(item) => (item.price ? `+${money(priceOf(item)!)}` : 'Included')}
        bodies={{ wording: wordingBody, finding: findingBody, photos: photosBody }}
      />
      {#if a.build.chosen.contact}
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
    </Steps>

    <input class="botcheck" type="checkbox" tabindex="-1" aria-hidden="true" bind:checked={botcheck} />
    {#if status === 'failed'}<p class="error" role="alert">{failure || "Sorry, that didn't send."} Please try again in a moment.</p>{/if}
    {#if !site.formKey && !site.intakeUrl}<p class="note">Not connected yet: this form doesn't send anything.</p>{/if}
  </form>
{/if}

<style>
  form {
    display: grid;
    gap: 1.4rem;
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
  .tick {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
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
