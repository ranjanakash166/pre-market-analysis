import { NextResponse } from "next/server";
import { getLatestAnalysisForAccount, hasDatabase } from "@/lib/x-repo";

export async function GET(
  _: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!hasDatabase()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { id } = await context.params;
  const analysis = await getLatestAnalysisForAccount(id);

  if (!analysis) {
    return NextResponse.json({ ok: true, analysis: null });
  }

  return NextResponse.json({ ok: true, analysis });
}
