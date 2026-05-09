import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  deleteTradeJournalEntry,
  getTradeJournalEntryById,
  updateTradeJournalEntry,
} from "@/lib/trading-journal-db";
import {
  tradeJournalEntryInputSchema,
  tradeJournalEntryPatchSchema,
} from "@/lib/trading-journal-schema";

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
    }

    const { id } = await context.params;
    const entry = await getTradeJournalEntryById(userId, id);
    if (!entry) {
      return NextResponse.json({ error: "Journal entry not found." }, { status: 404 });
    }

    return NextResponse.json({ entry });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load journal entry" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
    }

    const { id } = await context.params;
    const existing = await getTradeJournalEntryById(userId, id);
    if (!existing) {
      return NextResponse.json({ error: "Journal entry not found." }, { status: 404 });
    }

    const body = await request.json();
    const patch = tradeJournalEntryPatchSchema.safeParse(body);
    if (!patch.success) {
      return NextResponse.json({ error: patch.error.issues[0]?.message ?? "Invalid journal update." }, { status: 400 });
    }

    const merged = tradeJournalEntryInputSchema.safeParse({
      tradeDate: existing.tradeDate,
      exitDate: existing.exitDate,
      symbol: existing.symbol,
      instrumentType: existing.instrumentType,
      side: existing.side,
      quantity: existing.quantity,
      entryPrice: existing.entryPrice,
      exitPrice: existing.exitPrice,
      stopLoss: existing.stopLoss,
      targetPrice: existing.targetPrice,
      fees: existing.fees,
      broker: existing.broker,
      setupTag: existing.setupTag,
      entryReason: existing.entryReason,
      exitReason: existing.exitReason,
      mistakes: existing.mistakes,
      lessons: existing.lessons,
      status: existing.status,
      ...patch.data,
    });

    if (!merged.success) {
      return NextResponse.json({ error: merged.error.issues[0]?.message ?? "Invalid journal update." }, { status: 400 });
    }

    const entry = await updateTradeJournalEntry(userId, id, merged.data);
    if (!entry) {
      return NextResponse.json({ error: "Journal entry not found." }, { status: 404 });
    }

    return NextResponse.json({ entry });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update journal entry" },
      { status: 500 },
    );
  }
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
    }

    const { id } = await context.params;
    const deleted = await deleteTradeJournalEntry(userId, id);
    if (!deleted) {
      return NextResponse.json({ error: "Journal entry not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete journal entry" },
      { status: 500 },
    );
  }
}
