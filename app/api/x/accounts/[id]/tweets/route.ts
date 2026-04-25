import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { FREE_TIER_MAX_TWEET_PAGE, hasPaidAccessForUser } from "@/lib/feature-gates";
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
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  }

  const isPaid = await hasPaidAccessForUser(session.user.id);

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

  const requestedLimit = Number.isFinite(limit) ? limit : 20;
  const effectiveLimit = isPaid ? requestedLimit : Math.min(requestedLimit, FREE_TIER_MAX_TWEET_PAGE);

  if (!isPaid && cursorRaw) {
    return NextResponse.json(
      {
        error: "Free tier shows latest posts only. Upgrade to load older posts.",
        upgradePath: "/subscribe",
      },
      { status: 402 },
    );
  }

  const page = await listTweetsPage({
    accountId: account.id,
    handle: account.handle,
    limit: effectiveLimit,
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
    nextCursor: isPaid ? page.nextCursor : null,
    access: isPaid
      ? { tier: "paid" }
      : {
          tier: "free",
          limit: FREE_TIER_MAX_TWEET_PAGE,
          note: "Upgrade to load older posts.",
          upgradePath: "/subscribe",
        },
  });
}
