<script lang="ts">
  // Past work as a grid of pictures with a line on each.
  import type { Picture as PictureData } from '../../lib/images';
  import Picture from '../../components/Picture.svelte';

  let {
    items,
    browser = false,
  }: { items: { title: string; kind: string; text: string; link?: string; demo?: boolean; image: PictureData }[]; browser?: boolean } = $props();
</script>

<ul class="work">
  {#each items as item, i (i)}
    <li>
      <figure class:browser>
        {#if browser}<span class="dots" aria-hidden="true"></span>{/if}
        <Picture image={item.image} />
      </figure>
      <p class="kind">{item.kind}{#if item.demo}<span class="visually-hidden">, </span><span class="tag">Demo</span>{/if}</p>
      <h3>{#if item.link}<a href={item.link}>{item.title}</a>{:else}{item.title}{/if}</h3>
      <p class="text">{item.text}</p>
    </li>
  {/each}
</ul>

<style>
  .work {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 22rem), 1fr));
    gap: 2.5rem 2rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  figure {
    margin: 0 0 1rem;
    border-radius: 0.8rem;
    overflow: hidden;
    border: var(--frame);
    box-shadow: var(--lift);
  }

  figure :global(img) {
    display: block;
    width: 100%;
    height: auto;
    aspect-ratio: 16 / 10;
    object-fit: cover;
    object-position: top;
  }

  .browser {
    border-radius: 0.6rem;
  }

  .dots {
    display: block;
    height: 1.4rem;
    border-bottom: 2px solid var(--ink);
    background:
      radial-gradient(circle at 0.8rem 50%, var(--highlight) 0.28rem, transparent 0.3rem),
      radial-gradient(circle at 1.7rem 50%, var(--rule) 0.28rem, transparent 0.3rem),
      radial-gradient(circle at 2.6rem 50%, var(--rule) 0.28rem, transparent 0.3rem),
      var(--paper);
  }

  .kind {
    margin: 0;
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--ink-soft);
  }

  .tag {
    display: inline-block;
    margin-left: 0.4rem;
    padding: 0.05rem 0.5rem;
    border-radius: 999px;
    background: var(--highlight);
    color: var(--on-highlight);
    letter-spacing: 0.04em;
  }

  h3 {
    font-size: 1.6rem;
    margin-block: 0.3rem 0.4rem;
  }

  h3 a {
    text-decoration-thickness: 2px;
    text-underline-offset: 4px;
  }

  .text {
    margin: 0;
    color: var(--ink-soft);
  }
</style>
