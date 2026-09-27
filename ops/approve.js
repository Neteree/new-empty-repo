// Approves a queue item (or closes one), and starts the scripted build.
//
//   node ops/approve.js <id> --price 20 [--site <client-site-folder>]   approve a confirmed change request
//   node ops/approve.js <id> --site <new-folder>                        build a new client's site from onboarding
//   node ops/approve.js <id> --close                                    done with it (e.g. an enquiry you replied to)
//
// With --site, scripted changes are applied to that site folder straight
// away; anything the scripts can't do is listed for you (or the agent).
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { loadItem, saveItem } from './lib.js';

const [id, ...args] = process.argv.slice(2);
const option = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
if (!id) {
  console.error('Usage: node ops/approve.js <id> [--price <dollars>] [--site <folder>] [--close]');
  process.exit(1);
}

const item = loadItem(id);
const starter = resolve(import.meta.dirname, '../starter');
const scratch = mkdtempSync(join(tmpdir(), 'approve-'));

if (args.includes('--close')) {
  item.status = 'closed';
  saveItem(item);
  console.log(`${id}: closed.`);
  process.exit(0);
}

if (item.status !== 'awaiting-approval') {
  const why = {
    'awaiting-confirmation': 'the client hasn’t confirmed it yet',
    'unknown-sender': 'it isn’t from a client’s saved email',
    suspicious: 'it failed the sender checks',
  }[item.status];
  console.error(`${id} can't be approved: ${why ?? `it's ${item.status}`}.`);
  process.exit(1);
}

const site = option('--site');
if (item.kind === 'onboarding') {
  if (!site) {
    console.error('Give the folder for the new site: --site <folder>');
    process.exit(1);
  }
  const email = join(scratch, 'onboarding.txt');
  writeFileSync(email, item.email);
  execFileSync('node', [join(starter, 'scripts/onboard.js'), email, site], { stdio: 'inherit' });
} else {
  // 0 is fine for free work (family, testimonial deals); leaving it out isn't.
  const price = Number(option('--price'));
  if (option('--price') === undefined || !(price >= 0)) {
    console.error('Set the price you agreed: --price <dollars> (0 for free work)');
    process.exit(1);
  }
  item.price = price;
  if (price === 0) item.free = true;
  if (site) {
    const changes = join(scratch, 'changes.json');
    writeFileSync(changes, JSON.stringify(item.changes));
    const output = execFileSync('node', ['scripts/apply-changes.js', changes], { cwd: site, encoding: 'utf8' });
    process.stdout.write(output);
    item.needsPerson = output.split('\n').filter((line) => line.startsWith('- Needs a person: ')).map((line) => line.slice(18));
  }
}

item.status = 'approved';
item.approved = new Date().toISOString();
saveItem(item);
console.log(`${id}: approved.${site ? ` Next: check ${site} (npm run check) and look at the preview.` : ''}`);
