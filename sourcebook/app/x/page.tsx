import Link from "next/link";
import { addThesisSearchesAction, addXSearchAction, deleteXSearchAction, dismissXPostAction } from "../actions";
import { findCompanyMatches } from "@/lib/dedupe";
import { findTerm } from "@/lib/match";
import { dismissedXPosts, getThesis, listCompanies, listSources, listXSearches, markXSearchRun } from "@/lib/repo";
import { normalizeUrl } from "@/lib/url";
import { hasXApi, searchRecent, thesisQueries, type XCandidate } from "@/lib/x";
import { fmtDate } from "@/components/ui";

export const metadata = { title: "X signals" };

const xSearchLink = (q: string) => `https://x.com/search?q=${encodeURIComponent(q)}&f=live`;

export default async function XPage({ searchParams }: { searchParams: Promise<{ search?: string; run?: string; error?: string }> }) {
  const sp = await searchParams;
  const [searches, thesis] = await Promise.all([listXSearches(), getThesis()]);
  const api = hasXApi();
  const selected = searches.find((s) => String(s.id) === sp.search) ?? searches[0] ?? null;
  const suggested = thesisQueries(thesis);

  let results: XCandidate[] | null = null;
  let runError: string | null = null;
  let runNote: string | undefined;
  if (api && selected && sp.run === "1") {
    try {
      const r = await searchRecent(selected.query);
      results = r.posts;
      runNote = r.note;
      await markXSearchRun(selected.id, r.posts.length);
    } catch (e) {
      runError = (e as Error).message;
    }
  }

  const [sources, companies, dismissed] = await Promise.all([listSources(), listCompanies(), dismissedXPosts()]);
  const captured = new Map(sources.map((s) => [s.normalizedUrl, s.companyId]));
  const companyName = new Map(companies.map((c) => [c.id, c.name]));
  const places = thesis.geographies.filter((g) => g.toLowerCase() !== "europe");
  const shown = results?.filter((p) => !dismissed.has(p.id)) ?? null;
  const hiddenCount = (results?.length ?? 0) - (shown?.length ?? 0);

  const finding = !api
    ? "Reading a post works now: paste any X link into Add a link and its text, author and date fill in. Searching X needs your fund's own X API token."
    : !searches.length
      ? "Save a search to start. The thesis can write the first ones."
      : results
        ? `${shown!.length} ${shown!.length === 1 ? "post" : "posts"} from the last 7 days for “${selected!.label}”${hiddenCount ? `, ${hiddenCount} dismissed earlier hidden` : ""}. Capture the ones about a company; the rest are noise.`
        : "Run a saved search to see the last 7 days of posts. Each run is a paid read on your X API plan.";

  return (
    <>
      <div className="title-row">
        <div>
          <h1>X signals</h1>
          <p className="finding">{finding}</p>
        </div>
        <div className="actions">
          <Link className="btn btn-secondary" href="/intake">
            Paste an X link
          </Link>
          {api && selected && (
            <Link className="btn btn-primary" href={`/x?search=${selected.id}&run=1`}>
              Run “{selected.label.length > 28 ? selected.label.slice(0, 27) + "…" : selected.label}”
            </Link>
          )}
        </div>
      </div>

      {sp.error === "query" && (
        <div className="notice" role="alert" style={{ marginBottom: 16 }}>
          Write a search query before saving.
        </div>
      )}

      <div className="brief-grid">
        <div className="stack">
          {!api && (
            <section className="card" aria-labelledby="setup-h">
              <div className="card-head">
                <h2 id="setup-h">Connect the X API</h2>
              </div>
              <div className="card-body prose" style={{ maxWidth: "none" }}>
                <p>
                  Searching X goes through X&rsquo;s own API with your fund&rsquo;s token, under X&rsquo;s developer terms. Sourcebook does not scrape X or read logged-in pages.
                </p>
                <ul>
                  <li>
                    Create a project and app at <a href="https://developer.x.com" rel="noopener noreferrer" target="_blank">developer.x.com</a> on a plan that includes recent search.
                  </li>
                  <li>
                    Put the app&rsquo;s bearer token in <code>.env.local</code> as <code>X_BEARER_TOKEN=…</code> (or in Vercel&rsquo;s environment settings) and restart.
                  </li>
                  <li>Until then, open the searches below on x.com yourself and paste the posts worth keeping into Add a link.</li>
                </ul>
              </div>
            </section>
          )}

          {runError && (
            <div className="notice" role="alert">
              {runError}
            </div>
          )}

          {shown && (
            <section className="card" aria-labelledby="results-h">
              <div className="card-head">
                <h2 id="results-h">Posts</h2>
                <span className="small muted num">
                  {shown.length}
                  {runNote ? ` · ${runNote}` : ""}
                </span>
              </div>
              {!shown.length ? (
                <div className="card-body muted">Nothing new. Narrow or widen the query on the right.</div>
              ) : (
                <div className="facts">
                  {shown.map((p) => {
                    const already = captured.get(normalizeUrl(p.url) ?? "");
                    const loc = places.map((g) => (findTerm(p.authorLocation, g) || findTerm(p.authorBio, g) ? g : null)).find(Boolean);
                    const known = p.authorWebsite ? findCompanyMatches({ name: null, website: p.authorWebsite }, companies)[0] : undefined;
                    return (
                      <article className="draft" key={p.id} aria-label={`Post by @${p.handle}`}>
                        <div className="fact-meta">
                          <span style={{ color: "var(--text)", fontWeight: 500 }}>{p.authorName || p.handle}</span>
                          <a href={`https://x.com/${p.handle}`} rel="noopener noreferrer" target="_blank">
                            @{p.handle}
                          </a>
                          <span className="num">{fmtDate(p.date)}</span>
                          {p.authorLocation && <span>{p.authorLocation}</span>}
                          {loc && <span className="res-match">location names {loc}</span>}
                        </div>
                        <div className="fact-value" style={{ whiteSpace: "pre-line" }}>{p.text}</div>
                        {(p.authorBio || p.authorWebsite) && (
                          <div className="small muted">
                            {p.authorBio}
                            {p.authorWebsite && (
                              <>
                                {p.authorBio ? " · " : ""}
                                {p.authorWebsite.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                              </>
                            )}
                          </div>
                        )}
                        <div className="draft-actions">
                          {already ? (
                            <Link className="btn btn-ghost btn-sm" href={`/companies/${already}`}>
                              Captured for {companyName.get(already)}
                            </Link>
                          ) : (
                            <Link className="btn btn-primary btn-sm" href={`/intake?url=${encodeURIComponent(p.url)}${known ? `&company=${known.id}` : ""}`}>
                              Capture{known ? ` for ${known.name}` : ""}
                            </Link>
                          )}
                          <a className="btn btn-secondary btn-sm" href={p.url} rel="noopener noreferrer" target="_blank">
                            Open on X
                          </a>
                          {!already && (
                            <form action={dismissXPostAction}>
                              <input type="hidden" name="postId" value={p.id} />
                              <button className="btn-link small" type="submit">
                                Not relevant
                              </button>
                            </form>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          <section className="card" aria-labelledby="how-h">
            <div className="card-head">
              <h2 id="how-h">From a post to a brief</h2>
            </div>
            <div className="card-body prose" style={{ maxWidth: "none" }}>
              <ul>
                <li>A captured post keeps its exact text, author and date, read from X&rsquo;s public embed of that post.</li>
                <li>It becomes a draft signal, marked as a company claim. Check that the author is the company or a founder; otherwise mark it third-party.</li>
                <li>Then add the company&rsquo;s site and one primary record. A post on its own is a lead, not a brief.</li>
                <li>Only captured posts are stored. Search results and dismissed post IDs are the only other things kept.</li>
              </ul>
            </div>
          </section>
        </div>

        <aside className="rail stack" aria-label="Saved searches">
          <section className="card" aria-labelledby="searches-h">
            <div className="card-head">
              <h2 id="searches-h">Saved searches</h2>
              <span className="small muted num">{searches.length}</span>
            </div>
            {searches.length ? (
              <ul className="history" style={{ padding: "0 var(--pad) 16px", fontSize: 14, color: "var(--text)", gap: 12 }}>
                {searches.map((s) => (
                  <li key={s.id} style={{ display: "grid", gap: 4 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <Link href={`/x?search=${s.id}`} aria-current={selected?.id === s.id ? "true" : undefined} style={{ fontWeight: selected?.id === s.id ? 600 : 400 }}>
                        {s.label}
                      </Link>
                      <span className="small muted num" style={{ whiteSpace: "nowrap" }}>
                        {s.lastRunAt ? `${s.lastCount} · ${fmtDate(s.lastRunAt.slice(0, 10))}` : "Not run"}
                      </span>
                    </div>
                    <code className="small muted" style={{ overflowWrap: "anywhere" }}>{s.query}</code>
                    <div className="draft-actions">
                      <a className="btn-link small" href={xSearchLink(s.query)} rel="noopener noreferrer" target="_blank">
                        Open on x.com
                      </a>
                      <form action={deleteXSearchAction}>
                        <input type="hidden" name="searchId" value={s.id} />
                        <button className="btn-link small" type="submit">
                          Delete
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="card-body">
                <p className="muted" style={{ marginBottom: 12 }}>
                  One search per thesis sector: its keywords plus the words founders use when something happened (launching, first customer, pilot, hiring).
                </p>
                <form action={addThesisSearchesAction}>
                  <button className="btn btn-primary" type="submit">
                    Create {suggested.length} from the thesis
                  </button>
                </form>
              </div>
            )}
          </section>

          <section className="card" aria-labelledby="new-h">
            <div className="card-head">
              <h2 id="new-h">New search</h2>
            </div>
            <form action={addXSearchAction} className="card-body" key={`new-${searches.length}`}>
              <div className="field">
                <label htmlFor="xs-label">Name</label>
                <input id="xs-label" name="label" type="text" placeholder="Grid founders launching" />
              </div>
              <div className="field">
                <label htmlFor="xs-q">Query</label>
                <textarea id="xs-q" name="query" style={{ minHeight: 88 }} aria-describedby="xs-q-hint" defaultValue={searches.length ? "" : suggested[0]?.query ?? ""} />
                <span id="xs-q-hint" className="hint">
                  X search operators: OR, &quot;exact phrase&quot;, -is:retweet, from:handle, lang:en. Up to 512 characters.
                </span>
              </div>
              <div style={{ marginTop: 16 }}>
                <button className="btn btn-secondary" type="submit">
                  Save search
                </button>
              </div>
            </form>
          </section>
        </aside>
      </div>
    </>
  );
}
