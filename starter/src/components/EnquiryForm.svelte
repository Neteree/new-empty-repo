<script lang="ts">
  // Enquiry form. Sends through Web3Forms (lib/send.ts), which emails the
  // enquiry to the address behind `site.formKey`. Without a key it sends nothing. The
  // "What do you need?" choices come from `site.enquiry.options`.
  import { site } from '../site.config';
  import { sendForm } from '../lib/send';

  let name = $state('');
  let email = $state('');
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
    if (!site.formKey) {
      status = 'sent';
      return;
    }
    status = 'sending';
    const sent = await sendForm(`Website enquiry from ${name.trim()}`, {
      name: name.trim(),
      email,
      need,
      message: message.trim() || '-',
      botcheck,
    });
    status = sent ? 'sent' : 'failed';
  }

  function reset() {
    status = 'idle';
    tried = false;
  }
</script>

{#if status === 'sent'}
  <div class="form-sent" role="status">
    <p class="big">Thanks, {name.trim().split(' ')[0]}.</p>
    {#if site.formKey}
      <p>Your enquiry is on its way. We'll get back to you soon.</p>
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
    {#if !site.formKey && site.demo}<p class="note">Not connected yet: this form doesn't send anything.</p>{/if}
    <!-- A real client's site can't go live until its form sends: the checks catch this placeholder. -->
    {#if !site.formKey && !site.demo}<p class="note">[PLACEHOLDER: connect this form with the client's Web3Forms key (a "form-key" change)]</p>{/if}
  </form>
{/if}
