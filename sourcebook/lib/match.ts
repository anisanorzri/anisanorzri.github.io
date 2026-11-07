import type { Fact, FactField, KeywordGroup, Thesis } from "./types";
import { FACT_FIELDS } from "./types";

// Transparent thesis matching. No weights, no score: each criterion says
// what it found, in which approved fact, or that nothing settles it.

export type CriterionResult = "match" | "no_match" | "unknown" | "flagged" | "clear";

export interface Evidence {
  factId: number;
  field: FactField;
  term: string;
  excerpt: string;
}

export interface CriterionCheck {
  criterion: "sector" | "geography" | "stage" | "exclusion";
  label: string;
  result: CriterionResult;
  explanation: string;
  evidence: Evidence[];
}

const EUROPE = [
  "europe", "european", "united kingdom", "uk", "england", "scotland", "wales", "northern ireland", "london", "ireland", "france",
  "germany", "netherlands", "belgium", "luxembourg", "switzerland", "austria", "italy", "spain", "portugal", "denmark", "sweden",
  "norway", "finland", "iceland", "estonia", "latvia", "lithuania", "poland", "czechia", "czech republic", "slovakia", "hungary",
  "romania", "bulgaria", "greece", "croatia", "slovenia", "serbia", "ukraine", "cyprus", "malta", "paris", "berlin", "munich",
  "amsterdam", "rotterdam", "brussels", "ghent", "antwerp", "leuven", "zurich", "zürich", "geneva", "lausanne", "vienna", "milan",
  "madrid", "barcelona", "lisbon", "copenhagen", "stockholm", "oslo", "helsinki", "tallinn", "warsaw", "prague", "dublin",
  "cambridge", "oxford", "manchester", "edinburgh", "bristol", "delft", "eindhoven", "hamburg",
];

