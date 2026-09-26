<script lang="ts">
  // Cake and catering enquiries. Validates in the browser; a live site would
  // post to a form service or serverless function instead of the demo message.
  let name = $state('');
  let email = $state('');
  let date = $state('');
  let kind = $state('');
  let guests = $state<number | undefined>(undefined);
  let details = $state('');
  let tried = $state(false);
  let sent = $state(false);

  const errors = $derived({
    name: name.trim() ? '' : 'Tell us your name.',
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '' : 'Enter an email address like you@example.com.',
    date: date ? (new Date(date) > new Date() ? '' : 'Choose a date in the future.') : 'Choose the date you need it.',
    kind: kind ? '' : 'Pick what you’d like us to make.',
  });
  const valid = $derived(Object.values(errors).every((e) => !e));

  function submit(event: SubmitEvent) {
    event.preventDefault();
    tried = true;
    if (valid) sent = true;
  }

  function reset() {
    name = email = date = kind = details = '';
    guests = undefined;
    tried = sent = false;
  }
</script>

{#if sent}
  <div class="sent" role="status">
    <p class="big">Thanks, {name.split(' ')[0]}!</p>
    <p>
      On the real site this goes straight to the bakery, and they reply within a day. This is a demo,
      so nothing was sent.
    </p>
    <button class="button" type="button" onclick={reset}>Send another enquiry</button>
  </div>
{:else}
  <form novalidate onsubmit={submit}>
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
    <div class="field">
      <label for="enq-kind">What do you need?</label>
      <select id="enq-kind" bind:value={kind} aria-invalid={tried && !!errors.kind} aria-describedby="enq-kind-err">
        <option value="" disabled>Choose one</option>
        <option>Celebration cake</option>
        <option>Morning tea for the office</option>
        <option>Bread for a wedding or event</option>
        <option>Something else</option>
      </select>
      {#if tried && errors.kind}<p class="error" id="enq-kind-err">{errors.kind}</p>{/if}
    </div>
    <div class="row">
      <div class="field">
        <label for="enq-date">Date</label>
        <input id="enq-date" type="date" bind:value={date} aria-invalid={tried && !!errors.date} aria-describedby="enq-date-err" />
        {#if tried && errors.date}<p class="error" id="enq-date-err">{errors.date}</p>{/if}
      </div>
      <div class="field">
        <label for="enq-guests">Guests <span class="optional">(optional)</span></label>
        <input id="enq-guests" type="number" min="1" max="500" inputmode="numeric" bind:value={guests} />
      </div>
    </div>
    <div class="field">
      <label for="enq-details">Anything else? <span class="optional">(optional)</span></label>
      <textarea id="enq-details" rows="3" bind:value={details} placeholder="Flavours, allergies, a message to pipe on top…"></textarea>
    </div>
    <button class="button" type="submit">Send enquiry</button>
  </form>
{/if}

<style>
  form {
    display: grid;
    gap: 1.1rem;
  }

  .row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
    gap: 1.1rem;
  }

  .field {
    display: grid;
    gap: 0.35rem;
  }

  label {
    font-weight: 700;
  }

  .optional {
    font-weight: 400;
    color: var(--ink-soft);
  }

  input,
  select,
  textarea {
    width: 100%;
    border: 2px solid var(--ink);
    border-radius: 0.6rem;
    background: var(--paper);
    padding: 0.6rem 0.75rem;
  }

  [aria-invalid='true'] {
    border-color: var(--error);
  }

  .error {
    margin: 0;
    color: var(--error);
    font-size: 0.9rem;
    font-weight: 600;
  }

  form .button {
    justify-self: start;
  }

  .sent {
    display: grid;
    gap: 0.75rem;
    justify-items: start;
  }

  .sent p {
    margin: 0;
  }

  .big {
    font-family: var(--display);
    font-size: 1.8rem;
    font-weight: 800;
  }
</style>
