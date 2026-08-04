import { z } from "zod";

/**
 * Risk-first position sizing.
 *
 * Core formula:
 *   Max loss allowed = risk% x capital        (recommended <= 2% per trade)
 *   Risk per unit    = |entry - stop loss|
 *   Quantity         = floor(max loss / risk per unit)
 *
 * For F&O the block is a lot (lot size x per-unit risk), and for concurrent
 * swing positions an allocation cap of capital/N applies on top of the
 * risk-based size — the final quantity is the smaller of the two.
 */

export const RECOMMENDED_MAX_RISK_PERCENT = 2;
export const HIGH_RISK_PERCENT = 5;

/** NSE/BSE index derivative lot sizes, January 2026 revision. User-editable in the UI. */
export const LOT_SIZE_PRESETS = [
  { symbol: "NIFTY", label: "Nifty 50", lotSize: 65 },
  { symbol: "BANKNIFTY", label: "Bank Nifty", lotSize: 30 },
  { symbol: "FINNIFTY", label: "FinNifty", lotSize: 60 },
  { symbol: "MIDCPNIFTY", label: "Midcap Nifty", lotSize: 120 },
  { symbol: "SENSEX", label: "Sensex", lotSize: 20 },
] as const;

export const LOT_SIZES_AS_OF = "Jan 2026 exchange revision";

/** Recovery gain needed after a drawdown: loss% / (1 - loss%). */
export function recoveryGainPercent(lossPercent: number): number {
  return (lossPercent / (100 - lossPercent)) * 100;
}

export const RECOVERY_TABLE = [10, 20, 30, 50].map((lossPercent) => ({
  lossPercent,
  gainNeededPercent: recoveryGainPercent(lossPercent),
}));

export const positionSizeInputSchema = z
  .object({
    capital: z.coerce.number().finite().positive(),
    riskPercent: z.coerce.number().finite().positive().max(100),
    entryPrice: z.coerce.number().finite().positive(),
    stopLossPrice: z.coerce.number().finite().positive(),
    targetPrice: z.coerce.number().finite().positive().nullable().optional(),
    mode: z.enum(["equity", "lots"]),
    lotSize: z.coerce.number().int().positive().nullable().optional(),
    concurrentPositions: z.coerce.number().int().min(1).max(50).default(1),
  })
  .superRefine((value, ctx) => {
    if (value.stopLossPrice === value.entryPrice) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["stopLossPrice"],
        message: "Stop loss must differ from entry price — the gap between them is your risk per unit.",
      });
    }
    if (value.mode === "lots" && (value.lotSize == null || value.lotSize < 1)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["lotSize"],
        message: "Lot size is required for F&O sizing.",
      });
    }
    if (value.targetPrice != null && value.stopLossPrice !== value.entryPrice) {
      const isLong = value.stopLossPrice < value.entryPrice;
      const targetOnProfitSide = isLong
        ? value.targetPrice > value.entryPrice
        : value.targetPrice < value.entryPrice;
      if (!targetOnProfitSide) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["targetPrice"],
          message: "Target must sit on the profit side of the entry (above entry for longs, below for shorts).",
        });
      }
    }
  });

export type PositionSizeInput = z.infer<typeof positionSizeInputSchema>;

export type PositionSizeResult = {
  side: "long" | "short";
  /** Rupees the trader is allowed to lose on this trade (risk% x capital). */
  maxLossAllowed: number;
  riskPerUnit: number;
  /** Final size in units (shares, or lots x lot size). */
  quantity: number;
  /** Final size in lots (null in equity mode). */
  lots: number | null;
  lotSize: number;
  /** Which cap produced the final size. */
  bindingConstraint: "risk" | "allocation";
  /** Capital/N allocation ceiling applied on top of risk-based sizing. */
  allocationCap: number;
  positionValue: number;
  capitalDeployedPercent: number;
  /** Rupee loss if the stop is hit at the computed size. */
  actualRiskAmount: number;
  actualRiskPercent: number;
  /** "Beginner mistake" comparison: deploy all capital instead of sizing by risk. */
  fullCapitalQuantity: number;
  fullCapitalLossAmount: number;
  fullCapitalLossPercent: number;
  rewardRiskRatio: number | null;
  /** Win rate needed to break even at this R:R: 1 / (1 + R:R). */
  breakevenWinRatePercent: number | null;
};

export function computePositionSize(input: PositionSizeInput): PositionSizeResult {
  const side: "long" | "short" = input.stopLossPrice < input.entryPrice ? "long" : "short";
  const riskPerUnit = Math.abs(input.entryPrice - input.stopLossPrice);
  const maxLossAllowed = (input.riskPercent / 100) * input.capital;
  const allocationCap = input.capital / input.concurrentPositions;

  // A "block" is the smallest tradeable increment: 1 share in equity mode, 1 lot in F&O mode.
  const lotSize = input.mode === "lots" ? (input.lotSize ?? 1) : 1;
  const blockValue = input.entryPrice * lotSize;
  const riskPerBlock = riskPerUnit * lotSize;

  const riskBasedBlocks = Math.floor(maxLossAllowed / riskPerBlock);
  const allocationBasedBlocks = Math.floor(allocationCap / blockValue);
  const blocks = Math.max(0, Math.min(riskBasedBlocks, allocationBasedBlocks));
  const bindingConstraint: "risk" | "allocation" =
    riskBasedBlocks <= allocationBasedBlocks ? "risk" : "allocation";

  const quantity = blocks * lotSize;
  const positionValue = blocks * blockValue;
  const actualRiskAmount = blocks * riskPerBlock;

  const fullCapitalBlocks = Math.floor(input.capital / blockValue);
  const fullCapitalLossAmount = fullCapitalBlocks * riskPerBlock;

  let rewardRiskRatio: number | null = null;
  let breakevenWinRatePercent: number | null = null;
  if (input.targetPrice != null) {
    const rewardPerUnit = Math.abs(input.targetPrice - input.entryPrice);
    if (rewardPerUnit > 0 && riskPerUnit > 0) {
      rewardRiskRatio = rewardPerUnit / riskPerUnit;
      breakevenWinRatePercent = (1 / (1 + rewardRiskRatio)) * 100;
    }
  }

  return {
    side,
    maxLossAllowed,
    riskPerUnit,
    quantity,
    lots: input.mode === "lots" ? blocks : null,
    lotSize,
    bindingConstraint,
    allocationCap,
    positionValue,
    capitalDeployedPercent: (positionValue / input.capital) * 100,
    actualRiskAmount,
    actualRiskPercent: (actualRiskAmount / input.capital) * 100,
    fullCapitalQuantity: fullCapitalBlocks * lotSize,
    fullCapitalLossAmount,
    fullCapitalLossPercent: (fullCapitalLossAmount / input.capital) * 100,
    rewardRiskRatio,
    breakevenWinRatePercent,
  };
}
