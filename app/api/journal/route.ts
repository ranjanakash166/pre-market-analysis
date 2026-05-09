import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  createTradeJournalEntry,
  listTradeJournalEntries,
} from "@/lib/trading-journal-db";
import {
  normalizeTradeJournalFilters,
  tradeJournalEntryInputSchema,
  tradeJournalFiltersSchema,
} from "@/lib/trading-journal-schema";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
    }

    const parsed = tradeJournalFiltersSchema.safeParse({
      status: request.nextUrl.searchParams.get("status") ?? undefined,
      instrumentType: request.nextUrl.searchParams.get("instrumentType") ?? undefined,
      setupTag: request.nextUrl.searchParams.get("setupTag") ?? undefined,
      search: request.nextUrl.searchParams.get("search") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid journal filters." }, { status: 400 });
    }

    const result = await listTradeJournalEntries(userId, normalizeTradeJournalFilters(parsed.data));
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load journal entries" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
    }

    const body = await request.json();
    const parsed = tradeJournalEntryInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid journal payload." }, { status: 400 });
    }

    const entry = await createTradeJournalEntry(userId, parsed.data);
    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create journal entry" },
      { status: 500 },
    );
  }
}
