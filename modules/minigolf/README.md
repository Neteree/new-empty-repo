# Mini golf module

A playable 3D mini golf game on its own page (`play.html`), with a section on
the home page listing the holes and a "Play" menu item. For a mini golf
course, a games venue, or any business that wants a fun page.

- Add it with `"modules": ["minigolf"]` in the client's JSON. The new-client
  script copies the module into the site and adds three.js and Threlte (its
  `module.json`); run `npm install`.
- The holes, wording and pars are in `src/modules/minigolf/minigolf.json`. A
  hole is its green's edge (corners in order), the start, the cup, and any
  rectangular blocks and round bumpers, in metres-ish units; walls follow the
  edge automatically. Typed and played by `golf.ts`: plain functions for the
  physics (rolling, bouncing, dropping in the cup), so they're easy to test
  and tune.
- `Course.svelte` draws a hole in 3D (Threlte) and turns a drag on the green
  into a putt: pull back from the ball and let go. `Golf.svelte` is the rest
  as page elements: hole, par and strokes, aim and power sliders with a Putt
  button (for keyboards and screen readers), the scorecard, and the best round
  (kept in the visitor's browser).
- The walls and flag use the site's theme colours; the green is always green.
- Only `play.html` loads three.js; the home page section is plain HTML.
