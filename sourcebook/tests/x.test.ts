import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_THESIS } from "@/lib/repo";
import { PLAYBOOK, parseOEmbed, searchRecent, statusId, thesisQueries } from "@/lib/x";

describe("statusId", () => {
  it("reads post IDs from x.com and twitter.com links", () => {
    expect(statusId("https://x.com/pieterbecking/status/1890123456789012345?s=20")).toBe("1890123456789012345");
    expect(statusId("twitter.com/jack/status/20/photo/1")).toBe("20");
    expect(statusId("https://x.com/pieterbecking")).toBeNull();
    expect(statusId("https://example.com/a/status/1")).toBeNull();
  });
});

describe("parseOEmbed", () => {
  it("takes the exact text, handle and date from X's embed", () => {
    const p = parseOEmbed({
      url: "https://x.com/jack/status/20",
      author_name: "jack",
      author_url: "https://x.com/jack",
      html: '<blockquote class="twitter-tweet"><p lang="en" dir="ltr">We&#39;re live with our first<br>customer &amp; hiring <a href="https://t.co/x">pic.x.com/x</a></p>&mdash; jack (@jack) <a href="https://x.com/jack/status/20?ref_src=twsrc%5Etfw">March 21, 2006</a></blockquote>\n',
    });
    expect(p.text).toBe("We're live with our first\ncustomer & hiring pic.x.com/x");
    expect(p.handle).toBe("jack");
    expect(p.date).toBe("2006-03-21");
    expect(p.id).toBe("20");
  });
});

describe("thesisQueries", () => {
  it("writes one query per sector, within X's 512-character limit", () => {
    const qs = thesisQueries(DEFAULT_THESIS);
    expect(qs).toHaveLength(DEFAULT_THESIS.sectors.length);
    for (const q of qs) {
      expect(q.query.length).toBeLessThanOrEqual(512);
      expect(q.query).toContain("-is:retweet");
    }
    expect(qs[0].query).toContain('"data centers"');
  });
});

describe("searchRecent", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.X_BEARER_TOKEN;
  });
  it("refuses without a token", async () => {
    await expect(searchRecent("grid")).rejects.toThrow(/X_BEARER_TOKEN/);
  });
  it("joins authors to posts and builds canonical links", async () => {
    process.env.X_BEARER_TOKEN = "t";
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          data: [{ id: "111", text: "Launching our grid planning tool", created_at: "2026-11-05T10:00:00.000Z", author_id: "9" }],
          includes: { users: [{ id: "9", username: "founder", name: "A Founder", description: "CEO @ GridCo", location: "London", entities: { url: { urls: [{ expanded_url: "https://gridco.example" }] } } }] },
          meta: { result_count: 1 },
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { posts } = await searchRecent("grid launching");
    expect(posts[0]).toMatchObject({ url: "https://x.com/founder/status/111", handle: "founder", date: "2026-11-05", authorLocation: "London", authorWebsite: "https://gridco.example" });
    const called = String((fetchMock.mock.calls[0] as unknown[])[0]);
    expect(called).toContain("api.x.com/2/tweets/search/recent");
  });
  it("explains a refused token", async () => {
    process.env.X_BEARER_TOKEN = "bad";
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 401 })));
    await expect(searchRecent("grid")).rejects.toThrow(/refused the token/);
  });
});

describe("playbook", () => {
  it("every query fits X's 512-character limit", () => {
    for (const p of PLAYBOOK) expect(p.query.length).toBeLessThanOrEqual(512);
  });
});
