// Checks the built site before it goes live:
//
//   npm run check              build, then check
//   npm run check -- --no-build   check the existing dist/
//
// 1. HTML is valid (html-validate).
// 2. Visible text is spelt correctly in NZ/UK English (cspell). Add real
//    names and places to cspell.json.
// 3. Every page, on a phone (390px) and a desktop (1440px): no sideways
//    scrolling, no broken images or files, no script errors, and every link
//    on the site points at a page and section that exist.
// 4. Forms: sending an empty form (or pressing Next on step one) shows errors
//    instead of sending.
// 5. No [PLACEHOLDER: ...] text is left on any page.
// 6. Accessibility in light and dark mode (axe-core): colour contrast, labels,
//    headings and other WCAG AA basics.
//
// Full-page screenshots go in check-output/. Exits with 1 if anything fails.
import { execFileSync, spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { extname, join, relative } from 'node:path';
import { launch } from './browser.js';

const dist = 'dist';
const out = 'check-output';
const viewports = { phone: { width: 390, height: 844 }, desktop: { width: 1440, height: 900 } };
const axeSource = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
const failures = [];
const fail = (area, message) => failures.push(`${area}: ${message}`);

if (!process.argv.includes('--no-build')) {
  console.log('Building…');
  execFileSync('npm', ['run', 'build'], { stdio: 'inherit' });
}
if (!existsSync(dist)) throw new Error('No dist/ folder. Run npm run build first.');
rmSync(out, { recursive: true, force: true });
mkdirSync(out);

const pages = (function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return walk(path);
    return name.endsWith('.html') ? [relative(dist, path)] : [];
  });
})(dist);

// 1. HTML
console.log('Checking HTML…');
const validate = spawnSync('npx', ['html-validate', ...pages.map((page) => join(dist, page))], { encoding: 'utf8' });
if (validate.status !== 0) fail('HTML', `\n${validate.stdout}${validate.stderr}`);

// Serve dist/ locally, like the real host would.
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };
const server = createServer((req, res) => {
  let path = join(dist, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (existsSync(path) && statSync(path).isDirectory()) path = join(path, 'index.html');
  if (!existsSync(path)) {
    res.writeHead(404);
    return res.end();
  }
  res.writeHead(200, { 'content-type': types[extname(path)] ?? 'application/octet-stream' });
  res.end(readFileSync(path));
}).listen(0);
const origin = `http://localhost:${server.address().port}`;

const { newPage, close } = await launch();
const texts = [];

for (const page of pages) {
  for (const [device, viewport] of Object.entries(viewports)) {
    const area = `${page} (${device})`;
    const tab = await newPage({ viewport });
    const errors = [];
    tab.on('pageerror', (error) => errors.push(error.message));
    tab.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
    tab.on('response', (response) => {
      if (response.url().startsWith(origin) && response.status() >= 400) errors.push(`${response.status()} ${response.url().slice(origin.length)}`);
    });
    await tab.goto(`${origin}/${page}`, { waitUntil: 'networkidle' });

    // Scroll through so lazy images load, then wait for them.
    const height = await tab.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < height; y += viewport.height / 2) {
      await tab.evaluate((top) => window.scrollTo(0, top), y);
      await tab.waitForTimeout(50);
    }
    await tab.waitForFunction(() => [...document.images].every((img) => img.complete), null, { timeout: 15000 }).catch(() => {});
    await tab.evaluate(() => window.scrollTo(0, 0));

    const report = await tab.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      brokenImages: [...document.images].filter((img) => !img.naturalWidth).map((img) => img.currentSrc || img.src),
      text: `${document.title}\n${document.querySelector('meta[name=description]')?.content ?? ''}\n${document.body.innerText}`,
      links: [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')),
    }));
    if (device === 'phone') {
      for (const gap of new Set(report.text.match(/\[PLACEHOLDER[^\]]*\]/g) ?? [])) fail(area, `still needs ${gap}`);
    }
    if (report.overflow > 0) fail(area, `scrolls sideways by ${report.overflow}px`);
    for (const src of report.brokenImages) fail(area, `image didn't load: ${src}`);
    for (const error of errors) fail(area, `error: ${error}`);
    await tab.screenshot({ path: join(out, `${page.replace(/[\\/]/g, '_').replace('.html', '')}-${device}.png`), fullPage: true });

    if (device === 'phone') {
      texts.push(report.text);

      // 6. Accessibility, in both colour schemes.
      await tab.addScriptTag({ content: axeSource });
      for (const colorScheme of ['light', 'dark']) {
        await tab.emulateMedia({ colorScheme });
        const problems = await tab.evaluate(async () => {
          const { violations } = await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa'] });
          return violations.map((v) => `${v.help} (${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(', ')})`);
        });
        for (const problem of problems) fail(area, `accessibility, ${colorScheme} mode: ${problem}`);
      }
      await tab.emulateMedia({ colorScheme: 'light' });
      // Links to pages and sections on this site must exist.
      for (const href of report.links) {
        if (/^(https?:|mailto:|tel:)/.test(href) || href === '#') continue;
        const target = new URL(href, `${origin}/${page}`);
        let file = decodeURIComponent(target.pathname).slice(1) || 'index.html';
        if (file.endsWith('/')) file += 'index.html';
        if (!existsSync(join(dist, file))) {
          fail(area, `link to a missing page: ${href}`);
          continue;
        }
        const id = decodeURIComponent(target.hash.slice(1));
        if (id && !readFileSync(join(dist, file), 'utf8').includes(`id="${id}"`)) fail(area, `link to a missing section: ${href}`);
      }

      // 4. Forms: an empty submit must show errors and send nothing.
      const forms = await tab.locator('form').count();
      for (let i = 0; i < forms; i++) {
        const form = tab.locator('form').nth(i);
        const sent = [];
        const onRequest = (request) => request.method() === 'POST' && sent.push(request.url());
        tab.on('request', onRequest);
        await form.scrollIntoViewIfNeeded();
        // Interactive parts start working once hydrated (some only when scrolled into
        // view). Wait for that, or a slow machine clicks before the form is ready.
        await tab.waitForFunction(() => !document.querySelector('astro-island[ssr]'), null, { timeout: 15000 }).catch(() => {});
        // A multi-step form starts with Next rather than a submit button.
        const button = form.locator('[type=submit]:visible, button:visible:text-matches("^(Next|Continue)$", "i")').first();
        await button.click();
        const flagged = await tab
          .waitForFunction(() => document.querySelectorAll('form [aria-invalid="true"], form :invalid').length > 0, null, { timeout: 3000 })
          .then(() => true, () => false);
        tab.off('request', onRequest);
        if (!flagged) fail(area, `form ${i + 1}: an empty submit showed no errors`);
        if (sent.length) fail(area, `form ${i + 1}: an empty submit sent a request to ${sent[0]}`);
      }
    }
    await tab.close();
  }
}
await close();
server.close();

// 2. Spelling
console.log('Checking spelling…');
const textFile = join(out, 'page-text.txt');
writeFileSync(textFile, texts.join('\n\n'));
const spell = spawnSync('npx', ['cspell', 'lint', '--no-progress', '--no-summary', '--no-must-find-files', textFile], { encoding: 'utf8' });
if (spell.status !== 0) fail('Spelling', `\n${spell.stdout}${spell.stderr}`);

console.log(`\nChecked ${pages.length} page(s) on phone and desktop. Screenshots are in ${out}/.`);
if (failures.length) {
  console.log(`\n${failures.length} problem(s):\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log('All checks passed.');
