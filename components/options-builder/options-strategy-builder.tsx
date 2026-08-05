"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Calculator,
  CandlestickChart,
  NotebookPen,
  ShieldAlert,
} from "lucide-react";
import {
  computeStrategyStats,
  formatBounded,
  type OptionLeg,
} from "@/lib/options-payoff";
import { LOT_SIZE_PRESETS, LOT_SIZES_AS_OF } from "@/lib/position-size";
import {
  BIAS_FILTERS,
  OPTIONS_STRATEGY_TEMPLATES,
  TIER_FILTERS,
  buildLegsFromTemplate,
  getTemplateById,
  type StrategyBias,
  type StrategyTier,
} from "@/lib/options-strategy-templates";

function toCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function PayoffChart({
  points,
  spot,
  breakEvens,
}: {
  points: Array<{ spot: number; pnl: number }>;
  spot: number;
  breakEvens: number[];
}) {
  if (points.length < 2) {
    return <div className="text-sm text-slate-500">Not enough points to draw payoff.</div>;
  }

  const width = 640;
  const height = 280;
  const pad = { top: 16, right: 16, bottom: 28, left: 48 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const xs = points.map((p) => p.spot);
  const ys = points.map((p) => p.pnl);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const rawMinY = Math.min(...ys, 0);
  const rawMaxY = Math.max(...ys, 0);
  const yPad = Math.max((rawMaxY - rawMinY) * 0.08, 1);
  const minY = rawMinY - yPad;
  const maxY = rawMaxY + yPad;

  const xScale = (x: number) => pad.left + ((x - minX) / (maxX - minX || 1)) * innerW;
  const yScale = (y: number) => pad.top + ((maxY - y) / (maxY - minY || 1)) * innerH;

  const zeroY = yScale(0);
  const polyline = points.map((p) => `${xScale(p.spot)},${yScale(p.pnl)}`).join(" ");

  // Split profit/loss fills roughly via area under curve coloring by segments
  const segments: Array<{ d: string; profit: boolean }> = [];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const midProfit = (a.pnl + b.pnl) / 2 >= 0;
    const d = `M ${xScale(a.spot)} ${zeroY} L ${xScale(a.spot)} ${yScale(a.pnl)} L ${xScale(b.spot)} ${yScale(b.pnl)} L ${xScale(b.spot)} ${zeroY} Z`;
    segments.push({ d, profit: midProfit });
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Payoff diagram">
      <rect x={0} y={0} width={width} height={height} fill="transparent" />
      {/* zero line */}
      <line
        x1={pad.left}
        x2={width - pad.right}
        y1={zeroY}
        y2={zeroY}
        stroke="rgb(148 163 184 / 0.45)"
        strokeDasharray="4 4"
      />
      {segments.map((seg, i) => (
        <path
          key={i}
          d={seg.d}
          fill={seg.profit ? "rgb(16 185 129 / 0.18)" : "rgb(244 63 94 / 0.18)"}
          stroke="none"
        />
      ))}
      <polyline
        fill="none"
        stroke="rgb(251 191 36)"
        strokeWidth={2.2}
        points={polyline}
      />
      {/* spot marker */}
      <line
        x1={xScale(spot)}
        x2={xScale(spot)}
        y1={pad.top}
        y2={height - pad.bottom}
        stroke="rgb(34 211 238 / 0.55)"
        strokeDasharray="3 3"
      />
      {breakEvens.map((be) => (
        <circle key={be} cx={xScale(be)} cy={zeroY} r={3.5} fill="rgb(248 250 252)" />
      ))}
      <text x={pad.left} y={height - 8} className="fill-slate-500" fontSize="10">
        {minX.toFixed(0)}
      </text>
      <text x={width - pad.right} y={height - 8} textAnchor="end" className="fill-slate-500" fontSize="10">
        {maxX.toFixed(0)}
      </text>
      <text x={8} y={pad.top + 8} className="fill-slate-500" fontSize="10">
        P&amp;L
      </text>
    </svg>
  );
}

