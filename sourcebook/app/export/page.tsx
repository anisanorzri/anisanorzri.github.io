import Link from "next/link";
import { listCompanies, listFeedback } from "@/lib/repo";
import { briefsWithStatus, statusesFrom } from "@/lib/shortlist";
import { FACT_FIELDS } from "@/lib/types";
import { StatusPill, fmtDate } from "@/components/ui";

export const metadata = { title: "Shortlist export" };

export default async function ExportPage({ searchParams }: { searchParams: Promise<{ scope?: string }> }) {
  const { scope } = await searchParams;
  const withInvestigate = scope === "with-investigate";
  const [briefs, feedback, companies] = await Promise.all([briefsWithStatus(statusesFrom(scope)), listFeedback(), listCompanies()]);
  const withContact = briefs.filter((b) => (b.byField.contact_route ?? []).some((f) => f.provenance === "verified")).length;
  const withDrafts = briefs.filter((b) => b.drafts.length).length;
  const missingQuestion = briefs.filter((b) => !b.company.nextQuestion.trim()).length;

  // Operator test: per company, the three questions that decide whether to keep going.
  const tested = companies
    .map((c) => {
      const fb = feedback.filter((f) => f.companyId === c.id);
      return {
        c,
        n: fb.length,
        unfamiliar: fb.filter((f) => f.familiar === "no").length,
        relevant: fb.filter((f) => f.relevant === "yes").length,
        partly: fb.filter((f) => f.relevant === "partly").length,
        worth: fb.filter((f) => f.worthInvestigating === "yes").length,
        operators: [...new Set(fb.map((f) => f.operator))],
      };
    })
    .filter((r) => r.n > 0);
  const operators = new Set(feedback.map((f) => f.operator)).size;

  return (
    <>
      <div className="title-row">
        <div>
          <h1>Shortlist export</h1>
          <p className="finding">
            {briefs.length
              ? `${briefs.length} ${briefs.length === 1 ? "company" : "companies"} in this export; ${withContact} with a contact route published by the company itself.`
              : "Nothing to export yet. Mark a company Shortlist on its brief."}
            {withDrafts > 0 && ` ${withDrafts} still ${withDrafts === 1 ? "has" : "have"} unchecked drafts, which the export leaves out.`}
            {missingQuestion > 0 && ` ${missingQuestion} ${missingQuestion === 1 ? "has" : "have"} no next diligence question.`}
          </p>
        </div>
        <div className="actions">
          <Link className="btn btn-ghost" href={withInvestigate ? "/export" : "/export?scope=with-investigate"}>
            {withInvestigate ? "Shortlist only" : "Include Investigate"}
          </Link>
          <a className={`btn btn-primary`} href={`/api/export${withInvestigate ? "?scope=with-investigate" : ""}`} aria-disabled={!briefs.length} download>
            Download CSV
          </a>
        </div>
      </div>

      <section className="card" aria-labelledby="preview-h">
        <div className="card-head">
          <h2 id="preview-h">What the file contains</h2>
          <span className="small muted">Approved facts only, each tagged verified, company claim or third-party</span>
        </div>
        {!briefs.length ? (
          <div className="empty">
            <p className="muted">The file would have a header row and nothing else.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Company</th>
                  <th scope="col">Location</th>
                  <th scope="col">Latest signal</th>
                  <th scope="col">Why it might fit</th>
                  <th scope="col">Contact route</th>
                  <th scope="col">Next diligence question</th>
                </tr>
              </thead>
              <tbody>
                {briefs.map((b) => {
                  const contact = (b.byField.contact_route ?? []).filter((f) => f.provenance === "verified");
                  return (
                    <tr key={b.company.id}>
                      <td style={{ minWidth: 150 }}>
                        <Link className="row-link" href={`/companies/${b.company.id}`}>
                          {b.company.name}
                        </Link>
                        <div style={{ marginTop: 4 }}>
                          <StatusPill status={b.company.status} />
                        </div>
                        {b.unknownFields.length > 0 && <div className="small muted" style={{ marginTop: 4 }}>Unknown: {b.unknownFields.map((f) => FACT_FIELDS[f].toLowerCase()).join(", ")}</div>}
                      </td>
                      <td className="small">{b.byField.location?.map((f) => f.value).join("; ") ?? <span className="muted">Unknown</span>}</td>
                      <td className="small" style={{ minWidth: 200 }}>
                        {b.latestSignal ? (
                          <>
                            {b.latestSignal.fact.value}
                            <div className="muted num">
                              {fmtDate(b.latestSignal.date)}
                              {b.latestSignal.source && (
                                <>
                                  {" · "}
                                  <a href={b.latestSignal.source.url} rel="noopener noreferrer" target="_blank">
                                    source
                                  </a>
                                </>
                              )}
                            </div>
                          </>
                        ) : (
                          <span className="muted">Unknown</span>
                        )}
                      </td>
                      <td className="small" style={{ minWidth: 200 }}>{b.why}</td>
                      <td className="small">{contact.length ? contact.map((f) => <div key={f.id}>{f.value}</div>) : <span className="muted">None verified</span>}</td>
                      <td className="small" style={{ minWidth: 220 }}>{b.company.nextQuestion || <span className="muted">—</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card" style={{ marginTop: 24 }} aria-labelledby="test-h">
        <div className="card-head">
          <h2 id="test-h">Operator test</h2>
          <span className="small muted">
            {operators} of 3 operators · {tested.length} of 5 briefs answered
          </span>
        </div>
        <div className="card-body" style={{ paddingBottom: tested.length ? 8 : 20 }}>
          <p>
            Before expanding: show five briefs to three London fund operators and record, on each brief, whether they knew the company, whether it is relevant, and whether
            it is worth investigating.
          </p>
        </div>
        {tested.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Brief</th>
                  <th scope="col" className="r">Answers</th>
                  <th scope="col" className="r">New to them</th>
                  <th scope="col" className="r">Relevant</th>
                  <th scope="col" className="r">Worth investigating</th>
                  <th scope="col">Operators</th>
                </tr>
              </thead>
              <tbody>
                {tested.map((r) => (
                  <tr key={r.c.id}>
                    <td>
                      <Link className="row-link" href={`/companies/${r.c.id}#operator-test`}>
                        {r.c.name}
                      </Link>
                    </td>
                    <td className="r num">{r.n}</td>
                    <td className="r num">{r.unfamiliar} of {r.n}</td>
                    <td className="r num">
                      {r.relevant} of {r.n}
                      {r.partly > 0 && <span className="muted"> (+{r.partly} partly)</span>}
                    </td>
                    <td className="r num">{r.worth} of {r.n}</td>
                    <td className="small muted">{r.operators.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
