import { differenceInCalendarDays } from "date-fns";
import { getSql } from "@/lib/db";
import type { TradeJournalEntry, TradeJournalFilters } from "@/types/trading-journal";
import type { TradeJournalEntryInput } from "@/lib/trading-journal-schema";

type Sql = NonNullable<ReturnType<typeof getSql>>;

type NumericLike = number | string | null;

type TradeJournalRow = {
  id: string;
  trade_date: Date | string;
  exit_date: Date | string | null;
  symbol: string;
  instrument_type: TradeJournalEntry["instrumentType"];
  side: TradeJournalEntry["side"];
  quantity: NumericLike;
  entry_price: NumericLike;
  exit_price: NumericLike;
  stop_loss: NumericLike;
  target_price: NumericLike;
  fees: NumericLike;
  broker: string | null;
  setup_tag: string | null;
  entry_reason: string | null;
  exit_reason: string | null;
  mistakes: string | null;
  lessons: string | null;
  status: TradeJournalEntry["status"];
  created_at: Date;
  updated_at: Date;
};

function requireSql(): Sql {
  const sql = getSql();
  if (!sql) {
    throw new Error("Database is required for trading journal");
  }
  return sql;
}

function toNumber(value: NumericLike): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toIsoDate(value: Date | string): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value.slice(0, 10);
}

function deriveMetrics(row: TradeJournalRow) {
  const tradeDate = toIsoDate(row.trade_date);
  const exitDate = row.exit_date ? toIsoDate(row.exit_date) : null;
  const quantity = toNumber(row.quantity) ?? 0;
  const entryPrice = toNumber(row.entry_price) ?? 0;
  const exitPrice = toNumber(row.exit_price);
  const fees = toNumber(row.fees);

  const holdingDays = Math.max(
    1,
    differenceInCalendarDays(
      exitDate ? new Date(`${exitDate}T00:00:00.000Z`) : new Date(),
      new Date(`${tradeDate}T00:00:00.000Z`),
    ) + 1,
  );

  if (row.status !== "closed" || exitPrice == null || quantity <= 0 || entryPrice <= 0) {
    return { holdingDays, grossPnl: null, netPnl: null, pnlPercent: null };
  }

  const grossPnl =
    row.side === "long" ? (exitPrice - entryPrice) * quantity : (entryPrice - exitPrice) * quantity;
  const netPnl = grossPnl - (fees ?? 0);
  const investedCapital = entryPrice * quantity;
  const pnlPercent = investedCapital > 0 ? (netPnl / investedCapital) * 100 : null;

  return {
    holdingDays,
    grossPnl,
    netPnl,
    pnlPercent,
  };
}

function toTradeJournalEntry(row: TradeJournalRow): TradeJournalEntry {
  const tradeDate = toIsoDate(row.trade_date);
  const exitDate = row.exit_date ? toIsoDate(row.exit_date) : null;
  const metrics = deriveMetrics(row);

  return {
    id: row.id,
    tradeDate,
    exitDate,
    symbol: row.symbol,
    instrumentType: row.instrument_type,
    side: row.side,
    quantity: toNumber(row.quantity) ?? 0,
    entryPrice: toNumber(row.entry_price) ?? 0,
    exitPrice: toNumber(row.exit_price),
    stopLoss: toNumber(row.stop_loss),
    targetPrice: toNumber(row.target_price),
    fees: toNumber(row.fees),
    broker: row.broker,
    setupTag: row.setup_tag,
    entryReason: row.entry_reason,
    exitReason: row.exit_reason,
    mistakes: row.mistakes,
    lessons: row.lessons,
    status: row.status,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    ...metrics,
  };
}

function normalizeInput(input: TradeJournalEntryInput) {
  return {
    tradeDate: input.tradeDate,
    exitDate: input.exitDate ?? null,
    symbol: input.symbol,
    instrumentType: input.instrumentType,
    side: input.side,
    quantity: input.quantity,
    entryPrice: input.entryPrice,
    exitPrice: input.exitPrice ?? null,
    stopLoss: input.stopLoss ?? null,
    targetPrice: input.targetPrice ?? null,
    fees: input.fees ?? null,
    broker: input.broker ?? null,
    setupTag: input.setupTag ?? null,
    entryReason: input.entryReason ?? null,
    exitReason: input.exitReason ?? null,
    mistakes: input.mistakes ?? null,
    lessons: input.lessons ?? null,
    status: input.status,
  };
}

