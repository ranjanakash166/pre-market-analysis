import type { OptionLeg } from "@/lib/options-payoff";

export type StrategyBias =
  | "bullish"
  | "bearish"
  | "neutral"
  | "volatile"
  | "income"
  | "hedge";

export type RiskClass = "defined" | "undefined";

export type StrategyTier = "rookie" | "veteran" | "pro" | "guru";

export type LegBlueprint = {
  kind: "option" | "stock";
  side: "buy" | "sell";
  right?: "call" | "put";
  /** Strike as offset from spot: 0 = ATM, +step, -step, or multiples. */
  strikeOffsetSteps?: number;
  /** Premium as fraction of spot (teaching defaults — user-editable). */
  premiumSpotFraction: number;
  quantity: number;
  /** For stock legs: entry = spot (premium filled at build time). */
};

export type OptionsStrategyTemplate = {
  id: string;
  name: string;
  bias: StrategyBias;
  riskClass: RiskClass;
  tier: StrategyTier;
  bestWhen: string;
  breakEvenFormula: string;
  maxProfitFormula: string;
  maxLossFormula: string;
  /** Multi-expiry strategies use single-expiry diagram as approximation. */
  approximateExpiry?: boolean;
  caution?: string;
  legs: LegBlueprint[];
};

const STEP = 0.03; // default 3% strike spacing from spot

function opt(
  side: "buy" | "sell",
  right: "call" | "put",
  steps: number,
  premFrac: number,
  quantity = 1,
): LegBlueprint {
  return {
    kind: "option",
    side,
    right,
    strikeOffsetSteps: steps,
    premiumSpotFraction: premFrac,
    quantity,
  };
}

function stock(side: "buy" | "sell", quantity = 1): LegBlueprint {
  return {
    kind: "stock",
    side,
    premiumSpotFraction: 1,
    quantity,
  };
}

