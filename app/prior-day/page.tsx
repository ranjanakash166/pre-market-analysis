import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";
import { loadPriorDayCatalog } from "@/lib/prior-day-store";
import type { PriorDayAnalysis } from "@/lib/prior-day-schema";
import { pageTitle } from "@/lib/branding";

export const metadata: Metadata = {
  title: pageTitle("Prior day"),
  description: "Last 6 trading days of Nifty and Bank Nifty prior-day analysis.",
};

export const dynamic = "force-dynamic";

const FIELD_ROWS: Array<{ key: keyof PriorDayAnalysis; label: string }> = [
  { key: "chart", label: "Chart" },
  { key: "openInterest", label: "Open Interest" },
  { key: "pcr", label: "PCR" },
  { key: "participantOptionsData", label: "Participant Options Data" },
  { key: "fiiFuturesData", label: "FII Futures Data" },
  { key: "fiiStockData", label: "FII Stock Data" },
];

function DayCard({ day }: { day: PriorDayAnalysis }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[rgb(15_23_42_/0.55)] shadow-xl shadow-black/20 backdrop-blur-md">
      <header className="border-b border-white/[0.06] px-5 py-4 md:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-500/90">{day.date}</p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight text-white md:text-xl">{day.title}</h2>
      </header>

      <div className="space-y-4 px-5 py-5 md:px-6">
        {FIELD_ROWS.map(({ key, label }) => {
          const value = day[key];
          if (typeof value !== "string" || !value.trim()) return null;
          return (
            <div key={key}>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{value}</p>
            </div>
          );
        })}
      </div>

      {(day.verdict.trim() || day.trades.trim()) && (
        <div className="mx-5 mb-5 rounded-xl border border-white/[0.08] bg-black/30 px-4 py-4 md:mx-6 md:mb-6">
          {day.verdict.trim() ? (
            <div className="mb-3 last:mb-0">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-400/90">Verdict</p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-100">{day.verdict}</p>
            </div>
          ) : null}
          {day.trades.trim() ? (
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-400/90">Trades?</p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-100">{day.trades}</p>
            </div>
          ) : null}
        </div>
      )}
    </article>
  );
}

export default async function PriorDayPage() {
  let catalog;
  let error: string | null = null;
  try {
    catalog = await loadPriorDayCatalog();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load prior-day analysis.";
  }

  return (
    <main className="mx-auto max-w-4xl px-4 pb-20 pt-8 md:px-8 md:pt-10">
      <div className="mb-10 md:mb-12">
        <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-500/90">
          <CalendarDays className="h-3.5 w-3.5" aria-hidden />
          Prior day
        </p>
        <h1 className="mb-3 text-3xl font-bold tracking-tight text-white md:text-4xl">Prior day analysis</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-400 md:text-[15px]">
          Last 6 trading days of Nifty and Bank Nifty structure — chart, open interest, PCR, FII flows, verdict, and
          trade ideas. Educational context only.
        </p>
        {catalog ? (
          <p className="mt-3 text-xs text-slate-500">
            Updated{" "}
            {new Date(catalog.updatedAt).toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
              hour12: false,
            })}{" "}
            IST
          </p>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-500/35 bg-rose-950/40 px-5 py-4 text-rose-100">{error}</div>
      ) : null}

      {catalog ? (
        <div className="space-y-6">
          {catalog.days.map((day) => (
            <DayCard key={day.date} day={day} />
          ))}
        </div>
      ) : null}
    </main>
  );
}
