import type { GeneratedReport, Metric } from "@/types/report";
import {
  type ClassicPivots,
  type PriorEodBar,
  computeClassicPivots,
  fetchPriorCompletedDailyBar,
  YAHOO_CHART_BANK_NIFTY,
  YAHOO_CHART_NIFTY50,
} from "@/lib/pivots";

function formatPivot(n: number): string {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

/** Sections that carry pivot / S&R grids (not Opening Brief). */
function isLevelsLikeSection(id: string, title: string): boolean {
  const i = id.toLowerCase();
  const t = title.toLowerCase();
  if (i === "opening-brief") return false;
  if (i.includes("level") || i.includes("pivot")) return true;
  if (t.includes("level") || t.includes("pivot")) return true;
  return false;
}

type IndexKey = "nifty50" | "bankNifty";

function matchPivotMetric(label: string): { index: IndexKey; slot: keyof ClassicPivots } | null {
  const L = label.toLowerCase().replace(/\s+/g, " ").trim();
  if (L.includes("gift")) return null;

  let index: IndexKey | null = null;
  if (/\bbank\s*nifty\b|\bnifty\s*bank\b/.test(L)) {
    index = "bankNifty";
  } else if (/\bnifty\s*50\b|\bnifty50\b/.test(L)) {
    index = "nifty50";
  } else if (/\bnifty\b/.test(L) && /\b50\b/.test(L) && !L.includes("bank")) {
    index = "nifty50";
  } else if (/\bnifty\b/.test(L) && !L.includes("bank") && !L.includes("500") && !L.includes("mid")) {
    index = "nifty50";
  }

  if (!index) return null;

  let slot: keyof ClassicPivots | null = null;
  if (/\br3\b|resistance\s*3\b/.test(L)) slot = "r3";
  else if (/\br2\b|resistance\s*2\b/.test(L)) slot = "r2";
  else if (/\br1\b|resistance\s*1\b/.test(L)) slot = "r1";
  else if (/\bs3\b|support\s*3\b/.test(L)) slot = "s3";
  else if (/\bs2\b|support\s*2\b/.test(L)) slot = "s2";
  else if (/\bs1\b|support\s*1\b/.test(L)) slot = "s1";
  else if (/\bpp\b|pivot\s*point|central\s*pivot/.test(L)) slot = "pp";

  if (!slot) return null;
  return { index, slot };
}

function applyPivotToMetric(
  metric: Metric,
  table: ClassicPivots,
  slot: keyof ClassicPivots,
  bar: PriorEodBar,
  yahooPath: string,
): Metric {
  const raw = table[slot];
  const isStooq = bar.ohlcSource === "stooq";
  return {
    ...metric,
    value: formatPivot(raw),
    freshness: `[Computed ${bar.barDateIst} IST EOD → classical pivots]`,
    note: isStooq
      ? "Floor pivots from prior session H/L/C (Stooq daily CSV)."
      : "Floor pivots from prior session H/L/C (Yahoo daily chart).",
    source: isStooq
      ? { name: "Stooq — EOD (pivot input)", url: "https://stooq.com/" }
      : {
          name: "Yahoo Finance — EOD (pivot input)",
          url: `https://finance.yahoo.com/quote/${encodeURIComponent(yahooPath)}/`,
        },
  };
}

/**
 * Overwrites Nifty 50 / Bank Nifty pivot metrics in level-style sections using
 * server-computed classical pivots (fixes duplicate R1=R2 model output).
 */
export async function enrichReportWithComputedPivotLevels(report: GeneratedReport): Promise<GeneratedReport> {
  const [niftyBar, bankBar] = await Promise.all([
    fetchPriorCompletedDailyBar(YAHOO_CHART_NIFTY50),
    fetchPriorCompletedDailyBar(YAHOO_CHART_BANK_NIFTY),
  ]);

  const niftyPivots = niftyBar ? computeClassicPivots(niftyBar.high, niftyBar.low, niftyBar.close) : null;
  const bankPivots = bankBar ? computeClassicPivots(bankBar.high, bankBar.low, bankBar.close) : null;

  if (!niftyPivots && !bankPivots) {
    return report;
  }

  const next = structuredClone(report);

  for (const section of next.sections) {
    if (!isLevelsLikeSection(section.id, section.title)) continue;

    section.metrics = section.metrics.map((metric) => {
      const hit = matchPivotMetric(metric.label);
      if (!hit) return metric;

      if (hit.index === "nifty50" && niftyPivots && niftyBar) {
        return applyPivotToMetric(metric, niftyPivots, hit.slot, niftyBar, YAHOO_CHART_NIFTY50);
      }
      if (hit.index === "bankNifty" && bankPivots && bankBar) {
        return applyPivotToMetric(metric, bankPivots, hit.slot, bankBar, YAHOO_CHART_BANK_NIFTY);
      }
      return metric;
    });
  }

  return next;
}
