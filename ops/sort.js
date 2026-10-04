// Puts a submission into the request queue: shared by intake.js (emails) and
// pull.js (the Cloudflare intake). Each function fills in the queue item,
// saves it, and returns a one-line summary.
import { randomBytes } from 'node:crypto';
import { findClient, saveItem, writeOutbox } from './lib.js';

function awaitConfirmation(item, client, details) {
  Object.assign(item, details, { client: client.slug, status: 'awaiting-confirmation', token: randomBytes(16).toString('hex') });
  const path = writeOutbox(item, client);
  saveItem(item);
  return `Change request from ${client.name}. Confirmation email ready in ${path}.`;
}

/** Onboarding answers (the CLIENT-JSON). `files` are local paths of any uploaded logo and photos. */
export function queueOnboarding(item, answers, { email, files = [] } = {}) {
  Object.assign(item, { kind: 'onboarding', status: 'awaiting-approval', business: answers.name, answers, files });
  if (email) item.email = email;
  saveItem(item);
  const photos = files.filter((file) => file.slot === 'photos').length;
  const parts = [files.some((file) => file.slot === 'logo') && 'a logo', photos && `${photos} photo${photos === 1 ? '' : 's'}`].filter(Boolean);
  const uploads = parts.length ? ` with ${parts.join(' and ')}` : '';
  const estimate = answers.estimate ? ` Their estimate: $${answers.estimate.total}${answers.estimate.custom ? ' + something to quote' : ''}.` : '';
  return `New website from ${answers.name}${uploads}.${estimate} Waiting for you to check it and send a quote.`;
}

/** A change request from the request form. It only counts once the client confirms from their saved address. */
export function queueChangeRequest(item, request) {
  const client = findClient(request.email);
  if (!client) {
    Object.assign(item, { kind: 'change', status: 'unknown-sender', claimed: request.email, business: request.business, changes: request.changes });
    saveItem(item);
    return `Change request from ${request.email}, which isn't a client email. Nothing was sent.`;
  }
  return awaitConfirmation(item, client, { kind: 'change', business: client.name, changes: request.changes });
}

/**
 * Free text: a message from a known client's address becomes a change request
 * (which they still have to confirm), anything else an enquiry. `headersChecked`
 * is true for raw emails, whose SPF/DKIM results must then pass.
 */
export function queueMessage(item, text, { from, senderVerified, headersChecked }) {
  const client = from && findClient(from);
  if (client && headersChecked && !senderVerified) {
    Object.assign(item, { kind: 'change', status: 'suspicious', business: client.name, text });
    saveItem(item);
    return `Email claiming to be ${client.name} failed the sender checks. Nothing was sent.`;
  }
  if (client) {
    // Someone (Cameron or the agent) works out the changes from the text.
    return awaitConfirmation(item, client, { kind: 'change', business: client.name, changes: [{ type: 'other', details: text }] });
  }
  Object.assign(item, { kind: 'enquiry', status: 'new-enquiry', text });
  saveItem(item);
  return `New enquiry${from ? ` from ${from}` : ''}.`;
}
