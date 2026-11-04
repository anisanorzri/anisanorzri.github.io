# Project skills

Claude Code loads every folder here as a skill when working in this repo.

| Skill | What it does | Source |
|---|---|---|
| `design-taste-frontend` | Taste Skill v2: art direction + browser-checked anti-slop house style for pages | [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) @ 12af471 (tasteskill.dev) |
| `web-design-guidelines` | Reviews UI code against Vercel's Web Interface Guidelines | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines) @ 1a2c79d |
| `image-to-code` | Generate design images first, then build the site to match | [Leonxlnx/imagegen-skills](https://github.com/Leonxlnx/imagegen-skills) @ beb16b0 (moved out of taste-skill in v2.1.3) |
| `awesome-design-md` | Fetches a ready-made DESIGN.md design system to build from | [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) @ fcc7028 (wrapper skill) |
| `playwright-cli` | Drive a real browser from the terminal: open, click, snapshot, screenshot | [microsoft/playwright-cli](https://github.com/microsoft/playwright-cli) @ db2a0fa |

`playwright-cli` needs the CLI binary: `npm install -g @playwright/cli@0.1.23`
(or run it ad hoc with `npx @playwright/cli`).

To update a skill, re-copy its folder from the upstream repo.