export const OPTIONS_STRATEGY_TEMPLATES: OptionsStrategyTemplate[] = [
  {
    id: "long-call",
    name: "Long Call",
    bias: "bullish",
    riskClass: "defined",
    tier: "rookie",
    bestWhen: "Bullish",
    breakEvenFormula: "K + Premium",
    maxProfitFormula: "Unlimited",
    maxLossFormula: "Premium paid",
    legs: [opt("buy", "call", 0, 0.02)],
  },
  {
    id: "long-put",
    name: "Long Put",
    bias: "bearish",
    riskClass: "defined",
    tier: "rookie",
    bestWhen: "Bearish",
    breakEvenFormula: "K − Premium",
    maxProfitFormula: "K − Premium",
    maxLossFormula: "Premium paid",
    legs: [opt("buy", "put", 0, 0.02)],
  },
  {
    id: "covered-call",
    name: "Covered Call",
    bias: "income",
    riskClass: "undefined",
    tier: "rookie",
    bestWhen: "Neutral to mildly bullish",
    breakEvenFormula: "Stock Price − Premium",
    maxProfitFormula: "Premium + (K − Stock) capped",
    maxLossFormula: "Unlimited (downside on stock)",
    legs: [stock("buy"), opt("sell", "call", 1, 0.015)],
  },
  {
    id: "cash-secured-put",
    name: "Cash-Secured Put",
    bias: "income",
    riskClass: "defined",
    tier: "rookie",
    bestWhen: "Neutral to mildly bullish",
    breakEvenFormula: "K − Premium",
    maxProfitFormula: "Premium",
    maxLossFormula: "K − Premium",
    legs: [opt("sell", "put", -1, 0.015)],
  },
  {
    id: "protective-put",
    name: "Protective Put (Married Put)",
    bias: "hedge",
    riskClass: "defined",
    tier: "rookie",
    bestWhen: "Want downside protection",
    breakEvenFormula: "Stock Price + Premium",
    maxProfitFormula: "Unlimited",
    maxLossFormula: "Stock − K + Premium",
    legs: [stock("buy"), opt("buy", "put", -1, 0.02)],
  },
  {
    id: "bull-call-spread",
    name: "Bull Call Spread",
    bias: "bullish",
    riskClass: "defined",
    tier: "veteran",
    bestWhen: "Moderately bullish",
    breakEvenFormula: "K1 + Net Debit",
    maxProfitFormula: "(K2 − K1) − Net Debit",
    maxLossFormula: "Net Debit",
    legs: [opt("buy", "call", 0, 0.025), opt("sell", "call", 1, 0.012)],
  },
  {
    id: "bear-call-spread",
    name: "Bear Call Spread",
    bias: "bearish",
    riskClass: "defined",
    tier: "veteran",
    bestWhen: "Moderately bearish",
    breakEvenFormula: "K1 + Net Credit",
    maxProfitFormula: "Net Credit",
    maxLossFormula: "(K2 − K1) − Net Credit",
    legs: [opt("sell", "call", 0, 0.025), opt("buy", "call", 1, 0.012)],
  },
  {
    id: "bull-put-spread",
    name: "Bull Put Spread",
    bias: "bullish",
    riskClass: "defined",
    tier: "veteran",
    bestWhen: "Moderately bullish",
    breakEvenFormula: "K2 − Net Credit",
    maxProfitFormula: "Net Credit",
    maxLossFormula: "(K2 − K1) − Net Credit",
    legs: [opt("buy", "put", -1, 0.012), opt("sell", "put", 0, 0.025)],
  },
  {
    id: "bear-put-spread",
    name: "Bear Put Spread",
    bias: "bearish",
    riskClass: "defined",
    tier: "veteran",
    bestWhen: "Moderately bearish",
    breakEvenFormula: "K2 − Net Debit",
    maxProfitFormula: "(K2 − K1) − Net Debit",
    maxLossFormula: "Net Debit",
    legs: [opt("buy", "put", 0, 0.025), opt("sell", "put", -1, 0.012)],
  },
  {
    id: "collar",
    name: "Collar",
    bias: "hedge",
    riskClass: "defined",
    tier: "veteran",
    bestWhen: "Limits both downside & upside",
    breakEvenFormula: "Stock − Net Cost",
    maxProfitFormula: "(K2 − Stock) + Net Credit",
    maxLossFormula: "(Stock − K1) − Net Credit",
    legs: [stock("buy"), opt("buy", "put", -1, 0.018), opt("sell", "call", 1, 0.018)],
  },
  {
    id: "long-call-butterfly",
    name: "Long Call Butterfly",
    bias: "neutral",
    riskClass: "defined",
    tier: "pro",
    bestWhen: "Low volatility, neutral",
    breakEvenFormula: "K1 + Net Debit / K3 − Net Debit",
    maxProfitFormula: "(K2 − K1) − Net Debit",
    maxLossFormula: "Net Debit",
    legs: [
      opt("buy", "call", -1, 0.03),
      opt("sell", "call", 0, 0.02, 2),
      opt("buy", "call", 1, 0.01),
    ],
  },
  {
    id: "long-put-butterfly",
    name: "Long Put Butterfly",
    bias: "neutral",
    riskClass: "defined",
    tier: "pro",
    bestWhen: "Low volatility, neutral",
    breakEvenFormula: "K1 + Net Debit / K3 − Net Debit",
    maxProfitFormula: "(K2 − K1) − Net Debit",
    maxLossFormula: "Net Debit",
    legs: [
      opt("buy", "put", -1, 0.01),
      opt("sell", "put", 0, 0.02, 2),
      opt("buy", "put", 1, 0.03),
    ],
  },
  {
    id: "long-straddle",
    name: "Long Straddle",
    bias: "volatile",
    riskClass: "defined",
    tier: "veteran",
    bestWhen: "High volatility",
    breakEvenFormula: "K ± Total Premium",
    maxProfitFormula: "Unlimited",
    maxLossFormula: "Total Premium",
    legs: [opt("buy", "call", 0, 0.02), opt("buy", "put", 0, 0.02)],
  },
  {
    id: "short-straddle",
    name: "Short Straddle",
    bias: "neutral",
    riskClass: "undefined",
    tier: "guru",
    bestWhen: "Low volatility",
    breakEvenFormula: "K ± Total Premium",
    maxProfitFormula: "Total Premium",
    maxLossFormula: "Unlimited",
    legs: [opt("sell", "call", 0, 0.02), opt("sell", "put", 0, 0.02)],
  },
  {
    id: "long-strangle",
    name: "Long Strangle",
    bias: "volatile",
    riskClass: "defined",
    tier: "veteran",
    bestWhen: "High volatility",
    breakEvenFormula: "K2 + Total Premium / K1 − Total Premium",
    maxProfitFormula: "Unlimited",
    maxLossFormula: "Total Premium",
    legs: [opt("buy", "put", -1, 0.012), opt("buy", "call", 1, 0.012)],
  },
  {
    id: "short-strangle",
    name: "Short Strangle",
    bias: "neutral",
    riskClass: "undefined",
    tier: "guru",
    bestWhen: "Low volatility",
    breakEvenFormula: "K2 + Total Premium / K1 − Total Premium",
    maxProfitFormula: "Total Premium",
    maxLossFormula: "Unlimited",
    legs: [opt("sell", "put", -1, 0.012), opt("sell", "call", 1, 0.012)],
  },
  {
    id: "iron-butterfly",
    name: "Iron Butterfly",
    bias: "neutral",
    riskClass: "defined",
    tier: "pro",
    bestWhen: "Low volatility",
    breakEvenFormula: "K2 ± Net Credit",
    maxProfitFormula: "Net Credit",
    maxLossFormula: "(K2 − K1) − Net Credit",
    legs: [
      opt("buy", "put", -1, 0.008),
      opt("sell", "put", 0, 0.02),
      opt("sell", "call", 0, 0.02),
      opt("buy", "call", 1, 0.008),
    ],
  },
  {
    id: "iron-condor",
    name: "Iron Condor",
    bias: "neutral",
    riskClass: "defined",
    tier: "pro",
    bestWhen: "Neutral, low volatility",
    breakEvenFormula: "K2 + Net Credit / K3 − Net Credit",
    maxProfitFormula: "Net Credit",
    maxLossFormula: "(K3 − K2) − Net Credit",
    legs: [
      opt("buy", "put", -2, 0.006),
      opt("sell", "put", -1, 0.014),
      opt("sell", "call", 1, 0.014),
      opt("buy", "call", 2, 0.006),
    ],
  },
  {
    id: "long-calendar-call",
    name: "Long Call Calendar",
    bias: "neutral",
    riskClass: "defined",
    tier: "pro",
    bestWhen: "Neutral, low volatility",
    breakEvenFormula: "Varies (multi-expiry)",
    maxProfitFormula: "Limited",
    maxLossFormula: "Net Debit",
    approximateExpiry: true,
    caution: "Multi-expiry: diagram approximates both legs at one expiry for teaching.",
    legs: [opt("sell", "call", 0, 0.018), opt("buy", "call", 0, 0.028)],
  },
  {
    id: "short-calendar-call",
    name: "Short Call Calendar",
    bias: "volatile",
    riskClass: "undefined",
    tier: "guru",
    bestWhen: "Expect a sharp move / IV crush of far month",
    breakEvenFormula: "Varies (multi-expiry)",
    maxProfitFormula: "Limited",
    maxLossFormula: "Limited to undefined (approx)",
    approximateExpiry: true,
    caution: "Multi-expiry approximation. Short calendars can behave poorly if mismanaged.",
    legs: [opt("buy", "call", 0, 0.018), opt("sell", "call", 0, 0.028)],
  },
  {
    id: "diagonal-call",
    name: "Diagonal Call Spread",
    bias: "bullish",
    riskClass: "defined",
    tier: "pro",
    bestWhen: "Mild bullish trend",
    breakEvenFormula: "Varies (multi-expiry)",
    maxProfitFormula: "Limited",
    maxLossFormula: "Net Debit",
    approximateExpiry: true,
    caution: "Multi-expiry: single-expiry diagram is approximate.",
    legs: [opt("sell", "call", 0, 0.016), opt("buy", "call", 1, 0.022)],
  },
  {
    id: "diagonal-put",
    name: "Diagonal Put Spread",
    bias: "bearish",
    riskClass: "defined",
    tier: "pro",
    bestWhen: "Mild bearish trend",
    breakEvenFormula: "Varies (multi-expiry)",
    maxProfitFormula: "Limited",
    maxLossFormula: "Net Debit",
    approximateExpiry: true,
    caution: "Multi-expiry: single-expiry diagram is approximate.",
    legs: [opt("sell", "put", 0, 0.016), opt("buy", "put", -1, 0.022)],
  },
  {
    id: "call-backspread",
    name: "Call Backspread",
    bias: "bullish",
    riskClass: "defined",
    tier: "guru",
    bestWhen: "Strong bullish move",
    breakEvenFormula: "Limited / varies",
    maxProfitFormula: "Unlimited",
    maxLossFormula: "Limited",
    legs: [opt("sell", "call", 0, 0.025), opt("buy", "call", 1, 0.014, 2)],
  },
  {
    id: "put-backspread",
    name: "Put Backspread",
    bias: "bearish",
    riskClass: "defined",
    tier: "guru",
    bestWhen: "Strong bearish move",
    breakEvenFormula: "Limited / varies",
    maxProfitFormula: "Unlimited",
    maxLossFormula: "Limited",
    legs: [opt("sell", "put", 0, 0.025), opt("buy", "put", -1, 0.014, 2)],
  },
  {
    id: "synthetic-long-stock",
    name: "Synthetic Long Stock",
    bias: "bullish",
    riskClass: "undefined",
    tier: "pro",
    bestWhen: "Bullish (futures substitute)",
    breakEvenFormula: "K − Net Debit / K + Net Credit",
    maxProfitFormula: "Unlimited",
    maxLossFormula: "Unlimited",
    legs: [opt("buy", "call", 0, 0.02), opt("sell", "put", 0, 0.02)],
  },
  {
    id: "synthetic-short-stock",
    name: "Synthetic Short Stock",
    bias: "bearish",
    riskClass: "undefined",
    tier: "pro",
    bestWhen: "Bearish (futures substitute)",
    breakEvenFormula: "K + Net Debit / K − Net Credit",
    maxProfitFormula: "Unlimited",
    maxLossFormula: "Unlimited",
    legs: [opt("sell", "call", 0, 0.02), opt("buy", "put", 0, 0.02)],
  },
  {
    id: "fig-leaf",
    name: "Fig Leaf (Leveraged Covered Call)",
    bias: "bullish",
    riskClass: "defined",
    tier: "pro",
    bestWhen: "Mildly bullish",
    breakEvenFormula: "K2 − Net Debit (approx)",
    maxProfitFormula: "Limited",
    maxLossFormula: "Limited",
    caution: "Long-dated deep ITM call + short near call — modelled as LEAP-style long call + short call.",
    legs: [opt("buy", "call", -1, 0.08), opt("sell", "call", 1, 0.015)],
  },
  {
    id: "call-front-spread",
    name: "Call Front Spread",
    bias: "bullish",
    riskClass: "undefined",
    tier: "guru",
    bestWhen: "Moderately bullish (limited upside)",
    breakEvenFormula: "Varies",
    maxProfitFormula: "Limited",
    maxLossFormula: "Unlimited",
    legs: [opt("buy", "call", 0, 0.022), opt("sell", "call", 1, 0.012, 2)],
  },
  {
    id: "put-front-spread",
    name: "Put Front Spread",
    bias: "bearish",
    riskClass: "undefined",
    tier: "guru",
    bestWhen: "Moderately bearish (limited downside)",
    breakEvenFormula: "Varies",
    maxProfitFormula: "Limited",
    maxLossFormula: "Unlimited",
    legs: [opt("buy", "put", 0, 0.022), opt("sell", "put", -1, 0.012, 2)],
  },
  {
    id: "covered-put",
    name: "Covered Put",
    bias: "income",
    riskClass: "undefined",
    tier: "guru",
    bestWhen: "Neutral / mildly bearish (nonstandard construction)",
    breakEvenFormula: "Stock Price − Premium (as diagrammed)",
    maxProfitFormula: "Premium",
    maxLossFormula: "Unlimited (stock downside)",
    caution:
      "Nonstandard vs common literature (usually short stock + short put). Verify before trading.",
    legs: [stock("buy"), opt("sell", "put", -1, 0.015)],
  },
  {
    id: "call-ratio-spread",
    name: "Call Ratio Spread",
    bias: "bullish",
    riskClass: "undefined",
    tier: "guru",
    bestWhen: "Neutral to mildly bullish",
    breakEvenFormula: "Varies",
    maxProfitFormula: "Limited",
    maxLossFormula: "Unlimited (upside)",
    caution: "Sells more calls than bought — opposite risk profile to a call backspread.",
    legs: [opt("buy", "call", 0, 0.025), opt("sell", "call", 1, 0.012, 2)],
  },
  {
    id: "put-ratio-spread",
    name: "Put Ratio Spread",
    bias: "bearish",
    riskClass: "undefined",
    tier: "guru",
    bestWhen: "Neutral to mildly bearish",
    breakEvenFormula: "Varies",
    maxProfitFormula: "Limited",
    maxLossFormula: "Unlimited (downside)",
    caution: "Sells more puts than bought — opposite risk profile to a put backspread.",
    legs: [opt("buy", "put", 0, 0.025), opt("sell", "put", -1, 0.012, 2)],
  },
  {
    id: "long-call-condor",
    name: "Long Call Condor",
    bias: "bullish",
    riskClass: "defined",
    tier: "pro",
    bestWhen: "Defined bullish range",
    breakEvenFormula: "Inner strikes ± net debit",
    maxProfitFormula: "Limited",
    maxLossFormula: "Net Debit",
    legs: [
      opt("buy", "call", -2, 0.035),
      opt("sell", "call", -1, 0.022),
      opt("sell", "call", 1, 0.012),
      opt("buy", "call", 2, 0.006),
    ],
  },
  {
    id: "long-put-condor",
    name: "Long Put Condor",
    bias: "bearish",
    riskClass: "defined",
    tier: "pro",
    bestWhen: "Defined bearish range",
    breakEvenFormula: "Inner strikes ± net debit",
    maxProfitFormula: "Limited",
    maxLossFormula: "Net Debit",
    legs: [
      opt("buy", "put", -2, 0.006),
      opt("sell", "put", -1, 0.012),
      opt("sell", "put", 1, 0.022),
      opt("buy", "put", 2, 0.035),
    ],
  },
  {
    id: "short-call-condor",
    name: "Short Call Condor",
    bias: "neutral",
    riskClass: "defined",
    tier: "pro",
    bestWhen: "Neutral, low movement",
    breakEvenFormula: "Inner strikes ± net credit",
    maxProfitFormula: "Net Credit",
    maxLossFormula: "Limited",
    legs: [
      opt("sell", "call", -2, 0.035),
      opt("buy", "call", -1, 0.022),
      opt("buy", "call", 1, 0.012),
      opt("sell", "call", 2, 0.006),
    ],
  },
  {
    id: "short-put-condor",
    name: "Short Put Condor",
    bias: "neutral",
    riskClass: "defined",
    tier: "pro",
    bestWhen: "Neutral, low movement",
    breakEvenFormula: "Inner strikes ± net credit",
    maxProfitFormula: "Net Credit",
    maxLossFormula: "Limited",
    legs: [
      opt("sell", "put", -2, 0.006),
      opt("buy", "put", -1, 0.012),
      opt("buy", "put", 1, 0.022),
      opt("sell", "put", 2, 0.035),
    ],
  },
  {
    id: "synthetic-long-call",
    name: "Synthetic Long Call",
    bias: "bullish",
    riskClass: "defined",
    tier: "pro",
    bestWhen: "Bullish with stock + put (call replica)",
    breakEvenFormula: "Stock + Put premium − adjustments",
    maxProfitFormula: "Unlimited",
    maxLossFormula: "Limited",
    legs: [stock("buy"), opt("buy", "put", 0, 0.02)],
  },
  {
    id: "synthetic-long-put",
    name: "Synthetic Long Put",
    bias: "bearish",
    riskClass: "defined",
    tier: "pro",
    bestWhen: "Bearish with short stock + call (put replica)",
    breakEvenFormula: "Short stock − Call premium adjustments",
    maxProfitFormula: "Unlimited",
    maxLossFormula: "Limited",
    legs: [stock("sell"), opt("buy", "call", 0, 0.02)],
  },
];

