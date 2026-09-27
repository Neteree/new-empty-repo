// Marks a change request as confirmed by the client, from the link in their
// confirmation email. Until the email service is set up, run it by hand:
//
//   node ops/confirm.js <id> <token>
import { timingSafeEqual } from 'node:crypto';
import { loadItem, saveItem } from './lib.js';

const [id, token] = process.argv.slice(2);
const item = loadItem(id);
if (item.status !== 'awaiting-confirmation') {
  console.error(`${id} isn't waiting for confirmation (it's ${item.status}).`);
  process.exit(1);
}
const matches = (a, b) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
if (!matches(token ?? '', item.token)) {
  console.error('That confirmation link is wrong. Nothing changed.');
  process.exit(1);
}
item.status = 'awaiting-approval';
item.confirmed = new Date().toISOString();
delete item.token;
saveItem(item);
console.log(`${id}: confirmed by ${item.business}. Waiting for you to approve and price it.`);
