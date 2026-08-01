import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { priorDayCatalogSchema, type PriorDayCatalog } from "@/lib/prior-day-schema";
import { fetchPriorDayCatalog } from "@/lib/sensibull-prior-day";

function runtimeCachePath(): string {
  if (process.env.VERCEL) {
    return path.join(os.tmpdir(), "twickers-prior-day", "latest.json");
  }
  return path.join(process.cwd(), ".cache", "prior-day", "latest.json");
}

function committedFallbackPath(): string {
  return path.join(process.cwd(), "content", "prior-day", "latest.json");
}

export async function savePriorDayCatalog(catalog: PriorDayCatalog): Promise<void> {
  const file = runtimeCachePath();
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
}

async function readCatalogFile(file: string): Promise<PriorDayCatalog | null> {
  try {
    const raw = await fs.readFile(file, "utf8");
    return priorDayCatalogSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

/**
 * Prefer a fresh Sensibull pull; fall back to runtime cache then committed content.
 */
export async function loadPriorDayCatalog(): Promise<PriorDayCatalog> {
  try {
    const live = await fetchPriorDayCatalog(6);
    try {
      await savePriorDayCatalog(live);
    } catch {
      // non-fatal on read-only / tmp issues
    }
    return live;
  } catch {
    const cached =
      (await readCatalogFile(runtimeCachePath())) ?? (await readCatalogFile(committedFallbackPath()));
    if (cached) return cached;
    throw new Error("Unable to load prior-day analysis from Sensibull or local cache.");
  }
}

/** Cron / seed helper: always hit Sensibull and persist runtime cache. */
export async function syncPriorDayCatalog(): Promise<PriorDayCatalog> {
  const catalog = await fetchPriorDayCatalog(6);
  await savePriorDayCatalog(catalog);
  return catalog;
}
