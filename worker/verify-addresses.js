// Asks Cloudflare to send each client a "verify your address" email, so the
// Worker may email their enquiries to them (Email Routing only delivers to
// verified addresses). Reads the clients from src/clients.json (written by
// clients.js); addresses already added, verified or not, are left alone.
// Run by the deploy with CLOUDFLARE_API_TOKEN, which needs the permission
// Account · Email Routing Addresses · Edit. Never fails the deploy: it says
// what's missing instead.
import { readFileSync } from 'node:fs';

const token = process.env.CLOUDFLARE_API_TOKEN;
const account = readFileSync(new URL('./wrangler.toml', import.meta.url), 'utf8').match(/^account_id = "(\w+)"/m)?.[1];
const wanted = [...new Set(Object.values(JSON.parse(readFileSync(new URL('./src/clients.json', import.meta.url), 'utf8'))).map((c) => c.to.toLowerCase()))];
const api = `https://api.cloudflare.com/client/v4/accounts/${account}/email/routing/addresses`;
const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

async function call(url, options = {}) {
  const response = await fetch(url, { headers, ...options });
  const body = await response.json().catch(() => ({}));
  if (!body.success) throw new Error(body.errors?.map((e) => e.message).join('; ') || `Cloudflare said ${response.status}`);
  return body;
}

try {
  if (!wanted.length) {
    console.log('No client inboxes to verify.');
    process.exit(0);
  }
  const known = new Map();
  for (let page = 1; ; page++) {
    const { result, result_info: info } = await call(`${api}?per_page=50&page=${page}`);
    for (const address of result) known.set(address.email.toLowerCase(), address.verified);
    if (!info || page >= Math.ceil(info.total_count / info.per_page)) break;
  }
  for (const email of wanted) {
    if (known.has(email)) {
      console.log(`${email}: ${known.get(email) ? 'verified' : 'waiting for them to click the link in Cloudflare’s email'}`);
      continue;
    }
    await call(api, { method: 'POST', body: JSON.stringify({ email }) });
    console.log(`${email}: verify email sent; enquiries reach them once they click its link`);
  }
} catch (error) {
  console.log(`Couldn't check client inboxes with Cloudflare (${error.message}).`);
  console.log('Give the CLOUDFLARE_API_TOKEN the permission Account · Email Routing Addresses · Edit (see worker/README.md).');
}
