# Grok sourcing for the radar (option B: weekly, one paste)

1. Monday's radar refresh builds a task with `make-task.cjs` (companies already on the radar are excluded) and posts it to the bridge.
2. You paste one message into a **normal Grok chat** (Grok Bots and Routines cannot call this connector; tested 2026-11-09).
3. Next Monday's refresh fetches the result, runs `check-result.ts` (every X post re-read through X oEmbed, quotes checked on live pages, fundraising inference rejected) and adds only companies that pass.

## Bridge

- Code: github.com/aipmer/codex-grok-task-bridge at commit `9acd28f` (Apache-2.0), plus `bridge/grok-redirect-fix.patch` (lets the approval page redirect to grok.com; without it Grok never receives its code).
- Config: `bridge/wrangler.jsonc` — Cloudflare free plan, D1 + KV only (no R2, so no card needed), logging off, the two upstream timers on (lease reset every 5 min, daily OAuth clean-up).
- Address: https://codex-grok-task-bridge.sourcebook-453906.workers.dev — Grok connects at `/grok/mcp`, the radar at `/mcp`.
- Secrets live only in Cloudflare and in this environment's network secrets; none are in git.