function escape(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Whole-word, case-insensitive. "grid" matches "power grid" but not "gridiron". */
export function findTerm(text: string, term: string): string | null {
  const t = term.trim();
  if (!t) return null;
  const re = new RegExp(`(^|[^\\p{L}\\p{N}])(${escape(t)})(?=$|[^\\p{L}\\p{N}])`, "iu");
  const m = text.match(re);
  if (!m || m.index === undefined) return null;
  const start = m.index + m[1].length;
  const from = Math.max(0, start - 40);
  const to = Math.min(text.length, start + t.length + 40);
  return `${from > 0 ? "…" : ""}${text.slice(from, to).trim()}${to < text.length ? "…" : ""}`;
}

function searchGroups(facts: Fact[], fields: FactField[], groups: KeywordGroup[]) {
  const hits = new Map<string, Evidence[]>();
  for (const g of groups) {
    for (const f of facts) {
      if (!fields.includes(f.field)) continue;
      for (const kw of g.keywords) {
        const ex = findTerm(f.value, kw) ?? findTerm(f.quote, kw);
        if (ex) {
          const list = hits.get(g.label) ?? [];
          if (!list.some((e) => e.factId === f.id && e.term === kw)) list.push({ factId: f.id, field: f.field, term: kw, excerpt: ex });
          hits.set(g.label, list);
        }
      }
    }
  }
  return hits;
}

const SECTOR_FIELDS: FactField[] = ["product", "customer", "signal", "other"];

export function evaluateThesis(thesis: Thesis, allFacts: Fact[]): CriterionCheck[] {
  const facts = allFacts.filter((f) => f.status === "approved");
  const checks: CriterionCheck[] = [];

  // Sector: any keyword of any sector group in what the company does.
  const sectorFacts = facts.filter((f) => SECTOR_FIELDS.includes(f.field));
  const sectorHits = searchGroups(facts, SECTOR_FIELDS, thesis.sectors);
  if (!sectorFacts.length) {
    checks.push({
      criterion: "sector",
      label: "Sector",
      result: "unknown",
      explanation: "No approved product, customer or signal fact yet.",
      evidence: [],
    });
  } else if (sectorHits.size) {
    const labels = [...sectorHits.keys()];
    checks.push({
      criterion: "sector",
      label: "Sector",
      result: "match",
      explanation: `Matches ${labels.join(" and ")}.`,
      evidence: labels.flatMap((l) => sectorHits.get(l)!),
    });
  } else {
    checks.push({
      criterion: "sector",
      label: "Sector",
      result: "no_match",
      explanation: `None of the thesis keywords appear in ${sectorFacts.length} approved ${sectorFacts.length === 1 ? "fact" : "facts"} about the product, customer or signal.`,
      evidence: [],
    });
  }

  // Geography: a location fact naming one of the thesis places.
  const places = thesis.geographies.flatMap((g) => (g.trim().toLowerCase() === "europe" ? EUROPE : [g]));
  const locFacts = facts.filter((f) => f.field === "location");
  const geoEvidence: Evidence[] = [];
  for (const f of locFacts) {
    for (const p of places) {
      const ex = findTerm(f.value, p);
      if (ex && !geoEvidence.some((e) => e.factId === f.id && e.term.toLowerCase() === p.toLowerCase())) geoEvidence.push({ factId: f.id, field: f.field, term: p, excerpt: ex });
    }
  }
  checks.push(
    !locFacts.length
      ? { criterion: "geography", label: "Geography", result: "unknown", explanation: "No approved location fact yet.", evidence: [] }
      : geoEvidence.length
        ? {
            criterion: "geography",
            label: "Geography",
            result: "match",
            explanation: `Location names ${[...new Set(geoEvidence.map((e) => e.term))].join(", ")}.`,
            evidence: geoEvidence,
          }
        : {
            criterion: "geography",
            label: "Geography",
            result: "no_match",
            explanation: `Approved locations name none of: ${thesis.geographies.join(", ")}.`,
            evidence: [],
          },
  );

  // Stage: only ever from a fact that states it. Never inferred.
  const stageFacts = facts.filter((f) => f.field === "stage");
  const stageEvidence: Evidence[] = [];
  for (const f of stageFacts) {
    for (const s of thesis.stages) {
      const ex = findTerm(f.value, s);
      if (ex) stageEvidence.push({ factId: f.id, field: f.field, term: s, excerpt: ex });
    }
  }
  checks.push(
    !stageFacts.length
      ? {
          criterion: "stage",
          label: "Stage",
          result: "unknown",
          explanation: "No source states the stage or a round. Not assumed from team size, age or accelerator.",
          evidence: [],
        }
      : stageEvidence.length
        ? { criterion: "stage", label: "Stage", result: "match", explanation: `Stated as ${stageEvidence[0].term}.`, evidence: stageEvidence }
        : {
            criterion: "stage",
            label: "Stage",
            result: "no_match",
            explanation: `Stated stage is not one of: ${thesis.stages.join(", ")}.`,
            evidence: [],
          },
  );

  // Exclusions: every approved fact, every field.
  const exHits = searchGroups(facts, Object.keys(FACT_FIELDS) as FactField[], thesis.exclusions);
  checks.push(
    exHits.size
      ? {
          criterion: "exclusion",
          label: "Exclusions",
          result: "flagged",
          explanation: `Mentions ${[...exHits.keys()].join(" and ")}. Check before going further.`,
          evidence: [...exHits.values()].flat(),
        }
      : {
          criterion: "exclusion",
          label: "Exclusions",
          result: "clear",
          explanation: facts.length
            ? `No exclusion keyword in ${facts.length} approved ${facts.length === 1 ? "fact" : "facts"}.`
            : "Nothing approved to check yet.",
          evidence: [],
        },
  );

  return checks;
}

/** One plain sentence on why it might fit, built only from the matches. */
export function whyItMightFit(checks: CriterionCheck[], locationText?: string): string {
  const parts: string[] = [];
  const sector = checks.find((c) => c.criterion === "sector");
  if (sector?.result === "match") {
    const terms = [...new Set(sector.evidence.map((e) => `“${e.term}”`))].slice(0, 3);
    parts.push(`${sector.explanation.replace(/^Matches /, "").replace(/\.$/, "")} (${terms.join(", ")})`);
  }
  const geo = checks.find((c) => c.criterion === "geography");
  if (geo?.result === "match") {
    const place = locationText ?? [...new Set(geo.evidence.map((e) => e.term))].join(", ");
    parts.push(`based in ${place.replace(/\.$/, "")}`);
  }
  const stage = checks.find((c) => c.criterion === "stage");
  if (stage?.result === "match") parts.push(stage.explanation.replace(/\.$/, "").toLowerCase());
  if (!parts.length) return "Nothing approved yet links it to the thesis.";
  const out = parts.join("; ");
  return out.charAt(0).toUpperCase() + out.slice(1) + ".";
}

export function unknownCriteria(checks: CriterionCheck[]): string[] {
  return checks.filter((c) => c.result === "unknown").map((c) => c.label);
}

export function summarize(checks: CriterionCheck[]) {
  return {
    match: checks.filter((c) => c.result === "match").length,
    noMatch: checks.filter((c) => c.result === "no_match").length,
    unknown: checks.filter((c) => c.result === "unknown").length,
    flagged: checks.some((c) => c.result === "flagged"),
  };
}
