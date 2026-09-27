// Photos and the logo live in src/assets/photos/ and are optimised at build
// time. The change scripts copy files there and name them in site.json.
import type { ImageMetadata } from 'astro';

const files = import.meta.glob<ImageMetadata>('../assets/photos/*.{jpg,jpeg,png,webp,avif,svg}', { eager: true, import: 'default' });

/** The image for a file named in site.json. A missing file stops the build rather than showing a broken image. */
export function photo(file: string): ImageMetadata {
  const image = files[`../assets/photos/${file}`];
  if (!image) throw new Error(`src/assets/photos/${file} is missing.`);
  return image;
}
