# Get started

One form on its own page, `start.html`, for everything someone wants from the builder: a new website, a change to their website, or just a question. It replaces the contact form, onboarding and change request forms on the builder's own site (`"offer": false`: not for clients).

- **New website:** their business, then "Build your site": one list of what the site can have, each marked Included or with its price from the price list module (`prices.json`, by item id in `start.json`), and "Something else?" for anything that doesn't exist yet (quoted). Ticked items open their questions; everything there can be left for later. Then a look, then their contact details. It sends the same `---CLIENT-JSON---` answers `starter/scripts/onboard.js` turns into a site, plus the quote.
- **A change:** the change request form (`RequestForm.svelte`), linked from emails as `start.html?path=change&site=<their site URL>`.
- **A question:** name, email and message.
- Answers are kept in the browser until sent. Nothing is built, changed or shown to the client until the builder has checked it.
- The old links (`onboarding.html?modules=…`, `request.html?site=…`) redirect here.
- Wording and the list are in `start.json`.
