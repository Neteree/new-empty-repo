<script lang="ts">
  // Onboarding: a new client's details for their site. Sends through Web3Forms
  // like the contact form. Besides the readable answers, it attaches the same
  // details as one line of JSON between markers, which the starter's
  // scripts/onboard.js turns into the client's site. Add-ons Cameron agreed
  // with them come from the link, e.g. onboarding.html?modules=food (add
  // &preorder=1 for ordering ahead for pickup), or ?modules=booking&quote=1.
  import { onMount } from 'svelte';
  import { site } from '../../site.config';
  import { looks as themes, offeredModules as knownModules } from '../../lib/catalogue';
  import { send, canUpload } from '../../lib/send';
  import PhotoPicker from '../../components/forms/PhotoPicker.svelte';
  import HoursPicker from '../../components/forms/HoursPicker.svelte';

  let name = $state('');
  let suburb = $state('');
  let city = $state('Auckland');
  let about = $state('');
  let headline = $state('');
  let standout = $state('');
  let visit = $state('');
  let hours = $state<{ days: string; times: string }[]>([]);
  // For a business people don't visit at set times (online, mobile, a game).
  let noHours = $state(false);
  // Content for the highlights and how-it-works add-ons, when the link includes them.
  let highlights = $state([{ title: '', text: '' }, { title: '', text: '' }, { title: '', text: '' }]);
  let howSteps = $state([{ title: '', text: '' }, { title: '', text: '' }, { title: '', text: '' }]);
  let enquiryTypes = $state('');
  let theme = $state('');
  let email = $state('');
  let phone = $state('');
  let notes = $state('');
  let botcheck = $state(false);
  // Photos go through the Cloudflare intake; without it, clients email them instead.
  let logos = $state<File[]>([]);
  const logo = $derived(logos[0] ?? null);
  let photos = $state<File[]>([]);
  let photoDescriptions = $state<string[]>([]);
  // 'new:<index>' for the photo they picked to go beside their headline, or null.
  let mainPhoto = $state<string | null>(null);
  let address = $state('');
  let sitePhone = $state('');
  let instagram = $state('');
  let facebook = $state('');
  let failure = $state('');
  const MAX_PHOTOS = 12;
  const MAX_BYTES = 15 * 1024 * 1024;
  const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  let modules = $state<string[]>([]);
  // Weekend-style ordering ahead for pickup, switched on with &preorder=1 in the link.
  let preOrder = $state(false);
  // A quote form instead of bookings, switched on with &quote=1 in the link.
  let quote = $state(false);
  // Five short steps instead of one long form. Each step checks only its own
  // answers before moving on; all answers stay in memory until the last step.
  const steps = [
    { title: 'Your business', fields: ['name', 'suburb', 'city'] },
    { title: 'Your words', fields: ['about'] },
    { title: 'Finding you', fields: ['visit', 'hours'] },
    { title: 'Your look', fields: ['theme', 'photos'] },
    { title: 'Contact details', fields: ['email'] },
  ] as const;
  let step = $state(0);
  let tried = $state(steps.map(() => false));
  let heading = $state<HTMLElement>();
  let status = $state<'idle' | 'sending' | 'sent' | 'failed'>('idle');

  onMount(() => {
    const asked = new URLSearchParams(location.search).get('modules') ?? '';
    modules = asked.split(',').map((m) => m.trim()).filter((m) => knownModules.includes(m));
    preOrder = modules.includes('food') && new URLSearchParams(location.search).get('preorder') === '1';
    quote = modules.includes('booking') && new URLSearchParams(location.search).get('quote') === '1';
  });

  const errors = $derived({
    name: name.trim() ? '' : 'Enter your business name.',
    suburb: suburb.trim() ? '' : 'Enter your suburb or area.',
    city: city.trim() ? '' : 'Enter your town or city.',
    about: about.trim().length >= 20 ? '' : 'Tell customers a little about what you do (a sentence or two).',
    visit: visit.trim() ? '' : 'Tell customers where to find you, or the area you cover.',
    hours: hours.length || noHours ? '' : 'Tick the days you’re open and choose times that close after they open, or tick “No opening hours”.',
    theme: theme ? '' : 'Choose a look.',
    photos: photoProblem(),
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '' : 'Enter an email address like you@example.com.',
  });
  const valid = $derived(Object.values(errors).every((e) => !e));

  function photoProblem() {
    const all = [...(logo ? [logo] : []), ...photos];
    if (photos.length > MAX_PHOTOS) return `Please choose up to ${MAX_PHOTOS} photos.`;
    const wrong = all.find((file) => !IMAGE_TYPES.includes(file.type));
    if (wrong) return `“${wrong.name}” isn’t a JPG, PNG or WebP photo.`;
    const big = all.find((file) => file.size > MAX_BYTES);
    if (big) return `“${big.name}” is too big. Photos can be up to 15 MB each.`;
    return '';
  }
  const stepValid = (i: number) => steps[i].fields.every((field) => !errors[field]);

  function go(to: number) {
    step = to;
    // Move focus to the new step's heading so screen readers and keyboards follow.
    requestAnimationFrame(() => heading?.focus());
  }

  function next() {
    tried[step] = true;
    if (stepValid(step)) go(step + 1);
  }

  const filled = (rows: { title: string; text: string }[]) =>
    rows.map((row) => ({ title: row.title.trim(), text: row.text.trim() })).filter((row) => row.title && row.text);

  /** The details in the shape the starter's onboarding script expects. */
  function clientJson() {
    return {
      onboarding: 1,
      name: name.trim(),
      suburb: suburb.trim(),
      city: city.trim(),
      about: about.trim(),
      headline: headline.trim(),
      standout: standout.trim(),
      visit: visit.trim(),
      address: address.trim(),
      sitePhone: sitePhone.trim(),
      instagram: instagram.trim(),
      facebook: facebook.trim(),
      hours: noHours ? [] : hours,
      noHours,
      // Only filled-in rows; blank ones are left for Cameron to fill in.
      highlights: modules.includes('highlights') ? filled(highlights) : [],
      steps: modules.includes('steps') ? filled(howSteps) : [],
      enquiryTypes: enquiryTypes.split('\n').map((line) => line.trim()).filter(Boolean),
      theme,
      modules,
      preOrder,
      quote,
      contact: { email: email.trim(), phone: phone.trim() },
      // One per uploaded photo, in the same order; blank ones become a placeholder to fill in.
      photoDescriptions: canUpload ? photos.map((_, i) => (photoDescriptions[i] ?? '').trim()) : [],
      // Which of those photos goes beside the headline (-1 for none).
      heroPhoto: canUpload && mainPhoto?.startsWith('new:') ? Number(mainPhoto.slice(4)) : -1,
    };
  }

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    tried[step] = true;
    if (step < steps.length - 1) return next();
    if (!valid || status === 'sending') return;
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
        subject: `Onboarding: ${answers.name}`,
        fields: {
          name: answers.name,
          email: answers.contact.email,
          phone: answers.contact.phone || '-',
          where: `${answers.suburb}, ${answers.city}`,
          look: theme,
          notes: notes.trim() || '-',
        },
        payload: answers,
        block: 'CLIENT',
        logo: canUpload ? logo : null,
        photos: canUpload ? photos : [],
        botcheck,
      });
      status = 'sent';
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
      <p>
        {canUpload && (logo || photos.length)
          ? 'Your photos came through too.'
          : 'Next, email me your logo and any photos you’d like on the site.'}
        I’ll send you a preview link to look over before anything goes live.
      </p>
    {:else}
      <p>This form isn't connected yet, so nothing was sent.</p>
    {/if}
  </div>
{:else}
  <form novalidate onsubmit={submit}>
    <div class="progress">
      <p class="step-count" aria-live="polite">Step {step + 1} of {steps.length}</p>
      <h2 class="step-title" tabindex="-1" bind:this={heading}>{steps[step].title}</h2>
      <div class="bar" aria-hidden="true"><span class="fill fill-{step + 1}"></span></div>
    </div>
    <fieldset hidden={step !== 0}>
      <legend class="visually-hidden">Your business</legend>
      <div class="field">
        <label for="o-name">Business name</label>
        <input id="o-name" autocomplete="organization" bind:value={name} aria-invalid={tried[0] && !!errors.name} aria-describedby="o-name-err" />
        {#if tried[0] && errors.name}<p class="error" id="o-name-err">{errors.name}</p>{/if}
      </div>
      <div class="row">
        <div class="field">
          <label for="o-suburb">Suburb or area</label>
          <input id="o-suburb" bind:value={suburb} aria-invalid={tried[0] && !!errors.suburb} aria-describedby="o-suburb-err" />
          {#if tried[0] && errors.suburb}<p class="error" id="o-suburb-err">{errors.suburb}</p>{/if}
        </div>
        <div class="field">
          <label for="o-city">Town or city</label>
          <input id="o-city" autocomplete="address-level2" bind:value={city} aria-invalid={tried[0] && !!errors.city} aria-describedby="o-city-err" />
          {#if tried[0] && errors.city}<p class="error" id="o-city-err">{errors.city}</p>{/if}
        </div>
      </div>
    </fieldset>

    <fieldset hidden={step !== 1}>
      <legend class="visually-hidden">Your words</legend>
      <div class="field">
        <label for="o-about">What you do, in a sentence or two</label>
        <p class="hint" id="o-about-hint">Write it the way you’d tell a new customer. This goes near the top of your site.</p>
        <textarea id="o-about" rows="3" bind:value={about} aria-invalid={tried[1] && !!errors.about} aria-describedby="o-about-hint o-about-err"></textarea>
        {#if tried[1] && errors.about}<p class="error" id="o-about-err">{errors.about}</p>{/if}
      </div>
      <div class="field">
        <label for="o-headline">A headline <span class="optional">(optional)</span></label>
        <p class="hint" id="o-headline-hint">A few punchy words, like “Bread worth the ferry ride.” Leave it blank and I’ll suggest one.</p>
        <input id="o-headline" bind:value={headline} aria-describedby="o-headline-hint" />
      </div>
      <div class="field">
        <label for="o-standout">What sets you apart, in a few words <span class="optional">(optional)</span></label>
        <p class="hint" id="o-standout-hint">Like “family run since 1998” or “first loaves out at 6am”.</p>
        <input id="o-standout" bind:value={standout} aria-describedby="o-standout-hint" />
      </div>
      {#if modules.includes('highlights')}
        <fieldset class="field">
          <legend class="label">Reasons customers choose you <span class="optional">(optional)</span></legend>
          <p class="hint">Up to three, each a short title and a sentence, like “Family run since 1998: three generations baking on the same street.”</p>
          {#each highlights as row, i (i)}
            <div class="row">
              <div class="field"><label for="o-hl-title-{i}">Reason {i + 1}</label><input id="o-hl-title-{i}" bind:value={row.title} /></div>
              <div class="field"><label for="o-hl-text-{i}">About it</label><input id="o-hl-text-{i}" bind:value={row.text} /></div>
            </div>
          {/each}
        </fieldset>
      {/if}
      {#if modules.includes('steps')}
        <fieldset class="field">
          <legend class="label">How it works, step by step <span class="optional">(optional)</span></legend>
          <p class="hint">What happens from first contact to a finished job, like “Free quote: we visit and price the job the same week.”</p>
          {#each howSteps as row, i (i)}
            <div class="row">
              <div class="field"><label for="o-st-title-{i}">Step {i + 1}</label><input id="o-st-title-{i}" bind:value={row.title} /></div>
              <div class="field"><label for="o-st-text-{i}">What happens</label><input id="o-st-text-{i}" bind:value={row.text} /></div>
            </div>
          {/each}
          <button class="small" type="button" onclick={() => howSteps.push({ title: '', text: '' })}>Add a step</button>
        </fieldset>
      {/if}
    </fieldset>

    <fieldset hidden={step !== 2}>
      <legend class="visually-hidden">Finding you</legend>
      <div class="field">
        <label for="o-visit">Where customers find you</label>
        <p class="hint" id="o-visit-hint">Your address and any tips, or the areas you cover if you come to them.</p>
        <textarea id="o-visit" rows="2" bind:value={visit} aria-invalid={tried[2] && !!errors.visit} aria-describedby="o-visit-hint o-visit-err"></textarea>
        {#if tried[2] && errors.visit}<p class="error" id="o-visit-err">{errors.visit}</p>{/if}
      </div>
      <div class="field">
        <span class="label" id="o-hours-label">Opening hours</span>
        <label class="tick"><input type="checkbox" bind:checked={noHours} /> No opening hours (people don’t visit at set times)</label>
        {#if !noHours}<HoursPicker id="o-hours" bind:hours invalid={tried[2]} />{/if}
        {#if tried[2] && errors.hours}<p class="error">{errors.hours}</p>{/if}
      </div>
      <div class="field">
        <label for="o-address">Street address for a map link <span class="optional">(optional)</span></label>
        <p class="hint" id="o-address-hint">Like “12 Main Road, Green Bay, Auckland”. Leave it blank if customers don’t come to you.</p>
        <input id="o-address" bind:value={address} aria-describedby="o-address-hint" />
      </div>
      <div class="field">
        <label for="o-site-phone">Phone number for customers <span class="optional">(optional)</span></label>
        <p class="hint" id="o-site-phone-hint">Shown on your site so people can tap to call. Leave it blank to keep your number off the site.</p>
        <input id="o-site-phone" type="tel" autocomplete="tel" bind:value={sitePhone} aria-describedby="o-site-phone-hint" />
      </div>
      <div class="row">
        <div class="field">
          <label for="o-instagram">Instagram <span class="optional">(optional)</span></label>
          <input id="o-instagram" placeholder="@yourbusiness" bind:value={instagram} />
        </div>
        <div class="field">
          <label for="o-facebook">Facebook page <span class="optional">(optional)</span></label>
          <input id="o-facebook" placeholder="facebook.com/yourbusiness" bind:value={facebook} />
        </div>
      </div>
      <div class="field">
        <label for="o-enquiries">What customers usually contact you about <span class="optional">(optional)</span></label>
        <p class="hint" id="o-enquiries-hint">One per line, like “A quote” or “Booking a table”. These become choices on your enquiry form.</p>
        <textarea id="o-enquiries" rows="3" bind:value={enquiryTypes} aria-describedby="o-enquiries-hint"></textarea>
      </div>
    </fieldset>

    <fieldset hidden={step !== 3}>
      <legend class="visually-hidden">Your look</legend>
      <div class="themes">
        {#each themes as option (option.id)}
          <label class="theme" class:chosen={theme === option.id}>
            <input type="radio" name="theme" value={option.id} bind:group={theme} />
            <svg class="swatches" viewBox="0 0 66 20" aria-hidden="true">{#each option.swatches as colour, k (k)}<rect x={k * 23} width="20" height="20" rx="10" fill={colour} stroke="currentColor" stroke-opacity="0.3" />{/each}</svg>
            <span class="theme-name">{option.name}</span>
            <span class="theme-text">{option.text}</span>
          </label>
        {/each}
      </div>
      {#if tried[3] && errors.theme}<p class="error">{errors.theme}</p>{/if}

      <div class="field">
        <span class="label">Your logo and photos <span class="optional">(optional)</span></span>
        {#if canUpload}
          <p class="hint">Photos of your place, your products and your team make the biggest difference. JPG, PNG or WebP, up to 12 photos.</p>
          <span class="label">Your logo</span>
          <PhotoPicker label="logo" bind:photos={logos} max={1} describe={false} />
          <span class="label">Your photos</span>
          <p class="hint">Pick your best one as the main photo: it goes beside your headline.</p>
          <PhotoPicker label="photos" bind:photos bind:descriptions={photoDescriptions} pickMain autoMain bind:main={mainPhoto} noMainLabel="No main photo (use a simple drawing instead)" />
          {#if tried[3] && errors.photos}<p class="error" role="alert">{errors.photos}</p>{/if}
        {:else}
          <p class="hint">After you send this, email me your logo and any photos you’d like on the site.</p>
        {/if}
        {#if modules.includes('work')}<p class="hint">Photos of past jobs go in your “Past work” section: send them after this with a line about each job, or add them later with the change form.</p>{/if}
      </div>
    </fieldset>

    <fieldset hidden={step !== 4}>
      <legend class="visually-hidden">Contact details for me</legend>
      <p class="hint">Only I see these. They aren’t shown on your site (the customer phone number earlier is).</p>
      <div class="row">
        <div class="field">
          <label for="o-email">Your email</label>
          <input id="o-email" type="email" autocomplete="email" bind:value={email} aria-invalid={tried[4] && !!errors.email} aria-describedby="o-email-err" />
          {#if tried[4] && errors.email}<p class="error" id="o-email-err">{errors.email}</p>{/if}
        </div>
        <div class="field">
          <label for="o-phone">Your phone <span class="optional">(optional)</span></label>
          <input id="o-phone" type="tel" autocomplete="tel" bind:value={phone} />
        </div>
      </div>
      <div class="field">
        <label for="o-notes">Anything else? <span class="optional">(optional)</span></label>
        <textarea id="o-notes" rows="3" bind:value={notes}></textarea>
      </div>
    </fieldset>

    <input class="botcheck" type="checkbox" tabindex="-1" aria-hidden="true" bind:checked={botcheck} />
    <div class="nav">
      {#if step > 0}
        <button class="button ghost" type="button" onclick={() => go(step - 1)}>Back</button>
      {/if}
      {#if step < steps.length - 1}
        <button class="button" type="submit">Next</button>
      {:else}
        <button class="button" type="submit" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending…' : 'Send my details'}
        </button>
      {/if}
    </div>
    {#if status === 'failed'}
      <p class="error" role="alert">{failure || "Sorry, that didn't send."} Please try again in a moment.</p>
    {/if}
    {#if !site.formKey && !site.intakeUrl}<p class="note">Not connected yet: this form doesn't send anything.</p>{/if}
  </form>
{/if}

<style>
  form {
    display: grid;
    gap: 2rem;
  }
  fieldset {
    border: 0;
    margin: 0;
    padding: 0;
    min-width: 0;
    display: grid;
    gap: 1.1rem;
  }
  fieldset[hidden] {
    display: none;
  }
  legend {
    font-family: var(--display);
    font-size: 1.5rem;
    padding: 0;
    margin-bottom: 0.9rem;
  }
  /* Questions grouped inside a step read like the other labels, not like the step heading. */
  legend.label {
    font-family: inherit;
    font-size: inherit;
    font-weight: 700;
    margin-bottom: 0.2rem;
  }
  .tick {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
  }
  .small {
    justify-self: start;
    border: 2px solid var(--ink);
    border-radius: 0.4rem;
    background: none;
    padding: 0.4rem 0.8rem;
    font-weight: 600;
    cursor: pointer;
  }
  .row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
    gap: 1.1rem;
  }
  .field {
    display: grid;
    gap: 0.35rem;
  }
  label,
  .label {
    font-weight: 600;
  }
  .optional {
    font-weight: 400;
    color: var(--ink-soft);
  }
  .hint {
    margin: 0;
    font-size: 0.92rem;
    color: var(--ink-soft);
  }
  input:not([type='radio']):not([type='checkbox']),
  textarea {
    width: 100%;
    border: 2px solid var(--ink);
    border-radius: 0.4rem;
    background: var(--paper);
    padding: 0.65rem 0.8rem;
  }
  [aria-invalid='true'] {
    border-color: var(--error) !important;
  }
  .error {
    margin: 0;
    color: var(--error);
    font-size: 0.92rem;
    font-weight: 600;
  }
  .themes {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
    gap: 0.8rem;
  }
  .theme {
    position: relative;
    display: grid;
    gap: 0.4rem;
    padding: 1rem;
    border: 2px solid var(--rule);
    border-radius: 0.6rem;
    cursor: pointer;
    font-weight: 400;
  }
  .theme.chosen {
    border-color: var(--accent);
    box-shadow: 0 0 0 2px var(--accent);
  }
  .theme:has(input:focus-visible) {
    outline: 3px solid var(--highlight);
    outline-offset: 3px;
  }
  .theme input {
    position: absolute;
    opacity: 0;
    width: 1px;
    height: 1px;
  }
  /* Each look's paper, accent and highlight colours (from src/themes.ts). */
  .swatches {
    width: 5.3rem;
    height: 1.6rem;
  }
  .theme-name {
    font-size: 1.25rem;
    font-weight: 700;
  }
  .theme-text {
    font-size: 0.92rem;
    color: var(--ink-soft);
  }
  .progress {
    display: grid;
    gap: 0.35rem;
  }
  .step-count {
    margin: 0;
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--accent);
  }
  .step-title {
    margin: 0;
    font-size: 1.7rem;
  }
  .step-title:focus {
    outline: none;
  }
  .bar {
    height: 0.4rem;
    border-radius: 999px;
    background: var(--rule);
    overflow: hidden;
  }
  .fill {
    display: block;
    height: 100%;
    background: var(--accent);
    transition: width 0.25s ease;
  }
  .fill-1 { width: 20%; }
  .fill-2 { width: 40%; }
  .fill-3 { width: 60%; }
  .fill-4 { width: 80%; }
  .fill-5 { width: 100%; }
  .nav {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
  @media (prefers-reduced-motion: reduce) {
    .fill {
      transition: none;
    }
  }
  form .button:disabled {
    opacity: 0.6;
    cursor: wait;
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
