import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addFactAction,
  addSourceAction,
  aiDraftAction,
  approveSourceDraftsAction,
  decideFactAction,
  deleteCompanyAction,
  deleteSourceAction,
  feedbackAction,
  fetchSourceAction,
  reopenFactAction,
  reviewAction,
} from "../../actions";
import { buildBrief } from "@/lib/brief";
import { getCompany, getThesis, listFacts, listFeedback, listReviewEvents, listSources } from "@/lib/repo";
import { CORE_FIELDS, FACT_FIELDS, PROVENANCE, PROVENANCE_HELP, REVIEW_STATUSES, SOURCE_KINDS, type Fact, type FactField, type Source } from "@/lib/types";
import { Prov, ProvMark, StatusPill, fmtDate } from "@/components/ui";

const SECONDARY: FactField[] = ["team", "founded", "legal_entity", "traction_claim", "backers", "stage", "contact_route", "other"];
const UNKNOWN_TEXT: Partial<Record<FactField, string>> = {
  stage: "No source states a stage or a round. Not assumed from team size, age or accelerator.",
  traction_claim: "No source states revenue, users or contracts.",
  backers: "No source names investors.",
  contact_route: "No published contact route recorded.",
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const c = await getCompany(Number((await params).id));
  return { title: c ? `${c.name} brief` : "Brief" };
}

