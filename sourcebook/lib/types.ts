// Domain vocabulary. Kept small on purpose: every field here is something a
// GP can check, and nothing here is a score.

export const SOURCE_KINDS = {
  x_post: "Founder post on X",
  accelerator_cohort: "Accelerator cohort",
  demo_day: "Demo day",
  company_website: "Company website",
  registry: "Company registry",
  press: "Press or blog",
  other: "Other public page",
} as const;
export type SourceKind = keyof typeof SOURCE_KINDS;

// The brief's sections. "Unknown" is never stored: a field with no approved
// fact is shown as unknown.
export const FACT_FIELDS = {
  product: "Product",
  customer: "Customer",
  location: "Location",
  signal: "Signal",
  team: "Team",
  founded: "Founded",
  legal_entity: "Legal entity",
  traction_claim: "Traction",
  backers: "Backers",
  stage: "Stage",
  contact_route: "Contact route",
  other: "Other",
} as const;
export type FactField = keyof typeof FACT_FIELDS;

/** Fields a brief must answer before it is shown to anyone. */
export const CORE_FIELDS: FactField[] = ["product", "customer", "location", "signal"];

export const PROVENANCE = {
  verified: "Verified",
  company_claim: "Company claim",
  third_party: "Third-party report",
} as const;
export type Provenance = keyof typeof PROVENANCE;

export const PROVENANCE_HELP: Record<Provenance, string> = {
  verified:
    "Checked against a primary record that the company does not write: a company registry, an accelerator's own batch list, a customer's own announcement. For a contact route: published on the company's own site.",
  company_claim:
    "Said by the company or its founders: its website, its posts, the description it wrote for an accelerator profile.",
  third_party: "Reported by someone else (press, a newsletter, an investor's post) but not checked against a primary record.",
};

export type FactStatus = "draft" | "approved" | "rejected";
export type FactOrigin = "manual" | "page_metadata" | "ai_draft";

export const REVIEW_STATUSES = {
  new: "To review",
  investigate: "Investigate",
  shortlist: "Shortlist",
  monitor: "Monitor",
  known: "Already known",
  reject: "Reject",
} as const;
export type ReviewStatus = keyof typeof REVIEW_STATUSES;

export interface Thesis {
  name: string;
  sectors: KeywordGroup[];
  geographies: string[];
  stages: string[];
  exclusions: KeywordGroup[];
  notes: string;
  updatedAt: string;
}

export interface KeywordGroup {
  label: string;
  keywords: string[];
}

export interface Company {
  id: number;
  name: string;
  website: string | null;
  domain: string | null;
  status: ReviewStatus;
  statusNote: string;
  nextQuestion: string;
  reviewedAt: string | null;
  createdAt: string;
}

export interface Source {
  id: number;
  companyId: number;
  url: string;
  normalizedUrl: string;
  kind: SourceKind;
  title: string;
  author: string;
  publishedOn: string | null;
  capturedOn: string;
  excerpt: string;
  notes: string;
}

export interface Fact {
  id: number;
  companyId: number;
  sourceId: number | null;
  field: FactField;
  value: string;
  quote: string;
  provenance: Provenance;
  status: FactStatus;
  origin: FactOrigin;
  note: string;
  createdAt: string;
  decidedAt: string | null;
}

export interface ReviewEvent {
  id: number;
  companyId: number;
  fromStatus: ReviewStatus | null;
  toStatus: ReviewStatus;
  note: string;
  at: string;
}

export interface Feedback {
  id: number;
  companyId: number;
  operator: string;
  familiar: "yes" | "no";
  relevant: "yes" | "partly" | "no";
  worthInvestigating: "yes" | "no";
  comment: string;
  at: string;
}
