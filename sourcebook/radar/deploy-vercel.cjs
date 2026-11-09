// Deploys the built public site to Vercel through the REST API (the CLI refuses team-scoped tokens).
// Usage: VERCEL_TOKEN=proxy-injected node radar/deploy-vercel.cjs <site-dir> european-startup-radar team_4VXhi7iUnePdYFnqcvhzIK8f
// The real token is a network secret for api.vercel.com, injected by the session proxy; never put it in a file or git.
const fs = require("fs"), path = require("path");
const [, , dir, name, team] = process.argv;
const files = fs.readdirSync(dir).filter((f) => !f.startsWith(".")).map((f) => ({ file: f, data: fs.readFileSync(path.join(dir, f), "utf8") }));
(async () => {
  const r = await fetch(`https://api.vercel.com/v13/deployments?teamId=${team}&skipAutoDetectionConfirmation=1`, {
    method: "POST", headers: { Authorization: `Bearer ${process.env.VERCEL_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name, files, target: "production", projectSettings: { framework: null, buildCommand: null, outputDirectory: null, installCommand: null } }),
  });
  const j = await r.json();
  if (!r.ok) { console.log(r.status, JSON.stringify(j).slice(0, 400)); process.exit(1); }
  console.log(j.id, j.url, j.readyState, (j.alias || []).join(" "));
  for (let i = 0; i < 40; i++) {
    await new Promise((s) => setTimeout(s, 3000));
    const d = await (await fetch(`https://api.vercel.com/v13/deployments/${j.id}?teamId=${team}`, { headers: { Authorization: `Bearer ${process.env.VERCEL_TOKEN}` } })).json();
    if (d.readyState === "READY" || d.readyState === "ERROR") { console.log(d.readyState, (d.alias || []).join(" ")); break; }
  }
})();
