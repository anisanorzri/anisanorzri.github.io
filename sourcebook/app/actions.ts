"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { findCompanyMatches, findSourceDuplicates, type CompanyMatch } from "@/lib/dedupe";
import { aiDrafts, fetchPage, metadataDrafts, quoteAppearsIn } from "@/lib/extract";
import * as repo from "@/lib/repo";
import { loadSeed } from "@/lib/seed";
import { FACT_FIELDS, PROVENANCE, REVIEW_STATUSES, SOURCE_KINDS, type FactField, type KeywordGroup, type Provenance, type ReviewStatus, type SourceKind } from "@/lib/types";
import { normalizeUrl, parseUrl } from "@/lib/url";

const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const id = (fd: FormData, k: string) => {
  const n = Number(fd.get(k));
  if (!Number.isInteger(n) || n <= 0) throw new Error(`Missing ${k}`);
  return n;
};
const isDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);
const oneOf = <T extends string>(v: string, allowed: Record<T, unknown>, fallback: T): T => (v in allowed ? (v as T) : fallback);

function refresh(companyId?: number) {
  revalidatePath("/", "layout");
  if (companyId) revalidatePath(`/companies/${companyId}`);
}

// ---------- Thesis

function parseGroups(text: string): KeywordGroup[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, rest] = line.includes(":") ? [line.slice(0, line.indexOf(":")), line.slice(line.indexOf(":") + 1)] : [line, line];
      return { label: label.trim(), keywords: rest.split(",").map((k) => k.trim()).filter(Boolean) };
    })
    .filter((g) => g.label && g.keywords.length);
}
const lines = (text: string) => text.split(/[\n,]/).map((l) => l.trim()).filter(Boolean);

export async function saveThesisAction(fd: FormData) {
  await repo.saveThesis({
    name: s(fd, "name") || "Untitled thesis",
    sectors: parseGroups(s(fd, "sectors")),
    geographies: lines(s(fd, "geographies")),
    stages: lines(s(fd, "stages")),
    exclusions: parseGroups(s(fd, "exclusions")),
    notes: s(fd, "notes"),
  });
  refresh();
  redirect("/thesis?saved=1");
}

// ---------- Link intake

export interface IntakeState {
  error?: string;
  sourceDuplicates?: { companyId: number; companyName: string }[];
  companyMatches?: CompanyMatch[];
  values?: Record<string, string>;
}

export async function intakeAction(_prev: IntakeState, fd: FormData): Promise<IntakeState> {
  const values = Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === "string")) as Record<string, string>;
  const url = s(fd, "url");
  if (!parseUrl(url)) return { error: "Paste the full web address of the post or page.", values };
  const kind = oneOf<SourceKind>(s(fd, "kind"), SOURCE_KINDS, "other");
  const publishedOn = s(fd, "publishedOn");
  if (publishedOn && !isDate(publishedOn)) return { error: "Use the date picker for the publication date, or leave it empty if the page has none.", values };

  const companies = await repo.listCompanies();
  const sources = await repo.listSources();
  const target = s(fd, "companyId");
  const confirmed = s(fd, "confirmDuplicate") === "yes";

  // 1. The same link already captured?
  const dups = findSourceDuplicates(url, sources);
  if (dups.length && !confirmed) {
    const byId = new Map(companies.map((c) => [c.id, c.name]));
    return {
      sourceDuplicates: [...new Set(dups.map((d) => d.companyId))].map((cid) => ({ companyId: cid, companyName: byId.get(cid) ?? "Unknown" })),
      values,
    };
  }

  let companyId: number;
  if (target && target !== "new") {
    companyId = Number(target);
    if (!companies.some((c) => c.id === companyId)) return { error: "That company is no longer in the workspace.", values };
    if (dups.some((d) => d.companyId === companyId)) return { error: "This link is already attached to that company.", values };
  } else {
    const name = s(fd, "companyName");
    if (!name) return { error: "Name the company the link is about, or pick one already in the workspace.", values };
    const website = s(fd, "companyWebsite");
    if (website && !parseUrl(website)) return { error: "The company website is not a web address.", values };
    // 2. A company that may already be here under another spelling?
    const matches = findCompanyMatches({ name, website, sourceUrl: url }, companies);
    if (matches.length && s(fd, "confirmNewCompany") !== "yes") return { companyMatches: matches, values };
    companyId = await repo.createCompany({ name, website: website || null });
  }

  await repo.addSource({
    companyId,
    url,
    kind,
    title: s(fd, "title"),
    author: s(fd, "author"),
    publishedOn: publishedOn || null,
    excerpt: s(fd, "excerpt"),
    notes: s(fd, "notes"),
  });
  refresh(companyId);
  redirect(`/companies/${companyId}?added=source`);
}

