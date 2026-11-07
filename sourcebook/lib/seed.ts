import { addFact, addSource, createCompany, getThesis, hasSavedThesis, listCompanies, saveThesis, setNextQuestion } from "./repo";
import { findCompanyMatches } from "./dedupe";
import { RESEARCHED_ON, SEED_COMPANIES } from "./seed-data";

/** Loads the researched examples as drafts. Skips any company already in the workspace. */
export async function loadSeed(): Promise<{ added: string[]; skipped: string[] }> {
  if (!(await hasSavedThesis())) {
    const { updatedAt: _ignored, ...t } = await getThesis();
    await saveThesis(t);
  }
  const added: string[] = [];
  const skipped: string[] = [];
  for (const sc of SEED_COMPANIES) {
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
          capturedOn: RESEARCHED_ON,
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
