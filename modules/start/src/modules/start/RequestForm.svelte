<script lang="ts">
  // Change requests from existing clients, sent through lib/send.ts like the
  // other forms, as changes in the shape the starter's scripts/apply-changes.js
  // takes (new photos go to the intake and point at their upload by number). Nothing happens until the client confirms
  // from their saved email address and Cameron approves the price.
  import { site } from '../../site.config';
  import { isPrice as priceOk, money } from '../../lib/money';
  import { send, canUpload } from '../../lib/send';
  import { looks as themes } from '../../lib/catalogue';
  import type { ExistingPhoto } from '../../components/forms/PhotoPicker.svelte';
  import ContactFields from './ContactFields.svelte';
  import HoursFields from './HoursFields.svelte';
  import PhotosFields from './PhotosFields.svelte';
  import PriceFields, { priceChanges, priceProblem } from '../../components/forms/PriceFields.svelte';
  import ListFields, { listChange, listKinds, listOf, listProblem, listUploads } from '../../components/forms/ListFields.svelte';
  import BuildList from './BuildList.svelte';
  import Steps from './Steps.svelte';
  import { type Item, blankBuild, filledRows, listDef } from './build';
  import data from './start.json';

  let { prices = {}, onback }: { prices?: Record<string, number>; onback: () => void } = $props();

  // Who they are and which site, then what they'd like changed or added.
  const steps = ['Your website', 'What would you like?'] as const;
  let step = $state(0);

  type Kind =
    | 'text' | 'hours' | 'contact' | 'news' | 'photos' | 'theme'
    | 'menu-add' | 'menu-price' | 'menu-remove' | 'menu-sold-out'
    | 'price-add' | 'price-change' | 'price-remove' | 'price-available' | 'price-note'
    | 'booking' | 'notice'
    | 'product-add' | 'product-price' | 'product-link' | 'product-sold-out' | 'product-remove'
    // Add and remove for every list section (reviews, questions, steps…): see ListFields.svelte.
    | (string & {});
  // Which item on the list (start.json) each change belongs to.
  const itemOf = (kind: Kind) =>
    ['text', 'notice', 'news'].includes(kind) ? 'wording'
    : ['hours', 'contact'].includes(kind) ? 'finding'
    : kind === 'photos' ? 'photos'
    : kind === 'theme' ? 'look'
    : kind.startsWith('menu-') ? 'menu'
    : kind.startsWith('price') ? 'prices'
    : kind.startsWith('product-') ? 'shop'
    : kind === 'booking' ? 'booking'
    : (items.find((item) => item.module === listKinds.find((k) => k.id === kind)?.module)?.id ?? '');
  const allKinds: { id: Kind; label: string }[] = [
    { id: 'text', label: 'Change some wording' },
    { id: 'hours', label: 'Update opening hours' },
    { id: 'contact', label: 'Update your phone, email, address or social links' },
    { id: 'news', label: 'Post news or a special' },
    // Photos can only be sent through the intake.
    ...(canUpload ? [{ id: 'photos' as Kind, label: 'Change your photos or logo' }] : []),
    { id: 'theme', label: 'Change the look' },
    { id: 'notice', label: 'Show a notice at the top of every page (like holiday hours)' },
    { id: 'menu-add', label: 'Add a menu item' },
    { id: 'menu-price', label: 'Change a price on the menu' },
    { id: 'menu-remove', label: 'Remove a menu item' },
    { id: 'menu-sold-out', label: 'Mark a menu item sold out (or back on)' },
    { id: 'price-add', label: 'Add something to your price list' },
    { id: 'price-change', label: 'Change a price on your price list' },
    { id: 'price-remove', label: 'Remove something from your price list' },
    { id: 'price-available', label: 'Hide something on your price list for now (or show it again)' },
    { id: 'price-note', label: 'Change the note under your price list' },
    { id: 'booking', label: 'Change what people can book (or the kinds of job you quote for)' },
    { id: 'product-add', label: 'Add something to your shop' },
    { id: 'product-price', label: 'Change a price in your shop' },
    { id: 'product-link', label: 'Add or change a Stripe payment link' },
    { id: 'product-sold-out', label: 'Mark something in your shop sold out (or back on)' },
    { id: 'product-remove', label: 'Remove something from your shop' },
    ...listKinds.map(({ id, label }) => ({ id: id as Kind, label })),
  ];
  let siteModules = $state<string[] | null>(null);
  let priceItems = $state<{ name: string; available: boolean }[]>([]);

  // One list, the new-website form's (start.json): what their site has can
  // be changed; anything else can be added (a section that comes with a new
  // site costs a small change, an add-on its price). Without knowing their
  // site, every section with changes counts as theirs.
  const items = data.items as Item[];
  const priceOf = (item: Item) => prices[item.price ?? 'small-change'];
  const kindsFor = (item: Item) => allKinds.filter((kind) => itemOf(kind.id) === item.id);
  const has = (item: Item) => (item.module ? (siteModules?.includes(item.module) ?? kindsFor(item).length > 0) : !item.price);
  const theirs = $derived(items.filter((item) => has(item) && kindsFor(item).length));
  const addable = $derived(items.filter((item) => !has(item) && !item.changeOnly && (item.module || item.price) && (!item.price || prices[item.price] !== undefined)));
  let build = $state(blankBuild(items));
  // The list's tabs: what's on their site (0) and what they can add (1).
  let tab = $state(0);
  const adding = $derived(addable.filter((item) => build.chosen[item.id]));
  const MAX_PHOTOS = 12;
  const MAX_BYTES = 15 * 1024 * 1024;
  const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  const blank = (kind: Kind) => ({
    kind,
    current: '',
    replacement: '',
    hours: [] as { days: string; times: string }[],
    noHours: false,
    title: '',
    excerpt: '',
    body: '',
    name: '',
    description: '',
    price: '',
    vegan: false,
    glutenFree: false,
    category: '',
    soldOut: true,
    photos: [] as File[],
    logo: [] as File[],
    photoDescriptions: [] as string[],
    // The photo to put beside the headline: 'existing:<file>', 'new:<index>' or null (no change).
    mainPhoto: null as string | null,
    phone: '',
    email: '',
    address: '',
    instagram: '',
    facebook: '',
    theme: '',
    // Price list changes (see PriceFields.svelte).
    pricing: 'one' as 'one' | 'from' | 'sizes' | 'ask',
    sizes: [{ label: '', price: '' }],
    available: false,
    footnote: '',
    itemPhoto: '',
    itemPhotoFile: [] as File[],
    itemPhotoAlt: '',
    // Booking or quote form choices, one per line.
    bookingOptions: '',
    // A notice at the top of every page, and the last day it shows ('' for until it's taken down).
    noticeText: '',
    noticeUntil: '',
    // Shop items.
    link: '',
    // A list section's item (see ListFields.svelte), and where it goes in an ordered list.
    item: {} as Record<string, string>,
    position: '',
  });

  // The client's current gallery, when the link names their site
  // (start.html?path=change&site=https://their-site.pages.dev): each site publishes photos.json.
  let existing = $state<ExistingPhoto[]>([]);
  const PLACEHOLDER = '[PLACEHOLDER';
  let address = $state(new URLSearchParams(location.search).get('site') ?? '');
  loadSite(address);
  function loadSite(given: string) {
    let siteUrl: URL;
    try {
      siteUrl = new URL(/^https?:\/\//.test(given.trim()) ? given.trim() : `https://${given.trim()}`);
    } catch {
      return;
    }
    if (siteUrl.protocol !== 'https:' && siteUrl.hostname !== 'localhost') return;
    fetch(new URL('photos.json', siteUrl.href.replace(/\/?$/, '/')))
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!Array.isArray(data?.gallery)) return;
        if (Array.isArray(data.modules)) siteModules = data.modules;
        if (Array.isArray(data.prices)) priceItems = data.prices;
        existing = data.gallery.map((item: { file: string; src: string; alt: string }) => {
          const alt = item.alt.startsWith(PLACEHOLDER) ? '' : item.alt;
          return { file: item.file, src: new URL(item.src, siteUrl).href, original: alt, alt, removed: false };
        });
      })
      .catch(() => {});
  }

  let email = $state('');
  let business = $state('');
  let changes = $state<Change[]>([]);
  /** Opens an item's changes, starting with one. */
  function startChange(item: Item) {
    if (!changes.some((c) => itemOf(c.kind) === item.id)) changes.push(blank(kindsFor(item)[0].id));
  }
  const changesFor = (item: Item) => changes.map((c, i) => [c, i] as const).filter(([c]) => itemOf(c.kind) === item.id);
  // Only the changes under a ticked section are sent (an unticked one keeps what was typed).
  const ticked = (c: Change) => build.chosen[itemOf(c.kind)];
  const sending = $derived(changes.filter(ticked));
  let botcheck = $state(false);
  let tried = $state([false, false]);
  let status = $state<'idle' | 'sending' | 'sent' | 'failed'>('idle');

  type Change = ReturnType<typeof blank>;
  const STRIPE = /^https:\/\/buy\.stripe\.com\/[\w-]+$/;

  /** What's missing from one change, or '' when it's complete. */
  function problem(c: Change): string {
    switch (c.kind) {
      case 'text':
        return c.current.trim() && c.replacement.trim() ? '' : 'Fill in the current and new wording.';
      case 'contact':
        return [c.phone, c.email, c.address, c.instagram, c.facebook].some((v) => v.trim()) ? '' : 'Fill in at least one new detail.';
      case 'hours':
        return c.noHours || c.hours.length ? '' : 'Tick the days you’re open and choose times that close after they open.';
      case 'news':
        return c.title.trim() && c.excerpt.trim() && c.body.trim() ? '' : 'Fill in the title, summary and text.';
      case 'menu-add':
        return c.name.trim() && c.description.trim() && priceOk(c.price) ? '' : 'Fill in the name, description and a price.';
      case 'menu-price':
        return c.name.trim() && priceOk(c.price) ? '' : 'Fill in the item name and its new price.';
      case 'menu-remove':
      case 'menu-sold-out':
        return c.name.trim() ? '' : 'Fill in the item name, exactly as it is on the menu.';
      case 'photos': {
        const touched = existing.some((p) => p.removed || p.alt.trim() !== p.original) || !!c.mainPhoto;
        if (!c.photos.length && !c.logo.length && !(firstPhotos(c) && touched)) return existing.length ? 'Add, remove or re-describe at least one photo.' : 'Choose at least one photo.';
        const wrong = [...c.photos, ...c.logo].find((file) => !IMAGE_TYPES.includes(file.type));
        if (wrong) return `“${wrong.name}” isn’t a JPG, PNG or WebP photo.`;
        const big = [...c.photos, ...c.logo].find((file) => file.size > MAX_BYTES);
        return big ? `“${big.name}” is too big. Photos can be up to 15 MB each.` : '';
      }
      case 'theme':
        return c.theme ? '' : 'Choose a look.';
      case 'notice':
        return c.noticeText.trim() ? '' : 'Write the notice. To take one down, use “Something else”.';
      case 'product-add':
        if (!c.name.trim() || !priceOk(c.price)) return 'Fill in the name and a price.';
        return !c.link.trim() || STRIPE.test(c.link.trim()) ? '' : 'Paste a Stripe payment link (it starts https://buy.stripe.com/), or leave it empty.';
      case 'product-price':
        return c.name.trim() && priceOk(c.price) ? '' : 'Fill in the item name and its new price.';
      case 'product-link':
        return c.name.trim() && STRIPE.test(c.link.trim()) ? '' : 'Fill in the item name and paste its Stripe payment link (it starts https://buy.stripe.com/).';
      case 'product-sold-out':
      case 'product-remove':
        return c.name.trim() ? '' : 'Fill in the item name, exactly as it is in your shop.';
      case 'booking':
        return c.bookingOptions.split('\n').some((line) => line.trim()) ? '' : 'List at least one choice.';
      case 'price-add':
      case 'price-change':
      case 'price-remove':
      case 'price-available':
      case 'price-note': {
        const missing = priceProblem(c);
        if (missing) return missing;
        const file = c.itemPhoto === 'new' ? c.itemPhotoFile[0] : null;
        if (file && !IMAGE_TYPES.includes(file.type)) return `“${file.name}” isn’t a JPG, PNG or WebP photo.`;
        return file && file.size > MAX_BYTES ? `“${file.name}” is too big. Photos can be up to 15 MB each.` : '';
      }
      default: {
        const file = c.itemPhoto === 'new' ? c.itemPhotoFile[0] : null;
        if (file && !IMAGE_TYPES.includes(file.type)) return `“${file.name}” isn’t a JPG, PNG or WebP photo.`;
        if (file && file.size > MAX_BYTES) return `“${file.name}” is too big. Photos can be up to 15 MB each.`;
        return listProblem(c, canUpload || existing.length > 0);
      }
    }
  }

  // Every photo to upload, in the order toChanges() numbers them.
  const uploadsOf = (c: Change) =>
    c.kind === 'photos' ? [...c.photos, ...c.logo] : (c.kind === 'price-add' || c.kind === 'price-change') && c.itemPhoto === 'new' ? c.itemPhotoFile : listUploads(c);
  const allPhotos = $derived(sending.flatMap(uploadsOf));
  const errors = $derived({
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '' : 'Enter the email address I have for you.',
    business: business.trim() ? '' : 'Enter your business name.',
    changes: changes.map((c) => (ticked(c) ? problem(c) : '')),
    photos: allPhotos.length > MAX_PHOTOS ? `Please send up to ${MAX_PHOTOS} photos at a time.` : '',
    nothing: sending.length || adding.length || build.custom.trim() ? '' : 'Choose something to change or add, or tell me what you’d like.',
  });
  const valid = $derived(!errors.email && !errors.business && !errors.photos && !errors.nothing && errors.changes.every((e) => !e));

  /** The site's current photos are shown (and changed) in the first photo change only. */
  const firstPhotos = (c: Change) => changes.find((other) => other.kind === 'photos') === c;

  /** The changes in the shape scripts/apply-changes.js takes. */
  function toChanges() {
    // Uploaded photos are sent as one list; each photo change points at its place in it.
    let upload = 0;
    return sending.flatMap((c) => {
      switch (c.kind) {
        case 'text':
          return { type: 'text', current: c.current.trim(), new: c.replacement.trim() };
        case 'hours':
          return c.noHours ? { type: 'hours', hours: [], none: true } : { type: 'hours', hours: c.hours };
        case 'contact': {
          // Only the details they filled in change; the rest stay as they are.
          const details = Object.fromEntries((['phone', 'email', 'address', 'instagram', 'facebook'] as const).filter((key) => c[key].trim()).map((key) => [key, c[key].trim()]));
          return { type: 'contact', ...details };
        }
        case 'news':
          return { type: 'news', title: c.title.trim(), excerpt: c.excerpt.trim(), body: c.body.trim() };
        case 'menu-add': {
          const tags = [c.vegan && 'vegan', c.glutenFree && 'gluten-free'].filter(Boolean);
          return { type: 'menu-add', name: c.name.trim(), description: c.description.trim(), price: c.price.trim(), tags, category: c.category.trim() };
        }
        case 'menu-price':
          return { type: 'menu-price', name: c.name.trim(), price: c.price.trim() };
        case 'menu-remove':
          return { type: 'menu-remove', name: c.name.trim() };
        case 'menu-sold-out':
          return { type: 'menu-sold-out', name: c.name.trim(), soldOut: c.soldOut };
        case 'photos': {
          const current = firstPhotos(c) ? existing : [];
          const edits = [
            ...current.filter((p) => p.removed).map((p) => ({ type: 'gallery-remove', file: p.file })),
            ...current
              .filter((p) => !p.removed && p.alt.trim() && p.alt.trim() !== p.original)
              .map((p) => ({ type: 'gallery-describe', file: p.file, alt: p.alt.trim() })),
          ];
          // Every new photo is uploaded; the one picked as the main photo goes beside the headline instead of the gallery.
          const added = c.photos.map((_, j) => ({ upload: upload++, alt: (c.photoDescriptions[j] ?? '').trim(), main: c.mainPhoto === `new:${j}` }));
          const gallery = added.filter((p) => !p.main).map(({ upload, alt }) => ({ upload, alt }));
          const newMain = added.find((p) => p.main);
          const keptMain = c.mainPhoto?.startsWith('existing:') ? c.mainPhoto.slice(9) : null;
          // The logo is uploaded after the photos, so it takes the next number.
          const logo = c.logo.length ? [{ type: 'logo', upload: upload++ }] : [];
          return [
            ...edits,
            ...(gallery.length ? [{ type: 'gallery-add', photos: gallery }] : []),
            ...(newMain ? [{ type: 'photo', slot: 'hero', upload: newMain.upload, ...(newMain.alt ? { alt: newMain.alt } : {}) }] : []),
            ...(keptMain ? [{ type: 'photo', slot: 'hero', gallery: keptMain }] : []),
            ...logo,
          ];
        }
        case 'theme':
          return { type: 'theme', theme: c.theme };
        case 'notice':
          return { type: 'notice', text: c.noticeText.trim(), until: c.noticeUntil };
        case 'product-add':
          return { type: 'product-add', name: c.name.trim(), price: c.price.trim(), link: c.link.trim(), ...(c.description.trim() ? { description: c.description.trim() } : {}) };
        case 'product-price':
          return { type: 'product-price', name: c.name.trim(), price: c.price.trim() };
        case 'product-link':
          return { type: 'product-link', name: c.name.trim(), link: c.link.trim() };
        case 'product-sold-out':
          return { type: 'product-sold-out', name: c.name.trim(), soldOut: c.soldOut };
        case 'product-remove':
          return { type: 'product-remove', name: c.name.trim() };
        case 'booking':
          return { type: 'booking', options: c.bookingOptions.split('\n').map((line) => line.trim()).filter(Boolean) };
        case 'price-add':
        case 'price-change':
        case 'price-remove':
        case 'price-available':
        case 'price-note':
          return priceChanges(c, () => upload++);
        default:
          return listChange(c, () => upload++);
      }
    });
  }

  /** What they're adding: each section (brought in by ops/approve.js), then anything they filled in for it. */
  function additions() {
    return [
      ...adding.flatMap((item) => [
        {
          type: 'add',
          label: item.label,
          ...(item.module ? { module: item.module } : {}),
          ...(item.id === 'booking' && build.quote ? { kind: 'quote' } : {}),
          ...(item.id === 'menu' && build.preOrder ? { preOrder: true } : {}),
          ...(item.id === 'page' && build.pageText.trim() ? { details: build.pageText.trim() } : {}),
        },
        ...filledRows(build, item).map((row) => ({ type: `${listDef(item)!.type}-add`, ...row })),
      ]),
      ...(build.custom.trim() ? [{ type: 'other', details: build.custom.trim() }] : []),
    ];
  }

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    tried[step] = true;
    if (step === 0) {
      if (!errors.email && !errors.business) step = 1;
      return;
    }
    // Open the first section with a change that needs finishing.
    const unfinished = sending.find((c) => problem(c));
    if (unfinished) {
      tab = 0;
      build.open = itemOf(unfinished.kind);
    }
    if (!valid || status === 'sending') return;
    if (!site.formKey && !site.intakeUrl) {
      status = 'sent';
      return;
    }
    status = 'sending';
    const request = { request: 1, email: email.trim(), business: business.trim(), changes: [...toChanges(), ...additions()] };
    try {
      await send({
        kind: 'request',
        subject: `Change request: ${request.business}`,
        fields: { email: request.email, business: request.business },
        payload: request,
        block: 'CHANGES',
        photos: canUpload ? allPhotos : [],
        botcheck,
      });
      status = 'sent';
    } catch {
      status = 'failed';
    }
  }
