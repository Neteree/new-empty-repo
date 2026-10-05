<script lang="ts">
  // The top of the home page: where the business is, its headline and a
  // button to the enquiry form, with its main photo (or drawn art until
  // there is one). The look picks the layout: the headline beside the photo
  // (split), the photo first (flip), the headline on a panel over a big photo
  // (cover), or a centred headline above a wide photo (stacked).
  import type { HeroLayout } from '../themes';
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
    layout = 'split',
  }: { name: string; note: string; title: string; text: string; button: { label: string; href: string }; image?: PictureData | null; layout?: HeroLayout } = $props();
  // Cover needs a photo to sit on; without one it falls back to the side-by-side layout.
  const shape = $derived(layout === 'cover' && !image ? 'split' : layout);
</script>

<section class="hero {shape}">
  <div class="words">
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
    border-radius: var(--radius);
    box-shadow: var(--lift-l);
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

  /* Photo first; the headline keeps the wider column. */
  .flip {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
  }
  .flip .words {
    order: 2;
  }

  /* A centred headline above a wide photo. */
  .stacked {
    grid-template-columns: 1fr;
    justify-items: center;
    text-align: center;
  }
  .stacked .lede {
    margin-inline: auto;
  }
  .stacked {
    gap: 1.5rem;
  }
  .stacked h1 {
    max-width: 18ch;
    margin-inline: auto;
    font-size: clamp(2.6rem, 6vw, 4.4rem);
    margin-block: 0.3rem 1rem;
  }
  .stacked .lede {
    margin-bottom: 1.5rem;
  }
  .stacked :global(.hero-photo) {
    aspect-ratio: 21 / 9;
  }

  /* The headline on a panel over a big photo. */
  .cover {
    grid-template-columns: 1fr;
    position: relative;
  }
  .cover :global(.hero-photo) {
    grid-area: 1 / 1;
    aspect-ratio: 16 / 9;
    min-height: 32rem;
  }
  .cover .words {
    grid-area: 1 / 1;
    align-self: end;
    z-index: 1;
    max-width: 34rem;
    margin: 0 0 2.5rem 2.5rem;
    padding: 2rem 2.25rem;
    background: var(--paper);
    border-radius: var(--radius);
    box-shadow: var(--lift-l);
  }
  .cover h1 {
    font-size: clamp(2.4rem, 5vw, 3.8rem);
  }

  @media (max-width: 52rem) {
    .hero {
      grid-template-columns: 1fr;
    }
    .flip .words {
      order: 0;
    }
    /* On narrow screens the photo comes first and the panel overlaps its foot. */
    .cover {
      gap: 0;
    }
    .cover .words {
      grid-area: 2 / 1;
      margin: -3rem 0.75rem 0;
      padding: 1.5rem 1.25rem;
    }
    .cover :global(.hero-photo) {
      grid-area: 1 / 1;
      min-height: 0;
      aspect-ratio: 4 / 3;
    }
  }

  /* Phones: a smaller headline, so the photo shows on the first screen. */
  @media (max-width: 40rem) {
    .hero {
      gap: 1.5rem;
    }
    h1 {
      font-size: clamp(2.2rem, 10vw, 2.8rem);
      margin-block: 0.4rem 0.9rem;
    }
    .lede {
      font-size: 1.05rem;
      margin-bottom: 1.4rem;
    }
    .hero :global(.hero-photo) {
      box-shadow: var(--lift-s);
    }
  }
</style>
