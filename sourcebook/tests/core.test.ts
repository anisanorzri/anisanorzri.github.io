import { describe, expect, it } from "vitest";
import { csvCell, toCsv } from "@/lib/csv";
import { findCompanyMatches, findSourceDuplicates, nameSimilarity, normalizeName } from "@/lib/dedupe";
import { quoteAppearsIn, parseHtml } from "@/lib/extract";
import { evaluateThesis, findTerm, whyItMightFit } from "@/lib/match";
import { DEFAULT_THESIS } from "@/lib/repo";
import { SEED_COMPANIES } from "@/lib/seed-data";
import { X_SEED_COMPANIES } from "@/lib/seed-x";
import type { Fact } from "@/lib/types";
import { guessKind, normalizeUrl, registrableDomain, xHandle } from "@/lib/url";

const fact = (p: Partial<Fact>): Fact => ({
  id: 1, companyId: 1, sourceId: 1, field: "product", value: "", quote: "", provenance: "company_claim", status: "approved", origin: "manual", note: "", createdAt: "", decidedAt: null, ...p,
});

describe("normalizeUrl", () => {
  it("treats twitter and x, tracking params and trailing slashes as one post", () => {
    const a = normalizeUrl("https://twitter.com/PieterBecking/status/1234567890?s=20&t=abc");
    const b = normalizeUrl("x.com/pieterbecking/status/1234567890/photo/1");
    expect(a).toBe("x.com/pieterbecking/status/1234567890");
    expect(b).toBe(a);
  });
  it("drops www, fragments and utm params, keeps meaningful query", () => {
    expect(normalizeUrl("https://www.Example.com/a/?utm_source=x&id=2#top")).toBe("example.com/a?id=2");
  });
  it("rejects non-web input", () => {
    expect(normalizeUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeUrl("hello")).toBeNull();
  });
});

describe("url helpers", () => {
  it("finds the registrable domain", () => {
    expect(registrableDomain("https://app.squid.energy/x")).toBe("squid.energy");
    expect(registrableDomain("https://www.foo.co.uk")).toBe("foo.co.uk");
  });
  it("guesses source kinds", () => {
    expect(guessKind("https://x.com/a/status/1")).toBe("x_post");
    expect(guessKind("https://www.ycombinator.com/companies/squid")).toBe("accelerator_cohort");
    expect(guessKind("https://find-and-update.company-information.service.gov.uk/company/16925657")).toBe("registry");
    expect(guessKind("https://squid.energy/about", "squid.energy")).toBe("company_website");
  });
  it("reads the X handle", () => {
    expect(xHandle("https://x.com/avansteenweghen/status/1")).toBe("@avansteenweghen");
  });
});

describe("duplicate detection", () => {
  const existing = [
    { id: 1, name: "Squid", domain: "squid.energy" },
    { id: 2, name: "NODI Energy", domain: "nodienergy.com" },
  ];
  it("matches legal names to brand names", () => {
    expect(normalizeName("Squid Labs Ltd")).toBe("squid");
    expect(nameSimilarity("Squid Labs Ltd", "Squid")).toBe(1);
    expect(findCompanyMatches({ name: "Squid Labs Ltd" }, existing)[0]?.id).toBe(1);
  });
  it("matches by domain and by a link on the company's own site", () => {
    expect(findCompanyMatches({ name: "Something", website: "https://www.nodienergy.com" }, existing)[0]?.reason).toMatch(/domain/);
    expect(findCompanyMatches({ name: "Other", sourceUrl: "https://squid.energy/blog/x" }, existing)[0]?.id).toBe(1);
  });
  it("does not match unrelated companies", () => {
    expect(findCompanyMatches({ name: "Servo7", website: "https://servo7.com" }, existing)).toEqual([]);
  });
  it("finds the same source under another spelling", () => {
    const n = normalizeUrl("https://www.ycombinator.com/companies/squid")!;
    expect(findSourceDuplicates("ycombinator.com/companies/squid/?utm_campaign=x", [{ id: 1, companyId: 1, normalizedUrl: n }])).toHaveLength(1);
  });
});

