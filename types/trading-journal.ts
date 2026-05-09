export type TradeInstrumentType = "equity" | "futures" | "options";

export type TradeSide = "long" | "short";

export type TradeStatus = "open" | "closed";

export interface TradeJournalFilters {
  status?: TradeStatus | "all";
  instrumentType?: TradeInstrumentType | "all";
  setupTag?: string;
  search?: string;
}

export interface TradeJournalEntry {
  id: string;
  tradeDate: string;
  exitDate: string | null;
  symbol: string;
  instrumentType: TradeInstrumentType;
  side: TradeSide;
  quantity: number;
  entryPrice: number;
  exitPrice: number | null;
  stopLoss: number | null;
  targetPrice: number | null;
  fees: number | null;
  broker: string | null;
  setupTag: string | null;
  entryReason: string | null;
  exitReason: string | null;
  mistakes: string | null;
  lessons: string | null;
  status: TradeStatus;
  createdAt: string;
  updatedAt: string;
  holdingDays: number;
  grossPnl: number | null;
  netPnl: number | null;
  pnlPercent: number | null;
}

export interface TradeJournalListResponse {
  entries: TradeJournalEntry[];
  availableSetupTags: string[];
}
