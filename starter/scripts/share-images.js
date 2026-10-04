// Draws the link-preview image (public/og.png, 1200x630) and the phone home
// screen icon (public/apple-touch-icon.png, 180x180) from the site's name,
// headline and look. The layout shows the preview once `url` is set in
// site.json. Run it again after changing the name, headline or look:
//
//   node scripts/share-images.js
import { mkdirSync, readFileSync } from 'node:fs';
import { launch } from './browser.js';
import { themes } from '../src/themes.ts';

const site = JSON.parse(readFileSync('src/data/site.json', 'utf8'));
const theme = themes[site.theme] ?? themes.bold;
const c = theme.light;
const fonts = `https://fonts.googleapis.com/css2?family=${theme.fonts}&display=swap`;
const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
const initials = site.name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

const share = `<!doctype html><html><head><link rel="stylesheet" href="${fonts}"><style>
  body { margin: 0; width: 1200px; height: 630px; background: ${c.paper}; font-family: ${theme.body}; color: ${c.ink}; }
  .card { box-sizing: border-box; height: 100%; padding: 72px 80px; display: flex; flex-direction: column; justify-content: space-between; border-bottom: 18px solid ${c.highlight}; }
  .eyebrow { font-weight: 700; font-size: 26px; letter-spacing: 0.14em; text-transform: uppercase; color: ${c.accent}; margin: 0; }
  h1 { font-family: ${theme.display}; font-weight: ${theme.displayWeight}; font-size: 80px; line-height: 1.04; margin: 0; max-width: 1000px; }
  .foot { display: flex; justify-content: space-between; align-items: end; font-size: 30px; font-weight: 500; }
  .name { font-family: ${theme.display}; font-weight: ${theme.displayWeight}; font-size: 44px; color: ${c.accent}; }
</style></head><body><div class="card">
  <p class="eyebrow">${esc(site.suburb)}, ${esc(site.city)}</p>
  <h1>${esc(site.heroTitle)}</h1>
  <div class="foot"><span class="name">${esc(site.name)}</span><span>${esc(site.heroNote)}</span></div>
</div></body></html>`;

const icon = `<!doctype html><html><head><link rel="stylesheet" href="${fonts}"><style>
  body { margin: 0; width: 180px; height: 180px; background: ${c.accent}; display: grid; place-items: center; }
  div { font-family: ${theme.display}; font-weight: ${theme.displayWeight}; font-size: 74px; color: ${c['on-accent']}; border-bottom: 10px solid ${c.highlight}; line-height: 1.1; }
</style></head><body><div>${esc(initials)}</div></body></html>`;

mkdirSync('public', { recursive: true });
const { newPage, close } = await launch();
for (const [html, size, path] of [
  [share, { width: 1200, height: 630 }, 'public/og.png'],
  [icon, { width: 180, height: 180 }, 'public/apple-touch-icon.png'],
]) {
  const page = await newPage({ viewport: size });
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path });
  console.log(`Wrote ${path}`);
}
await close();
