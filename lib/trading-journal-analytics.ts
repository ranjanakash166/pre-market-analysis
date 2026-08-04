import type { TradeJournalEntry, TradeSide } from "@/types/trading-journal";

/** Win rate needed to break even at a given reward:risk. */
export function breakevenWinRatePercent(rewardRiskRatio: number): number | null {
  if (!Number.isFinite(rewardRiskRatio) || rewardRiskRatio <= 0) return null;
  return (1 / (1 + rewardRiskRatio)) * 100;
}

function riskPerUnit(entryPrice: number, stopLoss: number | null): number | null {
  if (stopLoss == null || !Number.isFinite(entryPrice) || !Number.isFinite(stopLoss)) return null;
  const risk = Math.abs(entryPrice - stopLoss);
  return risk > 0 ? risk : null;
}

/** Planned R:R from entry / SL / target (price units). */
export function plannedRewardRisk(
  entryPrice: number,
  stopLoss: number | null,
  targetPrice: number | null,
): number | null {
  const risk = riskPerUnit(entryPrice, stopLoss);
  if (risk == null || targetPrice == null || !Number.isFinite(targetPrice)) return null;
  const reward = Math.abs(targetPrice - entryPrice);
  if (reward <= 0) return null;
  return reward / risk;
}

/** Realized R multiple from entry / SL / exit (gross price units, side-aware). */
export function realizedR(
  side: TradeSide,
  entryPrice: number,
  stopLoss: number | null,
  exitPrice: number | null,
): number | null {
  const risk = riskPerUnit(entryPrice, stopLoss);
  if (risk == null || exitPrice == null || !Number.isFinite(exitPrice)) return null;
  const pnlPerUnit = side === "long" ? exitPrice - entryPrice : entryPrice - exitPrice;
  return pnlPerUnit / risk;
}

export type RrEffectiveness = "paying" | "underwater" | "insufficient_data";

export type JournalAnalyticsTradeRef = {
  id: string;
  symbol: string;
  tradeDate: string;
  netPnl: number;
  realizedR: number | null;
};

export type JournalAnalytics = {
  total: number;
  open: number;
  closed: number;
  wins: number;
  losses: number;
  flats: number;
  totalNetPnl: number;
  avgNetPnl: number | null;
  winRatePercent: number | null;
  winLossRatio: number | null;
  avgPlannedRr: number | null;
  avgRealizedR: number | null;
  plannedRrSampleSize: number;
  realizedRSampleSize: number;
  breakevenWinRatePercent: number | null;
  rrEffectiveness: RrEffectiveness;
  bestTrade: JournalAnalyticsTradeRef | null;
  worstTrade: JournalAnalyticsTradeRef | null;
};

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function aggregateJournalAnalytics(entries: TradeJournalEntry[]): JournalAnalytics {
  const open = entries.filter((entry) => entry.status === "open").length;
  const closedEntries = entries.filter((entry) => entry.status === "closed");
  const closedWithPnl = closedEntries.filter((entry) => entry.netPnl != null);

  const wins = closedWithPnl.filter((entry) => (entry.netPnl ?? 0) > 0);
  const losses = closedWithPnl.filter((entry) => (entry.netPnl ?? 0) < 0);
  const flats = closedWithPnl.filter((entry) => (entry.netPnl ?? 0) === 0);

  const totalNetPnl = entries.reduce((sum, entry) => sum + (entry.netPnl ?? 0), 0);
  const avgNetPnl = closedWithPnl.length > 0 ? totalNetPnl / closedWithPnl.length : null;

  const decided = wins.length + losses.length;
  const winRatePercent = decided > 0 ? (wins.length / decided) * 100 : null;
  // Flats excluded from win:loss; open excluded entirely.
  // Wins with zero losses → null (UI shows wins/losses counts instead of "∞").
  const winLossRatio = losses.length > 0 ? wins.length / losses.length : null;

  const plannedSamples = closedEntries
    .map((entry) => entry.plannedRr)
    .filter((value): value is number => value != null && Number.isFinite(value));
  const realizedSamples = closedEntries
    .map((entry) => entry.realizedR)
    .filter((value): value is number => value != null && Number.isFinite(value));

  const avgPlannedRr = average(plannedSamples);
  const avgRealizedR = average(realizedSamples);
  const breakeven = avgPlannedRr != null ? breakevenWinRatePercent(avgPlannedRr) : null;

  let rrEffectiveness: RrEffectiveness = "insufficient_data";
  if (winRatePercent != null && breakeven != null && plannedSamples.length > 0) {
    rrEffectiveness = winRatePercent >= breakeven ? "paying" : "underwater";
  }

  let bestTrade: JournalAnalyticsTradeRef | null = null;
  let worstTrade: JournalAnalyticsTradeRef | null = null;
  for (const entry of closedWithPnl) {
    const netPnl = entry.netPnl ?? 0;
    const ref: JournalAnalyticsTradeRef = {
      id: entry.id,
      symbol: entry.symbol,
      tradeDate: entry.tradeDate,
      netPnl,
      realizedR: entry.realizedR,
    };
    if (!bestTrade || netPnl > bestTrade.netPnl) bestTrade = ref;
    if (!worstTrade || netPnl < worstTrade.netPnl) worstTrade = ref;
  }

  return {
    total: entries.length,
    open,
    closed: closedEntries.length,
    wins: wins.length,
    losses: losses.length,
    flats: flats.length,
    totalNetPnl,
    avgNetPnl,
    winRatePercent,
    winLossRatio,
    avgPlannedRr,
    avgRealizedR,
    plannedRrSampleSize: plannedSamples.length,
    realizedRSampleSize: realizedSamples.length,
    breakevenWinRatePercent: breakeven,
    rrEffectiveness,
    bestTrade,
    worstTrade,
  };
}

/** Soft form warnings — never block save. */
export function journalSideWarnings(input: {
  side: TradeSide;
  entryPrice: number | null;
  stopLoss: number | null;
  targetPrice: number | null;
}): string[] {
  const warnings: string[] = [];
  const { side, entryPrice, stopLoss, targetPrice } = input;
  if (entryPrice == null || !Number.isFinite(entryPrice)) return warnings;

  if (stopLoss != null && Number.isFinite(stopLoss) && stopLoss !== entryPrice) {
    const stopOk = side === "long" ? stopLoss < entryPrice : stopLoss > entryPrice;
    if (!stopOk) {
      warnings.push(
        side === "long"
          ? "Stop loss is above entry for a long — usually SL sits below entry."
          : "Stop loss is below entry for a short — usually SL sits above entry.",
      );
    }
  }

  if (targetPrice != null && Number.isFinite(targetPrice) && targetPrice !== entryPrice) {
    const targetOk = side === "long" ? targetPrice > entryPrice : targetPrice < entryPrice;
    if (!targetOk) {
      warnings.push(
        side === "long"
          ? "Target is below entry for a long — usually target sits above entry."
          : "Target is above entry for a short — usually target sits below entry.",
      );
    }
  }

  return warnings;
}
