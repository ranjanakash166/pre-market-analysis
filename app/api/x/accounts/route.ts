import { NextResponse } from "next/server";
import { hasDatabase, listMonitoredAccounts } from "@/lib/x-repo";

export async function GET() {
  if (!hasDatabase()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Database not configured. Set POSTGRES_URL (or DATABASE_URL), apply db/schema.sql, then seed X_MONITOR_HANDLES.",
        accounts: [],
      },
      { status: 503 },
    );
  }

  const accounts = await listMonitoredAccounts();
  return NextResponse.json({ ok: true, accounts });
}
