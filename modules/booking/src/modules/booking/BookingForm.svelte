<script lang="ts">
  // The booking or quote form. Sends through Web3Forms (lib/send.ts) like the
  // enquiry form, so it only sends once the site has its form key.
  import { site } from '../../site.config';
  import { connected, sendForm } from '../../lib/send';
  import { longDate, nzDate, type Booking } from './booking';

  let { settings }: { settings: Booking } = $props();
  const quote = $derived(settings.kind === 'quote');

  let name = $state('');
  let email = $state('');
  let phone = $state('');
  let choice = $state('');
  let day = $state('');
  let time = $state('');
  let address = $state('');
  let details = $state('');
  let botcheck = $state(false);
  let tried = $state(false);
  let status = $state<'idle' | 'sending' | 'sent' | 'failed'>('idle');

  const earliest = $derived(nzDate(settings.leadDays));
  const errors = $derived({
    name: name.trim() ? '' : 'Tell us your name.',
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '' : 'Enter an email address like you@example.com.',
    choice: choice ? '' : quote ? 'Choose the kind of job.' : 'Choose what you’d like to book.',
    day: quote && !day ? '' : !day ? 'Choose a day.' : day < earliest ? `Choose ${longDate(earliest)} or later.` : '',
    time: quote || time ? '' : 'Choose a time of day.',
    address: !settings.askAddress || address.trim() ? '' : quote ? 'Tell us where the job is.' : 'Tell us where to come.',
    details: !quote || details.trim().length >= 10 ? '' : 'Tell us a little about the job.',
  });
  const valid = $derived(Object.values(errors).every((e) => !e));
  const err = (key: keyof typeof errors) => tried && !!errors[key];

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    tried = true;
    if (!valid || status === 'sending') return;
    if (!connected) {
      status = 'sent';
      return;
    }
    status = 'sending';
    const sent = await sendForm(`${quote ? 'Quote request' : 'Booking request'} from ${name.trim()}`, {
      name: name.trim(),
      email,
      phone: phone.trim() || '-',
      [quote ? 'job' : 'service']: choice,
      [quote ? 'when' : 'day']: day ? longDate(day) : 'Any time',
      ...(quote ? {} : { time }),
      ...(settings.askAddress ? { address: address.trim() } : {}),
      details: details.trim() || '-',
      botcheck,
    });
    status = sent ? 'sent' : 'failed';
  }
</script>

{#if status === 'sent'}
  <div class="form-sent" role="status">
    <p class="big">Thanks, {name.trim().split(' ')[0]}.</p>
    {#if connected}
      <p>{quote ? 'We’ll look at the job and get back to you with a price.' : 'This is a request, not a confirmed booking yet: we’ll email you to confirm the time.'}</p>
    {:else}
      <p>This form isn't connected yet, so nothing was sent.</p>
    {/if}
    <button class="button" type="button" onclick={() => ((status = 'idle'), (tried = false))}>Back to the form</button>
  </div>
{:else}
  <form class="site-form" novalidate onsubmit={submit}>
    <div class="row">
      <div class="field">
        <label for="bk-name">Your name</label>
        <input id="bk-name" autocomplete="name" bind:value={name} aria-invalid={err('name')} aria-describedby="bk-name-err" />
        {#if err('name')}<p class="error" id="bk-name-err">{errors.name}</p>{/if}
      </div>
      <div class="field">
        <label for="bk-email">Email</label>
        <input id="bk-email" type="email" autocomplete="email" bind:value={email} aria-invalid={err('email')} aria-describedby="bk-email-err" />
        {#if err('email')}<p class="error" id="bk-email-err">{errors.email}</p>{/if}
      </div>
    </div>
    <div class="field">
      <label for="bk-phone">Phone <span class="optional">(optional)</span></label>
      <input id="bk-phone" type="tel" autocomplete="tel" bind:value={phone} />
    </div>
    <div class="field">
      <label for="bk-choice">{quote ? 'What kind of job?' : 'What would you like?'}</label>
      <select id="bk-choice" bind:value={choice} aria-invalid={err('choice')} aria-describedby="bk-choice-err">
        <option value="" disabled>Choose one</option>
        {#each settings.options as option (option)}<option>{option}</option>{/each}
      </select>
      {#if err('choice')}<p class="error" id="bk-choice-err">{errors.choice}</p>{/if}
    </div>
    <div class="row">
      <div class="field">
        <label for="bk-day">{quote ? 'When would you like it done?' : 'Which day?'} {#if quote}<span class="optional">(optional)</span>{/if}</label>
        <input id="bk-day" type="date" min={earliest} bind:value={day} aria-invalid={err('day')} aria-describedby="bk-day-err" />
        {#if err('day')}<p class="error" id="bk-day-err">{errors.day}</p>{/if}
      </div>
      {#if !quote}
        <div class="field">
          <label for="bk-time">What time of day?</label>
          <select id="bk-time" bind:value={time} aria-invalid={err('time')} aria-describedby="bk-time-err">
            <option value="" disabled>Choose one</option>
            {#each settings.times as option (option)}<option>{option}</option>{/each}
          </select>
          {#if err('time')}<p class="error" id="bk-time-err">{errors.time}</p>{/if}
        </div>
      {/if}
    </div>
    {#if settings.askAddress}
      <div class="field">
        <label for="bk-address">{quote ? 'Where’s the job?' : 'Where should we come?'}</label>
        <input id="bk-address" bind:value={address} aria-invalid={err('address')} aria-describedby="bk-address-err" />
        {#if err('address')}<p class="error" id="bk-address-err">{errors.address}</p>{/if}
      </div>
    {/if}
    <div class="field">
      <label for="bk-details">{quote ? 'Tell us about the job' : 'Anything we should know?'} {#if !quote}<span class="optional">(optional)</span>{/if}</label>
      <textarea id="bk-details" rows="4" bind:value={details} aria-invalid={err('details')} aria-describedby="bk-details-err"></textarea>
      {#if err('details')}<p class="error" id="bk-details-err">{errors.details}</p>{/if}
    </div>
    <input class="botcheck" type="checkbox" tabindex="-1" aria-hidden="true" bind:checked={botcheck} />
    <button class="button" type="submit" disabled={status === 'sending'}>
      {status === 'sending' ? 'Sending…' : quote ? 'Ask for a quote' : 'Request a booking'}
    </button>
    {#if status === 'failed'}<p class="error" role="alert">Sorry, that didn't send. Please try again in a moment.</p>{/if}
    {#if !connected && site.demo}<p class="note">Not connected yet: this form doesn't send anything.</p>{/if}
    {#if !connected && !site.demo}<p class="note">[PLACEHOLDER: connect this form: the client's Web3Forms key (a "form-key" change) or Cloudflare email (mailUrl)]</p>{/if}
  </form>
{/if}
