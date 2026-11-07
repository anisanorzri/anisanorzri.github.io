import { evaluateThesis, summarize, unknownCriteria, whyItMightFit, type CriterionCheck } from "./match";
import { CORE_FIELDS, FACT_FIELDS, PROVENANCE, type Company, type Fact, type FactField, type Source, type Thesis } from "./types";

function approvedLocation(checks: CriterionCheck[], approved: Fact[]): string | undefined {
  const geo = checks.find((c) => c.criterion === "geography");
  const id = geo?.evidence[0]?.factId;
  const f = approved.find((x) => x.id === id);
  // Use the location as written, up to its first note in brackets.
  return f ? f.value.split(/\s[(—]/)[0] : undefined;
}

export interface Brief {
  company: Company;
  sources: Source[];
  approved: Fact[];
  drafts: Fact[];
  rejected: Fact[];
  byField: Partial<Record<FactField, Fact[]>>;
  unknownFields: FactField[];
  checks: CriterionCheck[];
  why: string;
  summary: ReturnType<typeof summarize>;
  latestSignal: { fact: Fact; source: Source | null; date: string | null } | null;
  sourceDates: { earliest: string | null; latest: string | null };
}

export function buildBrief(company: Company, facts: Fact[], sources: Source[], thesis: Thesis): Brief {
  const approved = facts.filter((f) => f.status === "approved");
  const drafts = facts.filter((f) => f.status === "draft");
  const rejected = facts.filter((f) => f.status === "rejected");
  const byField: Partial<Record<FactField, Fact[]>> = {};
  for (const f of approved) (byField[f.field] ??= []).push(f);
  const unknownFields = CORE_FIELDS.filter((k) => !byField[k]?.length);
  const checks = evaluateThesis(thesis, facts);
  const srcById = new Map(sources.map((s) => [s.id, s]));
  const signals = (byField.signal ?? [])
    .map((f) => {
      const source = f.sourceId ? srcById.get(f.sourceId) ?? null : null;
      return { fact: f, source, date: source?.publishedOn ?? null };
    })
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  const dates = sources.map((s) => s.publishedOn).filter((d): d is string => !!d).sort();
  return {
    company,
    sources,
    approved,
    drafts,
    rejected,
    byField,
    unknownFields,
    checks,
    why: whyItMightFit(checks, approvedLocation(checks, approved)),
    summary: summarize(checks),
    latestSignal: signals[0] ?? null,
    sourceDates: { earliest: dates[0] ?? null, latest: dates[dates.length - 1] ?? null },
  };
}

const tag = (f: Fact) => `[${PROVENANCE[f.provenance].toLowerCase()}]`;

function fieldText(b: Brief, field: FactField) {
  return (b.byField[field] ?? []).map((f) => `${f.value} ${tag(f)}`).join(" | ");
}

export const EXPORT_HEADER = [
  "Company",
  "Website",
  "Review status",
  "Reviewed on",
  "Product",
  "Customer",
  "Location",
  "Latest signal",
  "Signal source",
  "Signal date",
  "Why it might fit",
  "Thesis criteria not yet known",
  "Exclusion flags",
  "Unknown brief fields",
  "Verified contact routes",
  "Next diligence question",
  "All sources (date · url)",
];

export function exportRow(b: Brief): string[] {
  const exclusion = b.checks.find((c) => c.criterion === "exclusion");
  const contacts = (b.byField.contact_route ?? []).filter((f) => f.provenance === "verified");
  return [
    b.company.name,
    b.company.website ?? "",
    b.company.status,
    b.company.reviewedAt?.slice(0, 10) ?? "",
    fieldText(b, "product"),
    fieldText(b, "customer"),
    fieldText(b, "location"),
    b.latestSignal ? `${b.latestSignal.fact.value} ${tag(b.latestSignal.fact)}` : "",
    b.latestSignal?.source?.url ?? "",
    b.latestSignal?.date ?? (b.latestSignal ? "undated" : ""),
    b.why,
    unknownCriteria(b.checks).join("; "),
    exclusion?.result === "flagged" ? exclusion.explanation : "",
    b.unknownFields.map((f) => FACT_FIELDS[f]).join("; "),
    contacts.map((f) => f.value).join("; "),
    b.company.nextQuestion,
    b.sources.map((s) => `${s.publishedOn ?? "undated"} · ${s.url}`).join("\n"),
  ];
}
