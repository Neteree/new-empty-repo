// Intake: receives form submissions and photo uploads from Cameron's site and
// keeps them in R2 until `node ops/pull.js` brings them into the request queue.
// No AI and no decisions here: it only checks, stores and hands over.
//
//   POST /submit                 public: multipart form with `kind`, `payload` (JSON),
//                                `botcheck`, and optional files `logo` (one) and `photos` (several)
//   GET  /items                  admin: submissions not yet pulled
//   GET  /file?key=…             admin: one uploaded file
//   POST /done?id=…              admin: mark a submission as pulled
//
// Admin routes need `Authorization: Bearer <ADMIN_TOKEN>` (a Worker secret).

const KINDS = ['contact', 'onboarding', 'request'];
const MAX_PHOTOS = 12;
const MAX_FILE_BYTES = 15 * 1024 * 1024;
const MAX_PAYLOAD_CHARS = 50_000;

// The first bytes of each allowed image type. Checking content, not the file
// name, stops anything that isn't really an image from being stored.
const SIGNATURES = [
  { type: 'image/jpeg', ext: 'jpg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { type: 'image/png', ext: 'png', test: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { type: 'image/webp', ext: 'webp', test: (b) => ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 4) === 'WEBP' },
];
const ascii = (bytes, start, length) => String.fromCharCode(...bytes.slice(start, start + length));

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = corsHeaders(request, env);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    try {
      if (request.method === 'POST' && url.pathname === '/submit') return await submit(request, env, cors);
      if (url.pathname === '/items' || url.pathname === '/file' || url.pathname === '/done') {
        if (!authorised(request, env)) return json({ ok: false, error: 'Not allowed.' }, 401);
        if (request.method === 'GET' && url.pathname === '/items') return await items(env);
        if (request.method === 'GET' && url.pathname === '/file') return await file(env, url.searchParams.get('key'));
        if (request.method === 'POST' && url.pathname === '/done') return await done(env, url.searchParams.get('id'));
      }
      return json({ ok: false, error: 'Not found.' }, 404, cors);
    } catch (error) {
      console.error(error);
      return json({ ok: false, error: 'Something went wrong. Please try again.' }, 500, cors);
    }
  },
};

function corsHeaders(request, env) {
  const allowed = (env.ALLOWED_ORIGINS ?? '').split(',').map((o) => o.trim()).filter(Boolean);
  const origin = request.headers.get('Origin') ?? '';
  return allowed.includes(origin)
    ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', Vary: 'Origin' }
    : {};
}

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });
}

function authorised(request, env) {
  const given = request.headers.get('Authorization') ?? '';
  const expected = `Bearer ${env.ADMIN_TOKEN ?? ''}`;
  if (!env.ADMIN_TOKEN || given.length !== expected.length) return false;
  // Constant-time comparison, so the token can't be guessed by timing.
  let difference = 0;
  for (let i = 0; i < given.length; i++) difference |= given.charCodeAt(i) ^ expected.charCodeAt(i);
  return difference === 0;
}

const newId = () => {
  const day = new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' });
  const random = [...crypto.getRandomValues(new Uint8Array(4))].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${day}-${random}`;
};

async function submit(request, env, cors) {
  const allowedOrigins = (env.ALLOWED_ORIGINS ?? '').split(',').map((o) => o.trim());
  if (!allowedOrigins.includes(request.headers.get('Origin') ?? '')) return json({ ok: false, error: 'Not allowed.' }, 403, cors);

  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, error: 'That didn’t arrive properly. Please try again.' }, 400, cors);
  }

  // Bots fill in the hidden checkbox; pretend it worked and store nothing.
  if (form.get('botcheck')) return json({ ok: true }, 200, cors);

  const kind = form.get('kind');
  if (!KINDS.includes(kind)) return json({ ok: false, error: 'Unknown form.' }, 400, cors);
  const rawPayload = String(form.get('payload') ?? '');
  if (!rawPayload || rawPayload.length > MAX_PAYLOAD_CHARS) return json({ ok: false, error: 'The form answers are missing or too long.' }, 400, cors);
  let payload;
  try {
    payload = JSON.parse(rawPayload);
  } catch {
    return json({ ok: false, error: 'The form answers are unreadable.' }, 400, cors);
  }

  const logo = form.getAll('logo').filter((f) => f instanceof File && f.size > 0);
  const photos = form.getAll('photos').filter((f) => f instanceof File && f.size > 0);
  if (logo.length > 1) return json({ ok: false, error: 'Please choose one logo.' }, 400, cors);
  if (photos.length > MAX_PHOTOS) return json({ ok: false, error: `Please choose up to ${MAX_PHOTOS} photos.` }, 400, cors);

  // Check every file before storing any, so a bad one doesn't leave half a submission.
  const uploads = [];
  for (const [slot, list] of [['logo', logo], ['photos', photos]]) {
    for (const upload of list) {
      if (upload.size > MAX_FILE_BYTES) return json({ ok: false, error: `“${upload.name}” is too big. Photos can be up to 15 MB each.` }, 400, cors);
      const bytes = new Uint8Array(await upload.arrayBuffer());
      const kindOfImage = SIGNATURES.find((signature) => signature.test(bytes));
      if (!kindOfImage) return json({ ok: false, error: `“${upload.name}” isn’t a photo we can use. Please send JPG, PNG or WebP photos.` }, 400, cors);
      uploads.push({ slot, name: upload.name, bytes, ...kindOfImage });
    }
  }

  const id = newId();
  const files = [];
  for (const [index, upload] of uploads.entries()) {
    const key = `files/${id}/${upload.slot}-${index + 1}.${upload.ext}`;
    await env.STORE.put(key, upload.bytes, { httpMetadata: { contentType: upload.type } });
    files.push({ key, slot: upload.slot, name: upload.name, type: upload.type, size: upload.bytes.length });
  }

  const item = { id, kind, received: new Date().toISOString(), payload, files };
  await env.STORE.put(`queue/${id}.json`, JSON.stringify(item), { httpMetadata: { contentType: 'application/json' } });
  return json({ ok: true, id }, 200, cors);
}

async function items(env) {
  const found = [];
  let cursor;
  do {
    const page = await env.STORE.list({ prefix: 'queue/', cursor });
    for (const object of page.objects) {
      const stored = await env.STORE.get(object.key);
      if (stored) found.push(await stored.json());
    }
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  return json({ ok: true, items: found });
}

async function file(env, key) {
  if (!key?.startsWith('files/')) return json({ ok: false, error: 'Not found.' }, 404);
  const stored = await env.STORE.get(key);
  if (!stored) return json({ ok: false, error: 'Not found.' }, 404);
  return new Response(stored.body, { headers: { 'Content-Type': stored.httpMetadata?.contentType ?? 'application/octet-stream' } });
}

// Pulled submissions move from queue/ to done/, so they're kept but not pulled twice.
async function done(env, id) {
  if (!/^\d{4}-\d{2}-\d{2}-[0-9a-f]{8}$/.test(id ?? '')) return json({ ok: false, error: 'Bad id.' }, 400);
  const stored = await env.STORE.get(`queue/${id}.json`);
  if (!stored) return json({ ok: false, error: 'Not found.' }, 404);
  await env.STORE.put(`done/${id}.json`, await stored.text(), { httpMetadata: { contentType: 'application/json' } });
  await env.STORE.delete(`queue/${id}.json`);
  return json({ ok: true });
}
