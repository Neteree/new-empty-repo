# Bouquet module

Adds a live 3D bunch of flowers to a starter site: a `#bouquet` section on the
home page that people turn with a slider (or by dragging with a mouse), with a
"New bunch" button. On a phone, touching the 3D just scrolls the page, so
turning never fights scrolling. The
first 3D module, and the pattern for others: the scene is drawn on a canvas
(Threlte, three.js in Svelte) and everything people read or tap is ordinary
page elements beside it.

- Add it with `"modules": ["bouquet"]` in the client's JSON (or
  `?modules=bouquet` in the onboarding link). The new-client script copies
  `src/modules/bouquet/` into the site and adds the packages in `module.json`
  (three and Threlte) to its `package.json`; run `npm install` afterwards.
- The wording, colours and number of flowers are in
  `src/modules/bouquet/bouquet.json` (types in `bouquet.ts`). It's a drawing,
  not a product photo, so it says so; keep it that way.
- `Section.astro` is the shell and places `Bouquet.svelte` as an island
  (`client:visible`), so three.js only loads when someone scrolls to it. The
  rest of the page stays plain HTML. `Flowers.svelte` is the scene itself and
  can be reused in any other Threlte canvas.
- It also adds a game page, `game.html` ("Make the bunch": tap the flowers each
  customer orders before time runs out), linked from the menu and the section.
  Its wording, length, flower kinds and customer names are under `game` in
  `bouquet.json`; the rules are plain functions in `game.ts`, the 3D garden is
  `Garden.svelte`, and the order, timer, score and pick buttons are page
  elements in `Game.svelte`. Both use `Flower.svelte`, one 3D flower.
- The bunch only moves when someone drags it, and flowers are placed so they
  never touch each other.
