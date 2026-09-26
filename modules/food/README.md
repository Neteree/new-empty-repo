# Food module

Adds a menu with a weekend pre-order to a starter site: a `#order` section on
the home page and a "Pre-order" badge with a live item count in the menu.
From the Early Crust demo.

- Add it with `"modules": ["food"]` in the client's JSON. The new-client script
  copies `src/modules/food/` into the site and adds `cspell-words.txt` to its
  spelling list.
- Menu items, days, pickup times and the section wording are in
  `src/modules/food/menu.ts`. The items there are demo data: replace them with
  the client's real menu and prices, and never invent any.
- `BakeArt.svelte` draws bakery illustrations for each item (`art`). Other
  food businesses will want photos instead.
- Placing an order isn't connected: it shows a demo message. Real orders and
  payment are the "Online orders" add-on (Stripe), not built yet.
