# Change request form

A private page, `request.html`, where clients list changes to their site. Linked from emails as `request.html?site=<their site URL>`, which loads that site's `photos.json` and only shows changes for the add-ons it has. It sends a `---CHANGES-JSON---` block that `ops/intake.js` reads.

- Every change type the form can send must be one `scripts/changes.js` handles: `npm run check` fails otherwise (`check.js` in this module).
- Wording is in `requests.json`. Not offered to clients (`"offer": false`): it's for the builder's own site.
