import fs from "node:fs";
import { X_SEED_COMPANIES } from "../lib/seed-x";
const R = process.env.RADAR_DIR || "radar/work/";
const yc = JSON.parse(fs.readFileSync(R + "yc-eu.json", "utf8"));
const det = JSON.parse(fs.readFileSync(R + "yc-detail.json", "utf8"));
const posts = Object.fromEntries(JSON.parse(fs.readFileSync(R + "xposts3.json", "utf8")).map((p: any) => [p.id, p]));
const CC: Record<string, string> = { GB: "United Kingdom", DE: "Germany", FR: "France", NL: "Netherlands", BE: "Belgium", CH: "Switzerland", SE: "Sweden", NO: "Norway", DK: "Denmark", FI: "Finland", ES: "Spain", PT: "Portugal", IT: "Italy", AT: "Austria", IE: "Ireland", PL: "Poland", EE: "Estonia", CZ: "Czechia", GR: "Greece", LT: "Lithuania", LV: "Latvia", RO: "Romania", HU: "Hungary", UA: "Ukraine", LU: "Luxembourg", IS: "Iceland" };

import { classify, sectorOf, fit } from "./rules";

const slug = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
const rows: any[] = [];

for (const c of yc) {
  const d = det[c.slug];
  const country = CC[d.country] ?? (c.loc.split(",").pop() || "").trim();
  const city = (d.location || "").split(",")[0].trim() || d.city || c.loc.split(",")[0];
  const text = `${c.one} ${(c.tags || []).join(" ")}`;
  const sector = sectorOf(c.one, c.industry, (c.tags || []).join(" "));
  const launch = d.launches?.[0];
  rows.push({
    id: "yc-" + c.slug,
    name: c.name,
    website: c.web || "",
    oneLiner: c.one,
    sector,
    city, country,
    channel: "Accelerator: YC",
    batch: c.batch,
    signal: launch ? `Launched on YC: “${launch.title}”` : `In Y Combinator's ${c.batch} batch`,
    signalDate: launch?.date ? String(launch.date).slice(0, 10) : null,
    signalUrl: launch?.url?.startsWith("http") ? launch.url : `https://www.ycombinator.com/companies/${c.slug}`,
    source: "Y Combinator company page",
    sourceUrl: `https://www.ycombinator.com/companies/${c.slug}`,
    companyX: d.twitter || "",
    founders: (d.founders || []).map((f: any) => ({ name: f.name, x: f.x || "" })),
    teamSize: c.team ?? null,
    founded: d.year ?? null,
    stage: "",
    stageBy: "",
    checks: ["Batch from YC's own listing", "Description written by the company"],
    ...fit(text, sector),
    addedOn: "2026-11-07",
  });
}

// X-sourced: the nine briefed companies
for (const c of X_SEED_COMPANIES) {
  const post = c.sources.find((s) => s.kind === "x_post")!;
  const f = (k: string) => c.facts.find((x) => x.field === k);
  const loc = f("location")?.value ?? "";
  const product = f("product")?.value ?? "";
  const sector = sectorOf(product);
  rows.push({
    id: "x-" + slug(c.name),
    name: c.name, website: c.website, oneLiner: product, sector,
    city: loc.includes(",") ? loc.split(",")[0] : "", country: loc.includes(",") ? loc.split(",").pop()!.trim() : loc,
    channel: c.sources.some((s) => s.key === "tfn") ? "X: investor batch post" : "X: funding post",
    batch: "",
    signal: f("signal")?.value ?? "", signalDate: post.publishedOn, signalUrl: post.url,
    source: `Post by ${post.author}`, sourceUrl: post.url,
    companyX: "", founders: [], teamSize: null, founded: null,
    stage: f("stage")?.value.split(",")[0].replace(/\.$/, "") ?? "", stageBy: post.author,
    checks: ["Post read from X", "Company website checked", ...(c.sources.some((s) => s.kind === "registry") ? ["Company register checked"] : [])],
    ...fit(`${product} ${f("customer")?.value ?? ""}`, sector),
    nextQuestion: c.nextQuestion,
    addedOn: "2026-11-07",
  });
}

