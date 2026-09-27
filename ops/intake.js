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
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { findClient, newId, saveItem, writeOutbox } from './lib.js';

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

function awaitConfirmation(client, details) {
  Object.assign(item, details, { client: client.slug, status: 'awaiting-confirmation', token: randomBytes(16).toString('hex') });
  const path = writeOutbox(item, client);
  return `Change request from ${client.name}. Confirmation email ready in ${path}.`;
}

let outcome;
if (onboarding) {
  const answers = JSON.parse(onboarding[1]);
  Object.assign(item, { kind: 'onboarding', status: 'awaiting-approval', business: answers.name, email: raw });
  outcome = `Onboarding answers from ${answers.name}. Waiting for you to approve the build.`;
} else if (changeBlock) {
  const request = JSON.parse(changeBlock[1]);
  const client = findClient(request.email);
  if (!client) {
    Object.assign(item, { kind: 'change', status: 'unknown-sender', claimed: request.email, business: request.business, changes: request.changes });
    outcome = `Change request from ${request.email}, which isn't a client email. Nothing was sent.`;
  } else {
    outcome = awaitConfirmation(client, { kind: 'change', business: client.name, changes: request.changes });
  }
} else {
  const client = from && findClient(from);
  const text = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 4000);
  if (client && headerText && !senderVerified) {
    Object.assign(item, { kind: 'change', status: 'suspicious', business: client.name, text });
    outcome = `Email claiming to be ${client.name} failed the sender checks. Nothing was sent.`;
  } else if (client) {
    // A free-text request: someone (Cameron or the agent) works out the changes.
    outcome = awaitConfirmation(client, { kind: 'change', business: client.name, changes: [{ type: 'other', details: text }] });
  } else {
    Object.assign(item, { kind: 'enquiry', status: 'new-enquiry', text });
    outcome = `New enquiry${from ? ` from ${from}` : ''}.`;
  }
}

saveItem(item);
console.log(`${item.id}: ${outcome}`);
