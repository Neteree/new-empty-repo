<script lang="ts">
  // Photo gallery, shown once the site has photos (site.json "gallery"), in
  // one of four layouts (site.json "galleryLayout"):
  // - grid: every photo as a tile.
  // - slider: one big photo at a time, arrows beside the heading, thumbnails underneath.
  // - mosaic: the first photo large with the rest fitted around it.
  // - strip: a row of photos drifting slowly sideways (still for people who
  //   prefer less motion, who can scroll it instead).
  import SectionHead from './SectionHead.svelte';
  import type { Picture as PictureData } from '../lib/images';
  import Picture from './Picture.svelte';
  import Carousel from './Carousel.svelte';

  let {
    images,
    layout = 'grid',
    thumbImages = [],
  }: { images: PictureData[]; layout?: 'grid' | 'slider' | 'mosaic' | 'strip'; thumbImages?: PictureData[] } = $props();
</script>

{#snippet heading()}<SectionHead note="Gallery" title="Have a look around" />{/snippet}

{#if images.length}
  <section id="gallery" class="section">
    {#if layout === 'slider'}
      <Carousel label="Gallery" head={heading}>
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
      {@render heading()}
      {#if layout === 'mosaic'}
        <ul class="mosaic">
          {#each images as image, i (image.src)}
            <li class:big={i === 0} class:tall={i === 1}><Picture {image} /></li>
          {/each}
        </ul>
      {:else if layout === 'strip'}
        <div class="strip" tabindex="0" role="region" aria-label="Gallery">
          <ul class="strip-inner">
            {#each images as image (image.src)}
              <li><Picture {image} /></li>
            {/each}
            {#each images as image (`again-${image.src}`)}
              <li class="again" aria-hidden="true"><Picture image={{ ...image, alt: '' }} /></li>
            {/each}
          </ul>
        </div>
      {:else}
        <ul class="gallery">
          {#each images as image (image.src)}
            <li><Picture {image} /></li>
          {/each}
        </ul>
      {/if}
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
  /* Mosaic: the first photo two tiles wide and tall, the second two tall. */
  .mosaic {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    grid-auto-rows: clamp(7rem, 14vw, 11rem);
    grid-auto-flow: dense;
    gap: 0.5rem;
  }
  .mosaic li {
    overflow: hidden;
    border-radius: var(--radius-s);
  }
  .mosaic .big {
    grid-column: span 2;
    grid-row: span 2;
  }
  .mosaic .tall {
    grid-row: span 2;
  }
  .mosaic :global(img) {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* Strip: two copies side by side, moved half their width, so it loops. */
  .strip {
    overflow: hidden;
  }
  .strip-inner {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    gap: 0.75rem;
    width: max-content;
    animation: drift 60s linear infinite;
  }
  .strip:hover .strip-inner,
  .strip:focus-within .strip-inner {
    animation-play-state: paused;
  }
  .strip li {
    width: clamp(10rem, 22vw, 15rem);
    aspect-ratio: 3 / 4;
    overflow: hidden;
    border-radius: var(--radius-s);
  }
  .strip :global(img) {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  @keyframes drift {
    to {
      transform: translateX(-50%);
    }
  }

  @media (max-width: 40rem) {
    .mosaic {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      grid-auto-rows: 9rem;
    }
    .mosaic .tall {
      grid-row: span 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .strip {
      overflow-x: auto;
    }
    .strip-inner {
      animation: none;
    }
    .strip .again {
      display: none;
    }
    .gallery li {
      transition: none;
    }
  }
</style>
