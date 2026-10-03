// sitemap.xml: every page, for search engines. Only once the site's live
// address (site.json "url") is known, since a sitemap needs full addresses.
import { getCollection } from 'astro:content';
import { site } from '../site.config';

export async function GET() {
  if (!site.url) return new Response('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>\n', { headers: { 'Content-Type': 'application/xml' } });
  const pages = Object.keys(import.meta.glob('./*.astro'))
    .map((path) => path.slice(2).replace('.astro', ''))
    .filter((name) => name !== '404' && !name.includes('['))
    .map((name) => (name === 'index' ? '' : `${name}.html`));
  const hasPosts = Object.keys(import.meta.glob('../content/journal/**/*.md')).length > 0;
  const posts = hasPosts ? (await getCollection('journal')).map((post) => `journal/${post.id}.html`) : [];
  const urls = [...pages, ...posts].map((path) => `  <url><loc>${site.url}/${path}</loc></url>`).join('\n');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, {
    headers: { 'Content-Type': 'application/xml' },
  });
}
