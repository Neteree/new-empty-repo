<script lang="ts">
  import SectionHead from './SectionHead.svelte';
  // Photo gallery, shown once the site has photos (site.json "gallery"): every
  // photo as a tile (grid), or one big photo at a time with thumbnails (slider).
  import type { Picture as PictureData } from '../lib/images';
  import Picture from './Picture.svelte';
  import Carousel from './Carousel.svelte';

  let {
    images,
    layout = 'grid',
    thumbImages = [],
  }: { images: PictureData[]; layout?: 'grid' | 'slider'; thumbImages?: PictureData[] } = $props();
</script>

{#if images.length}
  <section id="gallery" class="section">
    <SectionHead note="Gallery" title="Have a look around" />
    {#if layout === 'slider'}
      <Carousel label="Gallery">
        {#each images as image (image.src)}
          <li class="slide"><Picture {image} /></li>
        {/each}
        {#snippet thumbs()}
          {#each thumbImages as image, i (image.src)}
            <button type="button" class="thumb" data-slide={i} aria-label={`Photo ${i + 1}`}><Picture {image} /></button>
          {/each}
        {/snippet}
      </Carousel>
    {:else}
      <ul class="gallery">
        {#each images as image (image.src)}
          <li><Picture {image} /></li>
        {/each}
      </ul>
    {/if}
  </section>
{/if}

<style>
  .gallery {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
    gap: 1.5rem;
  }
  /* Framed like the site's cards, so photos of mixed quality still look like a set. */
  .gallery li {
    border: var(--frame);
    border-radius: var(--radius);
    overflow: hidden;
    background: var(--paper);
    box-shadow: var(--lift);
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }
  .gallery li:hover {
    transform: translate(-2px, -2px);
    box-shadow: var(--lift-l);
  }
  .gallery :global(img) {
    display: block;
    width: 100%;
    height: auto;
    /* Square tiles crop phone photos (usually tall) far less than wide ones. */
    aspect-ratio: 1;
    object-fit: cover;
  }
  /* Phones: two photos a row, so the gallery reads as a set, not a long scroll. */
  @media (max-width: 40rem) {
    .gallery {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.75rem;
    }
    .gallery li {
      border-radius: var(--radius-s);
      box-shadow: var(--lift-s);
    }
    /* An odd one out at the end takes the whole row, so no gap is left beside it. */
    .gallery li:last-child:nth-child(odd) {
      grid-column: 1 / -1;
    }
    .gallery li:last-child:nth-child(odd) :global(img) {
      aspect-ratio: 2 / 1;
    }
  }
  /* Slider: one photo fills the row; thumbnails underneath. */
  .slide {
    width: 100%;
    border: var(--frame);
    border-radius: var(--radius);
    overflow: hidden;
  }
  .slide :global(img) {
    display: block;
    width: 100%;
    height: auto;
    aspect-ratio: 16 / 9;
    object-fit: cover;
  }
  .thumb {
    width: 3.5rem;
    height: 3.5rem;
    padding: 0;
    border: 2px solid transparent;
    border-radius: var(--radius-s);
    overflow: hidden;
    background: none;
    cursor: pointer;
    opacity: 0.55;
  }
  .thumb:global([aria-current='true']) {
    opacity: 1;
    border-color: var(--accent);
  }
  .thumb :global(img) {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  @media (max-width: 40rem) {
    .slide :global(img) {
      aspect-ratio: 4 / 5;
    }
    .thumb {
      width: 2.75rem;
      height: 2.75rem;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .gallery li {
      transition: none;
    }
  }
</style>
