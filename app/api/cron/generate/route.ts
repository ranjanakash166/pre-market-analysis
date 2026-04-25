import { NextRequest, NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/cron-auth";
import { generateReport } from "@/lib/ai";
import { saveReport } from "@/lib/store";
import type { TraderMode } from "@/types/report";

const MODES: TraderMode[] = ["A", "B", "C"];

/** Vercel Cron uses GET; manual triggers may use POST. Same auth for both. */
async function handleCron(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = [];

  for (const mode of MODES) {
    try {
      const report = await generateReport(mode);
      const saved = await saveReport(report);
      results.push({ mode, updatedAt: saved.updatedAt, ok: true });
    } catch (error) {
      results.push({
        mode,
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return NextResponse.json({
    ranAt: new Date().toISOString(),
    results,
  });
}

export async function GET(request: NextRequest) {
  return handleCron(request);
}

export async function POST(request: NextRequest) {
  return handleCron(request);
}
