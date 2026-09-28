// The site's current gallery, for the change request form on Cameron's site:
// it shows these photos so a client can remove or re-describe them (and pick
// them for price list items). Public,
// like the photos themselves (public/_headers lets other sites read it).
import { getImage } from 'astro:assets';
import { site } from '../site.config';
import { photo } from '../lib/photos';

export async function GET() {
  const gallery = await Promise.all(
    site.gallery.map(async (item) => ({
      file: item.file,
      alt: item.alt,
      src: (await getImage({ src: photo(item.file), width: 200, format: 'webp' })).src,
    })),
  );
  // Add-on modules on this site, and its price list items, so the form only
  // offers changes that fit and can list items to choose from.
  const modules = Object.keys(import.meta.glob('../modules/*/Section.astro')).map((path) => path.split('/')[2]);
  const priceData = Object.values(import.meta.glob<{ default: { items: { name: string; unavailable?: boolean }[] } }>('../modules/prices/prices.json', { eager: true }))[0];
  const prices = priceData?.default.items.map((item) => ({ name: item.name, available: !item.unavailable })) ?? [];
  return new Response(JSON.stringify({ name: site.name, gallery, modules, prices }), { headers: { 'Content-Type': 'application/json' } });
}
