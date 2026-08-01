import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";
import { PriorDayTabs } from "@/components/prior-day-analysis";
import { loadPriorDayCatalog } from "@/lib/prior-day-store";
import { pageTitle } from "@/lib/branding";

export const metadata: Metadata = {
  title: pageTitle("Prior day"),
  description: "Last 6 trading days of Nifty and Bank Nifty prior-day analysis.",
};

export const dynamic = "force-dynamic";

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
          trade ideas. Educational context only. Latest day is shown first; switch tabs for earlier sessions.
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

      {catalog ? <PriorDayTabs days={catalog.days} /> : null}
    </main>
  );
}
