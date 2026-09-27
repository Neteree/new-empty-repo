// Lists the request queue, oldest first, grouped by what it's waiting for.
//
//   node ops/queue.js
import { describeChange, listItems } from './lib.js';

const groups = [
  ['awaiting-approval', 'Waiting for you to approve'],
  ['new-enquiry', 'New enquiries to reply to'],
  ['unknown-sender', 'Change requests from unknown addresses (check these)'],
  ['suspicious', 'Failed sender checks (probably fake)'],
  ['awaiting-confirmation', 'Waiting for the client to confirm'],
  ['approved', 'Approved'],
];

const items = listItems();
if (!items.length) console.log('The queue is empty.');
for (const [status, title] of groups) {
  const matching = items.filter((item) => item.status === status);
  if (!matching.length) continue;
  console.log(`\n${title}:`);
  for (const item of matching) {
    const who =
      item.status === 'unknown-sender' ? `${item.claimed} (says they're ${item.business})` : (item.business ?? item.from ?? 'someone');
    const price = item.free ? ' (free)' : item.price ? ` ($${item.price})` : '';
    console.log(`  ${item.id}  ${item.kind} from ${who}${price}`);
    for (const change of item.changes ?? []) console.log(`      - ${describeChange(change)}`);
    for (const left of item.needsPerson ?? []) console.log(`      Still needs you: ${left}`);
    if (item.text && !item.changes) console.log(`      ${item.text.slice(0, 140)}${item.text.length > 140 ? '…' : ''}`);
  }
}
