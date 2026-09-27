# Project notes

A side business building websites for local New Zealand businesses, with AI agents doing most of the building and changes. No monthly fees: clients pay a one-off price for the build, then per request for changes (fixed price for small changes, quoted for bigger ones). Change work comes from our own builds; we don't go looking for work on other people's sites.

## Decisions

- **Scripts before AI (most important):** if a task is deterministic, automate it with a plain script or workflow, never an agent. AI costs money on every run, so use it only where real judgement is needed, and always try the scripted path first (as the change-request workflow does). When building anything new, say which parts are scripted and which, if any, need AI and why.

- **Stack:** Astro 7 with Svelte 5 islands, static output. Svelte 5 runes syntax only (`$state`, `$derived`, `$props`). Plain Astro everywhere else, with no JavaScript. SvelteKit only for a client who needs a real web app.
- **Shops:** a few products means Stripe Checkout. A real catalogue means Shopify behind an Astro front end. Not a focus yet.
- **Not WordPress,** unless a client already runs on it or needs its plugins.
- **Content:** client details live in `src/site.config.ts`, lists in `src/data/*.ts`, and journal posts in Markdown content collections.
- **Time zone:** all date logic uses the client's time zone (`Pacific/Auckland`), never UTC.
- **Honesty:** never invent facts about a client (prices, hours, allergens, suppliers). Use `[PLACEHOLDER: ...]` and ask.

## Starter plan

- **Base starter** (`starter/`) for every client: config, layout, light and dark mode, news (journal), enquiry form (Web3Forms), 404 page, checks, and the new-client script.
- **Add-on modules** (`modules/<name>/`) per client type: food (menu, pre-order) is done; services (booking), shops (products, Stripe) and trades (gallery, quotes) are still to build. A module adds `src/modules/<name>/Section.astro` (a home page section) and optionally `NavItem.astro` (a menu item); the starter picks them up automatically.
- Create a client site: `cd starter && node scripts/new-client.js clients/<client>.json <folder>`. The client JSON lists its `modules`. See `clients/example.json` (no modules) and `clients/bakery.json` (food).
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

## Client requests

- New enquiries: the contact form on Cameron's site emails him through Web3Forms once its key is set (see Parked).
- Change requests (built into every starter site, not yet used live): a "Change request" issue form → Cameron prices it and adds the `approved` label → the `change-request` workflow tries `scripts/apply-request.js` first (a free wording swap that must match exactly once) and only uses `scripts/site_agent.py` (Gemini) for anything else → `npm run check` → a pull request, with a Cloudflare Pages preview → Cameron merges to put it live. Payment link is still manual.
- Never let a request go straight from the public to the agent to live. Only people with write access can add labels.
- `site_agent.py` at the root is the one to edit; new-client copies it into each site.

## Repo layout

- `starter/`: base starter and new-client script. `modules/`: add-on modules (`food/`).
- `bakery-site/`: the Early Crust demo (portfolio piece). New client sites come from `starter/`, not from here.
- `floristry-site/`: Astro demos (pastel `index.html`, dark `still-life.html`).
- `demo-designs/`: single-file homepage designs (café, plumber, barber, physio) used as portfolio screenshots. Starting points for real clients.
- `flower-shop/`: SvelteKit shop demo (`npm run build:preview` makes a single-file preview).
- `site_agent.py`, `main_gemini.py`, `main.py`: Strands agents. Keys go in `.env` (see `.env.example`); `.env` is gitignored and isn't kept between sessions.

## Related repos

- `Neteree/cameron-belcher-web`: Cameron's own business site (Astro + Svelte). Portfolio screenshots are in `src/assets/work/`.

## Parked (Cameron to set up later)

- **Gemini API key** for `site_agent.py` and the other agents (paid key for client work, in `.env`).
- **Web3Forms access key** for the contact form on `cameron-belcher-web` (`formKey` in `src/site.config.ts`). Until then the form sends nothing.
- **Cloudflare Pages** for `cameron-belcher-web`: build `npm run build`, output `dist`. Needs a Cloudflare account; a custom domain costs money.
- **Per client repo, before change requests work:** add the `GEMINI_API_KEY` secret (only for non-wording requests), create an `approved` label, and turn on Settings → Actions → General → "Allow GitHub Actions to create and approve pull requests".

## Next steps

1. Add the validation agent (needs the Gemini key).
2. Build the next modules (services booking, trades gallery and quotes) as clients need them.
3. Find the first 3 paying clients in one niche.
