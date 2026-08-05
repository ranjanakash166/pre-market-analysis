import { z } from "zod";

/**
 * At-expiration multi-leg options payoff engine.
 * Stock + call/put legs → P&L at a given underlying price.
 * Multi-expiry (calendar/diagonal) templates are marked approximate.
 */

export type OptionRight = "call" | "put";
export type LegKind = "option" | "stock";
export type LegSide = "buy" | "sell";

export type OptionLeg = {
  id: string;
  kind: LegKind;
  side: LegSide;
  right?: OptionRight;
  strike?: number;
  /** Premium paid/received per unit (positive number). Ignored for stock except as entry price via strike/spot. */
  premium: number;
  /** Number of units (shares or option contracts * before lot multiplier). */
  quantity: number;
};

export const optionLegSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["option", "stock"]),
  side: z.enum(["buy", "sell"]),
  right: z.enum(["call", "put"]).optional(),
  strike: z.coerce.number().finite().positive().optional(),
  premium: z.coerce.number().finite().min(0),
  quantity: z.coerce.number().finite().positive(),
});

export const optionsBuilderInputSchema = z.object({
  spot: z.coerce.number().finite().positive(),
  lotSize: z.coerce.number().int().positive().default(1),
  legs: z.array(optionLegSchema).min(1),
});

export type OptionsBuilderInput = z.infer<typeof optionsBuilderInputSchema>;

function sign(side: LegSide): 1 | -1 {
  return side === "buy" ? 1 : -1;
}

/** Intrinsic value of one option at expiry. */
export function optionIntrinsic(right: OptionRight, strike: number, spotAtExpiry: number): number {
  return right === "call" ? Math.max(0, spotAtExpiry - strike) : Math.max(0, strike - spotAtExpiry);
}

/**
 * P&L of one leg at expiry (per unit quantity already applied).
 * Stock: buy/sell at `premium` as entry price (stock entry stored in premium field).
 */
export function legPayoffAtExpiry(leg: OptionLeg, spotAtExpiry: number): number {
  const qty = leg.quantity;
  const s = sign(leg.side);

  if (leg.kind === "stock") {
    const entry = leg.premium;
    return s * (spotAtExpiry - entry) * qty;
  }

  const strike = leg.strike ?? 0;
  const right = leg.right ?? "call";
  const intrinsic = optionIntrinsic(right, strike, spotAtExpiry);
  // Buy: +intrinsic - premium; Sell: -intrinsic + premium
  return s * (intrinsic - leg.premium) * qty;
}

export function payoffAtExpiry(legs: OptionLeg[], spotAtExpiry: number, lotSize = 1): number {
  const scale = lotSize;
  return legs.reduce((sum, leg) => sum + legPayoffAtExpiry(leg, spotAtExpiry) * scale, 0);
}

/** Net cash at open: negative = debit paid, positive = credit received (per lot unit, before lotSize). */
export function netPremium(legs: OptionLeg[]): number {
  return legs.reduce((sum, leg) => {
    if (leg.kind === "stock") return sum;
    const cash = leg.side === "sell" ? leg.premium : -leg.premium;
    return sum + cash * leg.quantity;
  }, 0);
}

export type BoundedValue = number | "unlimited";

export type StrategyStats = {
  netPremium: number;
  isCredit: boolean;
  maxProfit: BoundedValue;
  maxLoss: BoundedValue;
  breakEvens: number[];
  payoffPoints: Array<{ spot: number; pnl: number }>;
  spotMin: number;
  spotMax: number;
};

function collectKeyPrices(legs: OptionLeg[], spot: number): number[] {
  const keys = new Set<number>([spot]);
  for (const leg of legs) {
    if (leg.kind === "option" && leg.strike != null) keys.add(leg.strike);
    if (leg.kind === "stock" && leg.premium > 0) keys.add(leg.premium);
  }
  return [...keys].filter((n) => Number.isFinite(n) && n > 0).sort((a, b) => a - b);
}

function buildSpotGrid(legs: OptionLeg[], spot: number, points = 120): number[] {
  const keys = collectKeyPrices(legs, spot);
  const loKey = keys[0] ?? spot;
  const hiKey = keys[keys.length - 1] ?? spot;
  const pad = Math.max(spot * 0.25, (hiKey - loKey) * 0.5, 50);
  const min = Math.max(1, loKey - pad);
  const max = hiKey + pad;
  const step = (max - min) / (points - 1);
  const grid: number[] = [];
  for (let i = 0; i < points; i++) grid.push(min + i * step);
  for (const k of keys) {
    if (k >= min && k <= max) grid.push(k);
  }
  return [...new Set(grid.map((n) => Math.round(n * 100) / 100))].sort((a, b) => a - b);
}

