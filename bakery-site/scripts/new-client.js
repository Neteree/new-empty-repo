// Create a new client site from this starter.
//
//   node scripts/new-client.js clients/example.json ../my-client-site
//
// Copies the starter (without build output or installed packages), writes the
// client's details into src/site.config.ts, and names the package after them.
// The menu, notes and colours are still the starter's: edit those next.
import { cpSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
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
const required = ['name', 'suburb', 'city', 'description', 'heroNote', 'heroText', 'visitText', 'hours'];
const missing = required.filter((key) => details[key] === undefined);
if (missing.length) {
  console.error(`${detailsPath} is missing: ${missing.join(', ')}`);
  process.exit(1);
}

const starter = resolve(import.meta.dirname, '..');
const skip = new Set(['node_modules', 'dist', '.astro', 'clients']);
cpSync(starter, target, {
  recursive: true,
  filter: (source) => !skip.has(basename(source)) || source === starter,
});

const config = { ...details, demo: details.demo ?? false };
writeFileSync(
  join(target, 'src/site.config.ts'),
  `// Everything that changes from one client to the next.\n\nexport const site = ${JSON.stringify(config, null, 2)};\n`,
);

const pkgPath = join(target, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
pkg.name = basename(resolve(target));
writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

console.log(`Created ${target} for ${details.name}. Next: cd ${target} && npm install && npm run dev`);
