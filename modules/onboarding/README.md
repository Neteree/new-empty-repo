# Onboarding form

A private page, `onboarding.html`, where a new client fills in their details, hours, look, photos and add-ons. It sends a `---CLIENT-JSON---` block (or goes to the intake Worker when `intakeUrl` is set) that `starter/scripts/onboard.js` turns into their site.

- Add-ons come from the link: `?modules=food,prices`, plus `&preorder=1` or `&quote=1`. The list of add-ons and looks is read from the starter (`src/lib/catalogue.ts`), never kept by hand.
- Wording is in `onboarding.json`. Not offered to clients (`"offer": false`): it's for the builder's own site.
