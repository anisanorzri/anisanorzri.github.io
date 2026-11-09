// Sector and thesis rules shared by every radar run.
import { DEFAULT_THESIS } from "../lib/repo";
import { findTerm } from "../lib/match";

export const SECTORS: [string, RegExp][] = [
  ["Defence & security", /\b(defen[cs]e|military|munitions?|security robot|counter-drone|small drones|AI-Commanded Drones)\b/i],
  ["Health & bio", /\b(health|healthcare|medical|clinic|clinical|patients?|drugs?|biotech|cancers?|DNA|vets?|veterinar\w*|pharma|hospitals?|dental|therap\w*)\b/i],
  ["Energy & climate", /\b(energy|grid|power grid|batter(y|ies)|solar|electricity|carbon|climate|emissions?|fusion|nuclear|hydrogen|wastewater|water treatment|EV charging)\b/i],
  ["Logistics & supply chain", /\b(logistics?|warehouses?|freight|shipping|carriers?|fleets?|supply chain|containers?|distributors?|procurement|order entry|3PLs?)\b/i],
  ["Industrial & robotics", /\b(robots?|robotics?|humanoids?|manufactur\w*|industrial|(?<!software )factor(y|ies)|PCB|electronics|CAD|construction|lunar|landers?|satellites?|positioning|motion estimation|engineering (firms|projects)|drones|materials|chemicals?|mining|physical automation|aerospace)\b/i],
  ["Fintech & insurance", /\b(fintech|financ\w*|banks?|banking|payments?|accounting|accountants?|insurance|investors?|trading|stocks?|exchange|billing|tax|audit\w*|wealth|lending|CFOs?)\b/i],
  ["Legal & compliance", /\b(legal|law|lawyers?|litigation|compliance|regulat\w*|contracts?|intellectual property|patents?)\b/i],
  ["AI & developer tools", /\b(developers?|code|coding|API|APIs|infrastructure|database|models?|agents?|LLMs?|ML|machine learning|inference|open[- ]source|devtools?|engineers?|engineering teams|cloud)\b/i],
  ["Consumer", /\b(consumers?(?! brands| focus)|chef|music|games?|dating|social|fitness|your own)\b/i],
];
export const classify = (text: string) => { for (const [s, re] of SECTORS) if (re.test(text)) return s; return "B2B software"; };
export const sectorOf = (oneLiner: string, industry = "", tags = "") => {
  const a = classify(oneLiner);
  if (a !== "B2B software") return a;
  const b = classify(tags);
  if (b !== "B2B software") return b;
  return /Consumer/i.test(industry) ? "Consumer" : "B2B software";
};
export const THESIS_SECTORS: Record<string, string> = { "Energy & climate": "Grid and energy software", "Industrial & robotics": "Industrial and engineering tools", "Logistics & supply chain": "Logistics automation" };
export function fit(text: string, sector: string) {
  const ex = DEFAULT_THESIS.exclusions.flatMap((g) => g.keywords.map((k) => [g.label, k] as const)).find(([, k]) => findTerm(text, k));
  const exclusion = sector === "Defence & security" ? "Defence" : sector === "Consumer" ? "Consumer" : ex ? ex[0] : "";
  if (exclusion) return { thesis: "excluded", thesisReason: `Excluded: ${exclusion}`, exclusion };
  if (THESIS_SECTORS[sector]) {
    const g = DEFAULT_THESIS.sectors.find((x) => x.label === THESIS_SECTORS[sector])!;
    const k = g.keywords.find((kw) => findTerm(text, kw));
    return { thesis: "fits", thesisReason: k ? `${g.label} (“${k}”)` : g.label, exclusion };
  }
  return { thesis: "outside", thesisReason: "Sector outside the thesis", exclusion };
}
