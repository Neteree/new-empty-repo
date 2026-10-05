// Create a new client site from this starter, plus any add-on modules.
//
//   node scripts/new-client.js clients/example.json ../../my-client-site
//
// Copies the starter (without build output or installed packages), adds each
// module listed in the client's "modules" (from ../modules/<name>/), writes
// the client's details into src/data/site.json, adds any packages a module
// needs (its module.json), and names the package after the folder. Colours, fonts and any module data (e.g. the food menu) are
// still the starter's: edit those next.
import { appendFileSync, cpSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { themes } from '../src/themes.ts';
import { writeCatalogue } from './catalogue.js';
import { applyModuleSettings } from './module-settings.js';

const [detailsPath, target] = process.argv.slice(2);
if (!detailsPath || !target) {
  console.error('Usage: node scripts/new-client.js <client-details.json> <new-folder>');
  process.exit(1);
}
if (existsSync(target)) {
  console.error(`${target} already exists. Choose a new folder so nothing is overwritten.`);
  process.exit(1);
}

const details = JSON.parse(readFileSync(detailsPath, 'utf8'));
const required = ['name', 'suburb', 'city', 'description', 'heroTitle', 'heroText', 'visitText', 'hours', 'enquiry'];
const missing = required.filter((key) => details[key] === undefined);
if (missing.length) {
  console.error(`${detailsPath} is missing: ${missing.join(', ')}`);
  process.exit(1);
}

const theme = details.theme ?? 'bold';
if (!themes[theme]) {
  console.error(`No such theme: ${theme}. Choose one of: ${Object.keys(themes).join(', ')}.`);
  process.exit(1);
}

const starter = resolve(import.meta.dirname, '..');
const modulesDir = resolve(starter, '../modules');
const modules = details.modules ?? [];
const unknown = modules.filter((name) => !existsSync(join(modulesDir, name)));
if (unknown.length) {
  console.error(`No such module: ${unknown.join(', ')}. Modules live in ${modulesDir}.`);
  process.exit(1);
}

const skip = new Set(['node_modules', 'dist', '.astro', 'clients', 'check-output', 'new-client.js']);
cpSync(starter, target, {
  recursive: true,
  filter: (source) => !skip.has(basename(source)) || source === starter,
});

for (const name of modules) {
  const module = join(modulesDir, name);
  cpSync(join(module, 'src'), join(target, 'src'), { recursive: true });
  cpSync(join(module, 'README.md'), join(target, 'src/modules', name, 'README.md'));
  // Pre-ordering, and any settings for the module in the client JSON.
  applyModuleSettings(module, target, name, details);
  const words = join(module, 'cspell-words.txt');
  if (existsSync(words)) appendFileSync(join(target, 'cspell-words.txt'), readFileSync(words, 'utf8'));
}

// The add-on modules the onboarding form offers, from the modules folder.
writeCatalogue(target, modulesDir);

// Names of the business and place are real words for the spelling check.
// So are any extra words the client JSON lists ("words": ["Squarespace"]).
const names = [...`${details.name} ${details.suburb} ${details.city}`.split(/[^\p{L}'’-]+/u).filter(Boolean), ...(details.words ?? [])];
appendFileSync(join(target, 'cspell-words.txt'), `${names.join('\n')}\n`);

// The change-request workflow runs the agent from the site itself.
cpSync(resolve(starter, '../site_agent.py'), join(target, 'scripts/site_agent.py'));

// `contact` (the client's own email and phone) is for Cameron only, never the site;
// `phone`, `address` and `social` are the public ones.
const { modules: _, contact: __, menu: ___, words: ____, ...rest } = {
  heroNote: '',
  heroLink: { label: '', href: '' },
  address: '',
  phone: '',
  heroPhoto: null,
  logo: null,
  markColours: [],
  gallery: [],
  galleryLayout: 'grid',
  ...details,
  social: { instagram: '', facebook: '', ...details.social },
  theme,
  enquiry: { askBusiness: false, thanks: '', link: { label: '', href: '' }, ...details.enquiry },
  formKey: details.formKey ?? null,
  intakeUrl: details.intakeUrl ?? null,
  url: details.url ?? null,
  demo: details.demo ?? false,
};
// Module settings (keys named after a module) belong to the module, not site.json.
const config = Object.fromEntries(Object.entries(rest).filter(([key]) => !modules.includes(key)));
writeFileSync(join(target, 'src/data/site.json'), `${JSON.stringify(config, null, 2)}\n`);

const pkgPath = join(target, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
pkg.name = basename(resolve(target));
// Packages a module needs (e.g. three.js for a 3D one) are listed in its module.json.
const extra = {};
for (const name of modules) {
  const manifest = join(modulesDir, name, 'module.json');
  if (existsSync(manifest)) Object.assign(extra, JSON.parse(readFileSync(manifest, 'utf8')).dependencies);
}
pkg.dependencies = { ...pkg.dependencies, ...extra };
writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

const added = modules.length ? ` with ${modules.join(', ')}` : '';
const packages = Object.keys(extra).length ? ` (adds ${Object.keys(extra).join(', ')})` : '';
console.log(`Created ${target} for ${details.name}${added}${packages}. Next: cd ${target} && npm install && npm run check`);
