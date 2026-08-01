"use client";

import Link from "next/link";
import * as Tabs from "@radix-ui/react-tabs";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PriorDayAnalysis } from "@/lib/prior-day-schema";

const FIELD_ROWS: Array<{ key: keyof PriorDayAnalysis; label: string }> = [
  { key: "chart", label: "Chart" },
  { key: "openInterest", label: "Open Interest" },
  { key: "pcr", label: "PCR" },
  { key: "participantOptionsData", label: "Participant Options Data" },
  { key: "fiiFuturesData", label: "FII Futures Data" },
  { key: "fiiStockData", label: "FII Stock Data" },
];

export function formatPriorDayTabLabel(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00+05:30`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Kolkata",
  }).format(d);
}

export function PriorDayBody({
  day,
  compact = false,
}: {
  day: PriorDayAnalysis;
  compact?: boolean;
}) {
  const fields = compact
    ? FIELD_ROWS.filter((row) => row.key === "chart" || row.key === "pcr")
    : FIELD_ROWS;

  return (
    <div className={cn(compact ? "space-y-3" : "space-y-4")}>
      {!compact ? (
        <div className="space-y-4">
          {fields.map(({ key, label }) => {
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
      ) : null}

      {(day.verdict.trim() || day.trades.trim()) && (
        <div
          className={cn(
            "rounded-xl border border-white/[0.08] bg-black/30 px-4 py-4",
            !compact && "mt-1",
          )}
        >
          {day.verdict.trim() ? (
            <div className="mb-3 last:mb-0">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-400/90">Verdict</p>
              <p
                className={cn(
                  "whitespace-pre-wrap text-sm leading-relaxed text-slate-100",
                  compact && "line-clamp-4",
                )}
              >
                {day.verdict}
              </p>
            </div>
          ) : null}
          {day.trades.trim() ? (
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-400/90">Trades?</p>
              <p
                className={cn(
                  "whitespace-pre-wrap text-sm leading-relaxed text-slate-100",
                  compact && "line-clamp-3",
                )}
              >
                {day.trades}
              </p>
            </div>
          ) : null}
        </div>
      )}

      {compact
        ? fields.map(({ key, label }) => {
            const value = day[key];
            if (typeof value !== "string" || !value.trim()) return null;
            return (
              <div key={key}>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
                <p className="line-clamp-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{value}</p>
              </div>
            );
          })
        : null}
    </div>
  );
}

export function PriorDayTabs({ days }: { days: PriorDayAnalysis[] }) {
  if (!days.length) return null;
  const defaultValue = days[0].date;

  return (
    <Tabs.Root defaultValue={defaultValue} className="space-y-5">
      <Tabs.List className="flex flex-wrap gap-2 rounded-2xl border border-white/[0.08] bg-[rgb(15_23_42_/0.45)] p-2 shadow-inner backdrop-blur-sm">
        {days.map((day) => (
          <Tabs.Trigger
            key={day.date}
            value={day.date}
            className={cn(
              "rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-400 transition",
              "hover:bg-white/[0.06] hover:text-slate-200",
              "data-[state=active]:bg-gradient-to-b data-[state=active]:from-white/[0.12] data-[state=active]:to-white/[0.04] data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:ring-1 data-[state=active]:ring-amber-500/30",
            )}
          >
            {formatPriorDayTabLabel(day.date)}
          </Tabs.Trigger>
        ))}
      </Tabs.List>

      {days.map((day) => (
        <Tabs.Content key={day.date} value={day.date} className="outline-none">
          <article className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[rgb(15_23_42_/0.55)] shadow-xl shadow-black/20 backdrop-blur-md">
            <header className="border-b border-white/[0.06] px-5 py-4 md:px-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-500/90">{day.date}</p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-white md:text-xl">{day.title}</h2>
            </header>
            <div className="px-5 py-5 md:px-6">
              <PriorDayBody day={day} />
            </div>
          </article>
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}

export function PriorDayLatestPreview({ day }: { day: PriorDayAnalysis }) {
  return (
    <section className="mb-10 rounded-2xl border border-white/[0.08] bg-[rgb(15_23_42_/0.55)] p-5 shadow-xl shadow-black/20 backdrop-blur-md md:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Latest prior day</p>
          <h2 className="text-lg font-semibold tracking-tight text-white">{day.title}</h2>
          <p className="mt-1 text-xs text-slate-500">{day.date}</p>
        </div>
        <Link
          href="/prior-day"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-amber-100 ring-1 ring-amber-500/25 transition hover:bg-white/[0.1]"
        >
          View last 6 days
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
      <PriorDayBody day={day} compact />
    </section>
  );
}
