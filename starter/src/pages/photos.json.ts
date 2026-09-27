// The site's current gallery, for the change request form on Cameron's site:
// it shows these photos so a client can remove or re-describe them. Public,
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
  return new Response(JSON.stringify({ name: site.name, gallery }), { headers: { 'Content-Type': 'application/json' } });
}
