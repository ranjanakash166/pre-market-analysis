/**
 * Seed committed prior-day fallback from Sensibull (last 6 trading days).
 *
 * Usage: npm run prior-day:sync
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { fetchPriorDayCatalog } from "../lib/sensibull-prior-day";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");

async function main(): Promise<void> {
  console.error("Fetching Sensibull prior-day analyses…");
  const catalog = await fetchPriorDayCatalog(6);
  const outDir = join(repoRoot, "content", "prior-day");
  await mkdir(outDir, { recursive: true });
  const outPath = join(outDir, "latest.json");
  await writeFile(outPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  console.error(`Wrote ${outPath} (${catalog.days.length} days)`);
  for (const day of catalog.days) {
    console.error(`  - ${day.date}: ${day.title}`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
