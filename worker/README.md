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

## Testing locally

```
cd worker && npm install
echo "ADMIN_TOKEN=local-test-token" > .dev.vars
npx wrangler dev --local     # in one terminal
node test.mjs                # in another
```