</script>

{#if status === 'sent'}
  <div class="sent" role="status">
    <p class="big">Request sent.</p>
    {#if site.formKey || site.intakeUrl}
      <p>
        You’ll get an email at the address I have for you. Click the link in it to confirm the
        request, then I’ll send you the price before any work starts.
      </p>
    {:else}
      <p>This form isn't connected yet, so nothing was sent.</p>
    {/if}
  </div>
{:else}
  <form novalidate onsubmit={submit}>
    <Steps {steps} {step} send="Send request" sending={status === 'sending'} onback={() => (step === 0 ? onback() : (step = 0))}>
    {#if step === 0}
    <div class="row">
      <div class="field">
        <label for="r-email">Your email</label>
        <p class="hint" id="r-email-hint">The one I have on file for you. The confirmation goes there.</p>
        <input id="r-email" type="email" autocomplete="email" bind:value={email} aria-invalid={tried[0] && !!errors.email} aria-describedby="r-email-hint r-email-err" />
        {#if tried[0] && errors.email}<p class="error" id="r-email-err">{errors.email}</p>{/if}
      </div>
      <div class="field">
        <label for="r-business">Business name</label>
        <p class="hint" id="r-business-hint">As it appears on your website.</p>
        <input id="r-business" autocomplete="organization" bind:value={business} aria-invalid={tried[0] && !!errors.business} aria-describedby="r-business-hint r-business-err" />
        {#if tried[0] && errors.business}<p class="error" id="r-business-err">{errors.business}</p>{/if}
      </div>
    </div>

    <div class="field">
      <label for="r-site">Your website address</label>
      <p class="hint" id="r-site-hint">So the list shows what’s on your site.</p>
      <input id="r-site" type="url" inputmode="url" placeholder="yourbusiness.co.nz" bind:value={address} onchange={() => loadSite(address)} aria-describedby="r-site-hint" />
    </div>
    {:else}

    {#snippet changeCard(change: Change, i: number, n: number)}
      {@const options = kindsFor({ id: itemOf(change.kind) } as Item)}
      <fieldset class="change">
        <legend>Change {n}</legend>
        {#if options.length > 1}
          <div class="field">
            <label for="r-kind-{i}">What would you like to do?</label>
            <select id="r-kind-{i}" bind:value={change.kind}>
              {#each options as kind (kind.id)}<option value={kind.id}>{kind.label}</option>{/each}
            </select>
          </div>
        {/if}
      {#if change.kind === 'text'}
        <div class="field">
          <label for="r-current-{i}">Current wording</label>
          <p class="hint" id="r-current-hint-{i}">Copy it exactly from your site.</p>
          <textarea id="r-current-{i}" rows="2" bind:value={change.current} aria-describedby="r-current-hint-{i}"></textarea>
        </div>
        <div class="field">
          <label for="r-new-{i}">New wording</label>
          <textarea id="r-new-{i}" rows="2" bind:value={change.replacement}></textarea>
        </div>
      {:else if change.kind === 'hours'}
        <HoursFields id="r-hours-{i}" bind:hours={change.hours} bind:none={change.noHours} />
      {:else if change.kind === 'contact'}
        <p class="hint">Fill in only what’s changing. To take something off your site, use “Something else”.</p>
        <ContactFields id="r-{i}" bind:phone={change.phone} bind:email={change.email} bind:address={change.address} bind:instagram={change.instagram} bind:facebook={change.facebook} />
      {:else if change.kind === 'news'}
        <div class="field">
          <label for="r-title-{i}">Title</label>
          <input id="r-title-{i}" bind:value={change.title} />
        </div>
        <div class="field">
          <label for="r-excerpt-{i}">One-line summary</label>
          <input id="r-excerpt-{i}" bind:value={change.excerpt} />
        </div>
        <div class="field">
          <label for="r-body-{i}">The post</label>
          <textarea id="r-body-{i}" rows="4" bind:value={change.body}></textarea>
        </div>
      {:else if change.kind === 'photos'}
        {#if firstPhotos(change)}
          <PhotosFields bind:logo={change.logo} bind:photos={change.photos} bind:descriptions={change.photoDescriptions} bind:main={change.mainPhoto} bind:existing />
        {:else}
          <PhotosFields bind:logo={change.logo} bind:photos={change.photos} bind:descriptions={change.photoDescriptions} bind:main={change.mainPhoto} />
        {/if}
      {:else if change.kind === 'theme'}
        <div class="field">
          <label for="r-theme-{i}">New look</label>
          <select id="r-theme-{i}" bind:value={change.theme}>
            <option value="" disabled>Choose one</option>
            {#each themes as option (option.id)}<option value={option.id}>{option.name}</option>{/each}
          </select>
          <p class="hint">{themes.find((option) => option.id === change.theme)?.text ?? 'The colours and fonts of your whole site.'}</p>
        </div>
      {:else if change.kind.startsWith('price')}
        <PriceFields bind:change={changes[i]} {i} items={priceItems} gallery={existing.filter((p) => !p.removed)} {canUpload} />
      {:else if change.kind === 'booking'}
        <div class="field">
          <label for="r-booking-{i}">All the choices, one per line</label>
          <p class="hint" id="r-booking-hint-{i}">Like “Haircut”, “Beard trim” or “Hot water repairs”. These replace the current list.</p>
          <textarea id="r-booking-{i}" rows="5" bind:value={change.bookingOptions} aria-describedby="r-booking-hint-{i}"></textarea>
        </div>
      {:else if change.kind === 'notice'}
        <div class="field">
          <label for="r-notice-{i}">The notice</label>
          <input id="r-notice-{i}" maxlength="160" placeholder="Closed 24 December to 6 January. Merry Christmas!" bind:value={change.noticeText} />
        </div>
        <div class="field">
          <label for="r-until-{i}">Last day it shows <span class="optional">(optional)</span></label>
          <p class="hint" id="r-until-hint-{i}">It disappears by itself after this day. Leave it empty to keep it up until you ask.</p>
          <input id="r-until-{i}" type="date" bind:value={change.noticeUntil} aria-describedby="r-until-hint-{i}" />
        </div>
      {:else if listOf(change.kind)}
        <ListFields bind:change={changes[i]} {i} gallery={existing.filter((p) => !p.removed)} {canUpload} />
      {:else if change.kind.startsWith('product-')}
        <div class="field">
          <label for="r-pr-name-{i}">{change.kind === 'product-add' ? 'Name' : 'Item name, as it is in your shop'}</label>
          <input id="r-pr-name-{i}" bind:value={change.name} />
        </div>
        {#if change.kind === 'product-add'}
          <div class="field">
            <label for="r-pr-desc-{i}">Short description <span class="optional">(optional)</span></label>
            <input id="r-pr-desc-{i}" bind:value={change.description} />
          </div>
        {/if}
        {#if change.kind === 'product-add' || change.kind === 'product-price'}
          <div class="field">
            <label for="r-pr-price-{i}">{change.kind === 'product-add' ? 'Price' : 'New price'}</label>
            <input id="r-pr-price-{i}" inputmode="decimal" placeholder="$28" bind:value={change.price} />
          </div>
        {/if}
        {#if change.kind === 'product-add' || change.kind === 'product-link'}
          <div class="field">
            <label for="r-pr-link-{i}">Stripe payment link {#if change.kind === 'product-add'}<span class="optional">(optional)</span>{/if}</label>
            <p class="hint" id="r-pr-link-hint-{i}">From Stripe: Payment links, then Create. It starts https://buy.stripe.com/. Without one, the item shows “Ask us”.</p>
            <input id="r-pr-link-{i}" type="url" placeholder="https://buy.stripe.com/…" bind:value={change.link} aria-describedby="r-pr-link-hint-{i}" />
          </div>
        {/if}
        {#if change.kind === 'product-sold-out'}
          <div class="checks">
            <label><input type="radio" name="r-pr-sold-{i}" value={true} bind:group={changes[i].soldOut} /> Sold out</label>
            <label><input type="radio" name="r-pr-sold-{i}" value={false} bind:group={changes[i].soldOut} /> Back on</label>
          </div>
        {/if}
      {:else}
        <div class="field">
          <label for="r-name-{i}">Menu item name{change.kind === 'menu-add' ? '' : ', as it is on the menu'}</label>
          <input id="r-name-{i}" bind:value={change.name} />
        </div>
        {#if change.kind === 'menu-add'}
          <div class="field">
            <label for="r-description-{i}">Description</label>
            <textarea id="r-description-{i}" rows="2" bind:value={change.description}></textarea>
          </div>
          <div class="field">
            <label for="r-category-{i}">Menu section <span class="optional">(optional)</span></label>
            <input id="r-category-{i}" placeholder="Lunch" bind:value={change.category} />
          </div>
          <div class="checks">
            <label><input type="checkbox" bind:checked={change.vegan} /> Vegan</label>
            <label><input type="checkbox" bind:checked={change.glutenFree} /> Gluten-free</label>
          </div>
        {/if}
        {#if change.kind === 'menu-add' || change.kind === 'menu-price'}
          <div class="field">
            <label for="r-price-{i}">{change.kind === 'menu-add' ? 'Price' : 'New price'}</label>
            <input id="r-price-{i}" inputmode="decimal" placeholder="$6.50" bind:value={change.price} />
          </div>
        {/if}
        {#if change.kind === 'menu-sold-out'}
          <div class="checks">
            <label><input type="radio" name="r-sold-{i}" value={true} bind:group={changes[i].soldOut} /> Sold out</label>
            <label><input type="radio" name="r-sold-{i}" value={false} bind:group={changes[i].soldOut} /> Back on</label>
          </div>
        {/if}
      {/if}

        {#if tried[1] && errors.changes[i]}<p class="error">{errors.changes[i]}</p>{/if}
        <button class="small" type="button" onclick={() => changes.splice(i, 1)}>Remove this change</button>
      </fieldset>
    {/snippet}
    {#snippet changeBody(item: Item)}
      {#each changesFor(item) as [c, i], n (i)}{@render changeCard(c, i, n + 1)}{/each}
      <button class="small" type="button" onclick={() => changes.push(blank(kindsFor(item)[0].id))}>{changesFor(item).length ? 'Another change here' : 'Change something here'}</button>
    {/snippet}

    <BuildList
      id="r"
      bind:build
      groups={[{ title: 'Change', items: theirs }, ...(addable.length ? [{ title: 'Add', items: addable }] : [])]}
      tabs
      bind:tab
      priceText={(item) => {
        // A change to what they have is a small change; adding something costs its price.
        const price = has(item) ? prices['small-change'] : priceOf(item);
        return price === undefined ? '' : `+${money(price)}`;
      }}
      keywords={(item) => kindsFor(item).map((kind) => kind.label).join(' ')}
      owned={has}
      {changeBody}
      onchange={startChange}
    />
    {#if tried[1] && errors.photos}<p class="error">{errors.photos}</p>{/if}
    {#if prices['small-change'] !== undefined}
      <p class="hint">Small changes are {money(prices['small-change'])} each. I’ll confirm the price before any work starts.</p>
    {/if}
    {#if tried[1] && errors.nothing}<p class="error">{errors.nothing}</p>{/if}
    {/if}
    </Steps>

    <input class="botcheck" type="checkbox" tabindex="-1" aria-hidden="true" bind:checked={botcheck} />
    {#if status === 'failed'}
      <p class="error" role="alert">Sorry, that didn't send. Please try again in a moment.</p>
    {/if}
    {#if !site.formKey && !site.intakeUrl}<p class="note">Not connected yet: this form doesn't send anything.</p>{/if}
  </form>
{/if}

<style>
  form {
    display: grid;
    gap: 1.5rem;
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
  select,
  textarea {
    width: 100%;
    border: 2px solid var(--ink);
    border-radius: 0.4rem;
    background: var(--paper);
    padding: 0.65rem 0.8rem;
  }
  [aria-invalid='true'] {
    border-color: var(--error);
  }
  .change {
    display: grid;
    gap: 1rem;
    margin: 0;
    padding: 1.25rem;
    border: 2px solid var(--rule);
    border-radius: 0.6rem;
    min-width: 0;
  }
  legend {
    font-family: var(--display);
    font-size: 1.2rem;
    padding-inline: 0.4rem;
  }
  .checks {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1.5rem;
  }
  .checks label {
    display: flex;
    align-items: center;
    gap: 0.4rem;
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
  .error {
    margin: 0;
    color: var(--error);
    font-size: 0.92rem;
    font-weight: 600;
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
