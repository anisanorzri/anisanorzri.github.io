import type { Row } from "@libsql/client";
import { db } from "./db";
import { normalizeUrl, registrableDomain } from "./url";
import type {
  Company,
  Fact,
  FactField,
  FactOrigin,
  FactStatus,
  Feedback,
  Provenance,
  ReviewEvent,
  ReviewStatus,
  Source,
  SourceKind,
  Thesis,
} from "./types";

export const nowIso = () => new Date().toISOString();
export const today = () => new Date().toISOString().slice(0, 10);

const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));
const strOrNull = (v: unknown) => (v === null || v === undefined || v === "" ? null : String(v));

function toCompany(r: Row): Company {
  return {
    id: Number(r.id),
    name: str(r.name),
    website: strOrNull(r.website),
    domain: strOrNull(r.domain),
    status: str(r.status) as ReviewStatus,
    statusNote: str(r.status_note),
    nextQuestion: str(r.next_question),
    reviewedAt: strOrNull(r.reviewed_at),
    createdAt: str(r.created_at),
  };
}
function toSource(r: Row): Source {
  return {
    id: Number(r.id),
    companyId: Number(r.company_id),
    url: str(r.url),
    normalizedUrl: str(r.normalized_url),
    kind: str(r.kind) as SourceKind,
    title: str(r.title),
    author: str(r.author),
    publishedOn: strOrNull(r.published_on),
    capturedOn: str(r.captured_on),
    excerpt: str(r.excerpt),
    notes: str(r.notes),
  };
}
function toFact(r: Row): Fact {
  return {
    id: Number(r.id),
    companyId: Number(r.company_id),
    sourceId: r.source_id === null ? null : Number(r.source_id),
    field: str(r.field) as FactField,
    value: str(r.value),
    quote: str(r.quote),
    provenance: str(r.provenance) as Provenance,
    status: str(r.status) as FactStatus,
    origin: str(r.origin) as FactOrigin,
    note: str(r.note),
    createdAt: str(r.created_at),
    decidedAt: strOrNull(r.decided_at),
  };
}

// ---------- Thesis

export const DEFAULT_THESIS: Thesis = {
  name: "European B2B software for energy, industry and physical operations",
  sectors: [
    { label: "Grid and energy software", keywords: ["grid", "power", "electricity", "energy", "battery", "batteries", "data centers", "data centres"] },
    { label: "Industrial and engineering tools", keywords: ["engineering", "manufacturing", "PCB", "electronics", "CAD", "industrial", "KiCad", "Altium"] },
    { label: "Logistics automation", keywords: ["warehouse", "warehouses", "logistics", "container", "containers", "3PL", "3PLs", "unloading"] },
  ],
  geographies: ["United Kingdom", "Europe"],
  stages: ["pre-seed", "seed"],
  exclusions: [
    { label: "Defence", keywords: ["defence", "defense", "military", "weapons", "munitions"] },
    { label: "Crypto", keywords: ["crypto", "blockchain", "token", "web3"] },
    { label: "Consumer", keywords: ["consumer app", "D2C", "for consumers"] },
  ],
  notes: "Cheque size and ownership targets are private fund notes and are not stored here.",
  updatedAt: "",
};

export async function getThesis(): Promise<Thesis> {
  const c = await db();
  const r = (await c.execute("SELECT * FROM thesis WHERE id = 1")).rows[0];
  if (!r) return DEFAULT_THESIS;
  return {
    name: str(r.name),
    sectors: JSON.parse(str(r.sectors)),
    geographies: JSON.parse(str(r.geographies)),
    stages: JSON.parse(str(r.stages)),
    exclusions: JSON.parse(str(r.exclusions)),
    notes: str(r.notes),
    updatedAt: str(r.updated_at),
  };
}

export async function hasSavedThesis() {
  const c = await db();
  return (await c.execute("SELECT 1 FROM thesis WHERE id = 1")).rows.length > 0;
}

export async function saveThesis(t: Omit<Thesis, "updatedAt">) {
  const c = await db();
  await c.execute({
    sql: `INSERT INTO thesis (id, name, sectors, geographies, stages, exclusions, notes, updated_at)
          VALUES (1, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET name=excluded.name, sectors=excluded.sectors, geographies=excluded.geographies,
          stages=excluded.stages, exclusions=excluded.exclusions, notes=excluded.notes, updated_at=excluded.updated_at`,
    args: [t.name, JSON.stringify(t.sectors), JSON.stringify(t.geographies), JSON.stringify(t.stages), JSON.stringify(t.exclusions), t.notes, nowIso()],
  });
}

