# Reviews module

A "What customers say" section of quote cards: the review, who left it, and
optionally where (e.g. "Google review") and stars.

- Add it with `"modules": ["reviews"]` in the client's JSON; real reviews can
  go in straight away with `"reviews": { "items": [...] }`.
- Reviews are in `src/modules/reviews/reviews.json` (types in `reviews.ts`).
  They start as a placeholder the checks refuse to let go live. Only ever real
  reviews, word for word, named the way the customer agreed: never invent or
  tidy one up.
- The `review-add` and `review-remove` changes edit them; the first real one
  replaces the placeholder. The section hides when there are none.
