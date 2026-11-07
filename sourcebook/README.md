# Sourcebook

An open-source sourcing workspace for small London VC funds that invest in European startups. You add public links: founder posts on X, accelerator cohorts, demo days, company websites. Sourcebook turns them into short company briefs where every line points to its source, and anything not yet known is marked unknown.

It does not make warm introductions or investment recommendations. It has no scores.

## The workflow

1. **Thesis** (`/thesis`): sectors with their keywords, geography, stage and exclusions.
2. **Add a link** (`/intake`): paste a link. Before saving, Sourcebook checks the URL against everything already captured (it ignores tracking parameters and treats `twitter.com` and `x.com` as the same site), and checks the company against existing ones by domain and by name ("Squid Labs Ltd" matches "Squid").
   - **X posts:** paste a post link and its exact text, author and date are filled in from X's public embed endpoint (oEmbed: no login, no scraping). The saved post immediately becomes a draft signal that quotes it.
3. **X signals** (`/x`): saved searches over X's last 7 days through the official **X API v2 recent search**, using your fund's own `X_BEARER_TOKEN`. "Create from the thesis" writes one query per sector: its keywords plus phrases founders use when something has happened ("launching", "first customer", "pilot", "we're hiring"). Each result shows the author, bio, location (and whether it names a thesis place), and whether the post is already captured. Then **Capture** it into intake, or mark it **Not relevant**. Without a token, every saved search opens on x.com, so you can browse yourself and paste what's worth keeping. Only captured posts are stored, plus the IDs of dismissed posts.
4. **Brief** (`/companies/:id`): product, customer, location and signal, then team, entity, traction claims, backers, stage and contact route. Each fact shows who says so:
   - **Verified**: checked against a primary record the company doesn't write, such as a company registry, an accelerator's own batch list or a customer's own announcement.
   - **Company claim**: the company's website, its posts, or the profile text it wrote for an accelerator.
   - **Third-party report**: press or someone else's post, not checked against a primary record.
   - **Unknown**: no approved fact answers the question. Unknowns are shown, never filled in.
5. **Decide**: investigate, shortlist, monitor, already known or reject. Each decision takes a reason and a next diligence question, and every change is logged.
6. **Export** (`/export`): a CSV of the shortlist with sources and dates, why each company might fit, which thesis criteria are still unknown, contact routes the company publishes itself, and the next diligence question.

### Thesis matching

Each criterion shows the fact and the words that matched it:

- **Sector**: whole-word keyword match in approved product, customer and signal facts.
- **Geography**: a match in approved location facts. "Europe" expands to the European countries and their main startup cities.
- **Stage**: matched only when a source states it. It is never inferred from team size, company age or accelerator.
- **Exclusions**: checked against every approved fact. A match flags the brief and doesn't hide it.

### AI is optional and never approves anything

- **Fetch details** reads a page's title, publication date and meta description. The description becomes a draft fact.
- **Draft with Claude** (only when `ANTHROPIC_API_KEY` is set) asks Claude for draft facts. Each draft must quote the source word for word. Drafts whose quote isn't in the page text are thrown away automatically. The rest wait for a person to approve or reject them.
- Drafts count for nothing in the brief, the thesis check or the export until someone approves them.

## The five example briefs

`npm run db:seed`, or the button on an empty queue, loads five real companies. They were researched by hand on 7 Nov 2026 from public pages: Y Combinator's company directory, each company's website, and Companies House for the two UK entities.

| Company | Where | Signal | Verified against a primary record |
| --- | --- | --- | --- |
| Squid | London | YC Winter 2026; says it is "Live with National Grid DSO" | Squid Labs Ltd (16925657): incorporation date, registered office, directors match YC's founders |
| NODI Energy | London | YC Spring 2025 | PowerMatrix Technology Limited (16411726): the website names the number; registered office is in Mildenhall, not London |
| Servo7 | Amsterdam | BTS Logistics partnership, 7 Sep 2026; YC Winter 2026 | YC batch only. Customer names are the company's claim |
| Stillwind | Zürich | Stillwind Builder launch, 30 Jun 2026; YC Winter 2025 | YC batch only. Two earlier names (P2P Industries, Augento) |
| Macadamia | Ghent | YC Winter 2025 | YC batch only. The operator named on the site is Macadamia Labs Inc. |

They load as **drafts** with verbatim quotes, so a person checks each one against its page before any brief is shown. The research didn't:

- record funding amounts, rounds or valuations, because no page states one;
- scrape LinkedIn or X;
- copy directors' dates of birth;
- check the Dutch, Swiss or Belgian registers. Those facts are marked as claims, with a note.

These companies all come from one accelerator's public directory, so London operators may already know them. That is the first thing the operator test measures. The next five should come from sources that are less watched.

## Success test

Every brief has an **Operator test** panel. Record whether each operator already knew the company, whether it is relevant to their fund, and whether it is worth investigating. `/export` adds up the answers across the five briefs and three operators. Don't expand the tool until those answers say the companies are unfamiliar, relevant and worth a look.

## Run it

```bash
npm install
```

```bash
npm run db:seed
```

```bash
npm run dev
```

Open http://localhost:3000. Data is stored in `data/sourcebook.db`, which git ignores.

```bash
npm test
```

```bash
npm run build && npm start
```

### Hosting on Vercel

Vercel's filesystem doesn't persist between requests, so use a durable libSQL database such as Turso. The code is the same; only the environment changes:

```
DATABASE_URL=libsql://<your-db>.turso.io
DATABASE_AUTH_TOKEN=<token>
ANTHROPIC_API_KEY=<optional>
X_BEARER_TOKEN=<optional, for X search>
```

X API reads are paid under X's developer terms. Each "Run" is one recent-search request of up to 25 posts, and runs only when you press it.

The schema is created on first request. A hosted instance has no login, so put it behind Vercel's deployment protection or another access gate before you store fund notes in it. Page fetches refuse private and loopback addresses and check every redirect.

## What is open and what stays private

The code is MIT-licensed. Your thesis, decisions, notes and operator answers stay in your own database, and `data/*.db` is git-ignored. Don't commit private fund notes or restricted datasets.

## Later, not now

X search already runs through the official API. Other discovery will come only through permitted feeds or authorised APIs, for example the Companies House API with a key, or accelerator feeds that allow reuse. Next steps for X: scheduled runs of saved searches, and `from:` lists of founders you already follow. Each would add links to the same intake, so they get the same duplicate check and the same human approval.

## Stack

Next.js 16 (App Router, server actions), TypeScript, libSQL/SQLite, Vitest. Optional: `@anthropic-ai/sdk` with structured outputs.
