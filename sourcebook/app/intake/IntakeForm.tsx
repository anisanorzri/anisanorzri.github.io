"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { checkLinkAction, intakeAction, type IntakeState } from "../actions";
import { SOURCE_KINDS, type SourceKind } from "@/lib/types";
import { guessKind, xHandle } from "@/lib/url";

type C = { id: number; name: string; domain: string | null };

export function IntakeForm({ companies, defaultCompanyId }: { companies: C[]; defaultCompanyId: string }) {
  const [state, action, pending] = useActionState<IntakeState, FormData>(intakeAction, {});
  const v = state.values ?? {};
  const [url, setUrl] = useState(v.url ?? "");
  const [kind, setKind] = useState<SourceKind>((v.kind as SourceKind) ?? "other");
  const [kindTouched, setKindTouched] = useState(!!v.kind);
  const [author, setAuthor] = useState(v.author ?? "");
  const [companyId, setCompanyId] = useState(v.companyId ?? (defaultCompanyId || (companies.length ? "" : "new")));
  const [live, setLive] = useState<{ normalized: string | null; duplicates: { companyId: number; companyName: string }[] } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selected = companies.find((c) => String(c.id) === companyId);
  const guessed = useMemo(() => guessKind(url, selected?.domain), [url, selected?.domain]);
  useEffect(() => {
    if (!kindTouched) setKind(guessed);
  }, [guessed, kindTouched]);
  useEffect(() => {
    const h = xHandle(url);
    if (h && !author) setAuthor(h);
    if (timer.current) clearTimeout(timer.current);
    if (!url.trim()) return setLive(null);
    timer.current = setTimeout(async () => setLive(await checkLinkAction(url)), 350);
  }, [url]); // eslint-disable-line react-hooks/exhaustive-deps

  const dupNotice = state.sourceDuplicates ?? (live?.duplicates.length ? live.duplicates : null);

  return (
    <form action={action} className="settings" noValidate>
      <section className="settings-section" aria-labelledby="s-link">
        <div>
          <h2 id="s-link">The link</h2>
          <p className="desc">A founder post, a cohort or demo-day page, a company site or a registry record. Tracking parameters are ignored when checking for duplicates.</p>
        </div>
        <div className="panel">
          <div className="field">
            <label htmlFor="url">Web address</label>
            <input id="url" name="url" type="url" inputMode="url" autoComplete="off" required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://x.com/founder/status/…" aria-describedby="url-hint" />
            <span id="url-hint" className="hint" aria-live="polite">
              {live?.normalized ? `Checked as ${live.normalized}` : "Paste the full address."}
            </span>
          </div>
          {dupNotice && dupNotice.length > 0 && (
            <div className="notice" role="status" style={{ marginTop: 12 }}>
              Already captured for{" "}
              {dupNotice.map((d, i) => (
                <span key={d.companyId}>
                  {i > 0 && ", "}
                  <Link href={`/companies/${d.companyId}`}>{d.companyName}</Link>
                </span>
              ))}
              .
              {state.sourceDuplicates && (
                <label className="check" style={{ marginTop: 8 }}>
                  <input type="checkbox" name="confirmDuplicate" value="yes" /> This page is also about a different company. Add it again.
                </label>
              )}
            </div>
          )}
          <div className="row-2" style={{ marginTop: 16 }}>
            <div className="field">
              <label htmlFor="kind">Kind of source</label>
              <select id="kind" name="kind" value={kind} onChange={(e) => { setKind(e.target.value as SourceKind); setKindTouched(true); }}>
                {Object.entries(SOURCE_KINDS).map(([k, label]) => (
                  <option key={k} value={k}>{label}</option>
                ))}
              </select>
            </div>
            <div className="field" style={{ marginTop: 0 }}>
              <label htmlFor="publishedOn">Published on</label>
              <input id="publishedOn" name="publishedOn" type="date" defaultValue={v.publishedOn ?? ""} aria-describedby="date-hint" />
              <span id="date-hint" className="hint">Leave empty if the page shows no date. It will read as undated, not as today.</span>
            </div>
          </div>
          <div className="row-2" style={{ marginTop: 16 }}>
            <div className="field">
              <label htmlFor="author">Author or publisher</label>
              <input id="author" name="author" type="text" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="@handle, accelerator, publication" />
            </div>
            <div className="field" style={{ marginTop: 0 }}>
              <label htmlFor="title">Title</label>
              <input id="title" name="title" type="text" defaultValue={v.title ?? ""} placeholder="Optional. Fetched later if empty." />
            </div>
          </div>
          <div className="field" style={{ marginTop: 16 }}>
            <label htmlFor="excerpt">What the source says</label>
            <textarea id="excerpt" name="excerpt" defaultValue={v.excerpt ?? ""} placeholder="Paste the post or the passage word for word." aria-describedby="excerpt-hint" />
            <span id="excerpt-hint" className="hint">Copied text, not a summary. X posts cannot be read automatically, so for them this is the record. Quotes in the brief are checked against it.</span>
          </div>
        </div>
      </section>

      <section className="settings-section" aria-labelledby="s-company">
        <div>
          <h2 id="s-company">The company</h2>
          <p className="desc">Pick one already in the workspace, or name a new one. A new name is checked against existing companies by website and by spelling.</p>
        </div>
        <div className="panel">
          <div className="field">
            <label htmlFor="companyId">Company</label>
            <select id="companyId" name="companyId" value={companyId} onChange={(e) => setCompanyId(e.target.value)} required>
              <option value="" disabled>Choose…</option>
              <option value="new">A company not in the workspace yet</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}{c.domain ? ` (${c.domain})` : ""}</option>
              ))}
            </select>
          </div>
          {companyId === "new" && (
            <div className="row-2" style={{ marginTop: 16 }}>
              <div className="field">
                <label htmlFor="companyName">Company name</label>
                <input id="companyName" name="companyName" type="text" defaultValue={v.companyName ?? ""} autoComplete="off" />
              </div>
              <div className="field" style={{ marginTop: 0 }}>
                <label htmlFor="companyWebsite">Company website</label>
                <input id="companyWebsite" name="companyWebsite" type="url" inputMode="url" defaultValue={v.companyWebsite ?? ""} placeholder="Optional" />
              </div>
            </div>
          )}
          {state.companyMatches && state.companyMatches.length > 0 && (
            <div className="notice" role="alert" style={{ marginTop: 12 }}>
              This may be a company you already have:
              <ul>
                {state.companyMatches.map((m) => (
                  <li key={m.id}>
                    <Link href={`/companies/${m.id}`}>{m.name}</Link> — {m.reason}
                  </li>
                ))}
              </ul>
              <label className="check" style={{ marginTop: 8 }}>
                <input type="checkbox" name="confirmNewCompany" value="yes" /> It is a different company. Create it.
              </label>
            </div>
          )}
          <div className="field" style={{ marginTop: 16 }}>
            <label htmlFor="notes">Your note</label>
            <input id="notes" name="notes" type="text" defaultValue={v.notes ?? ""} placeholder="Why this link caught your eye. Optional." />
          </div>
        </div>
      </section>

      <div className="save-bar">
        {state.error && <span role="alert" style={{ color: "var(--negative)" }}>{state.error}</span>}
        <button className="btn btn-primary" type="submit" disabled={pending}>
          {pending ? "Checking…" : "Save link and open brief"}
        </button>
      </div>
    </form>
  );
}
