# Intake Worker

A small Cloudflare Worker that receives form answers and photo uploads from
Cameron's site and keeps them in R2 storage until `node ops/pull.js` brings
them into the request queue. Free at this scale (Workers: 100,000 requests a
day; R2: 10 GB).

## One-time setup (Cameron)

1. **Turn on R2:** Cloudflare dashboard → R2 Object Storage → turn it on (the
   free plan; Cloudflare may ask for a card).
2. **Account ID:** already in `wrangler.toml` (it isn't secret).
3. **Create an API token:** Cloudflare → My Profile → API Tokens → Create Token
   → "Edit Cloudflare Workers" template → add the permission
   *Account · Workers R2 Storage · Edit* → Continue → Create. Copy the token.
4. **Make an admin password:** any long random password (a password manager
   can make one). It protects the list of submissions.
5. **Add two GitHub secrets:** github.com/Neteree/new-empty-repo → Settings →
   Secrets and variables → Actions → New repository secret:
   - `CLOUDFLARE_API_TOKEN`: the token from step 3
   - `INTAKE_ADMIN_TOKEN`: the password from step 4
6. **Deploy:** Actions → Intake worker → Run workflow. The log shows the
   Worker's address (`https://cameron-belcher-intake.<something>.workers.dev`).
7. **Switch the site over:** set `intakeUrl` in cameron-belcher-web's
   `src/site.config.ts` to that address, and add to this repo's `.env`:
   ```
   INTAKE_URL=https://cameron-belcher-intake.<something>.workers.dev
   INTAKE_TOKEN=<the password from step 4>
   ```

Then `node ops/pull.js` brings new submissions and photos into the queue.

## Client enquiries by email (one-time setup, Cameron)

Client sites can send their enquiry form here instead of to Web3Forms, and the
Worker emails each enquiry to the client (Reply-To is the customer). Free, no
keys for the client: they only click one Cloudflare "verify" link.

1. **A domain on Cloudflare with Email Routing on:** Cloudflare → the domain →
   Email → Email Routing → turn it on (it sets the domain's MX records, so check
   nobody gets email at that domain first).
2. **Set the sending address:** github.com/Neteree/new-empty-repo → Settings →
   Secrets and variables → Actions → Variables → `MAIL_FROM`, e.g.
   `enquiries@artangelflorist.co.nz`. The next deploy switches sending on.
3. **Per client:** Email Routing → Destination addresses → add the client's
   email (their `contact.email`); they click the link in Cloudflare's email.
   Then give the client JSON `"mailUrl": "<this Worker's address>/enquiry"` and
   their live `url`, and run update-site. The Worker learns the site from
   `starter/clients/` on its next deploy (`node clients.js`).

## Testing locally

```
cd worker && npm install
TEST_CLIENT=http://localhost:4322=florist@example.com node clients.js
printf 'ADMIN_TOKEN=local-test-token\nMAIL_FROM=enquiries@example.com\n' > .dev.vars
npx wrangler dev --local     # in one terminal
node test.mjs                # in another
```
