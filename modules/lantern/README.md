# Lantern Market

A night-market tile game on its own page, `lantern.html`, plus a home page section with a Play button. Lay numbered jewel tiles from a looping belt onto a hex board, clear runs and sets to serve patrons before their patience runs out, buy stall upgrades with the gems and travel five stops to the Grand Bazaar. It mixes twelve games (Rummikub, Candy Crush, Catan, Splendor, Overcooked and more): the list is in `lantern.json` and shows on the home page.

- **Rules** are plain functions in `lantern.ts` (no page code), so bots and checks can play them. **The page** is `Lantern.svelte`, using the starter's shared game parts (`src/lib/game/`: seeded random, saving, best score, sound, hex board; `src/components/game/GameDialog.svelte`).
- **Wording and content** a client might change is in `lantern.json`: the home page section, the five stops and their prestige goals, patron names, card names, perks and gem colours.
- **Checks** (`check.js`, run by `npm run check`): replays recorded games and fails if the rules play differently from the playtested original, then runs 30 bot games and checks they stay inside agreed limits. To change the rules on purpose, re-record with `node src/modules/lantern/check.js --record` and say so in the pull request.
- Colours and fonts follow the site's look; the `night` look is the one it was designed for (`clients/lantern-demo.json`).
