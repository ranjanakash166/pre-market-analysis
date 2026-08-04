"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Calculator,
  NotebookPen,
  Save,
  ShieldAlert,
  TrendingDown,
} from "lucide-react";
import {
  HIGH_RISK_PERCENT,
  LOT_SIZE_PRESETS,
  LOT_SIZES_AS_OF,
  RECOMMENDED_MAX_RISK_PERCENT,
  RECOVERY_TABLE,
  computePositionSize,
  positionSizeInputSchema,
  type PositionSizeResult,
} from "@/lib/position-size";
import type { UserRiskProfile } from "@/lib/risk-profile-db";

type Mode = "equity" | "lots";

function toCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function toNumberOrNull(value: string): number | null {
  if (!value.trim()) return null;
  const n = Number(value.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

export function PositionSizeCalculator() {
  const [capital, setCapital] = useState("100000");
  const [riskPercent, setRiskPercent] = useState("2");
  const [mode, setMode] = useState<Mode>("equity");
  const [symbol, setSymbol] = useState("");
  const [entryPrice, setEntryPrice] = useState("250");
  const [stopLossPrice, setStopLossPrice] = useState("210");
  const [targetPrice, setTargetPrice] = useState("");
  const [concurrentPositions, setConcurrentPositions] = useState("1");
  const [lotSize, setLotSize] = useState(String(LOT_SIZE_PRESETS[0].lotSize));
  const [lotPreset, setLotPreset] = useState<string>(LOT_SIZE_PRESETS[0].symbol);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      try {
        const response = await fetch("/api/risk-profile", { cache: "no-store" });
        const body = (await response.json().catch(() => ({}))) as {
          profile?: UserRiskProfile | null;
          error?: string;
        };
        if (!response.ok) {
          throw new Error(body.error ?? "Could not load risk profile.");
        }
        if (cancelled || !body.profile) return;
        setCapital(String(body.profile.capital));
        setRiskPercent(String(body.profile.defaultRiskPercent));
        setConcurrentPositions(String(body.profile.defaultConcurrentPositions));
      } catch (err) {
        if (!cancelled) {
          setProfileError(err instanceof Error ? err.message : "Could not load risk profile.");
        }
      } finally {
        if (!cancelled) setProfileLoaded(true);
      }
    }
    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  const parsed = useMemo(() => {
    const capitalN = toNumberOrNull(capital);
    const riskN = toNumberOrNull(riskPercent);
    const entryN = toNumberOrNull(entryPrice);
    const stopN = toNumberOrNull(stopLossPrice);
    const targetN = toNumberOrNull(targetPrice);
    const concurrentN = toNumberOrNull(concurrentPositions);
    const lotN = toNumberOrNull(lotSize);

    if (capitalN == null || riskN == null || entryN == null || stopN == null || concurrentN == null) {
      return { ok: false as const, error: "Enter capital, risk %, entry, stop loss, and concurrent positions.", result: null };
    }

    const input = {
      capital: capitalN,
      riskPercent: riskN,
      entryPrice: entryN,
      stopLossPrice: stopN,
      targetPrice: targetN,
      mode,
      lotSize: mode === "lots" ? lotN : null,
      concurrentPositions: concurrentN,
    };

    const validated = positionSizeInputSchema.safeParse(input);
    if (!validated.success) {
      return {
        ok: false as const,
        error: validated.error.issues[0]?.message ?? "Invalid inputs.",
        result: null,
      };
    }

    return { ok: true as const, error: null, result: computePositionSize(validated.data) };
  }, [capital, riskPercent, entryPrice, stopLossPrice, targetPrice, concurrentPositions, mode, lotSize]);

  const riskN = toNumberOrNull(riskPercent) ?? 0;
  const riskWarning =
    riskN > HIGH_RISK_PERCENT
      ? "strong"
      : riskN > RECOMMENDED_MAX_RISK_PERCENT
        ? "mild"
        : null;

  async function saveProfile() {
    const capitalN = toNumberOrNull(capital);
    const riskNLocal = toNumberOrNull(riskPercent);
    const concurrentN = toNumberOrNull(concurrentPositions);
    if (capitalN == null || riskNLocal == null || concurrentN == null) {
      setProfileError("Capital, risk %, and concurrent positions are required to save.");
      return;
    }

    setSavingProfile(true);
    setProfileError(null);
    setProfileMessage(null);
    try {
      const response = await fetch("/api/risk-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          capital: capitalN,
          defaultRiskPercent: riskNLocal,
          defaultConcurrentPositions: Math.floor(concurrentN),
        }),
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Could not save risk profile.");
      }
      setProfileMessage("Risk profile saved.");
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Could not save risk profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  function journalHref(result: PositionSizeResult): string {
    const params = new URLSearchParams();
    params.set("prefill", "1");
    if (symbol.trim()) params.set("symbol", symbol.trim().toUpperCase());
    params.set("side", result.side);
    params.set("instrumentType", mode === "lots" ? "options" : "equity");
    params.set("quantity", String(result.quantity));
    params.set("entryPrice", entryPrice);
    params.set("stopLoss", stopLossPrice);
    if (targetPrice.trim()) params.set("targetPrice", targetPrice);
    return `/journal?${params.toString()}`;
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-white/[0.08] bg-[rgb(15_23_42_/0.56)] p-5 shadow-xl shadow-black/20 backdrop-blur-md md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-500/90">
              Risk First
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">Position Size Calculator</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400 md:text-[15px]">
              Size every trade so a stop-loss hit never exceeds your risk cap. Default is 2% of capital —
              the single highest-leverage discipline for avoiding account blowups.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-black/20 px-3 py-1.5 text-xs text-slate-400">
            <Calculator className="h-3.5 w-3.5 text-amber-400" aria-hidden />
            Live recalculation
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-3xl border border-white/[0.08] bg-[rgb(15_23_42_/0.56)] p-5 shadow-xl shadow-black/15 backdrop-blur-md md:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Inputs</p>
          <h2 className="mt-1 text-xl font-semibold text-white">Trade & risk parameters</h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <TextField label="Trading Capital (₹)" value={capital} onChange={setCapital} type="number" />
            <div>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Risk % per trade
              </span>
              <div className="mb-2 flex flex-wrap gap-2">
                {[1, 2, 5].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRiskPercent(String(preset))}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      riskPercent === String(preset)
                        ? "bg-amber-500/20 text-amber-100 ring-1 ring-amber-500/35"
                        : "border border-white/[0.08] text-slate-400 hover:bg-white/[0.05]"
                    }`}
                  >
                    {preset}%
                  </button>
                ))}
              </div>
              <input
                type="number"
                step="0.1"
                value={riskPercent}
                onChange={(e) => setRiskPercent(e.target.value)}
                className="w-full rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-amber-500/40"
              />
            </div>

            <div className="md:col-span-2">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Instrument mode
              </span>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { id: "equity", label: "Equity (shares)" },
                    { id: "lots", label: "F&O (lots)" },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setMode(option.id)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      mode === option.id
                        ? "bg-white/[0.07] text-amber-100 ring-1 ring-amber-500/25"
                        : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <TextField
              label="Symbol (optional)"
              value={symbol}
              onChange={(v) => setSymbol(v.toUpperCase())}
              placeholder="RELIANCE / NIFTY"
            />
            <TextField
              label="Concurrent positions"
              value={concurrentPositions}
              onChange={setConcurrentPositions}
              type="number"
              hint="Caps each position at capital ÷ N"
            />
            <TextField label="Entry price" value={entryPrice} onChange={setEntryPrice} type="number" />
            <TextField label="Stop loss" value={stopLossPrice} onChange={setStopLossPrice} type="number" />
            <TextField
              label="Target (optional)"
              value={targetPrice}
              onChange={setTargetPrice}
              type="number"
              hint="Used for R:R and breakeven win rate"
            />

            {mode === "lots" ? (
              <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
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
                        setLotSize(String(preset.lotSize));
                        if (!symbol.trim()) setSymbol(preset.symbol);
                      }
                    }}
                    className="w-full rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-amber-500/40"
                  >
                    {LOT_SIZE_PRESETS.map((preset) => (
                      <option key={preset.symbol} value={preset.symbol} className="bg-slate-950">
                        {preset.label} ({preset.lotSize})
                      </option>
                    ))}
                    <option value="CUSTOM" className="bg-slate-950">
                      Custom
                    </option>
                  </select>
                  <span className="mt-1 block text-xs text-slate-500">As of {LOT_SIZES_AS_OF}. Always editable.</span>
                </label>
                <TextField
                  label="Lot size"
                  value={lotSize}
                  onChange={(v) => {
                    setLotSize(v);
                    setLotPreset("CUSTOM");
                  }}
                  type="number"
                />
              </div>
            ) : null}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void saveProfile()}
              disabled={savingProfile || !profileLoaded}
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/[0.05] disabled:opacity-60"
            >
              <Save className="h-4 w-4 text-amber-400" aria-hidden />
              {savingProfile ? "Saving…" : "Save risk profile"}
            </button>
            {profileMessage ? <p className="text-sm text-emerald-300">{profileMessage}</p> : null}
            {profileError ? <p className="text-sm text-rose-300">{profileError}</p> : null}
          </div>
        </section>

        <section className="space-y-4">
          {riskWarning ? (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm ${
                riskWarning === "strong"
                  ? "border-rose-500/35 bg-rose-950/40 text-rose-100"
                  : "border-amber-500/30 bg-amber-950/30 text-amber-100"
              }`}
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <p>
                  {riskWarning === "strong"
                    ? `Risking ${riskPercent}% per trade is aggressive. Murphy's upper bound is ~5% of equity in one market — consider 1–2%.`
                    : `Recommended risk is ≤ ${RECOMMENDED_MAX_RISK_PERCENT}% per trade. You're above that.`}
                </p>
              </div>
            </div>
          ) : null}

          {!parsed.ok || !parsed.result ? (
            <div className="rounded-3xl border border-dashed border-white/[0.12] bg-[rgb(15_23_42_/0.45)] px-5 py-10 text-sm text-slate-400">
              {parsed.error ?? "Enter valid inputs to see position size."}
            </div>
          ) : (
            <ResultsCard result={parsed.result} journalHref={journalHref(parsed.result)} mode={mode} />
          )}
        </section>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-white/[0.08] bg-[rgb(15_23_42_/0.48)] p-5">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-amber-400" aria-hidden />
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Loss recovery math
            </p>
          </div>
          <p className="mt-2 text-sm text-slate-400">
            Losses are not linear — a drawdown needs a larger gain to recover. Resist sizing up after a loss.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] text-slate-400">
                  <th className="px-2 py-2 font-medium">Loss</th>
                  <th className="px-2 py-2 font-medium">Gain needed</th>
                </tr>
              </thead>
              <tbody>
                {RECOVERY_TABLE.map((row) => (
                  <tr key={row.lossPercent} className="border-b border-white/[0.06] text-slate-200">
                    <td className="px-2 py-2">{row.lossPercent}%</td>
                    <td className="px-2 py-2">{row.gainNeededPercent.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-2xl border border-white/[0.08] bg-[rgb(15_23_42_/0.48)] p-5">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-300" aria-hidden />
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Why this matters
            </p>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            SEBI data for FY22–FY24: <span className="font-semibold text-rose-200">92.8%</span> of individual
            F&amp;O traders lost money. Position sizing won&apos;t make a bad setup good — but it stops one
            wrong trade from ending the account.
          </p>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            Education only — not investment advice. Lot sizes change with exchange circulars; verify before trading.
          </p>
        </article>
      </section>
    </div>
  );
}

function ResultsCard({
  result,
  journalHref,
  mode,
}: {
  result: PositionSizeResult;
  journalHref: string;
  mode: Mode;
}) {
  return (
    <div className="rounded-3xl border border-white/[0.08] bg-[rgb(15_23_42_/0.56)] p-5 shadow-xl shadow-black/15 backdrop-blur-md md:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Result</p>
      <h2 className="mt-1 text-xl font-semibold text-white">
        {mode === "lots" ? `${result.lots ?? 0} lot${result.lots === 1 ? "" : "s"}` : `${result.quantity} shares`}
      </h2>
      <p className="mt-1 text-sm text-slate-400">
        Inferred side: <span className="text-amber-100">{result.side}</span> · Bound by{" "}
        <span className="text-amber-100">
          {result.bindingConstraint === "risk" ? "risk %" : "allocation (capital ÷ N)"}
        </span>
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Metric label="Max loss allowed" value={toCurrency(result.maxLossAllowed)} />
        <Metric label="Risk per unit" value={toCurrency(result.riskPerUnit)} />
        <Metric label="Actual risk if SL hit" value={toCurrency(result.actualRiskAmount)} />
        <Metric label="Actual risk %" value={`${result.actualRiskPercent.toFixed(2)}%`} />
        <Metric label="Position value" value={toCurrency(result.positionValue)} />
        <Metric label="Capital deployed" value={`${result.capitalDeployedPercent.toFixed(1)}%`} />
        {result.rewardRiskRatio != null ? (
          <>
            <Metric label="Reward : Risk" value={`${result.rewardRiskRatio.toFixed(2)} : 1`} />
            <Metric
              label="Breakeven win rate"
              value={`${(result.breakevenWinRatePercent ?? 0).toFixed(1)}%`}
            />
          </>
        ) : null}
        {mode === "lots" ? <Metric label="Units (lots × size)" value={String(result.quantity)} /> : null}
      </div>

      {result.quantity === 0 ? (
        <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-950/30 px-4 py-3 text-sm text-amber-100">
          Risk per block exceeds your max loss. Widen capital, tighten the stop, or lower lot size.
        </div>
      ) : null}

      <div className="mt-4 rounded-2xl border border-rose-500/25 bg-rose-950/25 px-4 py-3 text-sm text-rose-100">
        <p className="font-semibold">Beginner mistake comparison</p>
        <p className="mt-1 text-rose-100/90">
          Deploying full capital → ~{result.fullCapitalQuantity}{" "}
          {mode === "lots" ? "units" : "shares"}. An SL hit would cost{" "}
          <span className="font-semibold">{toCurrency(result.fullCapitalLossAmount)}</span> (
          {result.fullCapitalLossPercent.toFixed(1)}% of capital) instead of{" "}
          {toCurrency(result.actualRiskAmount)}.
        </p>
      </div>

      <Link
        href={journalHref}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/25 transition hover:brightness-105"
      >
        <NotebookPen className="h-4 w-4" aria-hidden />
        Log this trade
      </Link>
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

function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</span>
      <input
        type={type}
        step={type === "number" ? "any" : undefined}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-amber-500/40"
      />
      {hint ? <span className="mt-1 block text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}
