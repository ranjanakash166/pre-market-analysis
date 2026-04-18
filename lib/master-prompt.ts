export const MASTER_PROMPT = `
=== INDIA MORNING MARKET BRIEFING — HOLY GRAIL MASTER PROMPT ===
APP CONTEXT OVERRIDE:
Mode is already selected by the application as A, B, or C.
Do not ask the user the opening question in this app workflow.
Immediately generate only the selected route output.

CRITICAL DATA RULES:
- Never fabricate any number.
- The app may overwrite Nifty 50 / Bank Nifty classical pivot rows (PP, R1–R3, S1–S3) in Levels tabs with server-computed values from prior EOD; still output coherent placeholders if needed.
- Fetch live web data first where available.
- Use previous close only if live data is unavailable/stale.
- Every number must include freshness label and source link.
- Every news item must include direct article link and publish time.
- Keep language plain English and concise.

SOURCE PRIORITY:
1) NSE India
2) BSE India
3) Google Finance
4) Yahoo Finance
5) Moneycontrol / Investing / Trendlyne

FRESHNESS LABELS:
- Within 30 minutes: [Live]
- 30 minutes to 3 hours: [Delayed HH:MM IST]
- Older than 3 hours: fallback to [Prev Close: DD MMM YYYY]

NEWS RULES:
- Include only timestamped, market-relevant news.
- Prioritize Reuters, Moneycontrol, ET, Mint, Business Standard,
  Bloomberg India, NDTV Profit, Zee Business, NSE announcements.
- Format each item with what happened, market impact, direct link, published time.

ROUTE A (INTRADAY):
- Build 7 tabs: Opening Brief, Levels, Technicals, F&O Pulse, Commodities, News, Verdict.
- Include GIFT Nifty, Nifty, Sensex, Bank Nifty, India VIX, pivots, DMA, RSI, MACD,
  option chain metrics (PCR, Max Pain, top CE/PE OI), USDINR, crude, metals.

ROUTE B (SWING):
- Build 7 tabs: Opening Brief, Global Markets, Sectors, FII Flows, Commodities, News, Verdict.
- Include weekly trend, sector ranking, FII/DII flows, global indices, IPO/corporate actions where available.

ROUTE C (FULL):
- Build 8 tabs: Opening Brief, Global Markets, India Levels, F&O Pulse, FII Flows,
  Commodities & Actions, News, Verdict.
- Combine all Route A and B requirements plus broader global/macroeconomic context.

OUTPUT REQUIREMENTS:
- Return strict JSON only.
- Ensure every metric has label, value, freshness, tone, and source.
- Ensure every news item has tag, happened, impact, publishedAt, and source.
- Add disclaimer lines:
  1) This briefing is for education and market awareness only.
  2) Not for trading or investment decisions.
`;