describe("thesis matching", () => {
  it("matches whole words only", () => {
    expect(findTerm("power grid planning", "grid")).toBeTruthy();
    expect(findTerm("gridiron football", "grid")).toBeNull();
  });
  it("never infers stage and ignores drafts", () => {
    const checks = evaluateThesis(DEFAULT_THESIS, [
      fact({ id: 1, field: "product", value: "Software for power grid planning" }),
      fact({ id: 2, field: "location", value: "London, United Kingdom" }),
      fact({ id: 3, field: "stage", value: "Raised a seed round", status: "draft" }),
    ]);
    expect(checks.find((c) => c.criterion === "sector")?.result).toBe("match");
    expect(checks.find((c) => c.criterion === "geography")?.result).toBe("match");
    expect(checks.find((c) => c.criterion === "stage")?.result).toBe("unknown");
    expect(checks.find((c) => c.criterion === "exclusion")?.result).toBe("clear");
    expect(whyItMightFit(checks, "London, United Kingdom")).toBe("Grid and energy software (“grid”, “power”); based in London, United Kingdom.");
  });
  it("expands Europe and flags exclusions in any field", () => {
    const checks = evaluateThesis(DEFAULT_THESIS, [
      fact({ id: 1, field: "location", value: "Ghent, Belgium" }),
      fact({ id: 2, field: "customer", value: "Defence ministries" }),
    ]);
    expect(checks.find((c) => c.criterion === "geography")?.result).toBe("match");
    expect(checks.find((c) => c.criterion === "exclusion")?.result).toBe("flagged");
  });
  it("says unknown, not no match, when nothing is approved", () => {
    const checks = evaluateThesis(DEFAULT_THESIS, []);
    expect(checks.filter((c) => c.result === "unknown").map((c) => c.criterion)).toEqual(["sector", "geography", "stage"]);
  });
});

describe("csv", () => {
  it("quotes and neutralises formulas", () => {
    expect(csvCell('a "b", c')).toBe('"a ""b"", c"');
    expect(csvCell("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(toCsv(["a"], [["x\ny"]])).toBe('a\r\n"x\ny"\r\n');
  });
});

describe("extraction guards", () => {
  it("accepts a quote across whitespace and curly quotes, rejects an invented one", () => {
    const text = "We’ve successfully unloaded\n multiple containers with our robot Mammoth";
    expect(quoteAppearsIn("We've successfully unloaded multiple containers", text)).toBe(true);
    expect(quoteAppearsIn("We have 40 paying customers", text)).toBe(false);
  });
  it("reads title, description and date from HTML", () => {
    const p = parseHtml('<title>T</title><meta name="description" content="Desc &amp; more"><script type="application/ld+json">{"datePublished":"2026-09-07T00:00:00Z"}</script><p>Body</p>', "https://a.b", 200);
    expect(p.title).toBe("T");
    expect(p.description).toBe("Desc & more");
    expect(p.publishedOn).toBe("2026-09-07");
    expect(p.text).toContain("Body");
  });
});

describe("seed data", () => {
  it("every fact has a source and a quote, and no seed states a stage", () => {
    for (const c of SEED_COMPANIES) {
      const keys = new Set(c.sources.map((s) => s.key));
      for (const f of c.facts) {
        expect(keys.has(f.source), `${c.name}: ${f.value}`).toBe(true);
        expect(f.quote.length).toBeGreaterThan(3);
      }
      expect(c.facts.some((f) => f.field === "stage")).toBe(false);
      expect(c.nextQuestion.length).toBeGreaterThan(20);
    }
    expect(SEED_COMPANIES).toHaveLength(5);
  });
});

describe("X-sourced leads", () => {
  it("every fact has a source and quote; every company has an X post; posts are never 'verified'", () => {
    for (const c of X_SEED_COMPANIES) {
      const keys = new Set(c.sources.map((s) => s.key));
      expect(c.sources.some((s) => s.kind === "x_post"), c.name).toBe(true);
      for (const f of c.facts) {
        expect(keys.has(f.source), `${c.name}: ${f.value}`).toBe(true);
        expect(f.quote.length).toBeGreaterThan(3);
        const src = c.sources.find((s) => s.key === f.source)!;
        if (src.kind === "x_post") expect(f.provenance, `${c.name}: ${f.value}`).not.toBe("verified");
      }
    }
  });
  it("each X post excerpt contains the quotes drawn from it", () => {
    for (const c of X_SEED_COMPANIES)
      for (const f of c.facts) {
        const src = c.sources.find((s) => s.key === f.source)!;
        if (src.kind === "x_post" && "excerpt" in src && src.excerpt) expect(src.excerpt, `${c.name}: ${f.quote}`).toContain(f.quote);
      }
  });
});
