// Builds the public copy of the radar map (for Vercel or any static host).
// Usage: node radar/build-site.cjs <db-export-dir> <out-dir>
// <db-export-dir> holds startups/*.json and meta/radar.json, as saved from the radar page's database.
// The page is the same file as the Claude artifact; without the Claude runtime it reads companies.json
// and keeps each visitor's stars and statuses in their own browser.
const fs = require("fs");
const path = require("path");
const [, , exportDir, outDir] = process.argv;
if (!exportDir || !outDir) { console.error("usage: node radar/build-site.cjs <db-export-dir> <out-dir>"); process.exit(1); }

const sdir = path.join(exportDir, "startups");
const rows = fs.readdirSync(sdir).filter((f) => f.endsWith(".json")).map((f) => {
  const d = JSON.parse(fs.readFileSync(path.join(sdir, f), "utf8"));
  return { id: path.basename(f, ".json"), ...d };
}).sort((a, b) => a.id.localeCompare(b.id));
const meta = JSON.parse(fs.readFileSync(path.join(exportDir, "meta", "radar.json"), "utf8"));

fs.mkdirSync(outDir, { recursive: true });
const page = fs.readFileSync(path.join(__dirname, "startup-radar.html"), "utf8");
const head = `<!doctype html>
<html lang="en">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="New European startups on a map, from Y Combinator and public posts on X. Every company links to its source.">
`;
fs.writeFileSync(path.join(outDir, "index.html"), head + page);
fs.copyFileSync(path.join(__dirname, "europe.json"), path.join(outDir, "europe.json"));
fs.writeFileSync(path.join(outDir, "companies.json"), JSON.stringify(rows));
fs.writeFileSync(path.join(outDir, "meta.json"), JSON.stringify({ updatedOn: meta.updatedOn, note: meta.note }));
fs.writeFileSync(path.join(outDir, "vercel.json"), JSON.stringify({
  headers: [{ source: "/(.*)", headers: [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Frame-Options", value: "DENY" },
  ] }, { source: "/(companies|meta).json", headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }] }],
}, null, 1));
console.log(`built ${outDir}: ${rows.length} companies, updated ${meta.updatedOn}`);
