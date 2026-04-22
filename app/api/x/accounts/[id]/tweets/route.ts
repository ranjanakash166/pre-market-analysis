import { NextRequest, NextResponse } from "next/server";
import {
  decodeTweetCursor,
  getMonitoredAccountById,
  hasDatabase,
  listTweetsPage,
} from "@/lib/x-repo";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!hasDatabase()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { id } = await context.params;
  const account = await getMonitoredAccountById(id);
  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const url = request.nextUrl;
  const limitRaw = url.searchParams.get("limit");
  const cursorRaw = url.searchParams.get("cursor");

  const limit = limitRaw ? Number(limitRaw) : 20;
  const cursor = decodeTweetCursor(cursorRaw);

  const page = await listTweetsPage({
    accountId: account.id,
    handle: account.handle,
    limit: Number.isFinite(limit) ? limit : 20,
    cursor,
  });

  return NextResponse.json({
    ok: true,
    account: {
      id: account.id,
      handle: account.handle,
      displayName: account.displayName,
    },
    tweets: page.tweets,
    nextCursor: page.nextCursor,
  });
}
