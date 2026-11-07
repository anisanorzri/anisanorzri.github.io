import type { SourceKind } from "./types";

const TRACKING_PARAMS = /^(utm_|fbclid$|gclid$|mc_|ref$|ref_src$|ref_url$|s$|t$|si$|igshid$|trk$)/i;

/** Parse a URL a person pasted. Adds https:// if they left it off. */
export function parseUrl(input: string): URL | null {
  const raw = input.trim();
  if (!raw) return null;
  try {
    const u = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (!u.hostname.includes(".")) return null;
    return u;
  } catch {
    return null;
  }
}

/**
 * One spelling per page, so the same link pasted twice is caught:
 * lowercase host, no www/mobile prefix, twitter.com → x.com, no tracking
 * parameters, no fragment, no trailing slash, sorted query.
 */
export function normalizeUrl(input: string): string | null {
  const u = parseUrl(input);
  if (!u) return null;
  let host = u.hostname.toLowerCase().replace(/^(www|m|mobile)\./, "");
  if (host === "twitter.com" || host === "fxtwitter.com" || host === "vxtwitter.com") host = "x.com";
  let path = u.pathname.replace(/\/+$/, "") || "";
  // X status links: /user/status/123 is the post whatever the handle's case or suffix (/photo/1).
  const status = path.match(/^\/([^/]+)\/status(?:es)?\/(\d+)/i);
  if (host === "x.com" && status) path = `/${status[1].toLowerCase()}/status/${status[2]}`;
  const params = [...u.searchParams.entries()]
    .filter(([k]) => !TRACKING_PARAMS.test(k))
    .sort(([a], [b]) => a.localeCompare(b));
  const query = params.length ? `?${new URLSearchParams(params).toString()}` : "";
  return `${host}${path}${query}`;
}

const MULTI_PART_TLDS = new Set(["co.uk", "org.uk", "ac.uk", "gov.uk", "com.au", "co.nz", "com.br", "co.jp"]);

/** The registrable domain: "app.squid.energy" → "squid.energy", "foo.co.uk" stays. */
export function registrableDomain(input: string): string | null {
  const u = parseUrl(input);
  if (!u) return null;
  const labels = u.hostname.toLowerCase().replace(/^www\./, "").split(".");
  if (labels.length <= 2) return labels.join(".");
  const lastTwo = labels.slice(-2).join(".");
  return MULTI_PART_TLDS.has(lastTwo) ? labels.slice(-3).join(".") : lastTwo;
}

const ACCELERATOR_HOSTS = [
  "ycombinator.com",
  "techstars.com",
  "joinef.com",
  "antler.co",
  "seedcamp.com",
  "foundersfactory.com",
  "entrepreneurfirst.com",
  "launchpad.ai",
  "conceptionx.org",
  "creativedestructionlab.com",
  "plugandplaytechcenter.com",
];

/** A first guess at the kind of link. The person can always change it. */
export function guessKind(input: string, companyDomain?: string | null): SourceKind {
  const u = parseUrl(input);
  if (!u) return "other";
  const host = u.hostname.toLowerCase().replace(/^www\./, "");
  if (host === "x.com" || host === "twitter.com") return "x_post";
  if (host.endsWith("company-information.service.gov.uk") || host.endsWith("kvk.nl") || host.endsWith("zefix.ch") || host.endsWith("handelsregister.de") || host.endsWith("pappers.fr") || host.endsWith("kbopub.economie.fgov.be"))
    return "registry";
  if (/demo-?day/i.test(u.pathname) || /demo-?day/i.test(host)) return "demo_day";
  if (ACCELERATOR_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) return "accelerator_cohort";
  if (companyDomain && registrableDomain(input) === companyDomain) return "company_website";
  return "other";
}

/** The handle in an X post link, for prefilling the author field. */
export function xHandle(input: string): string | null {
  const u = parseUrl(input);
  if (!u) return null;
  const host = u.hostname.replace(/^www\./, "");
  if (host !== "x.com" && host !== "twitter.com") return null;
  const m = u.pathname.match(/^\/([A-Za-z0-9_]{1,15})(\/|$)/);
  return m ? `@${m[1]}` : null;
}
