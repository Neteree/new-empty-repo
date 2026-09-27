// Sorts one incoming email into the request queue. No AI: it only looks for
// the blocks our forms attach and matches senders against the client list.
//
//   node ops/intake.js <email-file>
//
// The email can be a raw .eml (headers and body) or just its text or HTML.
// What it becomes:
//   - onboarding answers (---CLIENT-JSON---)          → waiting for Cameron to approve the build
//   - a change request (---CHANGES-JSON---) from a    → waiting for the client to confirm from their
//     known client, or a direct email from one          saved address (a confirmation email goes to ops/outbox/)
//   - a change request from an unknown address        → flagged for Cameron; nothing is sent
//   - a direct email that fails sender checks         → flagged as suspicious; nothing is sent
//   - anything else                                   → a new enquiry for Cameron
// Queue items live in ops/queue/ (not committed: they hold client emails).
import { readFileSync } from 'node:fs';
import { newId } from './lib.js';
import { queueChangeRequest, queueMessage, queueOnboarding } from './sort.js';

const file = process.argv[2];
if (!file) {
  console.error('Usage: node ops/intake.js <email-file>');
  process.exit(1);
}

const raw = readFileSync(file, 'utf8');
const decode = (text) =>
  text.replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

// Headers, if this is a raw email.
const headerEnd = raw.search(/\r?\n\r?\n/);
const headerText = /^[\w-]+: /.test(raw) && headerEnd > 0 ? raw.slice(0, headerEnd) : '';
const header = (name) => headerText.match(new RegExp(`^${name}:\\s*(.*(?:\\r?\\n[ \\t].*)*)`, 'im'))?.[1].replace(/\s+/g, ' ').trim() ?? '';
const addressOf = (value) => (value.match(/<([^>]+)>/)?.[1] ?? value).trim().toLowerCase();
const from = addressOf(header('From'));
const subject = header('Subject');
const body = decode(headerText ? raw.slice(headerEnd).trim() : raw);

// Emails sent straight to Cameron can fake their sender. Mail servers record
// SPF and DKIM results; a known client's email must pass both.
const auth = header('Authentication-Results');
const senderVerified = /spf=pass/i.test(auth) && /dkim=pass/i.test(auth);

const onboarding = body.match(/---CLIENT-JSON---\s*(\{[\s\S]*?\})\s*---END-CLIENT-JSON---/);
const changeBlock = body.match(/---CHANGES-JSON---\s*(\{[\s\S]*?\})\s*---END-CHANGES-JSON---/);

const item = { id: newId(), received: new Date().toISOString(), from, subject };

let outcome;
if (onboarding) outcome = queueOnboarding(item, JSON.parse(onboarding[1]), { email: raw });
else if (changeBlock) outcome = queueChangeRequest(item, JSON.parse(changeBlock[1]));
else {
  const text = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 4000);
  outcome = queueMessage(item, text, { from, senderVerified, headersChecked: Boolean(headerText) });
}
console.log(`${item.id}: ${outcome}`);
