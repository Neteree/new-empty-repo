// Optimised photos as plain data for Svelte sections. Astro resizes and
// converts photos at build time, but only an .astro file can ask it to, so
// the page shell calls picture() and passes the result to the section, which
// just draws an <img> with it (the same markup Astro's <Image> makes).
import { getImage } from 'astro:assets';
import { photo } from './photos';

export interface Picture {
  src: string;
  srcset: string;
  sizes: string;
  width: number;
  height: number;
  alt: string;
  loading: 'lazy' | 'eager';
}

export async function picture(file: string, alt: string, widths: number[], sizes: string, loading: 'lazy' | 'eager' = 'lazy'): Promise<Picture> {
  const image = await getImage({ src: photo(file), widths, sizes });
  return {
    src: image.src,
    srcset: image.srcSet.attribute,
    sizes,
    width: Number(image.attributes.width),
    height: Number(image.attributes.height),
    alt,
    loading,
  };
}
