// Brings an existing client site up to date with this starter and its
// modules: page code, components, scripts and checks are replaced with the
// starter's; the client's content never is. No AI: it only copies files.
//
//   node scripts/update-site.js <site-folder> [--dry-run]
//
// Kept as the site's own: src/data/site.json, photos, news posts, module data
// (src/modules/<name>/*.json), files in public/ (icons, share image) and the lock file. New settings the starter has
// added are filled in with their defaults (never overwriting the client's);
// package.json and cspell-words.txt are merged. Files that came from an older
// starter and are gone now are removed (the site keeps a list of them in
// .starter-files.json). Afterwards: cd <site> && npm install && npm run check.
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { writeCatalogue } from './catalogue.js';

const [target, ...flags] = process.argv.slice(2);
const dryRun = flags.includes('--dry-run');
if (!target || !existsSync(join(target, 'src/data/site.json'))) {
  console.error('Usage: node scripts/update-site.js <site-folder> [--dry-run]  (the folder of a site made from this starter)');
  process.exit(1);
}

const starter = resolve(import.meta.dirname, '..');
const modulesDir = resolve(starter, '../modules');
const site = resolve(target);
const MANIFEST = '.starter-files.json';
/** Files earlier starters had that are gone now, for sites updated before there was a list. */
const RETIRED = ['src/components/Gallery.astro', 'src/components/HeroArt.astro'];

const SKIP = new Set(['.git', 'node_modules', 'dist', '.astro', 'clients', 'check-output', 'new-client.js', 'update-site.js']);
/** The client's content: never replaced. */
const isContent = (path) =>
  path === 'src/data/site.json' ||
  path === 'package.json' ||
  path === 'package-lock.json' ||
  path === 'cspell-words.txt' ||
  /^src\/assets\/photos\//.test(path) ||
  (/^public\//.test(path) && !existsSync(join(starter, path))) ||
  /^src\/content\/journal\//.test(path);

function walk(dir, base = dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    if (SKIP.has(name)) return [];
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path, base) : [relative(base, path)];
  });
}

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const report = { updated: [], added: [], removed: [], filled: [], notFromStarter: [] };
const owned = [];

function put(from, to) {
  const path = relative(site, to);
  owned.push(path);
  if (existsSync(to) && readFileSync(to).equals(readFileSync(from))) return;
  report[existsSync(to) ? 'updated' : 'added'].push(path);
  if (dryRun) return;
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(from, to);
}

/** Adds settings the defaults have and the site's data doesn't, without touching existing values. */
function fill(data, defaults, at = '') {
  for (const [key, value] of Object.entries(defaults)) {
    if (!(key in data)) {
      data[key] = value;
      report.filled.push(`${at}${key}`);
    } else if (value && typeof value === 'object' && !Array.isArray(value) && data[key] && typeof data[key] === 'object') {
      fill(data[key], value, `${at}${key}.`);
    }
  }
  return data;
}

function fillJson(sitePath, defaultsPath, label) {
  if (!existsSync(sitePath)) return put(defaultsPath, sitePath);
  owned.push(relative(site, sitePath));
  const before = report.filled.length;
  const data = fill(readJson(sitePath), readJson(defaultsPath), `${label}: `);
  if (report.filled.length > before && !dryRun) writeFileSync(sitePath, `${JSON.stringify(data, null, 2)}\n`);
}

// 1. The starter's own files.
for (const path of walk(starter)) {
  if (isContent(path)) continue;
  put(join(starter, path), join(site, path));
}
fillJson(join(site, 'src/data/site.json'), join(starter, 'src/data/site.json'), 'site.json');

// 2. The modules this site has: code is replaced, data (*.json) only gains new settings.
const siteModules = existsSync(join(site, 'src/modules')) ? readdirSync(join(site, 'src/modules')) : [];
const extraDeps = {};
for (const name of siteModules) {
  if (!existsSync(join(modulesDir, name, 'src/modules', name))) {
    report.notFromStarter.push(`src/modules/${name}/ (no such module in the starter)`);
    continue;
  }
  // A module's whole src/ (its section, and any pages it adds, e.g. src/pages/game.astro).
  const source = join(modulesDir, name, 'src');
  for (const path of walk(source)) {
    const to = join(site, 'src', path);
    if (path.startsWith(`modules/${name}/`) && path.endsWith('.json')) fillJson(to, join(source, path), `${name}/${path.split('/').pop()}`);
    else put(join(source, path), to);
  }
  put(join(modulesDir, name, 'README.md'), join(site, 'src/modules', name, 'README.md'));
  const manifest = join(modulesDir, name, 'module.json');
  if (existsSync(manifest)) Object.assign(extraDeps, readJson(manifest).dependencies);
}

