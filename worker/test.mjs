// Tests the intake Worker. Start it first with `npx wrangler dev --local`
// (ADMIN_TOKEN=local-test-token in .dev.vars), then: node test.mjs
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const base = process.env.INTAKE_URL ?? 'http://localhost:8787';
const token = process.env.ADMIN_TOKEN ?? 'local-test-token';
const origin = 'http://localhost:4321';
const admin = { Authorization: `Bearer ${token}` };

// Tiny real images, made in memory: a 1x1 PNG and a JPEG header, plus a fake.
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const jpg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(200, 1)]);
const notAnImage = Buffer.from('<script>alert(1)</script>');

function form({ kind = 'onboarding', payload = { name: 'Test' }, logo, photos = [], botcheck } = {}) {
  const data = new FormData();
  data.set('kind', kind);
  data.set('payload', JSON.stringify(payload));
  if (botcheck) data.set('botcheck', 'on');
  if (logo) data.append('logo', new Blob([logo]), 'logo.png');
  photos.forEach((bytes, i) => data.append('photos', new Blob([bytes]), `photo-${i + 1}.jpg`));
  return data;
}
const submit = (data, from = origin) => fetch(`${base}/submit`, { method: 'POST', body: data, headers: { Origin: from } });

let passed = 0;
async function test(name, run) {
  await run();
  passed++;
  console.log(`ok  ${name}`);
}

// Start clean: mark anything left over from earlier runs as done.
for (const item of (await (await fetch(`${base}/items`, { headers: admin })).json()).items ?? [])
  await fetch(`${base}/done?id=${item.id}`, { method: 'POST', headers: admin });

let id;
await test('rejects other websites', async () => {
  assert.equal((await submit(form(), 'https://evil.example')).status, 403);
});
await test('rejects unknown forms', async () => {
  assert.equal((await submit(form({ kind: 'hack' }))).status, 400);
});
await test('rejects files that are not images, whatever their name', async () => {
  const response = await submit(form({ photos: [jpg, notAnImage] }));
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /isn’t a photo/);
});
await test('rejects more than one logo and too many photos', async () => {
  const two = form();
  two.append('logo', new Blob([png]), 'a.png');
  two.append('logo', new Blob([png]), 'b.png');
  assert.equal((await submit(two)).status, 400);
  assert.equal((await submit(form({ photos: Array(13).fill(jpg) }))).status, 400);
});
await test('quietly drops bot submissions', async () => {
  const response = await submit(form({ botcheck: true }));
  assert.equal(response.status, 200);
  const { items } = await (await fetch(`${base}/items`, { headers: admin })).json();
  assert.equal(items.length, 0);
});
await test('stores an onboarding with a logo and photos', async () => {
  const response = await submit(form({ logo: png, photos: [jpg, jpg] }));
  const body = await response.json();
  assert.equal(response.status, 200, JSON.stringify(body));
  id = body.id;
  assert.match(id, /^\d{4}-\d{2}-\d{2}-[0-9a-f]{8}$/);
});
await test('admin routes need the token', async () => {
  assert.equal((await fetch(`${base}/items`)).status, 401);
  assert.equal((await fetch(`${base}/items`, { headers: { Authorization: 'Bearer wrong-token-here' } })).status, 401);
});
await test('lists the submission with its files, and serves them', async () => {
  const { items } = await (await fetch(`${base}/items`, { headers: admin })).json();
  const item = items.find((i) => i.id === id);
  assert.equal(item.kind, 'onboarding');
  assert.deepEqual(item.files.map((f) => f.slot), ['logo', 'photos', 'photos']);
  const logo = await fetch(`${base}/file?key=${encodeURIComponent(item.files[0].key)}`, { headers: admin });
  assert.deepEqual(Buffer.from(await logo.arrayBuffer()), png);
  assert.equal((await fetch(`${base}/file?key=queue/${id}.json`, { headers: admin })).status, 404);
});
await test('a pulled submission is not listed again', async () => {
  assert.equal((await fetch(`${base}/done?id=${id}`, { method: 'POST', headers: admin })).status, 200);
  const { items } = await (await fetch(`${base}/items`, { headers: admin })).json();
  assert.equal(items.length, 0);
});
console.log(`\nAll ${passed} tests passed.`);
