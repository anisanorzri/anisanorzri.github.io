// Checks a finished Grok task and turns the companies that pass into radar rows.
// Usage: npx tsx radar/grok/check-result.ts <task.json> <rows-out-dir> <yyyy-mm-dd>
// task.json: the bridge's get_task response (the parsed task object).
// Every X post is re-read through X's own oEmbed endpoint; quotes are checked on the live pages.
import fs from "node:fs";
import { readPost } from "../../lib/x";
import { normalizeForQuote, htmlToText } from "../../lib/extract";
import { classify, fit } from "../rules";

const [, , taskFile, outDir, today] = process.argv;
const task = JSON.parse(fs.readFileSync(taskFile, "utf8"));
const companies: any[] = task.result?.companies ?? (task.result?.company ? [task.result.company] : []);
const FUND = /\b(is raising|are raising|raising (a|its)|plans? to raise|open to invest|seeking (investment|funding)|looking for investors)\b/i;

async function page(url: string) {
  try {
    const r = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (Sourcebook research check)" }, signal: AbortSignal.timeout(20000) });
    const h = await r.text();
    return r.ok ? htmlToText(h) + " " + h : null;
  } catch { return null; }
}
const slug = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const report: any[] = [];
  for (const c of companies) {
    const why: string[] = [];
    const checks: string[] = [];
    let post: any = null;
    try { post = await readPost(c.x_post?.url ?? ""); } catch (e) { why.push(`X post could not be confirmed: ${(e as Error).message}`); }
    if (post) {
      checks.push("Post read from X");
      if (c.x_post.posted_date && post.date !== c.x_post.posted_date) why.push(`post date mismatch (X: ${post.date}, Grok: ${c.x_post.posted_date})`);
      const q = String(c.x_post.quote ?? "").split("\n")[0];
      if (q && !normalizeForQuote(post.text).includes(normalizeForQuote(q).slice(0, 80))) why.push("post quote not found in the post");
    }
    if (FUND.test(JSON.stringify(c))) why.push("contains fundraising inference");
    let siteOk = false;
    if (c.website) { const p = await page(c.website); siteOk = !!p; checks.push(p ? "Company website checked" : "Company website not reachable"); }
    else checks.push("No company website given");
    let quotesOk = 0, quotesTried = 0;
    for (const cl of c.company_claims ?? []) {
      if (!cl.quote || !cl.source_url || /x\.com/.test(cl.source_url)) continue;
      quotesTried++; const p = await page(cl.source_url);
      if (p && normalizeForQuote(p).includes(normalizeForQuote(String(cl.quote).split("\n")[0]).slice(0, 80))) quotesOk++;
    }
    if (quotesTried && quotesOk < quotesTried) why.push(`${quotesTried - quotesOk} of ${quotesTried} claim quotes not found on their pages`);
    const verifiedFromCompany = (c.verified_facts ?? []).filter((f: any) => c.website && f.source_url?.includes(new URL(c.website).hostname.replace(/^www\./, "")));
    if (verifiedFromCompany.length) why.push("a 'verified' fact cites the company's own site");
    if ((c.verified_facts ?? []).length) checks.push("Company register or independent source cited by Grok (not re-checked)");

    const pass = post && !why.some((w) => /could not be confirmed|fundraising|verified' fact/.test(w));
    report.push({ name: c.name, pass, why });
    if (!pass) continue;
    const one = c.product_description?.value ?? "";
    const sector = classify(one);
    const id = "x-" + slug(c.name);
    const row = {
      name: c.name, website: c.website ?? "", oneLiner: one, sector,
      city: c.country?.city ?? "", country: c.country?.value ?? "",
      channel: "X: found by Grok", batch: "",
      signal: (c.x_post.quote || post.text).split("\n")[0].slice(0, 220), signalDate: post.date, signalUrl: post.url,
      source: `Post by @${post.handle}`, sourceUrl: post.url,
      companyX: c.x_post.author_role === "company" ? `https://x.com/${post.handle}` : "", founders: [],
      teamSize: null, founded: null, stage: "", stageBy: "",
      checks: [...checks, "Researched by Grok Bot via Sourcebook bridge"],
      ...fit(`${one} ${post.text}`, sector),
      unknowns: c.unknowns ?? [], companyClaims: c.company_claims ?? [], verifiedFacts: c.verified_facts ?? [],
      grokTaskId: task.task_id, addedOn: today,
    };
    if (!siteOk && c.website) row.checks.push("Website could not be opened during the check");
    fs.writeFileSync(`${outDir}/${id}.json`, JSON.stringify(row));
  }
  console.log(JSON.stringify(report, null, 1));
})();
