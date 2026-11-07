# European Startup Radar

The published list: https://claude.ai/artifact/Rvzr6rZXr2jEfF6GES19Ue (private until shared).

- `startup-radar.html` — the page, styled with open-design's Airtable-inspired design system (github.com/nexu-io/open-design, Apache-2.0) and its craft rules (state coverage, anti-AI-slop). Grid and Gallery views, Group by, a thesis builder, and a private pipeline (stars and statuses saved under each viewer's own `data/users/<id>/radar`). Rows live in its database (`startups` collection, `meta/radar`), written by Claude with ArtifactData; only the owner can write.
- `build-rows.ts` — turns the raw pulls in `radar/work/` (`yc-eu.json`, `yc-detail.json`, `xposts3.json`) into rows: sector, thesis fit, channel, checks. Run with `RADAR_DIR=radar/work/ npx tsx radar/build-rows.ts`.
- A scheduled task re-runs the sourcing every Monday at 08:39 London time and adds only new companies.

Rules the rows follow: every X post is re-read through X's oEmbed endpoint before use; a funding round shows only as reported by whoever posted it; thesis fit comes from the company's own one-line description; defence, crypto and consumer are excluded.
