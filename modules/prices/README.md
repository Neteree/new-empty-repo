# Prices module

Adds a price list to a starter site: a `#prices` section on the home page and
a "Prices" item in the menu. `Section.astro` prepares the items and photos;
`PriceList.svelte` draws them. For anything sold at set prices: bouquets,
haircuts, cakes, classes.

- Add it with `"modules": ["prices"]` in the client's JSON (or `?modules=prices`
  in the onboarding link). The new-client script copies `src/modules/prices/`
  into the site.
- Items, groups, the section wording and the note under the list are in
  `src/modules/prices/prices.json` (types in `prices.ts`). The items there are
  examples: replace them with the client's real prices (a `prices-replace`
  change, or `price-add` one at a time), never invent any. Until then the
  checks stop the site going live.
- Each item has one price (`price`), a starting price (`price` with
  `from: true`), sizes (`sizes`: `[{ label, price }]`), or none ("Ask us").
  `photo` is optional; with photos the items show as cards, without them as a
  plain list. `unavailable: true` hides an item without deleting it.
- The change scripts can add, remove, reprice, hide or show items, set their
  photo (a new one or a gallery photo) and change the note.
