// Every change type the request form can send must be one the change scripts
// handle (scripts/changes.js), so a new form option can't be added without
// its script. Run by npm run check.
import { readFileSync } from 'node:fs';
import { changeTypes } from '../../../scripts/changes.js';

const files = ['src/modules/start/RequestForm.svelte', 'src/components/forms/PriceFields.svelte'];
const sent = new Set(files.flatMap((file) => [...readFileSync(file, 'utf8').matchAll(/type: '([a-z-]+)'/g)].map((m) => m[1])));
// List sections' add and remove come from their descriptions (src/data/lists.json).
for (const def of Object.values(JSON.parse(readFileSync('src/data/lists.json', 'utf8')))) sent.add(`${def.type}-add`).add(`${def.type}-remove`);
// 'other' is free text for a person, never a script.
const unknown = [...sent].filter((type) => type !== 'other' && !changeTypes.includes(type));
if (unknown.length) {
  console.error(`The request form sends change types scripts/changes.js doesn't handle: ${unknown.join(', ')}`);
  process.exit(1);
}
console.log(`Request form: all ${sent.size} change types have a script.`);
