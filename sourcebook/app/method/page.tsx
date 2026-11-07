import { PROVENANCE, PROVENANCE_HELP, type Provenance } from "@/lib/types";
import { ProvMark } from "@/components/ui";

export const metadata = { title: "Evidence rules" };

export default function MethodPage() {
  return (
    <>
      <div className="title-row">
        <div>
          <h1>Evidence rules</h1>
          <p className="finding">How a public link becomes a brief, and what Sourcebook refuses to do. Share this page with anyone who reads a brief.</p>
        </div>
      </div>
      <div className="card">
        <div className="card-body prose" style={{ paddingTop: 20 }}>
          <h2>Who says so</h2>
          <ul style={{ listStyle: "none", paddingLeft: 0 }}>
            {(Object.keys(PROVENANCE) as Provenance[]).map((p) => (
              <li key={p} style={{ display: "grid", gridTemplateColumns: "18px 1fr", gap: 8 }}>
                <span style={{ paddingTop: 4 }}>
                  <ProvMark p={p} />
                </span>
                <span>
                  <b style={{ fontWeight: 600 }}>{PROVENANCE[p]}.</b> {PROVENANCE_HELP[p]}
                </span>
              </li>
            ))}
            <li style={{ display: "grid", gridTemplateColumns: "18px 1fr", gap: 8 }}>
              <span style={{ paddingTop: 4 }}>
                <ProvMark p="unknown" />
              </span>
              <span>
                <b style={{ fontWeight: 600 }}>Unknown.</b> No approved fact answers the question. Unknown is shown, never filled in.
              </span>
            </li>
          </ul>

          <h2>How a fact gets into a brief</h2>
          <ul>
            <li>Every fact points to a source and, where possible, quotes it word for word.</li>
            <li>Drafts — from a page&rsquo;s own description, from Claude, or from a researcher — count for nothing until a person approves them.</li>
            <li>Claude&rsquo;s drafts are discarded automatically when their quote cannot be found in the page text.</li>
            <li>A source keeps its publication date, or reads as undated. The capture date is recorded separately and never stands in for it.</li>
          </ul>

          <h2>What Sourcebook does not do</h2>
          <ul>
            <li>No scores, rankings or fit percentages. Each thesis criterion says what matched, in which fact, or that it is unknown.</li>
            <li>No assumed fundraising status. A stage appears only when a source states it.</li>
            <li>No invented traction. Customer names the company gives are claims until the customer says so.</li>
            <li>No warm introductions or connection maps. Contact routes are only those the company publishes itself.</li>
            <li>No investment recommendations. A brief says why a company might be worth a look and what to ask next.</li>
            <li>No scraping behind logins. X posts are captured by pasting their text; automated discovery waits for permitted feeds and authorised APIs.</li>
          </ul>

          <h2>What stays private</h2>
          <ul>
            <li>The code is open source. The database — your thesis, decisions, notes and operator answers — lives in your own SQLite file or hosted database and is never committed.</li>
          </ul>
        </div>
      </div>
    </>
  );
}