function findBreakEvens(points: Array<{ spot: number; pnl: number }>): number[] {
  const bes: number[] = [];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    if (a.pnl === 0) {
      bes.push(a.spot);
      continue;
    }
    if (a.pnl * b.pnl < 0) {
      const t = a.pnl / (a.pnl - b.pnl);
      bes.push(a.spot + t * (b.spot - a.spot));
    }
  }
  // Dedupe near-equal
  const out: number[] = [];
  for (const be of bes) {
    if (!out.some((x) => Math.abs(x - be) < 0.05)) out.push(be);
  }
  return out;
}

function isUnlimitedUp(points: Array<{ spot: number; pnl: number }>): boolean {
  if (points.length < 3) return false;
  const n = points.length;
  const slope = (points[n - 1].pnl - points[n - 3].pnl) / (points[n - 1].spot - points[n - 3].spot);
  return slope > 0.15; // growing with spot
}

function isUnlimitedDown(points: Array<{ spot: number; pnl: number }>): boolean {
  if (points.length < 3) return false;
  const slope = (points[2].pnl - points[0].pnl) / (points[2].spot - points[0].spot);
  // Loss grows as spot falls → negative slope and pnl very negative at left
  return slope < -0.15 && points[0].pnl < points[Math.floor(points.length / 2)].pnl;
}

export function computeStrategyStats(
  legs: OptionLeg[],
  spot: number,
  lotSize = 1,
): StrategyStats {
  const grid = buildSpotGrid(legs, spot);
  const payoffPoints = grid.map((s) => ({ spot: s, pnl: payoffAtExpiry(legs, s, lotSize) }));
  const pnls = payoffPoints.map((p) => p.pnl);
  const finiteMax = Math.max(...pnls);
  const finiteMin = Math.min(...pnls);

  const unlimitedProfit = isUnlimitedUp(payoffPoints) || (isUnlimitedDown(payoffPoints) && finiteMax === pnls[0]);
  // Unlimited profit on downside (short stock / long put style): left side rising as spot falls
  const profitUnlimitedDown =
    pointsSlopeLeftUp(payoffPoints) && finiteMax === Math.max(pnls[0], pnls[1] ?? pnls[0]);

  const maxProfit: BoundedValue =
    unlimitedProfit || profitUnlimitedDown || Math.abs(finiteMax) > 1e10 ? "unlimited" : finiteMax;
  const maxLoss: BoundedValue =
    isUnlimitedDown(payoffPoints) && finiteMin === pnls[0]
      ? "unlimited"
      : isUnlimitedUp(payoffPoints) && finiteMin === pnls[pnls.length - 1]
        ? "unlimited"
        : lossUnlimitedOnRight(payoffPoints)
          ? "unlimited"
          : lossUnlimitedOnLeft(payoffPoints)
            ? "unlimited"
            : finiteMin;

  const net = netPremium(legs) * lotSize;

  return {
    netPremium: net,
    isCredit: net > 0,
    maxProfit,
    maxLoss,
    breakEvens: findBreakEvens(payoffPoints),
    payoffPoints,
    spotMin: grid[0],
    spotMax: grid[grid.length - 1],
  };
}

function pointsSlopeLeftUp(points: Array<{ spot: number; pnl: number }>): boolean {
  if (points.length < 3) return false;
  // As spot increases from left, pnl falls → profit unlimited to the downside
  const slope = (points[2].pnl - points[0].pnl) / (points[2].spot - points[0].spot);
  return slope < -0.15 && points[0].pnl > 0;
}

function lossUnlimitedOnRight(points: Array<{ spot: number; pnl: number }>): boolean {
  if (points.length < 3) return false;
  const n = points.length;
  const slope = (points[n - 1].pnl - points[n - 3].pnl) / (points[n - 1].spot - points[n - 3].spot);
  return slope < -0.15 && points[n - 1].pnl < -1;
}

function lossUnlimitedOnLeft(points: Array<{ spot: number; pnl: number }>): boolean {
  if (points.length < 3) return false;
  const slope = (points[2].pnl - points[0].pnl) / (points[2].spot - points[0].spot);
  return slope > 0.15 && points[0].pnl < -1;
}

export function formatBounded(value: BoundedValue, currency = true): string {
  if (value === "unlimited") return "Unlimited";
  if (!currency) return value.toFixed(2);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}
