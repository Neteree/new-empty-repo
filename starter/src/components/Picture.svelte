<script lang="ts">
  // An optimised photo from lib/images.ts picture().
  import type { Picture } from '../lib/images';

  let { image, class: className = '' }: { image: Picture; class?: string } = $props();
</script>

<img
  class={className}
  src={image.src}
  srcset={image.srcset}
  sizes={image.sizes}
  width={image.width}
  height={image.height}
  alt={image.alt}
  loading={image.loading}
  decoding="async"
/>
