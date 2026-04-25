import { NextRequest, NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/cron-auth";
import { runXSyncPipeline } from "@/lib/x-sync";

/**
 * Vercel Cron invokes the path with GET by default. Export GET + POST so
 * scheduled runs succeed; both require the same cron auth.
 */
async function handleCron(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runXSyncPipeline();
    return NextResponse.json({ ranAt: new Date().toISOString(), ...result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Sync failed" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  return handleCron(request);
}

export async function POST(request: NextRequest) {
  return handleCron(request);
}
