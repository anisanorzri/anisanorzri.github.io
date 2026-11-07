import { createClient, type Client } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";

// libSQL speaks SQLite locally (file:) and over the network (libsql://, e.g.
// Turso), so the same code runs on a laptop and on Vercel, where the
// filesystem does not persist.

const SCHEMA = `
CREATE TABLE IF NOT EXISTS thesis (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  name TEXT NOT NULL,
  sectors TEXT NOT NULL,
  geographies TEXT NOT NULL,
  stages TEXT NOT NULL,
  exclusions TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  website TEXT,
  domain TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  status_note TEXT NOT NULL DEFAULT '',
  next_question TEXT NOT NULL DEFAULT '',
  reviewed_at TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS companies_domain ON companies(domain);
CREATE TABLE IF NOT EXISTS sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  normalized_url TEXT NOT NULL,
  kind TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  author TEXT NOT NULL DEFAULT '',
  published_on TEXT,
  captured_on TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  UNIQUE (company_id, normalized_url)
);
CREATE INDEX IF NOT EXISTS sources_norm ON sources(normalized_url);
CREATE TABLE IF NOT EXISTS facts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  source_id INTEGER REFERENCES sources(id) ON DELETE SET NULL,
  field TEXT NOT NULL,
  value TEXT NOT NULL,
  quote TEXT NOT NULL DEFAULT '',
  provenance TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  origin TEXT NOT NULL DEFAULT 'manual',
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  decided_at TEXT
);
CREATE INDEX IF NOT EXISTS facts_company ON facts(company_id);
CREATE TABLE IF NOT EXISTS review_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  operator TEXT NOT NULL,
  familiar TEXT NOT NULL,
  relevant TEXT NOT NULL,
  worth_investigating TEXT NOT NULL,
  comment TEXT NOT NULL DEFAULT '',
  at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS x_searches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT NOT NULL,
  query TEXT NOT NULL,
  created_at TEXT NOT NULL,
  last_run_at TEXT,
  last_count INTEGER
);
CREATE TABLE IF NOT EXISTS x_dismissed (
  post_id TEXT PRIMARY KEY,
  at TEXT NOT NULL
);
`;

let client: Client | null = null;
let ready: Promise<void> | null = null;

function makeClient(): Client {
  const url = process.env.DATABASE_URL || "file:./data/sourcebook.db";
  if (url.startsWith("file:")) {
    const file = url.slice("file:".length);
    if (file && file !== ":memory:") fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  }
  return createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN || undefined });
}

export async function db(): Promise<Client> {
  if (!client) client = makeClient();
  if (!ready) {
    const c = client;
    ready = (async () => {
      await c.execute("PRAGMA foreign_keys = ON");
      await c.executeMultiple(SCHEMA);
    })();
  }
  await ready;
  return client;
}

/** For tests: a fresh in-memory database. */
export function resetForTests(url = ":memory:") {
  client = createClient({ url: url === ":memory:" ? "file::memory:" : url });
  ready = null;
}