// The add-on modules the onboarding form offers, from the modules folder.
if (!dryRun) writeCatalogue(site, modulesDir);

// 3. The change-request agent lives at the repo root.
put(resolve(starter, '../site_agent.py'), join(site, 'scripts/site_agent.py'));

// 4. package.json: the starter's scripts and package versions, plus the site's own extras and its modules' packages.
const pkgPath = join(site, 'package.json');
const pkg = readJson(pkgPath);
const base = readJson(join(starter, 'package.json'));
const merged = {
  ...pkg,
  scripts: { ...pkg.scripts, ...base.scripts },
  dependencies: { ...pkg.dependencies, ...base.dependencies, ...extraDeps },
  devDependencies: { ...pkg.devDependencies, ...base.devDependencies },
};
if (JSON.stringify(merged) !== JSON.stringify(pkg)) {
  report.updated.push('package.json (merged)');
  if (!dryRun) writeFileSync(pkgPath, `${JSON.stringify(merged, null, 2)}\n`);
}

// 5. Spelling words: add the starter's and modules' words the site doesn't have yet.
const wordsPath = join(site, 'cspell-words.txt');
const words = new Set(readFileSync(wordsPath, 'utf8').split('\n').filter(Boolean));
const wordSources = [join(starter, 'cspell-words.txt'), ...siteModules.map((name) => join(modulesDir, name, 'cspell-words.txt'))];
const newWords = wordSources.filter(existsSync).flatMap((path) => readFileSync(path, 'utf8').split('\n').filter((w) => w && !words.has(w)));
if (newWords.length) {
  report.updated.push(`cspell-words.txt (+${new Set(newWords).size} words)`);
  if (!dryRun) writeFileSync(wordsPath, `${[...words, ...new Set(newWords)].join('\n')}\n`);
}

// 6. Files from an older starter that are gone now. Without a list from a
// previous update, code files the starter doesn't have are only reported:
// they may be a one-off made for this client.
const manifestPath = join(site, MANIFEST);
const ownedSet = new Set(owned);
if (existsSync(manifestPath)) {
  for (const path of readJson(manifestPath)) {
    // Never remove the client's data, even if a module stopped shipping that file.
    if (ownedSet.has(path) || isContent(path) || path.endsWith('.json') || !existsSync(join(site, path))) continue;
    report.removed.push(path);
    if (!dryRun) rmSync(join(site, path));
  }
} else {
  for (const path of RETIRED) {
    if (!existsSync(join(site, path))) continue;
    report.removed.push(path);
    if (!dryRun) rmSync(join(site, path));
  }
  for (const path of walk(site)) {
    if (RETIRED.includes(path)) continue;
    if (path === MANIFEST || ownedSet.has(path) || isContent(path)) continue;
    if (/^(src|scripts)\//.test(path) && !/^src\/modules\/[^/]+\/[^/]+\.json$/.test(path)) report.notFromStarter.push(path);
  }
}
if (!dryRun) writeFileSync(manifestPath, `${JSON.stringify([...ownedSet].sort(), null, 2)}\n`);

// Summary.
const section = (title, list) => list.length && console.log(`${title}:\n${list.map((item) => `  ${item}`).join('\n')}`);
section('Updated', report.updated);
section('Added', report.added);
section('Removed (from an older starter)', report.removed);
section('New settings filled in with their defaults', report.filled);
section('Not from the starter (kept; delete them if nothing uses them)', report.notFromStarter);
const changed = report.updated.length + report.added.length + report.removed.length + report.filled.length;
console.log(
  changed
    ? `${dryRun ? 'Would change' : 'Changed'} ${changed} thing${changed === 1 ? '' : 's'}.${dryRun ? '' : ` Next: cd ${target} && npm install && npm run check`}`
    : 'Already up to date.',
);
