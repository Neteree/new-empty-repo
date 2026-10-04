// Writes src/data/modules.json in a site: the add-on modules the builder has,
// for the onboarding form's ?modules= link. Used by new-client and update-site,
// so the list always matches the modules folder. A module whose module.json
// says "offer": false (e.g. the forms themselves) is left out.
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

export function writeCatalogue(siteDir, modulesDir) {
  writeFileSync(join(siteDir, 'src/data/modules.json'), `${JSON.stringify(offeredModules(modulesDir), null, 2)}\n`);
}
