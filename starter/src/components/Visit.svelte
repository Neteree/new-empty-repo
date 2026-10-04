<script lang="ts">
  // Beside the enquiry form: what to send, where to find the business, how to
  // call and when it's open.
  let {
    enquiry,
    visitText,
    phone,
    map,
    hours,
  }: {
    enquiry: { title: string; intro: string };
    visitText: string;
    phone: { href: string; text: string } | null;
    map: string;
    hours: { days: string; times: string }[];
  } = $props();
</script>

<div class="enquire-info">
  <div class="section-head">
    <p class="hand-note">Enquiries</p>
    <h2>{enquiry.title}</h2>
    <p class="intro">{enquiry.intro}</p>
  </div>
  <div id="visit" class="visit">
    {#if visitText || phone || map || hours.length}<h3>Find us</h3>{/if}
    {#if visitText}<p class="intro">{visitText}</p>{/if}
    {#if phone || map}
      <p class="contact-links">
        {#if phone}<a href={phone.href}>{`Call ${phone.text}`}</a>{/if}
        {#if map}<a href={map}>Open in Google Maps</a>{/if}
      </p>
    {/if}
    {#if hours.length}
      <dl class="hours">
        {#each hours as row, i (i)}
          <div><dt>{row.days}</dt><dd>{row.times}</dd></div>
        {/each}
      </dl>
    {/if}
  </div>
</div>

<style>
  .enquire-info {
    display: grid;
    gap: 2rem;
  }

  .enquire-info .section-head {
    margin-bottom: 0;
  }

  .visit h3 {
    font-size: 1.6rem;
    margin-bottom: 0.4rem;
  }

  .visit .intro {
    margin: 0 0 1rem;
  }

  .contact-links {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1.4rem;
    margin: 0 0 1rem;
  }

  .contact-links a {
    font-weight: 700;
    color: var(--accent);
  }

  .hours {
    margin: 0;
    border-top: 2px solid var(--ink);
  }

  .hours div {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 0.2rem 1rem;
    padding-block: 0.85rem;
    border-bottom: 1.5px dashed var(--rule);
  }

  .hours dt {
    font-weight: 700;
  }

  .hours dd {
    margin: 0;
    color: var(--ink-soft);
  }
</style>
