# Project notes

A side business building websites for local New Zealand businesses, with AI agents doing most of the building and changes. No monthly fees: clients pay a one-off price for the build, then per request for changes (fixed price for small changes, quoted for bigger ones). Change work comes from our own builds; we don't go looking for work on other people's sites.

## Decisions

- **Scripts before AI (most important):** if a task is deterministic, automate it with a plain script or workflow, never an agent. AI costs money on every run, so use it only where real judgement is needed, and always try the scripted path first (as the change-request workflow does). When building anything new, say which parts are scripted and which, if any, need AI and why.

- **Data-driven sites:** everything a client might change (wording, prices, hours, photos, menu items, news) lives in data files (`src/data/site.json`, module JSON such as `menu.json`, Markdown posts, `src/assets/photos/`), never mixed into page code, so scripts can make most changes. `.ts` files next to the JSON only hold types.
- **AI where it earns its keep:** the build and routine changes are scripted. AI is for judgement and writing: drafting a client's headline and copy from their onboarding answers (Cameron reviews), working out vague requests, and one-off work like new sections. When a kind of request keeps needing AI, write a script for it.
- **Components, built once:** a site is a set of components (hero, menu, hours, news…), each with its own data file. A new site uses the components that exist; only a missing one gets built (by Cameron or AI), in the same shape so themes, checks and scripted changes still work. A one-off stays with that client; once a kind of request or component comes up a second time, it becomes a reusable module or change script. Avoid building a site from scratch: it loses the automation. Keep automation first for now.
- **No AI at the front for now:** forms sort requests by type and Cameron approves everything. Add an AI step only if free-text requests become common, and then only to translate them into the scripts' change format for Cameron to approve.
- **Payments:** Stripe (payment links; a paid invoice triggers go-live), with bank transfer as a manual fallback.
- **Stack:** Astro 7 with Svelte 5 islands, static output. Svelte 5 runes syntax only (`$state`, `$derived`, `$props`). Plain Astro everywhere else, with no JavaScript. SvelteKit only for a client who needs a real web app.
- **Stay on Astro + Svelte;** reconsider only if something keeps getting in the way.
- **Shops:** a few products means Stripe Checkout. A real catalogue means Shopify behind an Astro front end. Not a focus yet.
- **Not WordPress,** unless a client already runs on it or needs its plugins.
- **Content:** client details live in `src/data/site.json` (typed by `src/site.config.ts`), module lists in their JSON, and news posts in Markdown content collections.
- **Time zone:** all date logic uses the client's time zone (`Pacific/Auckland`), never UTC.
- **Honesty:** never invent facts about a client (prices, hours, allergens, suppliers). Use `[PLACEHOLDER: ...]` and ask.

## Starter plan

- **Base starter** (`starter/`) for every client: config, layout, light and dark mode, news (journal), enquiry form (Web3Forms), 404 page, checks, and the new-client script.
- **Add-on modules** (`modules/<name>/`) per client type: food is done (a plain menu grouped by category; weekend-style pre-ordering is optional, `"menu": { "preOrder": true }` in the client JSON or `&preorder=1` in the onboarding link); services (booking), shops (products, Stripe) and trades (gallery, quotes) are still to build. A module adds `src/modules/<name>/Section.astro` (a home page section) and optionally `NavItem.astro` (a menu item); the starter picks them up automatically.
- Create a client site: `cd starter && node scripts/onboard.js <onboarding-email> <folder>` from onboarding answers, or `node scripts/new-client.js clients/<client>.json <folder>` from a client JSON. The client JSON lists its `modules`. See `clients/example.json` (no modules) and `clients/bakery.json` (food).
- **Looks:** four presets in `starter/src/themes.ts` (bold, classic, calm, warm), picked with `theme` in the client JSON. Colours are CSS variables (`--accent`, `--highlight`, `--paper`, `--ink`…); modules must use them, never hard-coded colours.
- **Checks:** GitHub Actions run them on every pull request (`.github/workflows/check.yml` in each site; `starter.yml` here tests the starter). `npm run check` in any site builds it, then checks HTML, NZ/UK spelling (`cspell-words.txt`), phone and desktop layout, images, links, empty-form errors, leftover `[PLACEHOLDER: ...]` text, and accessibility including colour contrast in light and dark mode (axe-core). Screenshots go in `check-output/`. `cameron-belcher-web` uses the same `scripts/check.js` and `scripts/browser.js`; keep them in step.

## Agents

- `site_agent.py`: a Strands agent on Gemini Flash that applies a client change request to a site. Its tools can only touch the site's `src/`, and it must pass the build. It falls back 3.8 → 3.7 → 3.5 → 3.5-lite when a model is overloaded or out of quota.
- **Planned additions:** a spelling and grammar check (e.g. Vale or LanguageTool), an HTML validator, and a small validation agent (Flash-Lite) that flags anything not in the client's request. A human approves before anything goes live.
- **Models:** Gemini Flash for routine edits, a stronger model only when checks fail. Use a paid Gemini key for client work, since the free tier hits "overloaded" and quota errors. A Claude subscription doesn't cover API use by custom agents.

