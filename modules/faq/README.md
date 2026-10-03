# FAQ module

A "Good to know" section of questions that open to show their answers
(parking, deposits, dietary needs, how long a job takes…). No JavaScript.

- Add it with `"modules": ["faq"]` in the client's JSON; questions can go in
  straight away with `"faq": { "questions": [...] }`.
- Questions are in `src/modules/faq/faq.json` (types in `faq.ts`). They start
  as a placeholder the checks refuse to let go live; answers are the
  business's own words, never invented. A blank line in an answer starts a new
  paragraph.
- The `faq-add`, `faq-remove` and `faq-replace` changes edit them; the first
  real one replaces the placeholder.
