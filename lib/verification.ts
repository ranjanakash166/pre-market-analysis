import type { GeneratedReport, SourceLink } from "@/types/report";

const ALLOWED_DOMAINS = [
  "nseindia.com",
  "bseindia.com",
  "finance.yahoo.com",
  "google.com",
  "moneycontrol.com",
  "investing.com",
  "trendlyne.com",
  "economictimes.indiatimes.com",
  "livemint.com",
  "business-standard.com",
  "reuters.com",
  "ndtvprofit.com",
  "zeebiz.com",
  "bloomberg.com",
  "timesofindia.indiatimes.com",
  "groww.in",
  "stooq.com",
];

const CANONICAL_BY_SOURCE: Record<string, string> = {
  "NSE India": "https://www.nseindia.com",
  "BSE India": "https://www.bseindia.com",
  "Yahoo Finance": "https://finance.yahoo.com",
  "Google Finance": "https://www.google.com/finance",
  Moneycontrol: "https://www.moneycontrol.com",
  Investing: "https://www.investing.com",
  Trendlyne: "https://trendlyne.com",
  Reuters: "https://www.reuters.com",
  Mint: "https://www.livemint.com",
  "Business Standard": "https://www.business-standard.com",
  "Economic Times": "https://economictimes.indiatimes.com",
  "NDTV Profit": "https://www.ndtvprofit.com",
  "Zee Business": "https://www.zeebiz.com",
  Bloomberg: "https://www.bloomberg.com",
};

function normalizeHost(hostname: string): string {
  return hostname.replace(/^www\./, "").toLowerCase();
}

