// Builds this week's Grok research task (JSON-RPC body for the bridge's create_task).
// Usage: node radar/grok/make-task.cjs <names.txt> <out.json> <yyyy-mm-dd>
// names.txt: one company name per line, already on the radar (Grok must not pick them).
const fs = require("fs");
const [, , namesFile, outFile, today] = process.argv;
const avoid = fs.readFileSync(namesFile, "utf8").split("\n").map((s) => s.trim()).filter(Boolean);

const instructions = `Find up to 6 NEW European startups from public posts on X made in the last 14 days, and return evidence for each. Read-only task.

WHAT TO FIND
- Startups headquartered in Europe (UK included), ideally pre-seed or seed, in: energy and the grid, industrial and engineering tools, robotics, or logistics and supply chain.
- Each must have a public post on X from the company, a founder, an investor or a news account in the last 14 days, which you can open directly without logging in.
- Prefer founders' own posts (launches, first customers, "building in public", hiring) over news accounts.
- Do NOT pick any company already on this list: ${avoid.join(", ")}.

HOW TO RESEARCH
- Use only public pages you can open directly without logging in: X posts and profiles, the company website, public company registers (e.g. UK Companies House), and reputable press.
- If an X post will not open, skip it. Do not use mirrors, readers, syndication endpoints or any third-party copy of X.
- Do not log in, like, reply, repost, follow, message, post, sign up, fill in forms or contact anyone. Do not use any other connector. Do not upload attachments.
- Copy quotes exactly as written on the page.

STRICT RULES
- Never state or imply that a company is raising, plans to raise, or is open to investment. Mention a round only if a source explicitly reports a completed one, and then only as a claim with that source and who posted it.
- Never guess stage, revenue, customers or traction.
- Keep company_claims (what the company or founders say) apart from verified_facts (confirmed by a source the company does not write: a company register, an accelerator listing, a named customer announcement, independent press). Say what each fact was verified against.
- Anything you could not find goes in unknowns.

RETURN (complete_task result)
- summary: one line per company.
- evidence: one item per source used, each with url, title, observed_at (ISO date-time you viewed it), claim, excerpt (exact quote).
- limitations: anything you could not open or verify.
- companies: [ {
    "name": "", "website": "",
    "country": { "value": "", "city": "", "source_url": "", "basis": "company_claim | verified" },
    "product_description": { "value": "", "source_url": "", "basis": "company_claim | verified" },
    "sector": "energy | industrial | robotics | logistics | other",
    "x_post": { "url": "", "posted_date": "YYYY-MM-DD", "author_handle": "", "author_role": "company | founder | investor | news | other", "quote": "" },
    "other_evidence_urls": [""],
    "company_claims": [ { "statement": "", "source_url": "", "quote": "" } ],
    "verified_facts": [ { "statement": "", "source_url": "", "verified_against": "" } ],
    "unknowns": [""],
    "verification_date": "YYYY-MM-DD"
  } ]
If you find none that meet every rule, return an empty companies list and say why in limitations.`;

const acceptance = `- 0 to 6 real companies, none on the do-not-pick list.
- Each x_post.url is a real x.com/<handle>/status/<id> link posted in the last 14 days, opened directly.
- Every statement has a source_url; every evidence item has an exact excerpt.
- Company claims and verified facts are separate; nothing marked verified rests only on the company's own words.
- No statement or implication about fundraising beyond a cited, completed round.
- Unknowns listed. No logins, posts, messages, follows or other actions. No mirrors of X.`;

fs.writeFileSync(outFile, JSON.stringify({
  jsonrpc: "2.0", id: 1, method: "tools/call",
  params: { name: "create_task", arguments: {
    task_type: "research_evidence",
    title: `Radar: new European startups from X (week of ${today})`,
    instructions, acceptance_criteria: acceptance, priority: 50,
    idempotency_key: `radar-weekly-${today}`,
  } },
}));
console.log(`task for ${today}: ${instructions.length} chars, ${avoid.length} names excluded`);