export const STRIKE_STEP_FRACTION = STEP;

export function getTemplateById(id: string): OptionsStrategyTemplate | undefined {
  return OPTIONS_STRATEGY_TEMPLATES.find((t) => t.id === id);
}

export function buildLegsFromTemplate(
  template: OptionsStrategyTemplate,
  spot: number,
  stepFraction = STEP,
): OptionLeg[] {
  return template.legs.map((bp, index) => {
    if (bp.kind === "stock") {
      return {
        id: `leg-${index}`,
        kind: "stock",
        side: bp.side,
        premium: spot,
        quantity: bp.quantity,
      };
    }
    const steps = bp.strikeOffsetSteps ?? 0;
    const strike = Math.round(spot * (1 + steps * stepFraction));
    const premium = Math.max(0.05, Math.round(spot * bp.premiumSpotFraction * 100) / 100);
    return {
      id: `leg-${index}`,
      kind: "option",
      side: bp.side,
      right: bp.right,
      strike: Math.max(1, strike),
      premium,
      quantity: bp.quantity,
    };
  });
}

export const BIAS_FILTERS: Array<{ id: StrategyBias | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "bullish", label: "Bullish" },
  { id: "bearish", label: "Bearish" },
  { id: "neutral", label: "Neutral" },
  { id: "volatile", label: "Volatility" },
  { id: "income", label: "Income" },
  { id: "hedge", label: "Hedge" },
];

export const TIER_FILTERS: Array<{ id: StrategyTier | "all"; label: string }> = [
  { id: "all", label: "All tiers" },
  { id: "rookie", label: "Rookie" },
  { id: "veteran", label: "Veteran" },
  { id: "pro", label: "Pro" },
  { id: "guru", label: "Guru" },
];
