import type { Thesis } from "./types";
import { parseUrl } from "./url";

// X, through the two routes X itself offers:
// 1. oEmbed (publish.twitter.com) — public, no key, one post at a time. Used to
//    read a link a person pasted: its text, author and date.
// 2. API v2 recent search — needs the fund's own bearer token (X_BEARER_TOKEN),
//    paid per X's terms. Used to surface candidate posts; a person picks which
//    to capture. Nothing is scraped and no logged-in page is read.

export function statusId(input: string): string | null {
  const u = parseUrl(input);
  if (!u) return null;
  const host = u.hostname.toLowerCase().replace(/^(www|m|mobile)\./, "");
  if (!["x.com", "twitter.com"].includes(host)) return null;
  return u.pathname.match(/^\/[^/]+\/status(?:es)?\/(\d{1,25})/i)?.[1] ?? null;
}

export const postUrl = (handle: string, id: string) => `https://x.com/${handle}/status/${id}`;

export interface XPost {
  id: string;
  url: string;
  handle: string;
  authorName: string;
  text: string;
  /** YYYY-MM-DD, or null if X gave none. */
  date: string | null;
}

const MONTHS: Record<string, string> = {
  january: "01", february: "02", march: "03", april: "04", may: "05", june: "06",
  july: "07", august: "08", september: "09", october: "10", november: "11", december: "12",
};

function decode(s: string) {
  return s
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;|&apos;/g, "'")
    .replace(/&mdash;/g, "—")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .trim();
}

/** Parse X's oEmbed blockquote: <p>text</p>&mdash; Name (@handle) <a>Month D, YYYY</a> */
export function parseOEmbed(json: { url?: string; author_name?: string; author_url?: string; html?: string }): Omit<XPost, "id"> & { id: string | null } {
  const html = json.html ?? "";
  const text = decode(html.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? "");
  const dateText = html.match(/<a[^>]*>([A-Za-z]+ \d{1,2}, \d{4})<\/a>\s*<\/blockquote>/i)?.[1] ?? "";
  const m = dateText.match(/^([A-Za-z]+) (\d{1,2}), (\d{4})$/);
  const date = m && MONTHS[m[1].toLowerCase()] ? `${m[3]}-${MONTHS[m[1].toLowerCase()]}-${m[2].padStart(2, "0")}` : null;
  const handle = (json.author_url ?? "").split("/").filter(Boolean).pop() ?? "";
  const url = json.url ?? "";
  return { id: statusId(url), url, handle, authorName: json.author_name ?? "", text, date };
}

export async function readPost(link: string): Promise<XPost> {
  const id = statusId(link);
  if (!id) throw new Error("That is not a link to a post on X.");
  const endpoint = `https://publish.twitter.com/oembed?omit_script=1&dnt=true&url=${encodeURIComponent(`https://twitter.com/i/status/${id}`)}`;
  const res = await fetch(endpoint, { signal: AbortSignal.timeout(10_000), headers: { accept: "application/json" } });
  if (res.status === 404) throw new Error("X has no public post at that link. It may be deleted or from a protected account.");
  if (!res.ok) throw new Error(`X did not return the post (status ${res.status}).`);
  const p = parseOEmbed(await res.json());
  if (!p.text) throw new Error("X returned the post without its text.");
  return { ...p, id, url: postUrl(p.handle || "i", id) };
}

// ---------- Discovery: API v2 recent search

export interface XCandidate extends XPost {
  authorBio: string;
  authorLocation: string;
  authorWebsite: string;
  followers: number | null;
}

export const hasXApi = () => !!process.env.X_BEARER_TOKEN;

interface V2User {
  id: string;
  username: string;
  name: string;
  description?: string;
  location?: string;
  url?: string;
  entities?: { url?: { urls?: { expanded_url?: string }[] } };
  public_metrics?: { followers_count?: number };
}

export async function searchRecent(query: string, max = 25): Promise<{ posts: XCandidate[]; note?: string }> {
  const token = process.env.X_BEARER_TOKEN;
  if (!token) throw new Error("Add X_BEARER_TOKEN to search X.");
  const params = new URLSearchParams({
    query,
    max_results: String(Math.min(100, Math.max(10, max))),
    "tweet.fields": "created_at,author_id,lang,note_tweet",
    expansions: "author_id",
    "user.fields": "username,name,description,location,url,entities,public_metrics",
  });
  const res = await fetch(`https://api.x.com/2/tweets/search/recent?${params}`, {
    headers: { authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });
  if (res.status === 401 || res.status === 403) throw new Error("X refused the token. Check X_BEARER_TOKEN and that your X API plan includes recent search.");
  if (res.status === 429) throw new Error("X rate limit reached. Try again later.");
  const body = await res.json();
  if (!res.ok) throw new Error(body?.detail || body?.title || `X search failed (status ${res.status}).`);
  const users = new Map<string, V2User>(((body.includes?.users ?? []) as V2User[]).map((u) => [u.id, u]));
  const posts: XCandidate[] = ((body.data ?? []) as { id: string; text: string; created_at?: string; author_id: string; note_tweet?: { text?: string } }[]).map((t) => {
    const u = users.get(t.author_id);
    const handle = u?.username ?? "i";
    return {
      id: t.id,
      url: postUrl(handle, t.id),
      handle,
      authorName: u?.name ?? "",
      text: t.note_tweet?.text ?? t.text,
      date: t.created_at?.slice(0, 10) ?? null,
      authorBio: u?.description ?? "",
      authorLocation: u?.location ?? "",
      authorWebsite: u?.entities?.url?.urls?.[0]?.expanded_url ?? u?.url ?? "",
      followers: u?.public_metrics?.followers_count ?? null,
    };
  });
  return { posts, note: body.meta?.result_count === 0 ? "No posts in the last 7 days." : undefined };
}

// ---------- Queries built from the thesis

/** Words founders use when something real happened. Kept short so queries stay under X's length limit. */
export const SIGNAL_PHRASES = ['"we\'re live"', "launching", '"first customer"', "pilot", '"pre-seed"', '"we raised"', '"we\'re hiring"', '"just shipped"'];

const quote = (k: string) => (/\s/.test(k) ? `"${k.replace(/"/g, "")}"` : k);

export function thesisQueries(thesis: Thesis): { label: string; query: string }[] {
  const tail = "-is:retweet -is:reply lang:en";
  const signals = `(${SIGNAL_PHRASES.join(" OR ")})`;
  return thesis.sectors.map((s) => {
    // As many of the sector's keywords as fit in X's 512-character query limit.
    const words: string[] = [];
    for (const k of s.keywords) {
      const next = [...words, quote(k)];
      if (`(${next.join(" OR ")}) ${signals} ${tail}`.length > 512) break;
      words.push(quote(k));
    }
    return { label: s.label, query: `(${words.join(" OR ")}) ${signals} ${tail}` };
  });
}
