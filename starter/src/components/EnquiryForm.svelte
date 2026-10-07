<script lang="ts">
  // Enquiry form. Sends through lib/send.ts: the intake Worker (`mailUrl`) or
  // Web3Forms (`site.formKey`) emails the enquiry to the client (or, on a site
  // with `intakeUrl`, it goes into the request queue). Without any it sends nothing. The "What do you
  // need?" choices come from `site.enquiry.options`.
  import { site } from '../site.config';
  import { connected, send } from '../lib/send';

  let name = $state('');
  let email = $state('');
  let business = $state('');
  let need = $state('');
  let message = $state('');
  let botcheck = $state(false);
  let tried = $state(false);
  let status = $state<'idle' | 'sending' | 'sent' | 'failed'>('idle');

  const errors = $derived({
    name: name.trim() ? '' : 'Tell us your name.',
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '' : 'Enter an email address like you@example.com.',
    need: need ? '' : 'Choose what you need.',
  });
  const valid = $derived(Object.values(errors).every((e) => !e));

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    tried = true;
    if (!valid || status === 'sending') return;
    if (!connected) {
      status = 'sent';
      return;
    }
    status = 'sending';
    const answers = {
      name: name.trim(),
      email: email.trim(),
      ...(site.enquiry.askBusiness ? { business: business.trim() || '-' } : {}),
      need,
      message: message.trim() || '-',
    };
    try {
      await send({ kind: 'contact', subject: `Website enquiry from ${answers.name}`, fields: answers, payload: answers, botcheck });
      status = 'sent';
    } catch {
      status = 'failed';
    }
  }

  function reset() {
    status = 'idle';
    tried = false;
  }
</script>

{#if status === 'sent'}
  <div class="form-sent" role="status">
    <p class="big">Thanks, {name.trim().split(' ')[0]}.</p>
    {#if connected}
      <p>{site.enquiry.thanks || "Your enquiry is on its way. We'll get back to you soon."}</p>
    {:else}
      <p>This form isn't connected yet, so nothing was sent. Once it's live, enquiries will arrive straight away.</p>
    {/if}
    <button class="button" type="button" onclick={reset}>Back to the form</button>
  </div>
{:else}
  <form class="site-form" novalidate onsubmit={submit}>
    <div class="row">
      <div class="field">
        <label for="enq-name">Your name</label>
        <input id="enq-name" autocomplete="name" bind:value={name} aria-invalid={tried && !!errors.name} aria-describedby="enq-name-err" />
        {#if tried && errors.name}<p class="error" id="enq-name-err">{errors.name}</p>{/if}
      </div>
      <div class="field">
        <label for="enq-email">Email</label>
        <input id="enq-email" type="email" autocomplete="email" bind:value={email} aria-invalid={tried && !!errors.email} aria-describedby="enq-email-err" />
        {#if tried && errors.email}<p class="error" id="enq-email-err">{errors.email}</p>{/if}
      </div>
    </div>
    {#if site.enquiry.askBusiness}
      <div class="field">
        <label for="enq-business">Your business <span class="optional">(optional)</span></label>
        <input id="enq-business" autocomplete="organization" bind:value={business} />
      </div>
    {/if}
    <div class="field">
      <label for="enq-need">What do you need?</label>
      <select id="enq-need" bind:value={need} aria-invalid={tried && !!errors.need} aria-describedby="enq-need-err">
        <option value="" disabled>Choose one</option>
        {#each site.enquiry.options as option (option)}<option>{option}</option>{/each}
      </select>
      {#if tried && errors.need}<p class="error" id="enq-need-err">{errors.need}</p>{/if}
    </div>
    <div class="field">
      <label for="enq-message">Anything else? <span class="optional">(optional)</span></label>
      <textarea id="enq-message" rows="4" bind:value={message}></textarea>
    </div>
    <input class="botcheck" type="checkbox" tabindex="-1" aria-hidden="true" bind:checked={botcheck} />
    <button class="button" type="submit" disabled={status === 'sending'}>
      {status === 'sending' ? 'Sending…' : 'Send enquiry'}
    </button>
    {#if status === 'failed'}
      <p class="error" role="alert">Sorry, that didn't send. Please try again in a moment.</p>
    {/if}
    {#if !connected && site.demo}<p class="note">Not connected yet: this form doesn't send anything.</p>{/if}
    <!-- A real client's site can't go live until its form sends: the checks catch this placeholder. -->
    {#if !connected && !site.demo}<p class="note">[PLACEHOLDER: connect this form with the client's Web3Forms key (a "form-key" change)]</p>{/if}
  </form>
{/if}
