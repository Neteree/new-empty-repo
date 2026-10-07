// Writes src/clients.json for the Worker: which client site may send enquiries
// to /enquiry, and whose inbox they go to. Read from starter/clients/*.json, the
// one place client details live: a client with `mailUrl` set, a live `url` and
// a `contact.email` gets an entry. Run before testing and deploying.
//
//   node clients.js                       write src/clients.json
//   TEST_CLIENT=<origin>=<email> node clients.js   also add a client (local tests)
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const folder = new URL('../starter/clients/', import.meta.url).pathname;
const clients = {};
for (const file of readdirSync(folder).filter((f) => f.endsWith('.json'))) {
  const client = JSON.parse(readFileSync(join(folder, file), 'utf8'));
  if (!client.mailUrl || !client.url || !client.contact?.email) continue;
  clients[new URL(client.url).origin] = { name: client.name, to: client.contact.email };
}
if (process.env.TEST_CLIENT) {
  const [origin, to] = process.env.TEST_CLIENT.split('=');
  clients[origin] = { name: 'Test Florist', to };
}
writeFileSync(new URL('./src/clients.json', import.meta.url), `${JSON.stringify(clients, null, 2)}\n`);
console.log(`${Object.keys(clients).length} client site(s) can send enquiries.`);
