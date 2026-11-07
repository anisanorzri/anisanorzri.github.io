import { addFact, addSource, createCompany, getThesis, hasSavedThesis, listCompanies, saveThesis, setNextQuestion } from "./repo";
import { findCompanyMatches } from "./dedupe";
import { RESEARCHED_ON, SEED_COMPANIES, type SeedCompany } from "./seed-data";
import { X_SEED_COMPANIES, X_SOURCED_ON } from "./seed-x";

/** Loads the researched examples as drafts. Skips any company already in the workspace. */
export type SeedSet = "examples" | "x";

export async function loadSeed(set: SeedSet = "examples"): Promise<{ added: string[]; skipped: string[] }> {
  const list: SeedCompany[] = set === "x" ? X_SEED_COMPANIES : SEED_COMPANIES;
  const capturedOn = set === "x" ? X_SOURCED_ON : RESEARCHED_ON;
  if (!(await hasSavedThesis())) {
    const { updatedAt: _ignored, ...t } = await getThesis();
    await saveThesis(t);
  }
  const added: string[] = [];
  const skipped: string[] = [];
  for (const sc of list) {
    const existing = await listCompanies();
    if (findCompanyMatches({ name: sc.name, website: sc.website }, existing).length) {
      skipped.push(sc.name);
      continue;
    }
    const companyId = await createCompany({ name: sc.name, website: sc.website });
    const ids = new Map<string, number>();
    for (const s of sc.sources) {
      ids.set(
        s.key,
        await addSource({
          companyId,
          url: s.url,
          kind: s.kind,
          title: s.title,
          author: s.author,
          publishedOn: s.publishedOn,
          capturedOn,
          excerpt: s.excerpt ?? "",
          notes: s.notes ?? "",
        }),
      );
    }
    for (const f of sc.facts) {
      await addFact({
        companyId,
        sourceId: ids.get(f.source) ?? null,
        field: f.field,
        value: f.value,
        quote: f.quote,
        provenance: f.provenance,
        status: "draft",
        origin: "manual",
        note: f.note ?? "",
      });
    }
    await setNextQuestion(companyId, sc.nextQuestion);
    added.push(sc.name);
  }
  return { added, skipped };
}
