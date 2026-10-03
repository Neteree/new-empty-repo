<script lang="ts">
  // Customer reviews as quote cards.
  import type { Review } from './reviews';

  let { items }: { items: Review[] } = $props();
</script>

<ul class="reviews">
  {#each items as review, i (i)}
    <li>
      <figure>
        {#if review.stars}
          <p class="stars"><span aria-hidden="true">{'★'.repeat(review.stars)}<span class="off">{'★'.repeat(5 - review.stars)}</span></span><span class="visually-hidden">{review.stars} out of 5 stars</span></p>
        {/if}
        <blockquote><p>{review.quote}</p></blockquote>
        <figcaption>{review.name}{#if review.source}<span>, {review.source}</span>{/if}</figcaption>
      </figure>
    </li>
  {/each}
</ul>

<style>
  .reviews {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(17rem, 1fr));
    gap: 1.5rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  figure {
    display: grid;
    gap: 0.75rem;
    height: 100%;
    margin: 0;
    padding: 1.4rem 1.5rem;
    border: 2px solid var(--ink);
    border-radius: 1rem;
    box-shadow: 6px 6px 0 var(--highlight);
  }
  .stars {
    margin: 0;
    color: var(--accent);
    letter-spacing: 0.1em;
  }
  .stars .off {
    color: var(--rule);
  }
  blockquote {
    margin: 0;
    font-size: 1.1rem;
  }
  blockquote p {
    margin: 0;
  }
  blockquote p::before {
    content: '“';
  }
  blockquote p::after {
    content: '”';
  }
  figcaption {
    align-self: end;
    font-weight: 700;
  }
  figcaption span {
    font-weight: 400;
    color: var(--ink-soft);
  }
</style>
