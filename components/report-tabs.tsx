"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";
import type { GeneratedReport } from "@/types/report";

interface ReportTabsProps {
  report: GeneratedReport;
}

const OPENING_BRIEF_SECTION_ID = "opening-brief";

export function ReportTabs({ report }: ReportTabsProps) {
  const firstSection = report.sections[0]?.id ?? "verdict";

  return (
    <Tabs.Root defaultValue={firstSection} className="space-y-5">
      <Tabs.List className="flex flex-wrap gap-2 rounded-2xl border border-white/[0.08] bg-[rgb(15_23_42_/0.45)] p-2 shadow-inner backdrop-blur-sm">
        {report.sections.map((section) => (
          <Tabs.Trigger
            key={section.id}
            value={section.id}
            className={cn(
              "rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-400 transition",
              "hover:bg-white/[0.06] hover:text-slate-200",
              "data-[state=active]:bg-gradient-to-b data-[state=active]:from-white/[0.12] data-[state=active]:to-white/[0.04] data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:ring-1 data-[state=active]:ring-amber-500/30",
            )}
          >
            {section.title}
          </Tabs.Trigger>
        ))}
      </Tabs.List>

      {report.sections.map((section) => {
        const useMetricGrid = section.id === OPENING_BRIEF_SECTION_ID;

        return (
        <Tabs.Content
          key={section.id}
          value={section.id}
          className="rounded-2xl border border-white/[0.08] bg-[rgb(15_23_42_/0.45)] p-5 shadow-xl shadow-black/15 backdrop-blur-md md:p-6"
        >
          {section.summary ? (
            <p className="mb-5 border-b border-white/[0.06] pb-5 text-sm leading-relaxed text-slate-300">{section.summary}</p>
          ) : null}

          <div
            className={cn(
              useMetricGrid
                ? "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
                : "space-y-3",
            )}
          >
            {section.metrics.map((metric) => (
              <article
                key={`${section.id}-${metric.label}`}
                className={cn(
                  "group rounded-xl border border-white/[0.07] bg-gradient-to-br from-white/[0.06] to-transparent p-4 transition hover:border-amber-500/20 hover:shadow-lg hover:shadow-amber-500/[0.07]",
                  useMetricGrid && "flex h-full min-h-0 flex-col",
                )}
              >
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold text-slate-100">{metric.label}</h3>
                  <StatusBadge tone={metric.tone} label={metric.freshness} />
                </div>
                <p className="text-xl font-bold tracking-tight text-white md:text-2xl">{metric.value}</p>
                {metric.change ? <p className="mt-1 text-sm text-slate-400">Change · {metric.change}</p> : null}
                {metric.note ? (
                  <p
                    className={cn(
                      "mt-2 text-sm leading-relaxed text-slate-400",
                      useMetricGrid && "line-clamp-3",
                    )}
                  >
                    {metric.note}
                  </p>
                ) : null}
                <div className={cn(useMetricGrid ? "mt-auto pt-3" : "mt-3")}>
                  <a
                    href={metric.source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex text-sm font-medium text-cyan-400/95 underline decoration-cyan-500/35 underline-offset-4 transition group-hover:text-cyan-300"
                  >
                    {metric.source.name}
                  </a>
                </div>
              </article>
            ))}
          </div>

          {section.bullets.length > 0 ? (
            <ul className="mt-5 space-y-2 border-t border-white/[0.06] pt-5 text-sm leading-relaxed text-slate-300">
              {section.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-2">
                  <span className="text-amber-500/80">·</span>
                  {bullet}
                </li>
              ))}
            </ul>
          ) : null}

          {section.news?.length ? (
            <div className="mt-6 space-y-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">News & flow</p>
              {section.news.map((item) => (
                <article
                  key={`${item.tag}-${item.publishedAt}`}
                  className="rounded-xl border border-white/[0.06] bg-black/20 p-4 transition hover:border-white/[0.1]"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-500/90">{item.tag}</p>
                  <p className="mt-1 font-medium text-slate-100">{item.happened}</p>
                  <p className="mt-1 text-sm text-slate-400">{item.impact}</p>
                  <p className="mt-2 text-xs text-slate-600">{item.publishedAt}</p>
                  <a
                    href={item.source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-sm font-medium text-cyan-400/95 underline decoration-cyan-500/35 underline-offset-4"
                  >
                    {item.source.name}
                  </a>
                </article>
              ))}
            </div>
          ) : null}
        </Tabs.Content>
        );
      })}
    </Tabs.Root>
  );
}
