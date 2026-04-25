"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { FEATURE_PRE_MARKET, SITE_NAME, SITE_TAGLINE } from "@/lib/branding";
import { ReportTabs } from "@/components/report-tabs";
import type { GeneratedReport, TraderMode } from "@/types/report";

const MODES: TraderMode[] = ["A", "B", "C"];

function modeLabel(m: TraderMode): string {
  if (m === "A") return "Intraday";
  if (m === "B") return "Swing";
  return "Full report";
}

export default function HomePage() {
  const { data: session } = useSession();
  const isPaid = session?.user?.hasActiveSubscription === true;
  const [mode, setMode] = useState<TraderMode>("A");
  const [report, setReport] = useState<GeneratedReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNoCachedReport, setHasNoCachedReport] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  async function fetchReport(nextMode: TraderMode) {
    setLoading(true);
    setError(null);
    setHasNoCachedReport(false);
    setReport(null);
    setUpdatedAt(null);
    try {
      const response = await fetch(`/api/report?mode=${nextMode}`, { cache: "no-store" });
      if (response.status === 404) {
        setReport(null);
        setUpdatedAt(null);
        setHasNoCachedReport(true);
        return;
      }
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        setError(
          typeof body.error === "string"
            ? body.error
            : "We couldn’t load your briefing. Please try again in a moment.",
        );
        setReport(null);
        return;
      }
      const data = await response.json();
      setReport(data.report);
      setUpdatedAt(data.updatedAt ?? null);
      setHasNoCachedReport(false);
    } catch {
      setError("We couldn’t reach the server. Check your connection and try again.");
      setReport(null);
    } finally {
      setLoading(false);
    }
  }

  async function regenerate() {
    const hadReport = report !== null;
    setLoading(true);
    setError(null);
    setHasNoCachedReport(false);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          typeof data.error === "string" ? data.error : "We couldn’t create your briefing. Please try again.",
        );
      }
      const data = await response.json();
      setReport(data.report);
      setUpdatedAt(data.updatedAt ?? null);
      setHasNoCachedReport(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn’t create your briefing. Please try again.");
      if (!hadReport) {
        setHasNoCachedReport(true);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchReport(mode);
  }, [mode]);

  return (
    <main className="mx-auto max-w-7xl px-4 pb-16 pt-8 md:px-8 md:pt-10">
      <div className="mb-10 md:mb-12">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-500/90">{SITE_NAME}</p>
        <h1 className="mb-3 text-3xl font-bold tracking-tight text-white md:text-4xl">{FEATURE_PRE_MARKET}</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-400 md:text-[15px]">
          {SITE_TAGLINE} Switch A/B/C modes, load cached briefings, or regenerate with AI for indices, volatility, and
          flow—clear context, not noise.
        </p>
      </div>

      {!isPaid ? (
        <section className="mb-6 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] p-4 text-sm text-cyan-100">
          <p>
            Free tier is active: you can view all modes, and generate mode A.
            <span className="ml-1">Upgrade for unlimited B/C generation.</span>
            <Link href="/subscribe" className="ml-2 font-semibold underline underline-offset-4">
              See plans
            </Link>
          </p>
        </section>
      ) : null}

      <section className="mb-10 rounded-2xl border border-white/[0.08] bg-[rgb(15_23_42_/0.55)] p-5 shadow-xl shadow-black/20 backdrop-blur-md md:p-6">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Choose your view</p>
            <p className="text-sm text-slate-400">
              We show your last saved briefing for each view below. Tap <span className="font-medium text-slate-300">Generate report</span> anytime
              to create a fresh one.
            </p>
          </div>
          <p className="text-xs text-slate-500">
            Last updated (India time):{" "}
            <span className="font-medium text-slate-300">
              {updatedAt ? new Date(updatedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "—"}
            </span>
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
          <div
            className="inline-flex rounded-xl border border-white/[0.07] bg-black/25 p-1 shadow-inner"
            role="group"
            aria-label="Trader mode"
          >
            {MODES.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setMode(option)}
                className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                  mode === option
                    ? "bg-gradient-to-b from-white/[0.14] to-white/[0.06] text-white shadow-md ring-1 ring-amber-500/35"
                    : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
                }`}
                title={!isPaid && option !== "A" ? "Free tier: generate is limited to A mode." : undefined}
              >
                {option === "A" ? "A · Intraday" : option === "B" ? "B · Swing" : "C · Full"}
                {!isPaid && option !== "A" ? " (preview)" : ""}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={regenerate}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/25 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-55"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden />
            {loading ? "Generating…" : "Generate report"}
          </button>
        </div>
      </section>

      {error ? (
        <div className="mb-8 rounded-2xl border border-rose-500/35 bg-rose-950/40 px-5 py-4 text-rose-100 shadow-lg shadow-rose-900/20">
          {error}
        </div>
      ) : null}

      {loading && !report ? (
        <div className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-[rgb(15_23_42_/0.4)] px-5 py-8 text-slate-400">
          <RefreshCw className="h-5 w-5 shrink-0 animate-spin text-amber-500/80" aria-hidden />
          <span>Loading your briefing…</span>
        </div>
      ) : null}

      {!loading && !report && !error && hasNoCachedReport ? (
        <div className="mb-8 rounded-2xl border border-amber-500/30 bg-amber-950/25 px-5 py-6 text-amber-50 shadow-lg shadow-amber-950/20">
          <p className="mb-2 text-base font-semibold text-white">No briefing saved yet</p>
          <p className="mb-1 text-sm leading-relaxed text-amber-100/90">
            There isn&apos;t a saved briefing for <span className="font-medium text-white">{modeLabel(mode)}</span>{" "}
            ({mode}). Create one to see levels, news, and the full tabs here.
          </p>
          <p className="text-sm text-amber-200/80">
            Tap <span className="font-semibold text-white">Generate report</span> above — it may take a minute the first time.
          </p>
        </div>
      ) : null}

      {report ? (
        <>
          <ReportTabs report={report} />

          <section className="mt-8 rounded-2xl border border-white/[0.08] bg-[rgb(15_23_42_/0.5)] p-5 backdrop-blur-sm md:p-6">
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Verdict</h2>
            <p className="mb-3 text-base font-medium text-white">
              {report.verdict.title}{" "}
              <span className="font-normal text-slate-400">
                — {report.verdict.bias} ({report.verdict.confidence})
              </span>
            </p>
            <ul className="space-y-2 text-sm leading-relaxed text-slate-300">
              {report.verdict.bullets.map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500/90" aria-hidden />
                  {line}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-6 rounded-2xl border border-white/[0.08] bg-[rgb(15_23_42_/0.5)] p-5 backdrop-blur-sm md:p-6">
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Sources</h2>
            <ul className="space-y-2 text-sm">
              {report.sourcesUsed.map((source) => (
                <li key={`${source.name}-${source.url}`}>
                  <a
                    className="font-medium text-cyan-400/95 underline decoration-cyan-500/40 underline-offset-4 transition hover:text-cyan-300"
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {source.name}
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-6 rounded-2xl border border-dashed border-white/[0.1] bg-black/20 px-5 py-4 text-xs leading-relaxed text-slate-500 md:px-6">
            {report.disclaimer.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </section>
        </>
      ) : null}
    </main>
  );
}