function hasAllowedDomain(url: string): boolean {
  try {
    const host = normalizeHost(new URL(url).hostname);
    return ALLOWED_DOMAINS.some((domain) => host === domain || host.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

function getCanonicalUrl(sourceName: string): string {
  for (const [key, value] of Object.entries(CANONICAL_BY_SOURCE)) {
    if (sourceName.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  return "https://www.nseindia.com";
}

async function urlReachable(url: string): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3500);

  try {
    const head = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      cache: "no-store",
    });
    if (head.ok) {
      return true;
    }

    const get = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      cache: "no-store",
    });
    return get.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

function repairSource(source: SourceLink): SourceLink {
  if (!hasAllowedDomain(source.url)) {
    return { ...source, url: getCanonicalUrl(source.name) };
  }
  return source;
}

function numericLike(value: string): boolean {
  return /\d/.test(value);
}

/** NSE/BSE sites; Sensex may cite the official BSE SENSEX page or any bseindia.com URL. */
function isAuthoritativeIndianIndexSource(label: string, url: string): boolean {
  const lower = label.toLowerCase();
  try {
    const host = normalizeHost(new URL(url).hostname);
    const isNse = host === "nseindia.com" || host.endsWith(".nseindia.com");
    const isBse = host === "bseindia.com" || host.endsWith(".bseindia.com");

    if (lower.includes("sensex")) {
      return isBse;
    }
    if (lower.includes("gift nifty") || lower.includes("sgx nifty")) {
      return isNse;
    }
    if (
      (lower.includes("nifty") && !lower.includes("gift nifty") && !lower.includes("sgx nifty")) ||
      lower.includes("india vix")
    ) {
      return isNse;
    }
  } catch {
    return false;
  }
  return false;
}

function isIndianIndexMetric(label: string): boolean {
  const lower = label.toLowerCase();
  return (
    (lower.includes("nifty") && !lower.includes("gift nifty") && !lower.includes("sgx nifty")) ||
    lower.includes("sensex") ||
    lower.includes("india vix")
  );
}

function isGiftNiftyMetric(label: string): boolean {
  const lower = label.toLowerCase();
  return lower.includes("gift nifty") || lower.includes("sgx nifty");
}

function isNseIndiaUrl(url: string): boolean {
  try {
    const host = normalizeHost(new URL(url).hostname);
    return host === "nseindia.com" || host.endsWith(".nseindia.com");
  } catch {
    return false;
  }
}

function ensureOfficialSourcePresent(sources: SourceLink[], label: string): SourceLink[] {
  const next = [...sources];
  const lower = label.toLowerCase();
  const needsNse =
    lower.includes("india vix") ||
    (lower.includes("nifty") && !lower.includes("gift nifty") && !lower.includes("sgx nifty"));
  const needsSensex = label.toLowerCase().includes("sensex");
  const needsNseGift = isGiftNiftyMetric(label);
  const hasDomain = (needle: "nseindia.com" | "bseindia.com") =>
    next.some((s) => {
      try {
        return normalizeHost(new URL(s.url).hostname).includes(needle);
      } catch {
        return false;
      }
    });

  const hasSensexSource = next.some((s) => {
    try {
      const h = normalizeHost(new URL(s.url).hostname);
      return h.includes("bseindia.com");
    } catch {
      return false;
    }
  });

  if ((needsNse || needsNseGift) && !hasDomain("nseindia.com")) {
    next.push({ name: "NSE India", url: "https://www.nseindia.com" });
  }
  if (needsSensex && !hasSensexSource) {
    next.push({ name: "BSE India — S&P BSE SENSEX", url: "https://www.bseindia.com/sensex/code/16/" });
  }
  return next;
}

export async function verifyAndNormalizeReport(report: GeneratedReport): Promise<GeneratedReport> {
  const normalized: GeneratedReport = structuredClone(report);

  normalized.sourcesUsed = normalized.sourcesUsed.map(repairSource);

  for (const section of normalized.sections) {
    section.metrics = section.metrics.map((metric) => {
      const source = repairSource(metric.source);
      const safeMetric = { ...metric, source };
      if (!numericLike(metric.value)) {
        safeMetric.value = "N/A";
        safeMetric.freshness = "[Unverified]";
        safeMetric.tone = "neutral";
        safeMetric.note = "Value not verifiable from model output.";
      }
      if (isIndianIndexMetric(metric.label) && !isAuthoritativeIndianIndexSource(metric.label, source.url)) {
        safeMetric.freshness = "[Unverified]";
        safeMetric.tone = "neutral";
        safeMetric.note = "Authoritative index citation missing (NSE India or BSE India).";
      }
      if (isGiftNiftyMetric(metric.label) && !isNseIndiaUrl(source.url)) {
        safeMetric.freshness = "[Unverified]";
        safeMetric.tone = "neutral";
        safeMetric.note = "Official NSE India citation missing for GIFT Nifty.";
      }
      normalized.sourcesUsed = ensureOfficialSourcePresent(normalized.sourcesUsed, metric.label);
      return safeMetric;
    });
    section.news = (section.news ?? []).map((item) => ({
      ...item,
      source: repairSource(item.source),
    }));
  }

  const urlCache = new Map<string, boolean>();
  const candidates = new Set<string>();
  normalized.sourcesUsed.forEach((s) => candidates.add(s.url));
  normalized.sections.forEach((section) => {
    section.metrics.forEach((metric) => candidates.add(metric.source.url));
    (section.news ?? []).forEach((news) => candidates.add(news.source.url));
  });

  const urlsToCheck = Array.from(candidates).slice(0, 20);
  await Promise.all(
    urlsToCheck.map(async (url) => {
      const ok = await urlReachable(url);
      urlCache.set(url, ok);
    }),
  );

  const fallbackIfBroken = (source: SourceLink): SourceLink => {
    const status = urlCache.get(source.url);
    if (status === false) {
      return { ...source, url: getCanonicalUrl(source.name) };
    }
    return source;
  };

  normalized.sourcesUsed = normalized.sourcesUsed.map(fallbackIfBroken);
  for (const section of normalized.sections) {
    section.metrics = section.metrics.map((metric) => ({
      ...metric,
      source: fallbackIfBroken(metric.source),
    }));
    section.news = (section.news ?? []).map((item) => ({
      ...item,
      source: fallbackIfBroken(item.source),
    }));
  }

  return normalized;
}