/** Live check while typing. Read-only. */
export async function checkLinkAction(url: string) {
  const normalized = normalizeUrl(url);
  if (!normalized) return { normalized: null, duplicates: [] as { companyId: number; companyName: string }[] };
  const [sources, companies] = await Promise.all([repo.listSources(), repo.listCompanies()]);
  const byId = new Map(companies.map((c) => [c.id, c.name]));
  const dups = findSourceDuplicates(url, sources);
  return {
    normalized,
    duplicates: [...new Set(dups.map((d) => d.companyId))].map((cid) => ({ companyId: cid, companyName: byId.get(cid) ?? "Unknown" })),
  };
}

export async function addSourceAction(fd: FormData) {
  const companyId = id(fd, "companyId");
  const url = s(fd, "url");
  if (!parseUrl(url)) redirect(`/companies/${companyId}?error=url#sources`);
  const publishedOn = s(fd, "publishedOn");
  await repo.addSource({
    companyId,
    url,
    kind: oneOf<SourceKind>(s(fd, "kind"), SOURCE_KINDS, "other"),
    title: s(fd, "title"),
    author: s(fd, "author"),
    publishedOn: isDate(publishedOn) ? publishedOn : null,
    excerpt: s(fd, "excerpt"),
  });
  refresh(companyId);
  redirect(`/companies/${companyId}#sources`);
}

export async function deleteSourceAction(fd: FormData) {
  const companyId = id(fd, "companyId");
  await repo.deleteSource(id(fd, "sourceId"));
  refresh(companyId);
}

// ---------- Drafting facts from a source

async function addDraftsUnique(companyId: number, sourceId: number, drafts: { field: FactField; value: string; quote: string; provenance: Provenance; note: string }[], origin: "page_metadata" | "ai_draft") {
  const existing = await repo.listFacts(companyId);
  let added = 0;
  for (const d of drafts) {
    if (existing.some((f) => f.sourceId === sourceId && f.field === d.field && (f.value === d.value || f.quote === d.quote))) continue;
    await repo.addFact({ companyId, sourceId, ...d, status: "draft", origin });
    added++;
  }
  return added;
}

export async function fetchSourceAction(fd: FormData) {
  const companyId = id(fd, "companyId");
  const source = await repo.getSource(id(fd, "sourceId"));
  if (!source) return;
  let msg: string;
  try {
    const page = await fetchPage(source.url);
    await repo.updateSourceMeta(source.id, {
      title: source.title || page.title,
      publishedOn: source.publishedOn ?? page.publishedOn,
    });
    const added = await addDraftsUnique(companyId, source.id, metadataDrafts(page, source.kind), "page_metadata");
    msg = `fetched:${added}:${page.publishedOn ? "dated" : "undated"}`;
  } catch (e) {
    msg = `fetchfail:${encodeURIComponent((e as Error).message).slice(0, 200)}`;
  }
  refresh(companyId);
  redirect(`/companies/${companyId}?msg=${msg}#sources`);
}

export async function aiDraftAction(fd: FormData) {
  const companyId = id(fd, "companyId");
  const source = await repo.getSource(id(fd, "sourceId"));
  const company = await repo.getCompany(companyId);
  if (!source || !company) return;
  let msg: string;
  try {
    let text = source.excerpt;
    try {
      const page = await fetchPage(source.url);
      text = [source.excerpt, page.title, page.description, page.text].filter(Boolean).join("\n\n");
    } catch {
      // X and some sites refuse automated reads; the pasted excerpt is then the only text.
    }
    if (text.trim().length < 40) throw new Error("No readable text. Paste the post's text into the source excerpt first.");
    const { drafts, dropped } = await aiDrafts({ companyName: company.name, kind: source.kind, url: source.url, text });
    const added = await addDraftsUnique(companyId, source.id, drafts, "ai_draft");
    msg = `ai:${added}:${dropped}`;
  } catch (e) {
    msg = `aifail:${encodeURIComponent((e as Error).message).slice(0, 200)}`;
  }
  refresh(companyId);
  redirect(`/companies/${companyId}?msg=${msg}#drafts`);
}