// ---------- Companies

export async function listCompanies(): Promise<Company[]> {
  const c = await db();
  return (await c.execute("SELECT * FROM companies ORDER BY created_at DESC, id DESC")).rows.map(toCompany);
}

export async function getCompany(id: number): Promise<Company | null> {
  const c = await db();
  const r = (await c.execute({ sql: "SELECT * FROM companies WHERE id = ?", args: [id] })).rows[0];
  return r ? toCompany(r) : null;
}

export async function createCompany(input: { name: string; website?: string | null }): Promise<number> {
  const c = await db();
  const website = input.website?.trim() || null;
  const domain = website ? registrableDomain(website) : null;
  const res = await c.execute({
    sql: "INSERT INTO companies (name, website, domain, created_at) VALUES (?, ?, ?, ?)",
    args: [input.name.trim(), website, domain, nowIso()],
  });
  return Number(res.lastInsertRowid);
}

export async function updateCompanyBasics(id: number, input: { name: string; website: string | null }) {
  const c = await db();
  const website = input.website?.trim() || null;
  await c.execute({
    sql: "UPDATE companies SET name = ?, website = ?, domain = ? WHERE id = ?",
    args: [input.name.trim(), website, website ? registrableDomain(website) : null, id],
  });
}

export async function setReview(id: number, status: ReviewStatus, note: string, nextQuestion: string) {
  const c = await db();
  const before = await getCompany(id);
  if (!before) return;
  await c.batch(
    [
      {
        sql: "UPDATE companies SET status = ?, status_note = ?, next_question = ?, reviewed_at = ? WHERE id = ?",
        args: [status, note, nextQuestion, nowIso(), id],
      },
      ...(before.status !== status || before.statusNote !== note
        ? [{ sql: "INSERT INTO review_events (company_id, from_status, to_status, note, at) VALUES (?, ?, ?, ?, ?)", args: [id, before.status, status, note, nowIso()] }]
        : []),
    ],
    "write",
  );
}

export async function deleteCompany(id: number) {
  const c = await db();
  await c.batch(
    [
      { sql: "DELETE FROM facts WHERE company_id = ?", args: [id] },
      { sql: "DELETE FROM sources WHERE company_id = ?", args: [id] },
      { sql: "DELETE FROM review_events WHERE company_id = ?", args: [id] },
      { sql: "DELETE FROM feedback WHERE company_id = ?", args: [id] },
      { sql: "DELETE FROM companies WHERE id = ?", args: [id] },
    ],
    "write",
  );
}

// ---------- Sources

export async function listSources(companyId?: number): Promise<Source[]> {
  const c = await db();
  const rs = companyId
    ? await c.execute({ sql: "SELECT * FROM sources WHERE company_id = ? ORDER BY COALESCE(published_on, captured_on) DESC, id DESC", args: [companyId] })
    : await c.execute("SELECT * FROM sources ORDER BY id DESC");
  return rs.rows.map(toSource);
}

export async function getSource(id: number): Promise<Source | null> {
  const c = await db();
  const r = (await c.execute({ sql: "SELECT * FROM sources WHERE id = ?", args: [id] })).rows[0];
  return r ? toSource(r) : null;
}

