import { promises as fs } from "node:fs";
import path from "node:path";
import { storedReportSchema } from "@/lib/schema";
import type { GeneratedReport, StoredReport, TraderMode } from "@/types/report";

const CACHE_DIR = path.join(process.cwd(), ".cache", "reports");

function cacheFile(mode: TraderMode): string {
  return path.join(CACHE_DIR, `${mode}.json`);
}

export async function getStoredReport(mode: TraderMode): Promise<StoredReport | null> {
  try {
    const content = await fs.readFile(cacheFile(mode), "utf8");
    const parsed = JSON.parse(content);
    return storedReportSchema.parse(parsed);
  } catch {
    return null;
  }
}

export async function saveReport(report: GeneratedReport): Promise<StoredReport> {
  await fs.mkdir(CACHE_DIR, { recursive: true });
  const payload: StoredReport = {
    report,
    updatedAt: new Date().toISOString(),
  };
  await fs.writeFile(cacheFile(report.mode), JSON.stringify(payload, null, 2), "utf8");
  return payload;
}
