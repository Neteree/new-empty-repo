// Shared helpers for the request queue scripts in ops/.
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const here = import.meta.dirname;
export const queueDir = join(here, 'queue');
export const outboxDir = join(here, 'outbox');
const clientsDir = resolve(here, '../starter/clients');

/** Where the confirm link points. Until the email service is set up, confirm with ops/confirm.js. */
const CONFIRM_URL = process.env.CONFIRM_URL ?? 'https://[confirm link: needs the email service]/confirm';

/** The client whose saved contact email matches, or null. Only real clients (not demos) count. */
export function findClient(email) {
  const wanted = email?.trim().toLowerCase();
  if (!wanted || !existsSync(clientsDir)) return null;
  for (const name of readdirSync(clientsDir).filter((n) => n.endsWith('.json'))) {
    const client = JSON.parse(readFileSync(join(clientsDir, name), 'utf8'));
    if (!client.demo && client.contact?.email?.toLowerCase() === wanted)
      return { slug: name.replace(/\.json$/, ''), name: client.name, email: client.contact.email };
  }
  return null;
}

export const newId = () => `${new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' })}-${randomBytes(3).toString('hex')}`;

export function saveItem(item) {
  mkdirSync(queueDir, { recursive: true });
  writeFileSync(join(queueDir, `${item.id}.json`), `${JSON.stringify(item, null, 2)}\n`);
}

export function loadItem(id) {
  const path = join(queueDir, `${id}.json`);
  if (!existsSync(path)) throw new Error(`No queue item ${id}.`);
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function listItems() {
  if (!existsSync(queueDir)) return [];
  return readdirSync(queueDir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => JSON.parse(readFileSync(join(queueDir, name), 'utf8')))
    .sort((a, b) => a.received.localeCompare(b.received));
}

/** One change in plain English. */
export function describeChange(change) {
  switch (change.type) {
    case 'text':
      return `Change “${change.current}” to “${change.new}”`;
    case 'hours':
      return `Opening hours: ${change.hours.map((row) => `${row.days} ${row.times}`).join('; ')}`;
    case 'news':
      return `Post news: “${change.title}”`;
    case 'menu-replace':
      return `Replace the menu with ${change.items.length} items`;
    case 'logo':
      return 'New logo';
    case 'gallery-add': {
      const count = change.photos?.length ?? 0;
      return count ? `Add ${count} photo${count === 1 ? '' : 's'} to the gallery` : 'Add photos to the gallery';
    }
    case 'theme':
      return `Change the look to ${change.theme ?? '?'}`;
    case 'gallery-describe':
      return `Describe gallery photo ${change.file}`;
    case 'gallery-remove':
      return `Remove gallery photo ${change.file}`;
    case 'gallery-order':
      return 'Reorder the gallery';
    case 'form-key':
      return 'Connect the enquiry form';
    case 'photo':
      return change.gallery ? `Use gallery photo ${change.gallery} as the main photo` : `New main photo: ${change.alt}`;
    case 'contact':
      return `Contact details: ${['phone', 'address', 'instagram', 'facebook'].filter((key) => change[key] !== undefined).map((key) => `${key} ${change[key] || '(remove)'}`).join('; ')}`;
    case 'menu-add':
      return `Add “${change.name}” to the menu at ${change.price}`;
    case 'menu-price':
      return `Change the price of “${change.name}” to ${change.price}`;
    case 'menu-remove':
      return `Remove “${change.name}” from the menu`;
    case 'menu-sold-out':
      return `Mark “${change.name}” as ${change.soldOut ? 'sold out' : 'back on'}`;
    default:
      return change.details ?? JSON.stringify(change);
  }
}

/** Writes the confirmation email for a change request, to send to the client's saved address. */
export function writeOutbox(item, client) {
  mkdirSync(outboxDir, { recursive: true });
  const path = join(outboxDir, `${item.id}-confirm.txt`);
  const list = item.changes.map((change) => `- ${describeChange(change)}`).join('\n');
  writeFileSync(
    path,
    `To: ${client.email}
Subject: Please confirm your website change request

Hi ${client.name},

We received a request to change your website:

${list}

If this was you, confirm it here:
${CONFIRM_URL}?id=${item.id}&token=${item.token}

Once it's confirmed, I'll send you the price before any work starts. If this
wasn't you, ignore this email and nothing will change.

Cameron
`,
  );
  return path;
}
