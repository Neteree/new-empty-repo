<script lang="ts">
  // Numbered steps, e.g. from first chat to finished job.
  import type { Step } from './steps';

  let { steps }: { steps: Step[] } = $props();
</script>

<ol class="steps">
  {#each steps as step, i (i)}
    <li>
      <span class="num" aria-hidden="true">{i + 1}</span>
      <h3>{step.title}</h3>
      <p>{step.text}</p>
    </li>
  {/each}
</ol>

<style>
  .steps {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
    gap: 1.5rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    display: grid;
    gap: 0.5rem;
    align-content: start;
  }

  .num {
    display: grid;
    place-items: center;
    width: 2.6rem;
    height: 2.6rem;
    border-radius: 50%;
    background: var(--accent);
    color: var(--on-accent);
    font-family: var(--display);
    font-weight: var(--display-weight);
    font-size: 1.2rem;
    box-shadow: 3px 3px 0 var(--highlight);
  }

  h3 {
    font-size: 1.3rem;
  }

  p {
    margin: 0;
    color: var(--ink-soft);
  }
</style>
