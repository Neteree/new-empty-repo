# Food module

Adds a menu with a weekend pre-order to a starter site: a `#order` section on
the home page and a "Pre-order" badge with a live item count in the menu.
From the Early Crust demo.

- Add it with `"modules": ["food"]` in the client's JSON. The new-client script
  copies `src/modules/food/` into the site and adds `cspell-words.txt` to its
  spelling list.
- Menu items, days, pickup times and the section wording are in
  `src/modules/food/menu.json` (types in `menu.ts`). The items there are demo
  data: replace them with the client's real menu and prices, never invent
  any, then set `demoMenu` to false. The change scripts can add, remove,
  reprice and mark items sold out.
- `Section.astro` is the shell: the plain menu is `Menu.svelte`, the pre-order
  form `PreOrder.svelte`.
- `BakeArt.svelte` draws bakery illustrations for items that have an `art`
  value; items without one show no picture.
- Placing an order isn't connected: it shows a demo message. Real orders and
  payment are the "Online orders" add-on (Stripe), not built yet.
