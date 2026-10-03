# Booking module

The "booking or quote form" add-on: a `#book` section on the home page with a
form that asks what the customer wants and when, and a menu item. One module
for both kinds of business:

- `"kind": "booking"` (barbers, physios, groomers, classes): pick a service,
  a day and a time of day. The business confirms by email; nothing is booked
  automatically.
- `"kind": "quote"` (trades): describe the job, where it is and roughly when.
  The site's gallery shows past work.

- Add it with `"modules": ["booking"]` in the client's JSON, and set the kind
  and choices with `"booking": { "kind": "quote", "options": [...] }` (or
  `?modules=booking` in the onboarding link, plus `&quote=1` for quotes). The
  new-client script copies `src/modules/booking/` into the site and writes
  those settings into `booking.json`.
- Everything is in `src/modules/booking/booking.json` (types in `booking.ts`):
  the wording, `options` (what can be booked, or the kinds of job), `times`
  (times of day to choose from), whether to ask for an address, and how many
  days ahead the earliest day is. The options start as a placeholder, which the
  checks refuse to let go live: fill them in from the client, never invent
  them. The `booking` change sets them later.
- It sends through the site's Web3Forms key like the enquiry form
  (`src/lib/send.ts`), so it works once the `form-key` change is done.
- Dates use the client's time zone (Pacific/Auckland), so "tomorrow" is right
  in New Zealand wherever the visitor is.
