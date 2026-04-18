/**
 * Classical floor pivots from one session’s High, Low, Close (prior completed EOD).
 * PP = (H+L+C)/3; R1/S1/R2/S2 standard; R3/S3 extended range.
 *
 * Prior-day OHLC fetch order (no broker API key required by default):
 * 1) Stooq daily CSV — only if STOOQ_API_KEY is set (free key from Stooq captcha page).
 * 2) Yahoo chart query1.finance.yahoo.com
 * 3) Yahoo chart query2.finance.yahoo.com (fallback host)
 */

export const YAHOO_CHART_NIFTY50 = "^NSEI";
export const YAHOO_CHART_BANK_NIFTY = "^NSEBANK";

export type ClassicPivots = {
  pp: number;
  r1: number;
  r2: number;
  r3: number;
  s1: number;
  s2: number;
  s3: number;
};

export function computeClassicPivots(high: number, low: number, close: number): ClassicPivots {
  const h = high;
  const l = low;
  const c = close;
  const pp = (h + l + c) / 3;
  const r1 = 2 * pp - l;
  const s1 = 2 * pp - h;
  const r2 = pp + (h - l);
  const s2 = pp - (h - l);
  const r3 = pp + 2 * (h - l);
  const s3 = pp - 2 * (h - l);
  return { pp, r1, r2, r3, s1, s2, s3 };
}

export type PriorEodBar = {
  high: number;
  low: number;
  close: number;
  /** YYYY-MM-DD (IST) for the bar used */
  barDateIst: string;
  /** Where prior EOD OHLC was read from for this bar */
  ohlcSource: "stooq" | "yahoo";
};

