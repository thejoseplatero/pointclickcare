# Jose Platero, for PointClickCare

A single-purpose application page built for one job posting (VP, Design & User Experience). Not affiliated with or endorsed by PointClickCare.

Deployed to `joseplatero.com/pointclickcare` and mirrored on GitHub Pages. Deliberately not indexed by search engines (noindex meta, no OG tags, enforced by `scripts/qa.mjs`); meant to be shared by direct link only.

## How it works

- `template.html` holds structure, styles, and behavior, with `<!--content:token-->` markers.
- `content/*.md` holds every piece of prose. Edit these, not `index.html`.
- `node scripts/build.mjs` stitches `index.html`.
- `node scripts/qa.mjs` gates every commit; `node scripts/qa.mjs --live` also checks both deploy targets and the media assets embedded from joseplatero.com.
- `design-notes.md` is the measured record of PointClickCare's design language this page is built in. Every visual decision traces back to it.
