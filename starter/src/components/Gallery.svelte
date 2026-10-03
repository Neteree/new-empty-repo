<script lang="ts">
  // Photo gallery, shown once the site has photos (site.json "gallery").
  import type { Picture as PictureData } from '../lib/images';
  import Picture from './Picture.svelte';

  let { images }: { images: PictureData[] } = $props();
</script>

{#if images.length}
  <section id="gallery" class="section">
    <div class="section-head">
      <p class="hand-note">Gallery</p>
      <h2>Have a look around</h2>
    </div>
    <ul class="gallery">
      {#each images as image (image.src)}
        <li><Picture {image} /></li>
      {/each}
    </ul>
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
    border: 2px solid var(--ink);
    border-radius: 1rem;
    overflow: hidden;
    background: var(--paper);
    box-shadow: 6px 6px 0 var(--highlight);
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }
  .gallery li:hover {
    transform: translate(-2px, -2px);
    box-shadow: 8px 8px 0 var(--highlight);
  }
  .gallery :global(img) {
    display: block;
    width: 100%;
    height: auto;
    /* Square tiles crop phone photos (usually tall) far less than wide ones. */
    aspect-ratio: 1;
    object-fit: cover;
  }
  @media (prefers-reduced-motion: reduce) {
    .gallery li {
      transition: none;
    }
  }
</style>
