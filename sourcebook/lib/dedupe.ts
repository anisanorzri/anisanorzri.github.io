import { normalizeUrl, registrableDomain } from "./url";

// Words that differ between how a company writes its name and how a registry
// or a post writes it ("Squid" / "Squid Labs Ltd" / "squid.energy").
const NOISE = new Set([
  "ltd", "limited", "plc", "llp", "inc", "incorporated", "corp", "co", "company", "gmbh", "ag", "bv", "b.v", "nv", "sa", "sas", "sarl",
  "srl", "ab", "as", "aps", "oy", "spa", "labs", "lab", "hq", "technologies", "technology", "tech", "group", "holdings", "the",
  "ai", "io", "app", "energy", "robotics",
]);

export function normalizeName(name: string): string {
  const words = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\.(com|io|ai|co|dev|app|energy|tech)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const kept = words.filter((w) => !NOISE.has(w));
  return (kept.length ? kept : words).join(" ");
}

function bigrams(s: string): string[] {
  const t = s.replace(/\s+/g, "");
  const out: string[] = [];
  for (let i = 0; i < t.length - 1; i++) out.push(t.slice(i, i + 2));
  return out;
}

/** Sørensen–Dice similarity on character pairs, 0..1. */
export function nameSimilarity(a: string, b: string): number {
  const x = normalizeName(a);
  const y = normalizeName(b);
  if (!x || !y) return 0;
  if (x === y) return 1;
  const bx = bigrams(x);
  const by = bigrams(y);
  if (!bx.length || !by.length) return 0;
  const counts = new Map<string, number>();
  for (const g of bx) counts.set(g, (counts.get(g) ?? 0) + 1);
  let overlap = 0;
  for (const g of by) {
    const n = counts.get(g) ?? 0;
    if (n > 0) {
      overlap++;
      counts.set(g, n - 1);
    }
  }
  return (2 * overlap) / (bx.length + by.length);
}

export interface CompanyLike {
  id: number;
  name: string;
  domain: string | null;
}

export interface CompanyMatch {
  id: number;
  name: string;
  reason: string;
}

/**
 * Companies already in the workspace that may be the one being added.
 * Every match states its reason, so the person decides.
 */
export function findCompanyMatches(
  candidate: { name?: string | null; website?: string | null; sourceUrl?: string | null },
  existing: CompanyLike[],
): CompanyMatch[] {
  const out: CompanyMatch[] = [];
  const domain = candidate.website ? registrableDomain(candidate.website) : null;
  const sourceDomain = candidate.sourceUrl ? registrableDomain(candidate.sourceUrl) : null;
  for (const c of existing) {
    if (domain && c.domain && domain === c.domain) {
      out.push({ id: c.id, name: c.name, reason: `Same website domain (${c.domain})` });
      continue;
    }
    if (sourceDomain && c.domain && sourceDomain === c.domain) {
      out.push({ id: c.id, name: c.name, reason: `The link is on ${c.name}'s own domain (${c.domain})` });
      continue;
    }
    if (candidate.name) {
      const sim = nameSimilarity(candidate.name, c.name);
      if (sim === 1) out.push({ id: c.id, name: c.name, reason: `Same name once suffixes are ignored ("${normalizeName(c.name)}")` });
      else if (sim >= 0.8) out.push({ id: c.id, name: c.name, reason: `Similar name (${Math.round(sim * 100)}% of letter pairs shared)` });
    }
  }
  return out;
}

export interface SourceLike {
  id: number;
  companyId: number;
  normalizedUrl: string;
}

/** Sources already captured at the same normalised address. */
export function findSourceDuplicates(url: string, existing: SourceLike[]): SourceLike[] {
  const n = normalizeUrl(url);
  if (!n) return [];
  return existing.filter((s) => s.normalizedUrl === n);
}