// ---------- Facts

export async function addFactAction(fd: FormData) {
  const companyId = id(fd, "companyId");
  const sourceRaw = s(fd, "sourceId");
  const sourceId = sourceRaw ? Number(sourceRaw) : null;
  const value = s(fd, "value");
  if (!value) redirect(`/companies/${companyId}?error=fact#add-fact`);
  const quote = s(fd, "quote");
  let note = s(fd, "note");
  if (sourceId && quote) {
    const src = await repo.getSource(sourceId);
    if (src?.excerpt && !quoteAppearsIn(quote, src.excerpt) && !note) note = "Quote not found in the saved excerpt. Check it against the live page.";
  }
  await repo.addFact({
    companyId,
    sourceId,
    field: oneOf<FactField>(s(fd, "field"), FACT_FIELDS, "other"),
    value,
    quote,
    provenance: oneOf<Provenance>(s(fd, "provenance"), PROVENANCE, "company_claim"),
    // A fact typed by the reviewer with a source is approved by that act; without a source it stays a draft.
    status: sourceId ? "approved" : "draft",
    origin: "manual",
    note,
  });
  refresh(companyId);
  redirect(`/companies/${companyId}#brief`);
}

export async function decideFactAction(fd: FormData) {
  const companyId = id(fd, "companyId");
  const decision = s(fd, "decision") === "reject" ? "rejected" : "approved";
  const prov = s(fd, "provenance");
  await repo.decideFact(id(fd, "factId"), decision, prov in PROVENANCE ? (prov as Provenance) : undefined);
  refresh(companyId);
}

export async function approveSourceDraftsAction(fd: FormData) {
  const companyId = id(fd, "companyId");
  const sourceId = id(fd, "sourceId");
  const facts = await repo.listFacts(companyId);
  for (const f of facts) if (f.sourceId === sourceId && f.status === "draft") await repo.decideFact(f.id, "approved");
  refresh(companyId);
}

export async function reopenFactAction(fd: FormData) {
  const companyId = id(fd, "companyId");
  await repo.reopenFact(id(fd, "factId"));
  refresh(companyId);
}

// ---------- Review

export async function reviewAction(fd: FormData) {
  const companyId = id(fd, "companyId");
  await repo.setReview(companyId, oneOf<ReviewStatus>(s(fd, "status"), REVIEW_STATUSES, "new"), s(fd, "note"), s(fd, "nextQuestion"));
  refresh(companyId);
  redirect(`/companies/${companyId}?msg=saved#review`);
}

export async function updateCompanyAction(fd: FormData) {
  const companyId = id(fd, "companyId");
  const name = s(fd, "name");
  const website = s(fd, "website");
  if (name) await repo.updateCompanyBasics(companyId, { name, website: website && parseUrl(website) ? website : null });
  refresh(companyId);
}

export async function deleteCompanyAction(fd: FormData) {
  await repo.deleteCompany(id(fd, "companyId"));
  refresh();
  redirect("/");
}

export async function feedbackAction(fd: FormData) {
  const companyId = id(fd, "companyId");
  const operator = s(fd, "operator");
  const yesNo = (v: string) => (v === "yes" ? "yes" : "no");
  if (!operator) redirect(`/companies/${companyId}?error=operator#operator-test`);
  await repo.addFeedback({
    companyId,
    operator,
    familiar: yesNo(s(fd, "familiar")),
    relevant: (["yes", "partly", "no"].includes(s(fd, "relevant")) ? s(fd, "relevant") : "no") as "yes" | "partly" | "no",
    worthInvestigating: yesNo(s(fd, "worth")),
    comment: s(fd, "comment"),
  });
  refresh(companyId);
  redirect(`/companies/${companyId}?msg=feedback#operator-test`);
}

export async function loadSeedAction() {
  await loadSeed();
  refresh();
  redirect("/");
}
