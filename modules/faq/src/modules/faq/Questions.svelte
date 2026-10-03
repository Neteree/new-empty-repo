<script lang="ts">
  // Questions and answers that open and close, with no JavaScript (<details>).
  import type { Question } from './faq';

  let { questions }: { questions: Question[] } = $props();
</script>

<div class="faq">
  {#each questions as item, i (i)}
    <details>
      <summary>{item.question}</summary>
      {#each item.answer.split(/\n\s*\n/) as paragraph, j (j)}<p>{paragraph}</p>{/each}
    </details>
  {/each}
</div>

<style>
  .faq {
    max-width: 48rem;
    border-top: 2px solid var(--ink);
  }
  details {
    border-bottom: 1.5px dashed var(--rule);
  }
  summary {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding: 1rem 0;
    font-weight: 700;
    font-size: 1.1rem;
    cursor: pointer;
    list-style: none;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  summary::after {
    content: '+';
    flex: none;
    font-size: 1.5rem;
    line-height: 1;
    color: var(--accent);
  }
  details[open] summary::after {
    content: '−';
  }
  p {
    margin: 0 0 1rem;
    max-width: 60ch;
    color: var(--ink-soft);
  }
</style>