## Pricing (on Cameron's business site)

- One base site at $150 (one page, enquiry form, local search basics, own domain, free hosting in the client's name).
- Add-ons, now or later: extra page $40, menu or product list $60, booking or quote form $60, news editor $80, online orders (Stripe) $350.
- After launch: small change $20, anything bigger quoted. Prices are in `src/site.config.ts` of `cameron-belcher-web`.
- Family, friends and "first sites free for a testimonial" deals are word of mouth only, never on the site. Record the deal in the client's JSON.

## Client flow (agreed; being built in stages)

One pipeline for new clients and changes:

1. Request: an email, the contact form, or `request.html` on Cameron's site (clients list their changes; texts get a reply with the link). **Built**; emails still have to be saved and fed in by hand until email receiving is set up.
2. `node ops/intake.js <email>` sorts it into the queue (`ops/queue/`, not committed): new enquiry, onboarding answers, or a change request from a known client (matched on the saved `contact.email` in `starter/clients/`). Change requests wait for the client to confirm from their saved address (the email is written to `ops/outbox/` until an email service sends it; `ops/confirm.js` marks it confirmed). Unknown addresses and direct emails failing SPF/DKIM are flagged, never confirmed. **Built.** `node ops/queue.js` lists everything.
3. **Cameron approves** and sets the price (small changes: fixed $20; `--price 0` for free family or testimonial work): `node ops/approve.js <id> --price 20 --site <folder>` (or `--close`).
4. New clients fill in the onboarding form (tested for real end to end) (`onboarding.html` on Cameron's site, linked privately, with agreed add-ons in the link, e.g. `?modules=food`). `starter/scripts/onboard.js` turns the emailed answers into the client JSON and site. **Built.** Blank headlines stay `[PLACEHOLDER]` for Cameron or AI copy drafting. A real client's site stays blocked until it has their own Web3Forms key (create one at web3forms.com with the client's email; they forward the key; apply a `form-key` change) and, with the food module, their real menu (a `menu-replace` change).
5. Build: new sites by script; changes by `scripts/apply-changes.js` with a list of changes (**built**: wording swaps, opening hours, the client's form key, hero photo, news posts, full menu replace, menu add/remove/price/sold out; see `scripts/changes.js`). Anything else comes back as "needs a person", for Cameron or the agent.
6. Checks and a Cloudflare Pages preview. **Cameron checks it first**, then the client sees it. Tweaks go back to step 5 (limit the free rounds).
7. The client pays the Stripe link; payment puts it live. **Planned.**

The GitHub side (issue form, `approved` label, `change-request` workflow opening a pull request) is built into every starter site. Never let a request go straight from the public to live: Cameron approves every job and every preview. `site_agent.py` at the root is the one to edit; new-client copies it into each site.

## Repo layout

- `starter/`: base starter and new-client script. `modules/`: add-on modules (`food/`).
- `ops/`: the request queue scripts (intake, confirm, queue, approve).
- `bakery-site/`: the Early Crust demo (portfolio piece). New client sites come from `starter/`, not from here.
- `floristry-site/`: Astro demos (pastel `index.html`, dark `still-life.html`).
- `demo-designs/`: single-file homepage designs (café, plumber, barber, physio) used as portfolio screenshots. Starting points for real clients.
- `flower-shop/`: SvelteKit shop demo (`npm run build:preview` makes a single-file preview).
- `site_agent.py`, `main_gemini.py`, `main.py`: Strands agents. Keys go in `.env` (see `.env.example`); `.env` is gitignored and isn't kept between sessions.

## Related repos

- `Neteree/cameron-belcher-web`: Cameron's own business site (Astro + Svelte). Portfolio screenshots are in `src/assets/work/`.

## Parked (Cameron to set up later)

- **Gemini API key** for `site_agent.py` and the other agents (paid key for client work, in `.env`).
- **Custom domain** for `cameron-belcher-web` (costs money). The site is live at https://cameron-belcher-web.pages.dev.
- **Stripe account** (payment links and the webhook that puts a paid job live).
- **Email service** for receiving requests into `ops/intake.js` and sending the confirmation emails (e.g. Cloudflare Email Routing and Workers, free).
- **Per client repo, before change requests work:** add the `GEMINI_API_KEY` secret (only for non-wording requests), create an `approved` label, and turn on Settings → Actions → General → "Allow GitHub Actions to create and approve pull requests".

## Next steps

1. When a client first asks to reorder or add sections: list each site's sections and their order in `site.json`, so layout changes become scripted too.
2. Switch on the parts that need accounts: receiving and sending email (so intake and confirmations run by themselves), Stripe, automatic repo and Cloudflare setup, AI copy drafting (Gemini).
3. Build the "news you edit yourself" add-on (Keystatic, free) when the first client buys it.
4. Try the whole flow with family sites first, then find the first 3 paying clients in one niche.
