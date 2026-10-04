<script lang="ts">
  // "What can I help with?": one form for a new website, a change to a
  // website, or just a question. The first answer picks the path; Back on a
  // path's first step comes back here. Older links still land in the right
  // place: ?path=change&site=… (or ?site=…) and ?path=new&modules=… .
  import { onMount } from 'svelte';
  import NewSite from './NewSite.svelte';
  import RequestForm from './RequestForm.svelte';
  import Question from './Question.svelte';

  let { prices }: { prices: Record<string, number> } = $props();

  type Path = '' | 'new' | 'change' | 'question';
  let path = $state<Path>('');
  let asked = $state<string[]>([]);
  let heading = $state<HTMLElement>();

  const paths: { id: Exclude<Path, ''>; title: string; text: string }[] = [
    { id: 'new', title: 'A new website', text: 'Tell me about your business and pick what you need. You’ll see the price as you go.' },
    { id: 'change', title: 'A change to my website', text: 'For sites I’ve built: new wording, prices, photos or hours, or something new.' },
    { id: 'question', title: 'Just a question', text: 'Ask me anything, no strings attached.' },
  ];

  onMount(() => {
    const params = new URLSearchParams(location.search);
    const given = params.get('path');
    if (given === 'new' || given === 'change' || given === 'question') path = given;
    else if (params.get('site')) path = 'change';
    else if (params.get('modules')) path = 'new';
    asked = (params.get('modules') ?? '').split(',').map((m) => m.trim()).filter(Boolean);
  });

  function choose(next: Path) {
    path = next;
    if (!next) requestAnimationFrame(() => heading?.focus());
  }
</script>

{#if !path}
  <div class="choose">
    <p class="step-count">Step 1</p>
    <h2 class="step-title" tabindex="-1" bind:this={heading}>What can I help with?</h2>
    <ul class="paths">
      {#each paths as option (option.id)}
        <li>
          <button type="button" class="path" onclick={() => choose(option.id)}>
            <span class="path-title">{option.title}</span>
            <span class="path-text">{option.text}</span>
          </button>
        </li>
      {/each}
    </ul>
  </div>
{:else if path === 'new'}
  <NewSite {prices} {asked} onback={() => choose('')} />
{:else if path === 'change'}
  <RequestForm {prices} onback={() => choose('')} />
{:else}
  <Question onback={() => choose('')} />
{/if}

<style>
  .choose {
    display: grid;
    gap: 0.6rem;
  }
  .step-count {
    margin: 0;
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ink-soft);
  }
  .step-title {
    font-size: clamp(1.6rem, 5vw, 2.2rem);
    outline: none;
  }
  .paths {
    list-style: none;
    margin: 0.6rem 0 0;
    padding: 0;
    display: grid;
    gap: 0.8rem;
  }
  .path {
    width: 100%;
    display: grid;
    gap: 0.25rem;
    text-align: left;
    background: var(--paper);
    border: 2px solid var(--ink);
    border-radius: 0.9rem;
    padding: 1rem 1.1rem;
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }
  .path:hover {
    transform: translate(-2px, -2px);
    box-shadow: 4px 4px 0 var(--accent);
  }
  .path-title {
    font-family: var(--display);
    font-weight: var(--display-weight);
    font-size: 1.3rem;
  }
  .path-text {
    color: var(--ink-soft);
  }
</style>
