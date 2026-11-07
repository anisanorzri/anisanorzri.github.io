import Link from "next/link";
import { loadSeedAction } from "./actions";
import { buildBrief } from "@/lib/brief";
import { getThesis, listCompanies, listFacts, listSources } from "@/lib/repo";
import { REVIEW_STATUSES, type ReviewStatus } from "@/lib/types";
import { EvidenceStrip, Legend, StatusPill, fmtDate } from "@/components/ui";

export const metadata = { title: "Review queue" };

const ORDER: ReviewStatus[] = ["new", "investigate", "shortlist", "monitor", "known", "reject"];

export default async function QueuePage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const filter = status && status in REVIEW_STATUSES ? (status as ReviewStatus) : null;
  const [thesis, companies, facts, sources] = await Promise.all([getThesis(), listCompanies(), listFacts(), listSources()]);

  const briefs = companies.map((c) =>
    buildBrief(
      c,
      facts.filter((f) => f.companyId === c.id),
      sources.filter((s) => s.companyId === c.id),
      thesis,
    ),
  );
  const counts = Object.fromEntries(ORDER.map((k) => [k, briefs.filter((b) => b.company.status === k).length])) as Record<ReviewStatus, number>;
  const shown = briefs
    .filter((b) => !filter || b.company.status === filter)
    .sort((a, b) => ORDER.indexOf(a.company.status) - ORDER.indexOf(b.company.status) || b.drafts.length - a.drafts.length);
  const drafts = briefs.reduce((n, b) => n + b.drafts.length, 0);
  const withDrafts = briefs.filter((b) => b.drafts.length).length;
  const flagged = briefs.filter((b) => b.summary.flagged && b.company.status !== "reject");

  let finding: string;
  if (!companies.length) finding = "Nothing captured yet. Add a link to a founder post, a cohort page or a company site.";
  else if (drafts)
    finding = `${drafts} draft ${drafts === 1 ? "fact waits" : "facts wait"} for a check across ${withDrafts} ${withDrafts === 1 ? "company" : "companies"}. Nothing counts towards a brief until a person approves it.`;
  else if (counts.new) finding = `${counts.new} ${counts.new === 1 ? "company is" : "companies are"} ready for a decision.`;
  else finding = `Every company has a decision. ${counts.shortlist} on the shortlist.`;

  return (
    <>
      <div className="title-row">
        <div>
          <h1>Review queue</h1>
          <p className="finding">{finding}</p>
          {flagged.length > 0 && (
            <p className="finding" style={{ color: "var(--negative)" }}>
              {flagged.map((b) => b.company.name).join(", ")} {flagged.length === 1 ? "mentions" : "mention"} a thesis exclusion.
            </p>
          )}
        </div>
        <div className="actions">
          <Link className="btn btn-primary" href="/intake">
            Add a link
          </Link>
        </div>
      </div>

      <section className="card" aria-labelledby="queue-h">
        <h2 id="queue-h" className="visually-hidden">
          Companies
        </h2>
        <nav className="tabs" aria-label="Filter by review status">
          <Link href="/" aria-current={!filter ? "page" : undefined}>
            All<span className="num">{companies.length}</span>
          </Link>
          {ORDER.map((k) => (
            <Link key={k} href={`/?status=${k}`} aria-current={filter === k ? "page" : undefined}>
              {REVIEW_STATUSES[k]}
              <span className="num">{counts[k]}</span>
            </Link>
          ))}
        </nav>

        {!companies.length ? (
          <div className="empty">
            <h2>No companies yet</h2>
            <p>
              Start with a real link: a founder&rsquo;s post on X, an accelerator cohort page, a demo-day list or a company website. Sourcebook makes a
              brief from what the sources say and marks everything else unknown.
            </p>
            <div className="actions">
              <Link className="btn btn-primary" href="/intake">
                Add a link
              </Link>
              <form action={loadSeedAction}>
                <button className="btn btn-secondary" type="submit">
                  Load 5 researched examples
                </button>
              </form>
            </div>
            <p className="small muted">
              The examples are five real European companies researched from public pages on 7 Nov 2026. They load as drafts for you to check.
            </p>
          </div>
        ) : !shown.length ? (
          <div className="empty">
            <h2>No companies marked {REVIEW_STATUSES[filter!].toLowerCase()}</h2>
            <p className="muted">Decisions are made on each brief.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="queue">
              <thead>
                <tr>
                  <th scope="col">Company</th>
                  <th scope="col">Brief evidence</th>
                  <th scope="col">Thesis fit</th>
                  <th scope="col">Latest signal</th>
                  <th scope="col" className="r">
                    Drafts to check
                  </th>
                  <th scope="col">Decision</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((b) => {
                  const loc = b.byField.location?.[0]?.value;
                  return (
                    <tr key={b.company.id}>
                      <td className="q-company">
                        <Link className="row-link" href={`/companies/${b.company.id}`}>
                          {b.company.name}
                        </Link>
                        <div className="muted" style={{ fontSize: 13 }}>{[b.company.domain, loc && loc.split(/[.(—]/)[0].trim()].filter(Boolean).join(" · ") || "—"}</div>
                      </td>
                      <td className="q-evidence">
                        <EvidenceStrip facts={facts.filter((f) => f.companyId === b.company.id)} />
                      </td>
                      <td className="q-fit" data-label="Thesis:">
                        <FitLine b={b} />
                      </td>
                      <td className="q-signal" style={{ maxWidth: 340 }}>
                        {b.latestSignal ? (
                          <>
                            <div>{b.latestSignal.fact.value}</div>
                            <div className="small muted num">{fmtDate(b.latestSignal.date)}</div>
                          </>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td className="q-drafts r num" data-label="Drafts to check:">
                        {b.drafts.length ? b.drafts.length : <span className="muted">0</span>}
                      </td>
                      <td className="q-status">
                        <StatusPill status={b.company.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {companies.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <Legend />
        </div>
      )}
    </>
  );
}

function FitLine({ b }: { b: ReturnType<typeof buildBrief> }) {
  const words: Record<string, string> = { match: "matches", no_match: "no match", unknown: "unknown", flagged: "flagged", clear: "clear" };
  const parts = b.checks
    .filter((c) => c.criterion !== "exclusion" || c.result === "flagged")
    .map((c) => (
      <span key={c.criterion} className={`res-${c.result}`} style={{ whiteSpace: "nowrap" }}>
        {c.label} {words[c.result]}
      </span>
    ));
  return (
    <span style={{ display: "inline-flex", flexWrap: "wrap", gap: "2px 12px", fontSize: 13 }}>
      {parts}
    </span>
  );
}
