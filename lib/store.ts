import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { storedReportSchema } from "@/lib/schema";
import type { GeneratedReport, StoredReport, TraderMode } from "@/types/report";

/** Writable on Vercel serverless (`/var/task` is read-only). Local dev uses project `.cache`. */
function reportsCacheDir(): string {
  if (process.env.VERCEL) {
    return path.join(os.tmpdir(), "twickers-reports");
  }
  return path.join(process.cwd(), ".cache", "reports");
}

function cacheFile(mode: TraderMode): string {
  return path.join(reportsCacheDir(), `${mode}.json`);
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
  await fs.mkdir(reportsCacheDir(), { recursive: true });
  const payload: StoredReport = {
    report,
    updatedAt: new Date().toISOString(),
  };
  await fs.writeFile(cacheFile(report.mode), JSON.stringify(payload, null, 2), "utf8");
  return payload;
}
