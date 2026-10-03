// robots.txt: search engines are welcome; points them at the sitemap once
// the live address is known. Demo sites ask not to be listed.
import { site } from '../site.config';

export function GET() {
  const lines = site.demo ? ['User-agent: *', 'Disallow: /'] : ['User-agent: *', 'Allow: /', ...(site.url ? [`Sitemap: ${site.url}/sitemap.xml`] : [])];
  return new Response(`${lines.join('\n')}\n`, { headers: { 'Content-Type': 'text/plain' } });
}
