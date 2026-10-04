// Brings new form submissions (and their uploaded photos) from the Cloudflare
// intake into the request queue, then marks them as pulled there:
//
//   node ops/pull.js
//
// Needs INTAKE_URL (the Worker's address) and INTAKE_TOKEN (its ADMIN_TOKEN),
// in the environment or in the repo's .env file. Photos are saved in
// ops/uploads/<id>/ (not committed).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { queueChangeRequest, queueMessage, queueOnboarding } from './sort.js';

// Read the repo's .env (KEY=value lines) without overriding real environment variables.
const envFile = resolve(import.meta.dirname, '../.env');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
  }
}
const base = process.env.INTAKE_URL?.replace(/\/$/, '');
const token = process.env.INTAKE_TOKEN;
if (!base || !token) {
  console.error('Set INTAKE_URL and INTAKE_TOKEN (in .env) first. See worker/README.md.');
  process.exit(1);
}
const headers = { Authorization: `Bearer ${token}` };

const response = await fetch(`${base}/items`, { headers });
if (!response.ok) {
  console.error(`The intake answered ${response.status}. Check INTAKE_URL and INTAKE_TOKEN.`);
  process.exit(1);
}
const { items } = await response.json();
if (!items.length) console.log('Nothing new.');

for (const submission of items) {
  // Download the files first, so nothing is marked as pulled until it's all here.
  const folder = join(import.meta.dirname, 'uploads', submission.id);
  mkdirSync(folder, { recursive: true });
  const files = [];
  for (const file of submission.files ?? []) {
    const download = await fetch(`${base}/file?key=${encodeURIComponent(file.key)}`, { headers });
    if (!download.ok) throw new Error(`Couldn't download ${file.key} (${download.status}).`);
    const path = join(folder, file.key.split('/').pop());
    writeFileSync(path, Buffer.from(await download.arrayBuffer()));
    files.push({ slot: file.slot, path, name: file.name });
  }

  const item = { id: submission.id, received: submission.received, source: 'form', from: submission.payload?.email?.toLowerCase() };
  const payload = submission.payload ?? {};
  let outcome;
  if (submission.kind === 'onboarding') outcome = queueOnboarding(item, payload, { files });
  else if (submission.kind === 'request') {
    // Photos added through the request form point at their upload by number,
    // in any change: on the change itself (a new main photo or a list item's
    // photo), as `photo.upload` (a new item with a photo) or in `photos` (gallery).
    // No list of change types to keep up to date.
    const photos = files.filter((file) => file.slot === 'photos');
    const fileFor = (photo) => ({ file: photos[photo.upload].path, ...(photo.alt ? { alt: photo.alt } : {}) });
    for (const change of payload.changes ?? []) {
      if (change.upload !== undefined) {
        if (photos[change.upload]) change.file = photos[change.upload].path;
        delete change.upload;
      }
      if (change.photo?.upload !== undefined) change.photo = photos[change.photo.upload] ? fileFor(change.photo) : undefined;
      if (Array.isArray(change.photos)) {
        change.photos = change.photos.filter((photo) => photo.upload === undefined || photos[photo.upload]).map((photo) => (photo.upload === undefined ? photo : fileFor(photo)));
      }
    }
    outcome = queueChangeRequest(item, payload);
  }
  else {
    const given = (value) => value && value !== '-';
    const text = [given(payload.need) && `Needs: ${payload.need}`, given(payload.business) && `Business: ${payload.business}`, given(payload.message) && payload.message]
      .filter(Boolean)
      .join('. ');
    outcome = queueMessage(item, `${payload.name ?? 'Someone'} (${payload.email ?? 'no email'}): ${text}`, { from: payload.email, headersChecked: false });
  }

  const marked = await fetch(`${base}/done?id=${submission.id}`, { method: 'POST', headers });
  if (!marked.ok) console.error(`${submission.id}: queued here, but couldn't mark it as pulled (${marked.status}); it may show up again.`);
  console.log(`${submission.id}: ${outcome}`);
}
