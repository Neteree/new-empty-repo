<script lang="ts">
  // Just a question: name, email and message, into the same queue as everything else.
  import { site } from '../../site.config';
  import { connected, send } from '../../lib/send';

  let { onback }: { onback: () => void } = $props();

  let name = $state('');
  let email = $state('');
  let message = $state('');
  let botcheck = $state(false);
  let tried = $state(false);
  let status = $state<'idle' | 'sending' | 'sent' | 'failed'>('idle');

  const errors = $derived({
    name: name.trim() ? '' : 'Tell me your name.',
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '' : 'Enter an email address like you@example.com.',
    message: message.trim() ? '' : 'Write your question.',
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
    const answers = { name: name.trim(), email: email.trim(), need: 'A question', message: message.trim() };
    try {
      await send({ kind: 'contact', subject: `Question from ${answers.name}`, fields: answers, payload: answers, botcheck });
      status = 'sent';
    } catch {
      status = 'failed';
    }
  }
</script>

{#if status === 'sent'}
  <div class="sent" role="status">
    <p class="big">Thanks, {name.trim().split(' ')[0]}.</p>
    <p>{connected ? "I'll get back to you soon." : "This form isn't connected yet, so nothing was sent."}</p>
  </div>
{:else}
  <form class="site-form" novalidate onsubmit={submit}>
    <div class="row">
      <div class="field">
        <label for="q-name">Your name</label>
        <input id="q-name" autocomplete="name" bind:value={name} aria-invalid={tried && !!errors.name} aria-describedby="q-name-err" />
        {#if tried && errors.name}<p class="error" id="q-name-err">{errors.name}</p>{/if}
      </div>
      <div class="field">
        <label for="q-email">Email</label>
        <input id="q-email" type="email" autocomplete="email" bind:value={email} aria-invalid={tried && !!errors.email} aria-describedby="q-email-err" />
        {#if tried && errors.email}<p class="error" id="q-email-err">{errors.email}</p>{/if}
      </div>
    </div>
    <div class="field">
      <label for="q-message">Your question</label>
      <textarea id="q-message" rows="4" bind:value={message} aria-invalid={tried && !!errors.message} aria-describedby="q-message-err"></textarea>
      {#if tried && errors.message}<p class="error" id="q-message-err">{errors.message}</p>{/if}
    </div>
    <input class="botcheck" type="checkbox" tabindex="-1" aria-hidden="true" bind:checked={botcheck} />
    <div class="nav">
      <button class="button ghost" type="button" onclick={onback}>Back</button>
      <button class="button" type="submit" disabled={status === 'sending'}>{status === 'sending' ? 'Sending…' : 'Send'}</button>
    </div>
    {#if status === 'failed'}<p class="error" role="alert">Sorry, that didn't send. Please try again in a moment.</p>{/if}
  </form>
{/if}

<style>
  .nav {
    display: flex;
    gap: 0.8rem;
  }
  .button.ghost {
    background: none;
    color: var(--ink);
    border: 2px solid var(--ink);
    box-shadow: none;
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
