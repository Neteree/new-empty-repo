// A module's settings, laid over its data file in a site: used when a site is
// made (new-client.js) and when an add-on is added to one later (ops/approve.js).
//
// `details` is in the client JSON's shape: the key named after the module
// (e.g. "reviews": { "items": [...] }, "booking": { "kind": "quote" }) is laid
// over its data file (module.json "data"), and "menu": { "preOrder": true }
// turns on the food module's pre-ordering.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const writeJson = (path, data) => writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);

export function applyModuleSettings(moduleDir, site, name, details) {
  const menuPath = join(site, 'src/modules', name, 'menu.json');
  if (name === 'food' && details.menu?.preOrder) {
    const menu = readJson(menuPath);
    menu.preOrder.enabled = true;
    writeJson(menuPath, menu);
  }
  const manifestPath = join(moduleDir, 'module.json');
  const manifest = existsSync(manifestPath) ? readJson(manifestPath) : {};
  if (manifest.data && details[name]) {
    const dataPath = join(site, 'src/modules', name, manifest.data);
    // The booking form's quote kind brings its own wording (presets.json).
    const presetPath = join(moduleDir, 'presets.json');
    const preset = existsSync(presetPath) ? (readJson(presetPath)[details[name].kind] ?? {}) : {};
    writeJson(dataPath, { ...readJson(dataPath), ...preset, ...details[name] });
  }
}