// X-sourced: funding / stealth posts, read from X; company sites not yet checked
const extra: [string, string, string, string, string, string, string, string][] = [
  // id, name, website, oneLiner (from post), city, country, stage, postId
  ["motion", "Motion", "", "Humanoid robots for European factories, offered as a service", "Brussels", "Belgium", "Pre-seed", "2093237785008181751"],
  ["inxm", "INXM", "", "AI process execution engine for enterprise and Mittelstand operations", "Berlin", "Germany", "Pre-seed", "2062053105794273444"],
  ["calibre", "Calibre", "", "Health navigation (Causal Health Navigation)", "London", "United Kingdom", "Pre-seed", "2046870845780582816"],
  ["foundational", "Foundational", "", "Came out of stealth with an £8.2M pre-seed", "", "", "Pre-seed", "2105553417464623231"],
  ["opereit", "Opereit", "https://www.opereit.com", "AI that automates logistics cost recovery", "", "Spain", "", "2062272774593261805"],
  ["atech", "Atech", "https://atech.dk", "AI platform for designing, prototyping and building physical products", "Copenhagen", "Denmark", "Pre-seed", "2048730359295054117"],
  ["companion-energy", "Companion.energy", "https://companion.energy", "Operating system for enterprise energy management", "", "", "Seed", "2063932505997312130"],
  ["granarium", "Granarium Technologies", "", "Energy storage without lithium: supercapacitors from a VTT spin-out", "", "Finland", "Pre-seed", "2064310743911035093"],
  ["reebuild", "reebuild", "", "AI back-office automation for construction and real estate", "Vienna", "Austria", "Seed", "2109904771976937847"],
  ["velatir", "Velatir", "", "Gives companies control over how AI is used", "", "Denmark", "Seed", "2090358875337662685"],
  ["clearops", "ClearOps", "", "AI after-sales platform for industrial OEMs", "Munich", "Germany", "Series A", "2057435129166049700"],
  ["finches", "Finches", "", "AI for agricultural procurement", "", "Germany", "Pre-seed", "2108076143974981645"],
];
for (const [id, name, web, one, city, country, stage, pid] of extra) {
  const p = posts[pid];
  if (!p) { console.error("missing post", pid); continue; }
  const sector = sectorOf(one);
  rows.push({
    id: "x-" + id, name, website: web, oneLiner: one, sector, city, country,
    channel: /stealth/i.test(p.text) ? "X: stealth exit" : "X: funding post",
    batch: "", signal: p.text.split("\n")[0].replace(/\s*(https:\/\/t\.co\/\S+|pic\.twitter\.com\/\S+)/g, "").slice(0, 220),
    signalDate: p.date, signalUrl: p.url, source: `Post by @${p.handle}`, sourceUrl: p.url,
    companyX: "", founders: [], teamSize: null, founded: null, stage, stageBy: stage ? `@${p.handle}` : "",
    checks: ["Post read from X", "Company website not yet checked"],
    ...fit(`${one} ${p.text}`, sector),
    addedOn: "2026-11-07",
  });
}
// de-duplicate by website domain / name
const seen = new Map<string, string>();
const byId = new Map(rows.map((r) => [r.id, r]));
const final = rows.filter((r) => { const k = (r.website.replace(/^https?:\/\/(www\.)?/, "").split("/")[0] || r.name).toLowerCase(); if (seen.has(k)) { const keep = byId.get(seen.get(k)!); keep.alsoSeen = [...(keep.alsoSeen || []), { signal: r.signal, signalDate: r.signalDate, signalUrl: r.signalUrl, source: r.source }]; if (!keep.stage && r.stage) { keep.stage = r.stage; keep.stageBy = r.stageBy; } keep.checks = [...new Set([...keep.checks, ...r.checks.filter((c: string) => !/not yet/.test(c))])]; console.error("merged", r.name, "into", keep.id); return false; } seen.set(k, r.id); return true; });
for (const r of final) { r.founders = (r.founders || []).map((f: any) => ({ ...f, x: f.x ? f.x.split("?")[0] : "" })); if (r.companyX) r.companyX = r.companyX.split("?")[0]; }
fs.writeFileSync(R + "rows.json", JSON.stringify(final, null, 1));
const cnt = (k: string) => Object.entries(final.reduce((a: any, r: any) => ((a[r[k]] = (a[r[k]] || 0) + 1), a), {})).sort((a: any, b: any) => b[1] - a[1]);
console.log(final.length, "rows"); console.log(cnt("thesis")); console.log(cnt("sector")); console.log(cnt("channel")); console.log(cnt("country").slice(0, 12));
console.log(final.filter((r) => r.thesis === "fits").map((r) => r.name + " [" + r.thesisReason + "]").join("\n"));
