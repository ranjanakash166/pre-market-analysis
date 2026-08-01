import { NextRequest, NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/cron-auth";
import { syncPriorDayCatalog } from "@/lib/prior-day-store";

async function handleCron(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const catalog = await syncPriorDayCatalog();
    return NextResponse.json({
      ranAt: new Date().toISOString(),
      dayCount: catalog.days.length,
      dates: catalog.days.map((d) => d.date),
      updatedAt: catalog.updatedAt,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Prior-day sync failed" },
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
