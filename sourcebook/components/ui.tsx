import { CORE_FIELDS, FACT_FIELDS, PROVENANCE, REVIEW_STATUSES, type Fact, type FactField, type Provenance, type ReviewStatus } from "@/lib/types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-09-07" → "7 Sep 2026". Missing dates say so. */
export function fmtDate(d: string | null | undefined, missing = "Undated") {
  if (!d) return missing;
  const m = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return d;
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
}

export function ProvMark({ p }: { p: Provenance | "unknown" | "draft" }) {
  return <span className={`mark mark-${p}`} aria-hidden="true" />;
}

export function Prov({ p }: { p: Provenance }) {
  return (
    <span className={`prov ${p === "verified" ? "prov-verified" : ""}`}>
      <ProvMark p={p} /> {PROVENANCE[p]}
    </span>
  );
}

export function StatusPill({ status }: { status: ReviewStatus }) {
  const cls = status === "shortlist" ? "pill-shortlist" : status === "investigate" ? "pill-investigate" : status === "reject" ? "pill-reject" : "";
  return <span className={`pill ${cls}`}>{REVIEW_STATUSES[status]}</span>;
}

/** Strongest provenance among approved facts for a field. */
export function bestProvenance(facts: Fact[], field: FactField): Provenance | "unknown" | "draft" {
  const approved = facts.filter((f) => f.field === field && f.status === "approved");
  if (approved.some((f) => f.provenance === "verified")) return "verified";
  if (approved.some((f) => f.provenance === "third_party")) return "third_party";
  if (approved.length) return "company_claim";
  if (facts.some((f) => f.field === field && f.status === "draft")) return "draft";
  return "unknown";
}

const SHORT: Partial<Record<FactField, string>> = { product: "Prod", customer: "Cust", location: "Loc", signal: "Sig" };
const WORD = { verified: "verified", company_claim: "company claim", third_party: "third-party report", unknown: "unknown", draft: "draft only, not yet checked" };

/** The four core brief fields as marks: what is verified, what is claimed, what is still unknown. */
export function EvidenceStrip({ facts }: { facts: Fact[] }) {
  const cells = CORE_FIELDS.map((f) => ({ f, p: bestProvenance(facts, f) }));
  const label = cells.map((c) => `${FACT_FIELDS[c.f]}: ${WORD[c.p]}`).join("; ");
  return (
    <span className="strip" role="img" aria-label={label} title={label}>
      {cells.map((c) => (
        <span className="cell" key={c.f}>
          <ProvMark p={c.p} />
          <span aria-hidden="true">{SHORT[c.f]}</span>
        </span>
      ))}
    </span>
  );
}

export function Legend() {
  return (
    <div className="legend" aria-label="Legend">
      <span><ProvMark p="verified" /> Verified against a primary record</span>
      <span><ProvMark p="company_claim" /> Company claim</span>
      <span><ProvMark p="third_party" /> Third-party report</span>
      <span><ProvMark p="draft" /> Draft, not checked</span>
      <span><ProvMark p="unknown" /> Unknown</span>
    </div>
  );
}