export default async function BriefPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ msg?: string; error?: string; added?: string }> }) {
  const companyId = Number((await params).id);
  const { msg, error, added } = await searchParams;
  const company = Number.isInteger(companyId) ? await getCompany(companyId) : null;
  if (!company) notFound();
  const [thesis, facts, sources, events, feedback] = await Promise.all([getThesis(), listFacts(companyId), listSources(companyId), listReviewEvents(companyId), listFeedback(companyId)]);
  const b = buildBrief(company, facts, sources, thesis);
  const srcById = new Map(sources.map((s) => [s.id, s]));
  const hasAI = !!process.env.ANTHROPIC_API_KEY;
  const verifiedCount = b.approved.filter((f) => f.provenance === "verified").length;

  const unknownCore = b.unknownFields.map((f) => FACT_FIELDS[f].toLowerCase());
  const finding = b.drafts.length
    ? `${b.drafts.length} draft ${b.drafts.length === 1 ? "fact needs" : "facts need"} checking before this brief can be shown.${unknownCore.length ? ` Still unknown: ${unknownCore.join(", ")}.` : ""}`
    : unknownCore.length
      ? `Still unknown: ${unknownCore.join(", ")}.`
      : `${b.approved.length} approved facts from ${sources.length} ${sources.length === 1 ? "source" : "sources"}; ${verifiedCount} verified against a primary record.`;

  return (
    <>
      <div className="title-row">
        <div>
          <div className="crumbs no-print">
            <Link href="/">Review queue</Link> /
          </div>
          <h1>
            {company.name}{" "}
            <span style={{ verticalAlign: 4 }}>
              <StatusPill status={company.status} />
            </span>
          </h1>
          <p className="finding">{finding}</p>
          <p className="small muted" style={{ marginTop: 4 }}>
            {company.website ? (
              <a href={company.website} rel="noopener noreferrer" target="_blank">
                {company.domain}
              </a>
            ) : (
              "No website recorded"
            )}{" "}
            · {dateLine(sources)} · Captured{" "}
            {fmtDate(sources.map((s) => s.capturedOn).sort().at(-1) ?? null, "—")}
          </p>
        </div>
        <div className="actions no-print">
          <Link className="btn btn-secondary" href={`/intake?company=${company.id}`}>
            Add a link
          </Link>
          <a className="btn btn-primary" href="#review">
            Decide
          </a>
        </div>
      </div>

      <Flash msg={msg} error={error} added={added} />

      <div className="brief-grid">
        <div className="stack">
          {/* ---------- The brief */}
          <section className="card" id="brief" aria-labelledby="brief-h">
            <div className="card-head">
              <h2 id="brief-h">Brief</h2>
              <span className="small muted">Approved facts only</span>
            </div>
            <div className="facts">
              {CORE_FIELDS.map((f) => (
                <FactRow key={f} field={f} facts={b.byField[f] ?? []} drafts={b.drafts.filter((d) => d.field === f).length} srcById={srcById} companyId={company.id} />
              ))}
            </div>
          </section>

          <section className="card" aria-labelledby="record-h">
            <div className="card-head">
              <h2 id="record-h">Also on record</h2>
            </div>
            <div className="facts">
              {SECONDARY.filter((f) => f !== "other" || b.byField.other?.length).map((f) => (
                <FactRow key={f} field={f} facts={b.byField[f] ?? []} drafts={b.drafts.filter((d) => d.field === f).length} srcById={srcById} companyId={company.id} />
              ))}
            </div>
          </section>

          {/* ---------- Drafts */}
          <section className="card no-print" id="drafts" aria-labelledby="drafts-h">
            <div className="card-head">
              <h2 id="drafts-h">Drafts to check</h2>
              <span className="small muted num">{b.drafts.length}</span>
            </div>
            {!b.drafts.length ? (
              <div className="card-body muted">
                Nothing waiting. {hasAI ? "Draft facts from a source below, or add one by hand." : "Add facts by hand below, or fetch a page's own description from a source."}
              </div>
            ) : (
              <DraftList drafts={b.drafts} srcById={srcById} companyId={company.id} />
            )}
          </section>

          {/* ---------- Sources */}
          <section className="card" id="sources" aria-labelledby="sources-h">
            <div className="card-head">
              <h2 id="sources-h">Sources</h2>
              <span className="small muted num">{sources.length}</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Source</th>
                    <th scope="col">Kind</th>
                    <th scope="col">Published</th>
                    <th scope="col" className="r">
                      Facts
                    </th>
                    <th scope="col" className="no-print">
                      <span className="visually-hidden">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sources.map((s) => {
                    const n = facts.filter((f) => f.sourceId === s.id && f.status === "approved").length;
                    const d = facts.filter((f) => f.sourceId === s.id && f.status === "draft").length;
                    return (
                      <tr key={s.id}>
                        <td style={{ minWidth: 240 }}>
                          <a href={s.url} rel="noopener noreferrer" target="_blank">
                            {s.title || s.url}
                          </a>
                          <div className="small muted">
                            {s.author || "Author not recorded"} · captured {fmtDate(s.capturedOn)}
                          </div>
                          {s.notes && <div className="small muted">{s.notes}</div>}
                        </td>
                        <td className="small">{SOURCE_KINDS[s.kind]}</td>
                        <td className="small num" style={{ whiteSpace: "nowrap" }}>
                          {s.publishedOn ? fmtDate(s.publishedOn) : <span className="muted">Undated</span>}
                        </td>
                        <td className="r num small">
                          {n}
                          {d > 0 && <span className="muted"> + {d} draft</span>}
                        </td>
                        <td className="no-print">
                          <div className="draft-actions" style={{ justifyContent: "flex-end" }}>
                            <form action={fetchSourceAction}>
                              <input type="hidden" name="companyId" value={company.id} />
                              <input type="hidden" name="sourceId" value={s.id} />
                              <button className="btn btn-ghost btn-sm" type="submit" title={s.kind === "x_post" ? "Read the post's text, author and date from X" : "Read the page's title, date and own description"}>
                                {s.kind === "x_post" ? "Read post" : "Fetch details"}
                              </button>
                            </form>
                            {hasAI && (
                              <form action={aiDraftAction}>
                                <input type="hidden" name="companyId" value={company.id} />
                                <input type="hidden" name="sourceId" value={s.id} />
                                <button className="btn btn-ghost btn-sm" type="submit" title="Claude proposes facts; each must quote this source">
                                  Draft with Claude
                                </button>
                              </form>
                            )}
                            <form action={deleteSourceAction}>
                              <input type="hidden" name="companyId" value={company.id} />
                              <input type="hidden" name="sourceId" value={s.id} />
                              <button className="btn-link small" type="submit">
                                Remove
                              </button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!sources.length && (
                    <tr>
                      <td colSpan={5} className="muted">
                        No sources. A brief without a source is not a brief.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* ---------- Add a fact */}
          <details className="card no-print fold" id="add-fact" open={!b.approved.length && !b.drafts.length}>
            <summary>Add a fact by hand</summary>
            <form action={addFactAction} className="card-body">
              <p className="small muted" style={{ marginBottom: 16 }}>With a source it counts at once; without one it waits as a draft.</p>
              <input type="hidden" name="companyId" value={company.id} />
              <div className="row-2">
                <div className="field">
                  <label htmlFor="f-field">Brief field</label>
                  <select id="f-field" name="field" defaultValue={b.unknownFields[0] ?? "product"}>
                    {Object.entries(FACT_FIELDS).map(([k, l]) => (
                      <option key={k} value={k}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field" style={{ marginTop: 0 }}>
                  <label htmlFor="f-source">Source</label>
                  <select id="f-source" name="sourceId" defaultValue={sources[0]?.id ?? ""}>
                    <option value="">No source yet</option>
                    {sources.map((s) => (
                      <option key={s.id} value={s.id}>
                        {(s.title || s.url).slice(0, 70)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="field" style={{ marginTop: 16 }}>
                <label htmlFor="f-value">Fact, in your words</label>
                <input id="f-value" name="value" type="text" required />
              </div>
              <div className="field">
                <label htmlFor="f-quote">Quote from the source</label>
                <textarea id="f-quote" name="quote" style={{ minHeight: 64 }} aria-describedby="f-quote-hint" />
                <span id="f-quote-hint" className="hint">
                  Copied word for word, so anyone can find it on the page.
                </span>
              </div>
              <fieldset className="field" style={{ border: 0, padding: 0, margin: "16px 0 0" }}>
                <legend style={{ fontWeight: 500, marginBottom: 6 }}>Who says so</legend>
                {Object.entries(PROVENANCE).map(([k, l]) => (
                  <label className="check" key={k}>
                    <input type="radio" name="provenance" value={k} defaultChecked={k === "company_claim"} />
                    <span>
                      <ProvMark p={k as keyof typeof PROVENANCE} /> {l} <span className="hint">— {PROVENANCE_HELP[k as keyof typeof PROVENANCE]}</span>
                    </span>
                  </label>
                ))}
              </fieldset>
              <div className="field">
                <label htmlFor="f-note">What to check</label>
                <input id="f-note" name="note" type="text" placeholder="Optional" />
              </div>
              <div style={{ marginTop: 16 }}>
                <button className="btn btn-primary" type="submit">
                  Add fact
                </button>
              </div>
            </form>
          </details>

          {/* ---------- Add a source */}
          <details className="card no-print fold">
            <summary>Add a source to this company</summary>
            <form action={addSourceAction} className="card-body">
              <input type="hidden" name="companyId" value={company.id} />
              <div className="row-2">
                <div className="field">
                  <label htmlFor="s-url">Web address</label>
                  <input id="s-url" name="url" type="url" required />
                </div>
                <div className="field" style={{ marginTop: 0 }}>
                  <label htmlFor="s-kind">Kind</label>
                  <select id="s-kind" name="kind" defaultValue="company_website">
                    {Object.entries(SOURCE_KINDS).map(([k, l]) => (
                      <option key={k} value={k}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="row-2" style={{ marginTop: 16 }}>
                <div className="field">
                  <label htmlFor="s-date">Published on</label>
                  <input id="s-date" name="publishedOn" type="date" />
                </div>
                <div className="field" style={{ marginTop: 0 }}>
                  <label htmlFor="s-author">Author or publisher</label>
                  <input id="s-author" name="author" type="text" />
                </div>
              </div>
              <div className="field" style={{ marginTop: 16 }}>
                <label htmlFor="s-excerpt">What it says</label>
                <textarea id="s-excerpt" name="excerpt" style={{ minHeight: 64 }} />
              </div>
              <p className="small muted" style={{ marginTop: 8 }}>
                For a new company or a duplicate check across the workspace, use <Link href={`/intake?company=${company.id}`}>Add a link</Link>.
              </p>
              <div style={{ marginTop: 12 }}>
                <button className="btn btn-secondary" type="submit">
                  Add source
                </button>
              </div>
            </form>
          </details>

          {b.rejected.length > 0 && (
            <section className="card no-print" aria-labelledby="rejected-h">
              <div className="card-head">
                <h2 id="rejected-h">Rejected drafts</h2>
                <span className="small muted num">{b.rejected.length}</span>
              </div>
              <div className="card-body">
                <ul className="history">
                  {b.rejected.map((f) => (
                    <li key={f.id} style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
                      <span>
                        <b style={{ color: "var(--text)", fontWeight: 500 }}>{FACT_FIELDS[f.field]}:</b> {f.value}
                      </span>
                      <form action={reopenFactAction}>
                        <input type="hidden" name="companyId" value={company.id} />
                        <input type="hidden" name="factId" value={f.id} />
                        <button className="btn-link" type="submit">
                          Reopen
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}
        </div>

        {/* ---------- Rail */}
        <aside className="rail stack" aria-label="Thesis fit and decision">
          <section className="card" aria-labelledby="fit-h">
            <div className="card-head">
              <h2 id="fit-h">Thesis fit</h2>
              <Link className="small muted no-print" href="/thesis">
                Edit thesis
              </Link>
            </div>
            {b.checks.map((c) => (
              <div className="check-row" key={c.criterion}>
                <div>
                  <div className="small muted">{c.label}</div>
                  <div className={`check-result res-${c.result}`}>{{ match: "Matches", no_match: "No match", unknown: "Unknown", flagged: "Flagged", clear: "Clear" }[c.result]}</div>
                </div>
                <div className="small">
                  {c.explanation}
                  {c.evidence.length > 0 && (
                    <ul className="evidence">
                      {c.evidence.slice(0, 3).map((e, i) => (
                        <li key={i}>
                          <b>“{e.term}”</b> in {FACT_FIELDS[e.field].toLowerCase()}: {e.excerpt}
                        </li>
                      ))}
                      {c.evidence.length > 3 && <li>and {c.evidence.length - 3} more</li>}
                    </ul>
                  )}
                </div>
              </div>
            ))}
            <div className="why">
              <div className="small muted">Why it might fit</div>
              <p style={{ marginTop: 2 }}>{b.why}</p>
            </div>
          </section>

          <section className="card" id="review" aria-labelledby="review-h">
            <div className="card-head">
              <h2 id="review-h">Decision</h2>
              {company.reviewedAt && <span className="small muted num">{fmtDate(company.reviewedAt.slice(0, 10))}</span>}
            </div>
            <form action={reviewAction} className="card-body">
              <input type="hidden" name="companyId" value={company.id} />
              <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
                <legend className="visually-hidden">Review status</legend>
                <div className="status-options">
                  {(["investigate", "shortlist", "monitor", "known", "reject", "new"] as const).map((k) => (
                    <label key={k}>
                      <input type="radio" name="status" value={k} defaultChecked={company.status === k} /> {REVIEW_STATUSES[k]}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="field" style={{ marginTop: 16 }}>
                <label htmlFor="r-note">Reason</label>
                <input id="r-note" name="note" type="text" defaultValue={company.statusNote} placeholder="One line, for the record" />
              </div>
              <div className="field">
                <label htmlFor="r-q">Next diligence question</label>
                <textarea id="r-q" name="nextQuestion" defaultValue={company.nextQuestion} style={{ minHeight: 96 }} />
              </div>
              {b.drafts.length > 0 && (
                <p className="small" style={{ marginTop: 12, color: "var(--warning)" }}>
                  {b.drafts.length} {b.drafts.length === 1 ? "draft is" : "drafts are"} not yet part of this brief.
                </p>
              )}
              <div style={{ marginTop: 16 }}>
                <button className="btn btn-primary" type="submit">
                  Save decision
                </button>
              </div>
            </form>
            {events.length > 0 && (
              <div className="card-body" style={{ paddingTop: 0 }}>
                <ul className="history">
                  {events.map((e) => (
                    <li key={e.id}>
                      <span className="num">{fmtDate(e.at.slice(0, 10))}</span> · {e.fromStatus ? REVIEW_STATUSES[e.fromStatus] : "—"} → {REVIEW_STATUSES[e.toStatus]}
                      {e.note && ` — ${e.note}`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section className="card" id="operator-test" aria-labelledby="op-h">
            <div className="card-head">
              <h2 id="op-h">Operator test</h2>
              <span className="small muted num">{feedback.length} {feedback.length === 1 ? "answer" : "answers"}</span>
            </div>
            {feedback.length > 0 && (
              <div className="card-body" style={{ paddingBottom: 12 }}>
                <ul className="history">
                  {feedback.map((f) => (
                    <li key={f.id}>
                      <b style={{ color: "var(--text)", fontWeight: 500 }}>{f.operator}</b> · {f.familiar === "yes" ? "knew it" : "new to them"} · relevant: {f.relevant} · worth investigating: {f.worthInvestigating}
                      {f.comment && <div>“{f.comment}”</div>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <form action={feedbackAction} className="card-body no-print">
              <input type="hidden" name="companyId" value={company.id} />
              <div className="field">
                <label htmlFor="o-name">Operator</label>
                <input id="o-name" name="operator" type="text" placeholder="Name or initials" required />
              </div>
              <Choice name="familiar" legend="Had they heard of it?" options={[["yes", "Yes"], ["no", "No"]]} />
              <Choice name="relevant" legend="Relevant to their fund?" options={[["yes", "Yes"], ["partly", "Partly"], ["no", "No"]]} />
              <Choice name="worth" legend="Worth investigating?" options={[["yes", "Yes"], ["no", "No"]]} />
              <div className="field">
                <label htmlFor="o-c">What they said</label>
                <input id="o-c" name="comment" type="text" placeholder="Optional" />
              </div>
              <div style={{ marginTop: 16 }}>
                <button className="btn btn-secondary" type="submit">
                  Record answer
                </button>
              </div>
            </form>
          </section>

          <form action={deleteCompanyAction} className="no-print" style={{ padding: "0 4px" }}>
            <input type="hidden" name="companyId" value={company.id} />
            <button className="btn-link small" type="submit">
              Delete this company and its sources
            </button>
          </form>
        </aside>
      </div>
    </>
  );
}

function dateLine(sources: Source[]) {
  const dated = sources.map((s) => s.publishedOn).filter((d): d is string => !!d).sort();
  if (!sources.length) return "No sources";
  if (!dated.length) return "No source carries a publication date";
  const range = dated[0] === dated.at(-1) ? fmtDate(dated[0]) : `${fmtDate(dated[0])} to ${fmtDate(dated.at(-1))}`;
  return `${dated.length} of ${sources.length} ${sources.length === 1 ? "source" : "sources"} dated, ${range}`;
}

function Choice({ name, legend, options }: { name: string; legend: string; options: [string, string][] }) {
  return (
    <fieldset style={{ border: 0, padding: 0, margin: "16px 0 0" }}>
      <legend style={{ fontWeight: 500, marginBottom: 6 }}>{legend}</legend>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {options.map(([v, l], i) => (
          <label className="check" key={v}>
            <input type="radio" name={name} value={v} required={i === 0} /> {l}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function SourceLine({ f, srcById }: { f: Fact; srcById: Map<number, Source> }) {
  const s = f.sourceId ? srcById.get(f.sourceId) : null;
  return (
    <div className="fact-meta">
      <Prov p={f.provenance} />
      {s ? (
        <>
          <a href={s.url} rel="noopener noreferrer" target="_blank">
            {s.author || SOURCE_KINDS[s.kind]}
          </a>
          <span className="num">{s.publishedOn ? fmtDate(s.publishedOn) : "undated"}</span>
        </>
      ) : (
        <span>No source</span>
      )}
      {f.origin === "ai_draft" && <span>drafted by Claude, approved by a person</span>}
    </div>
  );
}

function FactRow({ field, facts, drafts, srcById, companyId }: { field: FactField; facts: Fact[]; drafts: number; srcById: Map<number, Source>; companyId: number }) {
  return (
    <div className="fact-row">
      <div className="fact-label">{FACT_FIELDS[field]}</div>
      <div>
        {facts.length ? (
          facts.map((f) => (
            <div className="fact" key={f.id}>
              <div className="fact-value">{f.value}</div>
              <SourceLine f={f} srcById={srcById} />
              {f.note && <div className="note">{f.note}</div>}
              {f.quote && (
                <details>
                  <summary>Quote</summary>
                  <blockquote className="quote">{f.quote}</blockquote>
                  <form action={reopenFactAction} className="no-print" style={{ marginTop: 6 }}>
                    <input type="hidden" name="companyId" value={companyId} />
                    <input type="hidden" name="factId" value={f.id} />
                    <button className="btn-link small" type="submit">
                      Wrong? Send back to drafts
                    </button>
                  </form>
                </details>
              )}
            </div>
          ))
        ) : (
          <span className="unknown">
            <ProvMark p="unknown" /> Unknown{UNKNOWN_TEXT[field] ? `. ${UNKNOWN_TEXT[field]}` : ""}
            {drafts > 0 && (
              <a className="small" href="#drafts">
                {drafts} draft{drafts > 1 ? "s" : ""} to check
              </a>
            )}
          </span>
        )}
      </div>
    </div>
  );
}

function DraftList({ drafts, srcById, companyId }: { drafts: Fact[]; srcById: Map<number, Source>; companyId: number }) {
  const bySource = new Map<number | null, Fact[]>();
  for (const d of drafts) bySource.set(d.sourceId, [...(bySource.get(d.sourceId) ?? []), d]);
  return (
    <>
      {[...bySource.entries()].map(([sid, list]) => {
        const s = sid ? srcById.get(sid) : null;
        return (
          <div key={sid ?? "none"}>
            <div className="draft" style={{ background: "#fafbfc", gridTemplateColumns: "1fr auto", alignItems: "center" }}>
              <div className="small">
                From{" "}
                {s ? (
                  <a href={s.url} rel="noopener noreferrer" target="_blank">
                    {s.title || s.url}
                  </a>
                ) : (
                  "no source"
                )}
                <span className="muted"> · open it and compare each quote</span>
              </div>
              {s && list.length > 1 && (
                <form action={approveSourceDraftsAction}>
                  <input type="hidden" name="companyId" value={companyId} />
                  <input type="hidden" name="sourceId" value={s.id} />
                  <button className="btn btn-ghost btn-sm" type="submit">
                    Approve all {list.length} as checked
                  </button>
                </form>
              )}
            </div>
            {list.map((f) => (
              <div className="draft" key={f.id}>
                <div className="fact-meta">
                  <span style={{ color: "var(--text)", fontWeight: 500 }}>{FACT_FIELDS[f.field]}</span>
                  <span>{f.origin === "ai_draft" ? "Drafted by Claude" : f.origin === "page_metadata" ? "From the page's own description" : "Drafted by a researcher"}</span>
                </div>
                <div className="fact-value">{f.value}</div>
                {f.quote && <blockquote className="quote">{f.quote}</blockquote>}
                {f.note && <div className="note">{f.note}</div>}
                <form action={decideFactAction} className="draft-actions">
                  <input type="hidden" name="companyId" value={companyId} />
                  <input type="hidden" name="factId" value={f.id} />
                  <label className="visually-hidden" htmlFor={`p-${f.id}`}>
                    Who says so
                  </label>
                  <select id={`p-${f.id}`} name="provenance" defaultValue={f.provenance}>
                    {Object.entries(PROVENANCE).map(([k, l]) => (
                      <option key={k} value={k}>
                        {l}
                      </option>
                    ))}
                  </select>
                  <button className="btn btn-primary btn-sm" type="submit" name="decision" value="approve">
                    Approve
                  </button>
                  <button className="btn btn-secondary btn-sm" type="submit" name="decision" value="reject">
                    Reject
                  </button>
                </form>
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
}

function Flash({ msg, error, added }: { msg?: string; error?: string; added?: string }) {
  let text: string | null = null;
  let warn = false;
  if (added === "source") text = "Link saved. Add facts from it, or fetch the page's details.";
  if (added === "post") text = "Post saved with its exact text. It waits below as a draft signal: check the author is the company or a founder, then add the company's site and one primary record.";
  if (msg === "saved") text = "Decision saved.";
  if (msg === "feedback") text = "Answer recorded.";
  if (msg?.startsWith("fetched:")) {
    const [, n, dated] = msg.split(":");
    text = `Page read. ${n === "0" ? "No new draft" : `${n} new draft`}${dated === "dated" ? "; publication date taken from the page." : "; the page carries no publication date."}`;
  }
  if (msg?.startsWith("ai:")) {
    const [, n, dropped] = msg.split(":");
    text = `Claude proposed ${n} new ${n === "1" ? "draft" : "drafts"}.${dropped !== "0" ? ` ${dropped} discarded because the quote was not on the page.` : ""} Check each one.`;
  }
  if (msg?.startsWith("fetchfail:") || msg?.startsWith("aifail:")) {
    warn = true;
    text = `Could not read it: ${decodeURIComponent(msg.split(":").slice(1).join(":"))}`;
  }
  if (error === "url") (warn = true), (text = "That is not a web address.");
  if (error === "fact") (warn = true), (text = "Write the fact before adding it.");
  if (error === "operator") (warn = true), (text = "Name the operator so answers can be told apart.");
  if (!text) return null;
  return (
    <div className={`notice ${warn ? "" : "notice-info"} no-print`} role="status" style={{ marginBottom: 16 }}>
      {text}
    </div>
  );
}