export async function addSource(input: {
  companyId: number;
  url: string;
  kind: SourceKind;
  title?: string;
  author?: string;
  publishedOn?: string | null;
  capturedOn?: string;
  excerpt?: string;
  notes?: string;
}): Promise<number> {
  const normalized = normalizeUrl(input.url);
  if (!normalized) throw new Error("That is not a web address.");
  const c = await db();
  const existing = (
    await c.execute({ sql: "SELECT id FROM sources WHERE company_id = ? AND normalized_url = ?", args: [input.companyId, normalized] })
  ).rows[0];
  if (existing) return Number(existing.id);
  const res = await c.execute({
    sql: `INSERT INTO sources (company_id, url, normalized_url, kind, title, author, published_on, captured_on, excerpt, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      input.companyId,
      input.url.trim(),
      normalized,
      input.kind,
      input.title ?? "",
      input.author ?? "",
      input.publishedOn || null,
      input.capturedOn || today(),
      input.excerpt ?? "",
      input.notes ?? "",
    ],
  });
  return Number(res.lastInsertRowid);
}

export async function updateSourceMeta(id: number, patch: { title?: string; publishedOn?: string | null; excerpt?: string }) {
  const c = await db();
  const s = await getSource(id);
  if (!s) return;
  await c.execute({
    sql: "UPDATE sources SET title = ?, published_on = ?, excerpt = ? WHERE id = ?",
    args: [patch.title ?? s.title, patch.publishedOn === undefined ? s.publishedOn : patch.publishedOn, patch.excerpt ?? s.excerpt, id],
  });
}

export async function deleteSource(id: number) {
  const c = await db();
  await c.batch(
    [
      { sql: "UPDATE facts SET source_id = NULL WHERE source_id = ?", args: [id] },
      { sql: "DELETE FROM sources WHERE id = ?", args: [id] },
    ],
    "write",
  );
}

// ---------- Facts

export async function listFacts(companyId?: number): Promise<Fact[]> {
  const c = await db();
  const rs = companyId
    ? await c.execute({ sql: "SELECT * FROM facts WHERE company_id = ? ORDER BY id", args: [companyId] })
    : await c.execute("SELECT * FROM facts ORDER BY id");
  return rs.rows.map(toFact);
}

export async function addFact(input: {
  companyId: number;
  sourceId: number | null;
  field: FactField;
  value: string;
  quote?: string;
  provenance: Provenance;
  status?: FactStatus;
  origin?: FactOrigin;
  note?: string;
}): Promise<number> {
  const c = await db();
  const status = input.status ?? "draft";
  const res = await c.execute({
    sql: `INSERT INTO facts (company_id, source_id, field, value, quote, provenance, status, origin, note, created_at, decided_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      input.companyId,
      input.sourceId,
      input.field,
      input.value.trim(),
      (input.quote ?? "").trim(),
      input.provenance,
      status,
      input.origin ?? "manual",
      input.note ?? "",
      nowIso(),
      status === "draft" ? null : nowIso(),
    ],
  });
  return Number(res.lastInsertRowid);
}

export async function decideFact(id: number, status: "approved" | "rejected", provenance?: Provenance) {
  const c = await db();
  await c.execute({
    sql: "UPDATE facts SET status = ?, provenance = COALESCE(?, provenance), decided_at = ? WHERE id = ?",
    args: [status, provenance ?? null, nowIso(), id],
  });
}

export async function reopenFact(id: number) {
  const c = await db();
  await c.execute({ sql: "UPDATE facts SET status = 'draft', decided_at = NULL WHERE id = ?", args: [id] });
}

// ---------- Review history and operator feedback

export async function listReviewEvents(companyId: number): Promise<ReviewEvent[]> {
  const c = await db();
  return (await c.execute({ sql: "SELECT * FROM review_events WHERE company_id = ? ORDER BY at DESC, id DESC", args: [companyId] })).rows.map(
    (r) => ({
      id: Number(r.id),
      companyId: Number(r.company_id),
      fromStatus: strOrNull(r.from_status) as ReviewStatus | null,
      toStatus: str(r.to_status) as ReviewStatus,
      note: str(r.note),
      at: str(r.at),
    }),
  );
}

export async function listFeedback(companyId?: number): Promise<Feedback[]> {
  const c = await db();
  const rs = companyId
    ? await c.execute({ sql: "SELECT * FROM feedback WHERE company_id = ? ORDER BY at DESC", args: [companyId] })
    : await c.execute("SELECT * FROM feedback ORDER BY at DESC");
  return rs.rows.map((r) => ({
    id: Number(r.id),
    companyId: Number(r.company_id),
    operator: str(r.operator),
    familiar: str(r.familiar) as Feedback["familiar"],
    relevant: str(r.relevant) as Feedback["relevant"],
    worthInvestigating: str(r.worth_investigating) as Feedback["worthInvestigating"],
    comment: str(r.comment),
    at: str(r.at),
  }));
}

export async function addFeedback(f: Omit<Feedback, "id" | "at">) {
  const c = await db();
  await c.execute({
    sql: "INSERT INTO feedback (company_id, operator, familiar, relevant, worth_investigating, comment, at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    args: [f.companyId, f.operator.trim(), f.familiar, f.relevant, f.worthInvestigating, f.comment.trim(), nowIso()],
  });
}

export async function setNextQuestion(id: number, nextQuestion: string) {
  const c = await db();
  await c.execute({ sql: "UPDATE companies SET next_question = ? WHERE id = ?", args: [nextQuestion, id] });
}