export async function listTradeJournalEntries(userId: string, filters: TradeJournalFilters) {
  const sql = requireSql();
  const rows = (await sql`
    SELECT
      id, trade_date, exit_date, symbol, instrument_type, side, quantity, entry_price,
      exit_price, stop_loss, target_price, fees, broker, setup_tag, entry_reason,
      exit_reason, mistakes, lessons, status, created_at, updated_at
    FROM trade_journal_entries
    WHERE user_id = ${userId}
      AND (${filters.status ?? "all"} = 'all' OR status = ${filters.status ?? "all"})
      AND (${filters.instrumentType ?? "all"} = 'all' OR instrument_type = ${filters.instrumentType ?? "all"})
      AND (${filters.setupTag ?? null} IS NULL OR setup_tag = ${filters.setupTag ?? null})
      AND (${filters.search ?? null} IS NULL OR symbol ILIKE ${`%${filters.search ?? ""}%`})
    ORDER BY trade_date DESC, created_at DESC
  `) as TradeJournalRow[];

  const tagRows = (await sql`
    SELECT DISTINCT setup_tag
    FROM trade_journal_entries
    WHERE user_id = ${userId}
      AND setup_tag IS NOT NULL
      AND setup_tag <> ''
    ORDER BY setup_tag ASC
  `) as { setup_tag: string }[];

  return {
    entries: rows.map(toTradeJournalEntry),
    availableSetupTags: tagRows.map((row) => row.setup_tag),
  };
}

export async function getTradeJournalEntryById(userId: string, entryId: string): Promise<TradeJournalEntry | null> {
  const sql = requireSql();
  const rows = (await sql`
    SELECT
      id, trade_date, exit_date, symbol, instrument_type, side, quantity, entry_price,
      exit_price, stop_loss, target_price, fees, broker, setup_tag, entry_reason,
      exit_reason, mistakes, lessons, status, created_at, updated_at
    FROM trade_journal_entries
    WHERE id = ${entryId}
      AND user_id = ${userId}
    LIMIT 1
  `) as TradeJournalRow[];

  return rows[0] ? toTradeJournalEntry(rows[0]) : null;
}

export async function createTradeJournalEntry(userId: string, input: TradeJournalEntryInput): Promise<TradeJournalEntry> {
  const sql = requireSql();
  const value = normalizeInput(input);
  const rows = (await sql`
    INSERT INTO trade_journal_entries (
      user_id, trade_date, exit_date, symbol, instrument_type, side, quantity,
      entry_price, exit_price, stop_loss, target_price, fees, broker, setup_tag,
      entry_reason, exit_reason, mistakes, lessons, status
    ) VALUES (
      ${userId}, ${value.tradeDate}, ${value.exitDate}, ${value.symbol}, ${value.instrumentType},
      ${value.side}, ${value.quantity}, ${value.entryPrice}, ${value.exitPrice}, ${value.stopLoss},
      ${value.targetPrice}, ${value.fees}, ${value.broker}, ${value.setupTag}, ${value.entryReason},
      ${value.exitReason}, ${value.mistakes}, ${value.lessons}, ${value.status}
    )
    RETURNING
      id, trade_date, exit_date, symbol, instrument_type, side, quantity, entry_price,
      exit_price, stop_loss, target_price, fees, broker, setup_tag, entry_reason,
      exit_reason, mistakes, lessons, status, created_at, updated_at
  `) as TradeJournalRow[];
  return toTradeJournalEntry(rows[0]);
}

export async function updateTradeJournalEntry(
  userId: string,
  entryId: string,
  input: TradeJournalEntryInput,
): Promise<TradeJournalEntry | null> {
  const sql = requireSql();
  const value = normalizeInput(input);
  const rows = (await sql`
    UPDATE trade_journal_entries
    SET
      trade_date = ${value.tradeDate},
      exit_date = ${value.exitDate},
      symbol = ${value.symbol},
      instrument_type = ${value.instrumentType},
      side = ${value.side},
      quantity = ${value.quantity},
      entry_price = ${value.entryPrice},
      exit_price = ${value.exitPrice},
      stop_loss = ${value.stopLoss},
      target_price = ${value.targetPrice},
      fees = ${value.fees},
      broker = ${value.broker},
      setup_tag = ${value.setupTag},
      entry_reason = ${value.entryReason},
      exit_reason = ${value.exitReason},
      mistakes = ${value.mistakes},
      lessons = ${value.lessons},
      status = ${value.status},
      updated_at = now()
    WHERE id = ${entryId}
      AND user_id = ${userId}
    RETURNING
      id, trade_date, exit_date, symbol, instrument_type, side, quantity, entry_price,
      exit_price, stop_loss, target_price, fees, broker, setup_tag, entry_reason,
      exit_reason, mistakes, lessons, status, created_at, updated_at
  `) as TradeJournalRow[];

  return rows[0] ? toTradeJournalEntry(rows[0]) : null;
}

export async function deleteTradeJournalEntry(userId: string, entryId: string): Promise<boolean> {
  const sql = requireSql();
  const rows = (await sql`
    DELETE FROM trade_journal_entries
    WHERE id = ${entryId}
      AND user_id = ${userId}
    RETURNING id
  `) as { id: string }[];
  return rows.length > 0;
}