function istYmdFromUnixSeconds(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

function todayIstYmd(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

function coerceFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value.replace(/,/g, "").trim());
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function yahooSymbolToStooqQuery(s: string): string {
  const t = s.trim().toLowerCase();
  if (t === "^nsei" || t === "nsei") return "^nsei";
  if (t === "^nsebank" || t === "nsebank") return "^nsebank";
  return t.startsWith("^") ? t : `^${t}`;
}

/** Stooq returns instructions text when apikey is missing; CSV when key is valid. */
function parseStooqDailyCsv(csvText: string): Array<{ date: string; open: number; high: number; low: number; close: number }> {
  const lines = csvText.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const header = lines[0].toLowerCase();
  if (!header.includes("date") || !header.includes("close")) return [];

  const idx = (name: string) => {
    const cols = lines[0].split(",");
    return cols.findIndex((c) => c.trim().toLowerCase() === name);
  };
  const iDate = idx("date");
  const iOpen = idx("open");
  const iHigh = idx("high");
  const iLow = idx("low");
  const iClose = idx("close");
  if (iDate < 0 || iOpen < 0 || iHigh < 0 || iLow < 0 || iClose < 0) return [];

  const out: Array<{ date: string; open: number; high: number; low: number; close: number }> = [];
  for (let r = 1; r < lines.length; r++) {
    const cols = lines[r].split(",");
    if (cols.length <= iClose) continue;
    const date = cols[iDate]?.trim() ?? "";
    const open = coerceFiniteNumber(cols[iOpen]);
    const high = coerceFiniteNumber(cols[iHigh]);
    const low = coerceFiniteNumber(cols[iLow]);
    const close = coerceFiniteNumber(cols[iClose]);
    if (open === null || high === null || low === null || close === null) continue;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    out.push({ date, open, high, low, close });
  }
  return out;
}

function pickPriorBarFromRows(
  rows: Array<{ date: string; open: number; high: number; low: number; close: number }>,
  ohlcSource: "stooq" | "yahoo",
): PriorEodBar | null {
  if (rows.length === 0) return null;
  const todayIst = todayIstYmd();
  let i = rows.length - 1;
  if (rows[i].date === todayIst && i > 0) {
    i -= 1;
  }
  while (i >= 0) {
    const { date, high: h, low: l, close: c } = rows[i];
    if (Number.isFinite(h) && Number.isFinite(l) && Number.isFinite(c) && h >= l && h > 0 && l > 0) {
      return { high: h, low: l, close: c, barDateIst: date, ohlcSource };
    }
    i -= 1;
  }
  return null;
}

async function fetchPriorFromStooq(yahooSymbol: string): Promise<PriorEodBar | null> {
  const apiKey = process.env.STOOQ_API_KEY?.trim();
  if (!apiKey) return null;

  const stooqS = yahooSymbolToStooqQuery(yahooSymbol);
  const encoded = encodeURIComponent(stooqS);
  const url = `https://stooq.com/q/d/l/?s=${encoded}&i=d&apikey=${encodeURIComponent(apiKey)}`;

  const headers = {
    "user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    accept: "text/csv,text/plain,*/*",
  } as const;

  try {
    const response = await fetch(url, { headers, cache: "no-store" });
    if (!response.ok) return null;
    const text = await response.text();
    if (text.includes("get_apikey") || text.includes("captcha")) return null;
    const rows = parseStooqDailyCsv(text);
    return pickPriorBarFromRows(rows, "stooq");
  } catch {
    return null;
  }
}

function priorBarFromYahooPayload(payload: unknown): PriorEodBar | null {
  const p = payload as {
    chart?: {
      result?: Array<{
        timestamp?: number[];
        indicators?: { quote?: Array<Record<string, (number | null)[] | undefined>> };
      }>;
    };
  };

  const result = p.chart?.result?.[0];
  const timestamps = result?.timestamp;
  const quote = result?.indicators?.quote?.[0];
  if (!Array.isArray(timestamps) || !quote || timestamps.length < 2) return null;

  const highs = quote.high;
  const lows = quote.low;
  const closes = quote.close;
  if (!Array.isArray(highs) || !Array.isArray(lows) || !Array.isArray(closes)) return null;

  const todayIst = todayIstYmd();
  let i = timestamps.length - 1;

  if (istYmdFromUnixSeconds(timestamps[i]) === todayIst) {
    i -= 1;
  }
  while (i >= 0) {
    const h = coerceFiniteNumber(highs[i]);
    const l = coerceFiniteNumber(lows[i]);
    const c = coerceFiniteNumber(closes[i]);
    if (h !== null && l !== null && c !== null && h >= l && h > 0 && l > 0) {
      return {
        high: h,
        low: l,
        close: c,
        barDateIst: istYmdFromUnixSeconds(timestamps[i]),
        ohlcSource: "yahoo",
      };
    }
    i -= 1;
  }
  return null;
}

async function fetchPriorFromYahooHost(yahooSymbol: string, host: "query1" | "query2"): Promise<PriorEodBar | null> {
  const headers = {
    "user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    accept: "application/json",
  } as const;

  const encoded = encodeURIComponent(yahooSymbol);
  const url = `https://${host}.finance.yahoo.com/v8/finance/chart/${encoded}?interval=1d&range=90d`;

  try {
    const response = await fetch(url, { headers, cache: "no-store" });
    if (!response.ok) return null;
    const payload = (await response.json()) as unknown;
    return priorBarFromYahooPayload(payload);
  } catch {
    return null;
  }
}

/**
 * Prior completed daily OHLC for pivot math — tries free sources without a broker key:
 * optional Stooq (STOOQ_API_KEY), then Yahoo on two hosts.
 */
export async function fetchPriorCompletedDailyBar(yahooSymbol: string): Promise<PriorEodBar | null> {
  const fromStooq = await fetchPriorFromStooq(yahooSymbol);
  if (fromStooq) return fromStooq;

  const y1 = await fetchPriorFromYahooHost(yahooSymbol, "query1");
  if (y1) return y1;

  return fetchPriorFromYahooHost(yahooSymbol, "query2");
}
