import { NextResponse } from "next/server";
import { getAnalysisOutputById, hasDatabase } from "@/lib/x-repo";

export async function GET(
  _: Request,
  context: { params: Promise<{ outputId: string }> },
) {
  if (!hasDatabase()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { outputId } = await context.params;
  const analysis = await getAnalysisOutputById(outputId);

  if (!analysis) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, analysis });
}
