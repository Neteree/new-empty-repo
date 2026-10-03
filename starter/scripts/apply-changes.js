// Applies a list of scripted changes to the site in the current folder:
//
//   node scripts/apply-changes.js changes.json
//
// changes.json is an array of changes (see scripts/changes.js for the types),
// or { "changes": [...] }. Photo paths are relative to changes.json. Prints
// what was done and what needs a person; in a GitHub workflow it also sets the
// output `result` (applied, partial or needs-agent) and writes
// request-summary.md to RUNNER_TEMP.
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { applyChanges } from './changes.js';

export function report(results) {
  const done = results.filter((r) => r.done);
  const left = results.filter((r) => !r.done);
  const lines = [
    ...done.map((r) => `- Done: ${r.summary}`),
    ...left.map((r) => `- Needs a person: ${r.reason}`),
  ];
  const result = left.length === 0 ? 'applied' : done.length ? 'partial' : 'needs-agent';
  const summary = lines.join('\n');
  writeFileSync(join(process.env.RUNNER_TEMP ?? '.', 'request-summary.md'), `${summary}\n`);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `result=${result}\n`);
  console.log(summary);
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const input = process.argv[2];
  if (!input) {
    console.error('Usage: node scripts/apply-changes.js <changes.json>');
    process.exit(1);
  }
  const parsed = JSON.parse(readFileSync(input, 'utf8'));
  const base = dirname(resolve(input));
  // File and folder paths in changes.json are relative to it.
  const at = (path) => (path ? resolve(base, path) : path);
  const changes = (Array.isArray(parsed) ? parsed : parsed.changes).map((change) => ({
    ...change,
    ...(change.file && ['photo', 'logo', 'price-photo', 'product-photo'].includes(change.type) ? { file: at(change.file) } : {}),
    ...(change.photo?.file ? { photo: { ...change.photo, file: at(change.photo.file) } } : {}),
    ...(change.items ? { items: change.items.map((item) => (item.photo?.file ? { ...item, photo: { ...item.photo, file: at(item.photo.file) } } : item)) } : {}),
    ...(change.folder ? { folder: at(change.folder) } : {}),
    ...(change.photos ? { photos: change.photos.map((photo) => ({ ...photo, file: at(photo.file) })) } : {}),
  }));
  report(applyChanges(changes));
}
