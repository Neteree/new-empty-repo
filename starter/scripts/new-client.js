// Create a new client site from this starter, plus any add-on modules.
//
//   node scripts/new-client.js clients/example.json ../../my-client-site
//
// Copies the starter (without build output or installed packages), adds each
// module listed in the client's "modules" (from ../modules/<name>/), writes
// the client's details into src/site.config.ts, and names the package after
// the folder. Colours, fonts and any module data (e.g. the food menu) are
// still the starter's: edit those next.
import { appendFileSync, cpSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

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
const required = ['name', 'suburb', 'city', 'description', 'heroNote', 'heroTitle', 'heroText', 'visitText', 'hours', 'enquiry'];
const missing = required.filter((key) => details[key] === undefined);
if (missing.length) {
  console.error(`${detailsPath} is missing: ${missing.join(', ')}`);
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
  const words = join(module, 'cspell-words.txt');
  if (existsSync(words)) appendFileSync(join(target, 'cspell-words.txt'), readFileSync(words, 'utf8'));
}

// Names of the business and place are real words for the spelling check.
const names = `${details.name} ${details.suburb} ${details.city}`.split(/[^\p{L}'’-]+/u).filter(Boolean);
appendFileSync(join(target, 'cspell-words.txt'), `${names.join('\n')}\n`);

// The change-request workflow runs the agent from the site itself.
cpSync(resolve(starter, '../site_agent.py'), join(target, 'scripts/site_agent.py'));

const { modules: _, ...config } = { ...details, formKey: details.formKey ?? null, url: details.url ?? null, demo: details.demo ?? false };
const body = JSON.stringify(config, null, 2)
  .replace('"formKey": null', '"formKey": null as string | null')
  .replace('"url": null', '"url": null as string | null');
writeFileSync(
  join(target, 'src/site.config.ts'),
  `// Everything that changes from one client to the next. Never invent details:\n// leave [PLACEHOLDER: ...] and ask.\n\nexport const site = ${body};\n`,
);

const pkgPath = join(target, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
pkg.name = basename(resolve(target));
writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

const added = modules.length ? ` with ${modules.join(', ')}` : '';
console.log(`Created ${target} for ${details.name}${added}. Next: cd ${target} && npm install && npm run check`);
