import dns from "node:dns/promises";
import net from "node:net";
import { parseUrl } from "./url";
import { FACT_FIELDS, type FactField, type Provenance, type SourceKind } from "./types";

// Fetching a public page and proposing draft facts from it. Nothing here
// approves anything: every result is a draft a person accepts or rejects.

const MAX_BYTES = 1_500_000;
const TIMEOUT_MS = 12_000;

function isPrivateAddress(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
  }
  const v = ip.toLowerCase();
  return v === "::1" || v === "::" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80") || v.startsWith("::ffff:127.") || v.startsWith("::ffff:10.") || v.startsWith("::ffff:192.168.");
}

/** Refuses anything that resolves to a private or local address (the app may be hosted). */
async function assertPublic(url: URL) {
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const addrs = net.isIP(host) ? [host] : (await dns.lookup(host, { all: true })).map((a) => a.address);
  if (!addrs.length || addrs.some(isPrivateAddress)) throw new Error("That address is not a public web page.");
}

export interface FetchedPage {
  finalUrl: string;
  status: number;
  title: string;
  description: string;
  siteName: string;
  publishedOn: string | null;
  text: string;
}

function decode(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

function meta(html: string, key: string): string {
  const re1 = new RegExp(`<meta[^>]+(?:name|property)=["']${key}["'][^>]*content=["']([^"']*)["']`, "i");
  const re2 = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:name|property)=["']${key}["']`, "i");
  return decode((html.match(re1)?.[1] ?? html.match(re2)?.[1] ?? "").trim());
}

export function htmlToText(html: string): string {
  return decode(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
      .replace(/<(br|\/p|\/div|\/li|\/h[1-6])[^>]*>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*/g, "\n")
    .trim();
}

export function parseHtml(html: string, finalUrl: string, status: number): FetchedPage {
  const published =
    meta(html, "article:published_time") ||
    meta(html, "og:published_time") ||
    meta(html, "datePublished") ||
    html.match(/"datePublished"\s*:\s*"([^"]+)"/)?.[1] ||
    "";
  const date = published.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? null;
  return {
    finalUrl,
    status,
    title: meta(html, "og:title") || decode(html.match(/<title[^>]*>([^<]*)/i)?.[1]?.trim() ?? ""),
    description: meta(html, "description") || meta(html, "og:description"),
    siteName: meta(html, "og:site_name"),
    publishedOn: date,
    text: htmlToText(html).slice(0, 60_000),
  };
}

export async function fetchPage(input: string): Promise<FetchedPage> {
  let url = parseUrl(input);
  if (!url) throw new Error("That is not a web address.");
  // Follow up to five redirects by hand so each hop is checked.
  for (let hop = 0; hop < 6; hop++) {
    await assertPublic(url);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(url, {
        redirect: "manual",
        signal: ctrl.signal,
        headers: { "user-agent": "Sourcebook/0.1 (open-source research tool; reads public pages a person submitted)", accept: "text/html,*/*;q=0.5" },
      });
    } finally {
      clearTimeout(timer);
    }
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      url = new URL(res.headers.get("location")!, url);
      continue;
    }
    const type = res.headers.get("content-type") ?? "";
    if (!/html|text\/plain/i.test(type)) throw new Error(`The page is not HTML (${type || "unknown type"}).`);
    const reader = res.body?.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    if (reader) {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        chunks.push(value);
        if (size > MAX_BYTES) {
          await reader.cancel();
          break;
        }
      }
    }
    const html = new TextDecoder().decode(Buffer.concat(chunks));
    return parseHtml(html, url.toString(), res.status);
  }
  throw new Error("Too many redirects.");
}

/** Whitespace- and quote-style-insensitive containment, so a real quote survives line breaks. */
export function normalizeForQuote(s: string) {
  return s
    .toLowerCase()
    .replace(/[‘’‚′]/g, "'")
    .replace(/[“”„″]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

export function quoteAppearsIn(quote: string, text: string) {
  const q = normalizeForQuote(quote);
  return q.length >= 8 && normalizeForQuote(text).includes(q);
}

export interface DraftFact {
  field: FactField;
  value: string;
  quote: string;
  provenance: Provenance;
  note: string;
}

/** Drafts that need no model: the page's own description, said by whoever wrote the page. */
export function metadataDrafts(page: FetchedPage, kind: SourceKind): DraftFact[] {
  if (!page.description) return [];
  const provenance: Provenance = kind === "company_website" || kind === "x_post" ? "company_claim" : kind === "registry" ? "verified" : "third_party";
  return [
    {
      field: "product",
      value: page.description,
      quote: page.description,
      provenance,
      note: "From the page's own meta description. Edit the wording before approving if it reads like marketing.",
    },
  ];
}

const DRAFT_PROMPT = `You help a venture investor turn one public web page into draft facts about one company.
Rules:
- Use only the SOURCE TEXT. Never use outside knowledge, never guess.
- Every fact must carry "quote": a short passage copied character for character from the SOURCE TEXT that states it. If you cannot quote it, leave it out.
- Do not infer funding status, round, valuation, revenue or traction unless the text states it in so many words.
- Customers named by the company are claims, not verified facts.
- provenance: "company_claim" when the company or its founders say it; "third_party" when someone else reports it; "verified" only for a company registry record, an accelerator's own batch listing, or a customer's own announcement of the relationship.
- field is one of: ${Object.keys(FACT_FIELDS).join(", ")}.
- Prefer 3 to 8 facts. Plain, specific wording in "value"; no adjectives the source did not use.
- "note": one short line on what a reviewer should check, or "".`;

export async function aiDrafts(input: { companyName: string; kind: SourceKind; url: string; text: string }): Promise<{ drafts: DraftFact[]; dropped: number }> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("Set ANTHROPIC_API_KEY to draft facts with Claude.");
  const [{ default: Anthropic }, { zodOutputFormat }, { z }] = await Promise.all([
    import("@anthropic-ai/sdk"),
    import("@anthropic-ai/sdk/helpers/zod"),
    import("zod"),
  ]);
  const schema = z.object({
    facts: z.array(
      z.object({
        field: z.enum(Object.keys(FACT_FIELDS) as [FactField, ...FactField[]]),
        value: z.string(),
        quote: z.string(),
        provenance: z.enum(["verified", "company_claim", "third_party"]),
        note: z.string(),
      }),
    ),
  });
  const client = new Anthropic();
  const text = input.text.slice(0, 40_000);
  const res = await client.messages.parse({
    model: "claude-opus-5-5",
    max_tokens: 16000,
    output_config: { effort: "low", format: zodOutputFormat(schema) },
    system: DRAFT_PROMPT,
    messages: [
      {
        role: "user",
        content: `COMPANY: ${input.companyName}\nSOURCE KIND: ${input.kind}\nSOURCE URL: ${input.url}\n\nSOURCE TEXT:\n<<<\n${text}\n>>>`,
      },
    ],
  });
  if (res.stop_reason === "refusal") throw new Error("Claude declined to draft facts from this page.");
  const facts = res.parsed_output?.facts ?? [];
  // The guard that matters: a draft whose quote is not in the page is discarded.
  const kept = facts.filter((f) => quoteAppearsIn(f.quote, text));
  return { drafts: kept, dropped: facts.length - kept.length };
}
