// Writes what a site needs to know about every module the builder has, read
// from the modules folder so nothing is kept by hand. Used by new-client and
// update-site (and run in the starter itself):
//   src/data/modules.json  add-ons for the onboarding form's ?modules= link
//                          (a module.json with "offer": false is left out)
//   src/data/lists.json    the list sections' descriptions (module.json "list"),
//                          for the change scripts and the request form (see lists.js)
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export function offeredModules(modulesDir) {
  return readdirSync(modulesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => {
      const manifest = join(modulesDir, name, 'module.json');
      return !existsSync(manifest) || JSON.parse(readFileSync(manifest, 'utf8')).offer !== false;
    })
    .sort();
}

export function listDefinitions(modulesDir) {
  const defs = {};
  for (const entry of readdirSync(modulesDir, { withFileTypes: true })) {
    const manifest = join(modulesDir, entry.name, 'module.json');
    if (!entry.isDirectory() || !existsSync(manifest)) continue;
    const { data, list } = JSON.parse(readFileSync(manifest, 'utf8'));
    if (list) defs[entry.name] = { module: entry.name, data, ...list };
  }
  return defs;
}

export function writeCatalogue(siteDir, modulesDir) {
  const write = (file, value) => writeFileSync(join(siteDir, 'src/data', file), `${JSON.stringify(value, null, 2)}\n`);
  write('modules.json', offeredModules(modulesDir));
  write('lists.json', listDefinitions(modulesDir));
}
