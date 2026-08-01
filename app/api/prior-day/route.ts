import { NextResponse } from "next/server";
import { loadPriorDayCatalog } from "@/lib/prior-day-store";

export async function GET() {
  try {
    const catalog = await loadPriorDayCatalog();
    return NextResponse.json(catalog, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load prior-day analysis" },
      { status: 502 },
    );
  }
}
