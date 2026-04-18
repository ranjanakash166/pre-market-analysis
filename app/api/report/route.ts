import { NextRequest, NextResponse } from "next/server";
import { enrichReportWithComputedPivotLevels } from "@/lib/levels-enrich";
import { enrichReportWithLiveIndices, fetchLiveMarketData } from "@/lib/market-data";
import { traderModeSchema } from "@/lib/schema";
import { getStoredReport } from "@/lib/store";

export async function GET(request: NextRequest) {
  const modeRaw = request.nextUrl.searchParams.get("mode") ?? "A";
  const mode = traderModeSchema.safeParse(modeRaw);
  if (!mode.success) {
    return NextResponse.json({ error: "Invalid mode. Expected A/B/C." }, { status: 400 });
  }

  const cached = await getStoredReport(mode.data);
  if (!cached) {
    return NextResponse.json(
      {
        error: "No cached report found for this mode. Generate one first.",
      },
      { status: 404 },
    );
  }

  const live = await fetchLiveMarketData();
  const report = await enrichReportWithComputedPivotLevels(enrichReportWithLiveIndices(cached.report, live));

  return NextResponse.json({
    ...cached,
    report,
  });
}
