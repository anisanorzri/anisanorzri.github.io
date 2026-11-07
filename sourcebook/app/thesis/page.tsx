import { saveThesisAction } from "../actions";
import { getThesis, hasSavedThesis } from "@/lib/repo";
import { fmtDate } from "@/components/ui";

export const metadata = { title: "Thesis" };

const groups = (g: { label: string; keywords: string[] }[]) => g.map((x) => `${x.label}: ${x.keywords.join(", ")}`).join("\n");

export default async function ThesisPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { saved } = await searchParams;
  const [t, isSaved] = await Promise.all([getThesis(), hasSavedThesis()]);
  return (
    <>
      <div className="title-row">
        <div>
          <h1>Thesis</h1>
          <p className="finding">
            Every brief is checked against these words and nothing else. A company is never scored; each criterion shows the fact that matched it, or says it is unknown.
          </p>
          <p className="small muted" style={{ marginTop: 4 }}>
            {isSaved ? `Last saved ${fmtDate(t.updatedAt.slice(0, 10))}` : "Example thesis — not saved yet"}
          </p>
        </div>
      </div>
      {saved && (
        <div className="notice notice-info" role="status" style={{ marginBottom: 16 }}>
          Thesis saved. Every brief now reads against it.
        </div>
      )}
      <form action={saveThesisAction} className="settings">
        <section className="settings-section" aria-labelledby="t-name">
          <div>
            <h2 id="t-name">Name</h2>
            <p className="desc">Shown at the top of the sidebar so everyone knows which thesis the briefs were read against.</p>
          </div>
          <div className="panel">
            <div className="field">
              <label htmlFor="name">Thesis name</label>
              <input id="name" name="name" type="text" defaultValue={t.name} />
            </div>
          </div>
        </section>
        <section className="settings-section" aria-labelledby="t-sectors">
          <div>
            <h2 id="t-sectors">Sectors</h2>
            <p className="desc">One sector per line: its name, a colon, then the words that mean it. Matched as whole words in approved product, customer and signal facts.</p>
          </div>
          <div className="panel">
            <div className="field">
              <label htmlFor="sectors">Sectors and keywords</label>
              <textarea id="sectors" name="sectors" defaultValue={groups(t.sectors)} style={{ minHeight: 120 }} aria-describedby="sectors-hint" />
              <span id="sectors-hint" className="hint">Example: Grid and energy software: grid, power, battery</span>
            </div>
          </div>
        </section>
        <section className="settings-section" aria-labelledby="t-geo">
          <div>
            <h2 id="t-geo">Geography</h2>
            <p className="desc">Countries or cities, one per line. “Europe” covers the European countries and their main startup cities. Matched against approved location facts only.</p>
          </div>
          <div className="panel">
            <div className="field">
              <label htmlFor="geographies">Places</label>
              <textarea id="geographies" name="geographies" defaultValue={t.geographies.join("\n")} style={{ minHeight: 72 }} />
            </div>
          </div>
        </section>
        <section className="settings-section" aria-labelledby="t-stage">
          <div>
            <h2 id="t-stage">Stage</h2>
            <p className="desc">Only a source that states a stage or a round can match. Team size, age and accelerator never imply one.</p>
          </div>
          <div className="panel">
            <div className="field">
              <label htmlFor="stages">Stages</label>
              <input id="stages" name="stages" type="text" defaultValue={t.stages.join(", ")} aria-describedby="stages-hint" />
              <span id="stages-hint" className="hint">Separate with commas: pre-seed, seed</span>
            </div>
          </div>
        </section>
        <section className="settings-section" aria-labelledby="t-ex">
          <div>
            <h2 id="t-ex">Exclusions</h2>
            <p className="desc">Same format as sectors. Checked against every approved fact; a hit flags the brief rather than hiding it.</p>
          </div>
          <div className="panel">
            <div className="field">
              <label htmlFor="exclusions">Exclusions and keywords</label>
              <textarea id="exclusions" name="exclusions" defaultValue={groups(t.exclusions)} style={{ minHeight: 96 }} />
            </div>
          </div>
        </section>
        <section className="settings-section" aria-labelledby="t-notes">
          <div>
            <h2 id="t-notes">Notes</h2>
            <p className="desc">Kept in this workspace&rsquo;s database. Private fund notes stay out of the open-source repository.</p>
          </div>
          <div className="panel">
            <div className="field">
              <label htmlFor="notes">Notes</label>
              <textarea id="notes" name="notes" defaultValue={t.notes} />
            </div>
          </div>
        </section>
        <div className="save-bar">
          <button className="btn btn-primary" type="submit">
            Save thesis
          </button>
        </div>
      </form>
    </>
  );
}
