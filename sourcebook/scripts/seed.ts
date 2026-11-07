import { loadSeed } from "../lib/seed";

loadSeed(process.argv.includes("--x") ? "x" : "examples").then(({ added, skipped }) => {
  console.log(`Added ${added.length}: ${added.join(", ") || "none"}`);
  if (skipped.length) console.log(`Already present, skipped: ${skipped.join(", ")}`);
});
