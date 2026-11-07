import { buildBrief, type Brief } from "./brief";
import { getThesis, listCompanies, listFacts, listSources } from "./repo";
import type { ReviewStatus } from "./types";

export async function briefsWithStatus(statuses: ReviewStatus[]): Promise<Brief[]> {
  const [thesis, companies, facts, sources] = await Promise.all([getThesis(), listCompanies(), listFacts(), listSources()]);
  return companies
    .filter((c) => statuses.includes(c.status))
    .map((c) => buildBrief(c, facts.filter((f) => f.companyId === c.id), sources.filter((s) => s.companyId === c.id), thesis))
    .sort((a, b) => a.company.name.localeCompare(b.company.name));
}

export function statusesFrom(param: string | null | undefined): ReviewStatus[] {
  return param === "with-investigate" ? ["shortlist", "investigate"] : ["shortlist"];
}