export function OptionsStrategyBuilder() {
  const [templateId, setTemplateId] = useState("bull-call-spread");
  const [biasFilter, setBiasFilter] = useState<StrategyBias | "all">("all");
  const [tierFilter, setTierFilter] = useState<StrategyTier | "all">("all");
  const [spot, setSpot] = useState(24500);
  const [lotSize, setLotSize] = useState<number>(LOT_SIZE_PRESETS[0].lotSize);
  const [lotPreset, setLotPreset] = useState<string>(LOT_SIZE_PRESETS[0].symbol);
  const [lots, setLots] = useState(1);
  const [symbol, setSymbol] = useState<string>("NIFTY");
  const [legs, setLegs] = useState<OptionLeg[]>(() =>
    buildLegsFromTemplate(getTemplateById("bull-call-spread")!, 24500),
  );

  const template = getTemplateById(templateId) ?? OPTIONS_STRATEGY_TEMPLATES[0];

  const visibleTemplates = useMemo(() => {
    return OPTIONS_STRATEGY_TEMPLATES.filter((t) => {
      if (biasFilter !== "all" && t.bias !== biasFilter) return false;
      if (tierFilter !== "all" && t.tier !== tierFilter) return false;
      return true;
    });
  }, [biasFilter, tierFilter]);

  const effectiveLotSize = lotSize * Math.max(1, lots);
  const stats = useMemo(
    () => computeStrategyStats(legs, spot, effectiveLotSize),
    [legs, spot, effectiveLotSize],
  );

  function selectTemplate(id: string) {
    const next = getTemplateById(id);
    if (!next) return;
    setTemplateId(id);
    setLegs(buildLegsFromTemplate(next, spot));
  }

  function updateLeg(id: string, patch: Partial<OptionLeg>) {
    setLegs((current) => current.map((leg) => (leg.id === id ? { ...leg, ...patch } : leg)));
  }

  function rebuildFromSpot(nextSpot: number) {
    setSpot(nextSpot);
    const t = getTemplateById(templateId);
    if (t) setLegs(buildLegsFromTemplate(t, nextSpot));
  }

  const journalHref = useMemo(() => {
    const params = new URLSearchParams();
    params.set("prefill", "1");
    params.set("symbol", symbol);
    params.set("instrumentType", "options");
    params.set("side", template.bias === "bearish" ? "short" : "long");
    params.set("quantity", String(effectiveLotSize));
    const entry = Math.abs(stats.netPremium) / Math.max(1, effectiveLotSize);
    params.set("entryPrice", entry.toFixed(2));
    params.set("setupTag", template.name);
    return `/journal?${params.toString()}`;
  }, [symbol, template, effectiveLotSize, stats.netPremium]);

  const positionSizeHref = `/position-size`;

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-white/[0.08] bg-[rgb(15_23_42_/0.56)] p-5 shadow-xl shadow-black/20 backdrop-blur-md md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-500/90">
              At Expiry · 38 Strategies
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">Options Strategy Builder</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400 md:text-[15px]">
              Pick a template, edit strikes and premiums, and read break-even / max profit / max loss from the
              at-expiration payoff. Education only — not a live option chain.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-black/20 px-3 py-1.5 text-xs text-slate-400">
            <CandlestickChart className="h-3.5 w-3.5 text-amber-400" aria-hidden />
            {OPTIONS_STRATEGY_TEMPLATES.length} templates
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/[0.08] bg-[rgb(15_23_42_/0.48)] p-4">
        <div className="flex flex-wrap gap-2">
          {BIAS_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setBiasFilter(f.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                biasFilter === f.id
                  ? "bg-amber-500/20 text-amber-100 ring-1 ring-amber-500/35"
                  : "border border-white/[0.08] text-slate-400 hover:bg-white/[0.05]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {TIER_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setTierFilter(f.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                tierFilter === f.id
                  ? "bg-white/[0.07] text-cyan-100 ring-1 ring-cyan-400/25"
                  : "border border-white/[0.08] text-slate-400 hover:bg-white/[0.05]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="mt-4 grid max-h-56 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleTemplates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => selectTemplate(t.id)}
              className={`rounded-xl border px-3 py-2.5 text-left transition ${
                templateId === t.id
                  ? "border-amber-500/40 bg-amber-500/10"
                  : "border-white/[0.08] bg-black/20 hover:bg-white/[0.04]"
              }`}
            >
              <p className="text-sm font-semibold text-white">{t.name}</p>
              <p className="mt-1 text-[11px] uppercase tracking-wider text-slate-500">
                {t.bias} · {t.tier} · {t.riskClass}
              </p>
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="space-y-4 rounded-3xl border border-white/[0.08] bg-[rgb(15_23_42_/0.56)] p-5 md:p-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Inputs</p>
            <h2 className="mt-1 text-xl font-semibold text-white">{template.name}</h2>
            <p className="mt-1 text-sm text-slate-400">Best when: {template.bestWhen}</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Underlying / symbol
              </span>
              <input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                className="w-full rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-amber-500/40"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Spot
              </span>
              <input
                type="number"
                value={spot}
                onChange={(e) => rebuildFromSpot(Number(e.target.value) || spot)}
                className="w-full rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-amber-500/40"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Lot preset
              </span>
              <select
                value={lotPreset}
                onChange={(e) => {
                  const next = e.target.value;
                  setLotPreset(next);
                  const preset = LOT_SIZE_PRESETS.find((p) => p.symbol === next);
                  if (preset) {
                    setLotSize(preset.lotSize);
                    setSymbol(preset.symbol);
                  }
                }}
                className="w-full rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-amber-500/40"
              >
                {LOT_SIZE_PRESETS.map((p) => (
                  <option key={p.symbol} value={p.symbol} className="bg-slate-950">
                    {p.label} ({p.lotSize})
                  </option>
                ))}
                <option value="CUSTOM" className="bg-slate-950">
                  Custom lot size
                </option>
              </select>
              <span className="mt-1 block text-xs text-slate-500">As of {LOT_SIZES_AS_OF}</span>
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Lots × lot size
              </span>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  value={lots}
                  onChange={(e) => setLots(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-amber-500/40"
                />
                <input
                  type="number"
                  min={1}
                  value={lotSize}
                  onChange={(e) => {
                    setLotSize(Math.max(1, Number(e.target.value) || 1));
                    setLotPreset("CUSTOM");
                  }}
                  className="w-full rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-amber-500/40"
                />
              </div>
            </label>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Legs</p>
            {legs.map((leg) => (
              <div
                key={leg.id}
                className="grid gap-2 rounded-2xl border border-white/[0.08] bg-black/20 p-3 md:grid-cols-5"
              >
                <div className="text-xs text-slate-400 md:col-span-5">
                  <span className="font-semibold text-slate-200">{leg.side.toUpperCase()}</span>{" "}
                  {leg.kind === "stock" ? "STOCK" : `${leg.right?.toUpperCase()}`}
                </div>
                {leg.kind === "option" ? (
                  <>
                    <label className="block text-xs text-slate-500">
                      Strike
                      <input
                        type="number"
                        value={leg.strike ?? 0}
                        onChange={(e) => updateLeg(leg.id, { strike: Number(e.target.value) })}
                        className="mt-1 w-full rounded-lg border border-white/[0.08] bg-slate-950/40 px-2 py-1.5 text-sm text-white outline-none"
                      />
                    </label>
                    <label className="block text-xs text-slate-500">
                      Premium
                      <input
                        type="number"
                        step="0.05"
                        value={leg.premium}
                        onChange={(e) => updateLeg(leg.id, { premium: Number(e.target.value) })}
                        className="mt-1 w-full rounded-lg border border-white/[0.08] bg-slate-950/40 px-2 py-1.5 text-sm text-white outline-none"
                      />
                    </label>
                  </>
                ) : (
                  <label className="block text-xs text-slate-500 md:col-span-2">
                    Stock entry
                    <input
                      type="number"
                      value={leg.premium}
                      onChange={(e) => updateLeg(leg.id, { premium: Number(e.target.value) })}
                      className="mt-1 w-full rounded-lg border border-white/[0.08] bg-slate-950/40 px-2 py-1.5 text-sm text-white outline-none"
                    />
                  </label>
                )}
                <label className="block text-xs text-slate-500">
                  Qty
                  <input
                    type="number"
                    min={1}
                    value={leg.quantity}
                    onChange={(e) => updateLeg(leg.id, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                    className="mt-1 w-full rounded-lg border border-white/[0.08] bg-slate-950/40 px-2 py-1.5 text-sm text-white outline-none"
                  />
                </label>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-3 text-xs text-slate-400">
            <p>
              Wiki formulas — BE: <span className="text-slate-200">{template.breakEvenFormula}</span>
            </p>
            <p className="mt-1">
              Max profit: <span className="text-slate-200">{template.maxProfitFormula}</span> · Max loss:{" "}
              <span className="text-slate-200">{template.maxLossFormula}</span>
            </p>
          </div>
        </section>

        <section className="space-y-4">
          {(template.riskClass === "undefined" || template.caution || template.approximateExpiry) && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-950/30 px-4 py-3 text-sm text-amber-100">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <div className="space-y-1">
                  {template.riskClass === "undefined" ? (
                    <p>Undefined risk — max loss can be unlimited on one side. Size carefully.</p>
                  ) : null}
                  {template.approximateExpiry ? (
                    <p>Multi-expiry strategy: payoff diagram is a single-expiry approximation.</p>
                  ) : null}
                  {template.caution ? <p>{template.caution}</p> : null}
                </div>
              </div>
            </div>
          )}

          <div className="rounded-3xl border border-white/[0.08] bg-[rgb(15_23_42_/0.56)] p-5 md:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Payoff at expiry</p>
            <div className="mt-3">
              <PayoffChart points={stats.payoffPoints} spot={spot} breakEvens={stats.breakEvens} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Metric
                label={stats.isCredit ? "Net credit" : "Net debit"}
                value={toCurrency(Math.abs(stats.netPremium))}
              />
              <Metric label="Max profit" value={formatBounded(stats.maxProfit)} />
              <Metric label="Max loss" value={formatBounded(stats.maxLoss)} />
              <Metric
                label="Break-even(s)"
                value={
                  stats.breakEvens.length
                    ? stats.breakEvens.map((b) => b.toFixed(1)).join(", ")
                    : "—"
                }
              />
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link
                href={positionSizeHref}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/[0.08] px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/[0.05]"
              >
                <Calculator className="h-4 w-4 text-amber-400" aria-hidden />
                Size this trade
              </Link>
              <Link
                href={journalHref}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 px-4 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/25 transition hover:brightness-105"
              >
                <NotebookPen className="h-4 w-4" aria-hidden />
                Log this trade
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-rose-500/25 bg-rose-950/25 px-4 py-3 text-sm text-rose-100">
            <div className="flex items-start gap-2">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <p>
                SEBI (FY22–FY24): <span className="font-semibold">92.8%</span> of individual F&amp;O traders lost
                money. Payoffs are <span className="font-semibold">at expiration only</span> — before expiry, theta
                and IV change results. Not investment advice.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-white">{value}</p>
    </div>
  );
}
