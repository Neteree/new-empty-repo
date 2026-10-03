<script lang="ts">
  // The top of the home page: where the business is, its headline and a
  // button to the enquiry form, beside its main photo (or drawn art until
  // there is one).
  import type { Picture as PictureData } from '../lib/images';
  import Picture from './Picture.svelte';
  import HeroArt from './HeroArt.svelte';

  let {
    name,
    note,
    title,
    text,
    button,
    image = null,
  }: { name: string; note: string; title: string; text: string; button: { label: string; href: string }; image?: PictureData | null } = $props();
</script>

<section class="hero">
  <div>
    <p class="hand-note">{note}</p>
    <h1>{title}</h1>
    <p class="lede">{text}</p>
    <a class="button" href={button.href}>{button.label}</a>
  </div>
  {#if image}
    <Picture class="hero-photo" {image} />
  {:else}
    <HeroArt {name} />
  {/if}
</section>

<style>
  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
    align-items: center;
    gap: 2rem 3rem;
    padding-block: clamp(1.5rem, 5vw, 3.5rem) 0;
  }

  .hero :global(.hero-photo) {
    width: 100%;
    height: auto;
    aspect-ratio: 4 / 3;
    object-fit: cover;
    border-radius: 1rem;
    box-shadow: 8px 8px 0 var(--highlight);
  }

  h1 {
    font-size: clamp(2.8rem, 8vw, 5.6rem);
    margin-block: 0.5rem 1.4rem;
  }

  .lede {
    max-width: 44ch;
    font-size: 1.2rem;
    color: var(--ink-soft);
    margin: 0 0 2rem;
  }

  @media (max-width: 52rem) {
    .hero {
      grid-template-columns: 1fr;
    }
  }
</style>
