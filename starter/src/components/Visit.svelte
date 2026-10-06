<script lang="ts">
  import SectionHead from './SectionHead.svelte';
  // Beside the enquiry form: what to send, where to find the business, how to
  // call, its social pages, when it's open and who made the site.
  let {
    enquiry,
    visitText,
    phone,
    map,
    social,
    hours,
    credit,
  }: {
    enquiry: { title: string; intro: string };
    visitText: string;
    phone: { href: string; text: string } | null;
    map: string;
    social: { label: string; url: string }[];
    hours: { days: string; times: string }[];
    credit: { text: string; href: string } | null;
  } = $props();
</script>

<div class="enquire-info">
  <SectionHead note="Enquiries" title={enquiry.title} intro={enquiry.intro} />
  <div id="visit" class="visit">
    {#if visitText || phone || map || social.length || hours.length}<h3>Find us</h3>{/if}
    {#if visitText}<p class="intro">{visitText}</p>{/if}
    {#if phone || map || social.length}
      <p class="contact-links">
        {#if phone}<a href={phone.href}>{`Call ${phone.text}`}</a>{/if}
        {#if map}<a href={map}>Open in Google Maps</a>{/if}
        {#each social as link (link.url)}<a href={link.url}>{link.label}</a>{/each}
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
  {#if credit}
    <p class="credit">{#if credit.href}<a href={credit.href}>{credit.text}</a>{:else}{credit.text}{/if}</p>
  {/if}
</div>

<style>
  .enquire-info {
    display: grid;
    gap: 2rem;
  }

  .enquire-info :global(.section-head) {
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

  .credit {
    margin: 0;
    font-size: 0.9rem;
    color: var(--ink-soft);
  }

  .credit a {
    color: inherit;
  }

  /* On phones the credit goes under the form, at the end of the page. */
  @media (max-width: 52rem) {
    .enquire-info {
      display: contents;
    }

    .credit {
      order: 1;
    }
  }

  .hours dd {
    margin: 0;
    color: var(--ink-soft);
  }
</style>
