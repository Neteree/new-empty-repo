// Checks the queue scripts know every change the site scripts can make:
// each type in starter/scripts/changes.js needs a plain-English line in
// describeChange() (lib.js), or Cameron would see raw JSON when approving.
// Run by the Starter workflow: node ops/check.js
import { changeTypes } from '../starter/scripts/changes.js';
import { describeChange } from './lib.js';

const sample = { title: 'x', name: 'x', question: 'x', current: 'x', new: 'x', file: 'x', theme: 'x', hours: [], items: [], questions: [], photos: [], order: [], options: [], key: 'x', price: '1', footnote: 'x', text: 'x' };
const missing = changeTypes.filter((type) => describeChange({ type, ...sample }) === JSON.stringify({ type, ...sample }));
if (missing.length) {
  console.error(`describeChange() in ops/lib.js has no wording for: ${missing.join(', ')}`);
  process.exit(1);
}
console.log(`ops: all ${changeTypes.length} change types are described.`);
