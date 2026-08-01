import { priorDayAnalysisSchema, priorDayCatalogSchema, type PriorDayAnalysis, type PriorDayCatalog } from "@/lib/prior-day-schema";

const SENSIBULL_KLRHM_URL = "https://api.sensibull.com/v1/klrhm_data";
const DAY_LIMIT = 6;

type SensibullDayRaw = {
  chart?: string;
  open_interest?: string;
  pcr?: string;
  fii_option?: string;
  fii_futures_data?: string;
  fii_stock_data?: string;
  verdict?: string;
  trades?: string;
  youtube_url?: string;
  detailed_analysis?: string;
};

function formatTitle(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00+05:30`);
  if (Number.isNaN(d.getTime())) return `Nifty and Bank Nifty Analysis for ${isoDate}`;
  const formatted = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Kolkata",
  }).format(d);
  return `Nifty and Bank Nifty Analysis for ${formatted}`;
}

function mapDay(isoDate: string, raw: SensibullDayRaw): PriorDayAnalysis {
  return priorDayAnalysisSchema.parse({
    date: isoDate,
    title: formatTitle(isoDate),
    chart: String(raw.chart ?? ""),
    openInterest: String(raw.open_interest ?? ""),
    pcr: String(raw.pcr ?? ""),
    participantOptionsData: String(raw.fii_option ?? ""),
    fiiFuturesData: String(raw.fii_futures_data ?? ""),
    fiiStockData: String(raw.fii_stock_data ?? ""),
    verdict: String(raw.verdict ?? ""),
    trades: String(raw.trades ?? ""),
  });
}

/**
 * Fetch Sensibull daily Nifty/Bank Nifty analysis and keep the latest N trading days.
 * Server-side only (API CORS is locked to web.sensibull.com).
 */
export async function fetchPriorDayCatalog(limit = DAY_LIMIT): Promise<PriorDayCatalog> {
  const res = await fetch(SENSIBULL_KLRHM_URL, {
    headers: {
      Accept: "application/json",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Origin: "https://web.sensibull.com",
      Referer: "https://web.sensibull.com/",
    },
    // Cache at the Next data cache for one hour when used from RSC / route handlers.
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`Sensibull prior-day fetch failed (${res.status})`);
  }

  const payload = (await res.json()) as {
    status?: boolean;
    data?: { english?: Record<string, string> };
  };

  const english = payload.data?.english;
  if (!english || typeof english !== "object") {
    throw new Error("Sensibull response missing english day map");
  }

  const dates = Object.keys(english).sort();
  const latest = dates.slice(-Math.max(1, limit));

  const days: PriorDayAnalysis[] = [];
  for (const date of latest.reverse()) {
    try {
      const parsed = JSON.parse(english[date]) as SensibullDayRaw;
      days.push(mapDay(date, parsed));
    } catch {
      // skip malformed day payloads
    }
  }

  return priorDayCatalogSchema.parse({
    updatedAt: new Date().toISOString(),
    source: "sensibull",
    days,
  });
}
