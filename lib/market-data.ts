import type { GeneratedReport, Metric } from "@/types/report";

interface NseIndexRow {
  index: string;
  last: number;
  percentChange: number;
  previousClose: number;
}

/** Same index page the BSE site uses; `Referer` must match for `api.bseindia.com` to return JSON. */
export const BSE_SENSEX_PAGE_URL = "https://www.bseindia.com/sensex/code/16/";

const BSE_SENSEX_API_URL = "https://api.bseindia.com/RealTimeBseIndiaAPI/api/GetSensexData/w?code=16";

export interface LiveIndexPayload {
  nifty50?: NseIndexRow;
  bankNifty?: NseIndexRow;
  indiaVix?: NseIndexRow;
  giftNifty?: {
    last: number;
    percentChange: number;
  };
  /** S&P BSE SENSEX — BSE `GetSensexData` realtime API (same feed as the official Sensex page). */
  sensex?: {
    last: number;
    percentChange: number;
  };
  fetchedAtIst: string;
}

function toTone(change: number): "positive" | "negative" | "neutral" {
  if (change > 0) return "positive";
  if (change < 0) return "negative";
  return "neutral";
}

function formatValue(value: number): string {
  return value.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function formatChange(change: number): string {
  const sign = change > 0 ? "+" : "";
  return `${sign}${change.toFixed(2)}%`;
}

const NSE_FETCH_HEADERS = {
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  accept: "application/json,text/plain,*/*",
  referer: "https://www.nseindia.com/",
} as const;

const BSE_INDEX_FETCH_HEADERS = {
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  accept: "application/json,text/plain,*/*",
  referer: BSE_SENSEX_PAGE_URL,
} as const;

export async function fetchNseCoreIndices(): Promise<LiveIndexPayload | null> {
  try {
    const response = await fetch("https://www.nseindia.com/api/allIndices", {
      headers: NSE_FETCH_HEADERS,
      cache: "no-store",
    });

    if (!response.ok) return null;
    const payload = (await response.json()) as { data?: NseIndexRow[] };
    const data = payload.data ?? [];

    const find = (name: string) => data.find((row) => row.index === name);
    return {
      nifty50: find("NIFTY 50"),
      bankNifty: find("NIFTY BANK"),
      indiaVix: find("INDIA VIX"),
      fetchedAtIst: new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour12: false,
      }),
    };
  } catch {
    return null;
  }
}

function coerceFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value.replace(/,/g, "").replace(/%/g, "").trim());
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** BSE realtime row: `ltp`, `perchg`, `chg`, `Prev_Close` are often strings with commas / leading +. */
async function fetchSensexFromBse(): Promise<{ last: number; percentChange: number } | null> {
  try {
    const response = await fetch(BSE_SENSEX_API_URL, {
      headers: BSE_INDEX_FETCH_HEADERS,
      cache: "no-store",
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as unknown;
    const row = Array.isArray(payload) ? (payload[0] as Record<string, unknown> | undefined) : undefined;
    if (!row) return null;

    const last = coerceFiniteNumber(row.ltp);
    if (last === null || last < 10_000) return null;

    let percentChange = coerceFiniteNumber(row.perchg);
    if (percentChange === null) {
      const chg = coerceFiniteNumber(row.chg);
      const prev = coerceFiniteNumber(row.Prev_Close);
      if (chg !== null && prev !== null && prev !== 0) {
        percentChange = (chg / prev) * 100;
      }
    }
    if (percentChange === null || !Number.isFinite(percentChange)) return null;

    return { last, percentChange };
  } catch {
    return null;
  }
}

/** GIFT Nifty futures quote from NSE India's market status API (same feed as nseindia.com homepage). */
async function fetchGiftNiftyFromNse(): Promise<{ last: number; percentChange: number } | null> {
  try {
    const response = await fetch("https://www.nseindia.com/api/marketStatus", {
      headers: NSE_FETCH_HEADERS,
      cache: "no-store",
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as {
      giftnifty?: { LASTPRICE?: number | string; PERCHANGE?: number | string };
    };
    const g = payload.giftnifty;
    if (!g) return null;

    const last = typeof g.LASTPRICE === "number" ? g.LASTPRICE : Number(String(g.LASTPRICE).replace(/,/g, ""));
    const percentChange =
      typeof g.PERCHANGE === "number" ? g.PERCHANGE : Number(String(g.PERCHANGE).replace(/,/g, ""));

    if (Number.isNaN(last) || Number.isNaN(percentChange)) return null;

    return { last, percentChange };
  } catch {
    return null;
  }
}

export async function fetchLiveMarketData(): Promise<LiveIndexPayload | null> {
  const [nse, giftNifty, sensex] = await Promise.all([
    fetchNseCoreIndices(),
    fetchGiftNiftyFromNse(),
    fetchSensexFromBse(),
  ]);

  const fetchedAtIst =
    nse?.fetchedAtIst ??
    new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour12: false,
    });

  if (!nse && !giftNifty && !sensex) return null;
  return {
    nifty50: nse?.nifty50,
    bankNifty: nse?.bankNifty,
    indiaVix: nse?.indiaVix,
    giftNifty: giftNifty ?? undefined,
    sensex: sensex ?? undefined,
    fetchedAtIst,
  };
}

/**
 * Appended to the model prompt on every Generate so Opening Brief, verdict, and level
 * commentary align with the same server-fetched NSE/BSE snapshot (not model memory).
 */
export function buildLiveIndicesPromptAppendix(live: LiveIndexPayload | null): string {
  if (!live) {
    return `
=== LIVE_INDICES_SERVER_FETCH (this generation request) ===
Result: No live index bundle returned (NSE/BSE calls failed or were empty).
Instructions: For Nifty 50, Bank Nifty, India VIX, GIFT Nifty, and BSE Sensex, use value "N/A" with honest freshness and official NSE/BSE source URLs where you lack data. Do not invent spot levels or reuse outdated example levels from training.
`;
  }

  const lines: string[] = [
    "=== LIVE_INDICES_SERVER_FETCH (authoritative numeric ground truth for THIS generation) ===",
    `Fetched_at_IST: ${live.fetchedAtIst}`,
    "The server read these from NSE/BSE immediately before this run. You MUST use these exact last and session % values for matching Opening Brief metrics, and verdict.bullets plus any index commentary in ALL tabs must be consistent with these levels (derive nearby pivots from last/previous_close; never substitute placeholder strikes from memory).",
  ];

  if (live.nifty50) {
    lines.push(
      `NIFTY_50 last=${live.nifty50.last} previous_close=${live.nifty50.previousClose} session_pct_change=${live.nifty50.percentChange}`,
    );
  }
  if (live.bankNifty) {
    lines.push(
      `BANK_NIFTY last=${live.bankNifty.last} previous_close=${live.bankNifty.previousClose} session_pct_change=${live.bankNifty.percentChange}`,
    );
  }
  if (live.indiaVix) {
    lines.push(
      `INDIA_VIX last=${live.indiaVix.last} previous_close=${live.indiaVix.previousClose} session_pct_change=${live.indiaVix.percentChange}`,
    );
  }
  if (live.giftNifty) {
    lines.push(
      `GIFT_NIFTY last=${live.giftNifty.last} session_pct_change=${live.giftNifty.percentChange}`,
    );
  }
  if (live.sensex) {
    lines.push(`BSE_SENSEX last=${live.sensex.last} session_pct_change=${live.sensex.percentChange}`);
  }

  lines.push(
    "If you mention PCR, OI, or other figures not listed above, label them as illustrative unless you cite a timestamped source in JSON; do not contradict the session direction implied by the index rows above.",
  );

  return lines.join("\n");
}

function applyFromLive(metric: Metric, row: NseIndexRow, fetchedAtIst: string): Metric {
  return {
    ...metric,
    value: formatValue(row.last),
    change: formatChange(row.percentChange),
    freshness: `[Live ${fetchedAtIst} IST]`,
    tone: toTone(row.percentChange),
    note: metric.note,
    source: {
      name: "NSE India",
      url: "https://www.nseindia.com",
    },
  };
}

export function enrichReportWithLiveIndices(report: GeneratedReport, live: LiveIndexPayload | null): GeneratedReport {
  if (!live) return report;
  const next = structuredClone(report);

  const matchAndApply = (metric: Metric): Metric => {
    const label = metric.label.toLowerCase();
    if (label.includes("nifty 50") && live.nifty50) {
      return applyFromLive(metric, live.nifty50, live.fetchedAtIst);
    }
    if (label.includes("bank nifty") && live.bankNifty) {
      return applyFromLive(metric, live.bankNifty, live.fetchedAtIst);
    }
    if (label.includes("india vix") && live.indiaVix) {
      return applyFromLive(metric, live.indiaVix, live.fetchedAtIst);
    }
    if ((label.includes("gift nifty") || label.includes("sgx nifty")) && live.giftNifty) {
      return {
        ...metric,
        value: formatValue(live.giftNifty.last),
        change: formatChange(live.giftNifty.percentChange),
        freshness: `[Live ${live.fetchedAtIst} IST]`,
        tone: toTone(live.giftNifty.percentChange),
        source: {
          name: "NSE India — GIFT Nifty (market status)",
          url: "https://www.nseindia.com/",
        },
      };
    }
    if (label.includes("sensex") && live.sensex) {
      return {
        ...metric,
        value: formatValue(live.sensex.last),
        change: formatChange(live.sensex.percentChange),
        freshness: `[Live ${live.fetchedAtIst} IST]`,
        tone: toTone(live.sensex.percentChange),
        note:
          metric.note ??
          "Spot from BSE India realtime API (GetSensexData), same index as the official S&P BSE SENSEX page.",
        source: {
          name: "BSE India — S&P BSE SENSEX",
          url: BSE_SENSEX_PAGE_URL,
        },
      };
    }
    return metric;
  };

  next.sections = next.sections.map((section) => ({
    ...section,
    metrics: section.metrics.map(matchAndApply),
  }));

  const ensureNse = next.sourcesUsed.some((s) => s.url.includes("nseindia.com"));
  if (!ensureNse) {
    next.sourcesUsed.push({ name: "NSE India", url: "https://www.nseindia.com" });
  }
  const hasBseSensexPage = next.sourcesUsed.some((s) => s.url.includes("bseindia.com/sensex/code/16"));
  if (live.sensex && !hasBseSensexPage) {
    next.sourcesUsed.push({ name: "BSE India — S&P BSE SENSEX", url: BSE_SENSEX_PAGE_URL });
  }

  return next;
}
