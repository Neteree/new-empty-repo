# Shop module

A few products people can buy online, each with a "Buy" button that goes to
its Stripe payment link. No cart, server or monthly fee: the client makes a
payment link per product in their own Stripe account, Stripe takes the
payment and emails them, and they arrange pickup or delivery. (A real
catalogue needs Shopify instead; see the project notes.)

- Add it with `"modules": ["shop"]` in the client's JSON; products can go in
  straight away with `"shop": { "products": [...] }`.
- Products are in `src/modules/shop/shop.json` (types in `shop.ts`): name,
  description, price (NZ dollars), Stripe payment link, optional photo, and
  `soldOut`. They start as a placeholder the checks refuse to let go live;
  never invent products or prices. A product without a link shows "Ask us",
  which goes to the enquiry form.
- Changes: `product-add`, `product-remove`, `product-price`, `product-link`,
  `product-sold-out` and `product-photo`. Payment links must be
  `https://buy.stripe.com/…` links.
