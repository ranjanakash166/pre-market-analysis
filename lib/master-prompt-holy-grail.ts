/** Canonical Holy Grail master text. Edit master-prompt-holy-grail.md then run: node scripts/embed-holy-grail-md.mjs */
export const HOLY_GRAIL_BODY = `=== INDIA MORNING MARKET BRIEFING — HOLY GRAIL MASTER PROMPT ===
CRITICAL INSTRUCTION:
Your ONLY permitted first action is to display this question.
Do NOT search the web. Do NOT fetch any data. Do NOT write
any preamble. Do not say "Sure!" or "Great!" or anything else.
Just show the question exactly as written below.
Stop. Wait. Do nothing else until the user replies.
─────────────────────────────────────────────────────
YOUR FIRST AND ONLY RESPONSE MUST BE EXACTLY THIS:
─────────────────────────────────────────────────────
Good morning. What kind of trader are you today?

  A) Intraday   — Levels, technicals, F&O pulse, today's news.
  B) Swing      — Weekly view, sectors, FII flows, weekly news.
  C) Full Report — Everything. All tabs. Complete picture.

Reply A, B, or C.
─────────────────────────────────────────────────────
WAIT FOR REPLY. DO NOT PROCEED UNTIL USER RESPONDS.
If reply is unclear, ask once more. Then proceed.
─────────────────────────────────────────────────────
═══════════════════════════════════════════════════════
UNIVERSAL DATA RULES — APPLY TO ALL THREE MODES
═══════════════════════════════════════════════════════
NUMBER FETCHING — STRICT PRIORITY ORDER
For every single number in this report, follow this
exact sequence. Do not skip steps. Do not jump ahead.
STEP 1 — WEB SEARCH FIRST, ALWAYS
Before using any number, run a live web search for it.
Search Google Finance, Yahoo Finance, NSE India,
BSE India, and news sources simultaneously.
Look for the current live price or reading right now.
If the web search returns a number with a timestamp
within 30 minutes of PROMPT_TIME, use that number.
Mark it [Live].

STEP 2 — CROSS-CHECK LIVE NUMBERS
If a live number is found, verify it against at
least one more source before displaying.
If sources agree → show the number. Mark [Live].
If sources differ slightly → show range (₹X–₹Y).
If sources disagree materially → show both values
and write: "Sources disagree — verify at [link]."
STEP 3 — ONLY IF WEB SEARCH FAILS
If Step 1 returns nothing useful, or the timestamp
is older than 30 minutes, then search specifically
for the previous close value.
Search: "[index name] previous close [today's date]"
Use NSE India, BSE India, Google Finance, Yahoo Finance.
If found, display as [Prev Close: DD MMM YYYY].
STEP 4 — LAST RESORT
If neither live price nor previous close can be found:
Write: "N/A — check [source name directly]" with link.
Never leave a field blank.
Never fabricate or estimate any number.
Never use a number from a news article or analysis piece.
Always fetch from the primary data source directly.
SOURCE CITATION RULE — MANDATORY FOR EVERY NUMBER
Every single number displayed must show its source.
Format: [number] [freshness label] Source: [name + link]
Example: 22,819 [Live] Source: NSE India (nseindia.com)
Example: 22,819 [Prev Close: 27 Mar 2026]
Source: Google Finance (finance.google.com)
No number may appear without its source cited.
This applies to every index, indicator, commodity,
currency, F&O metric, and flow figure in the report.
FETCH SOURCE PRIORITY
1. NSE India (nseindia.com) — primary for Indian data
2. BSE India (bseindia.com) — secondary for Indian data
3. Google Finance — global indices, currencies, commodities
4. Yahoo Finance — technicals, DMA, RSI, MACD
5. Moneycontrol, Investing.com, Trendlyne — tertiary
6. Broker pages, screener.in, tickertape.in — last resort
TIMESTAMP AND FRESHNESS LABELS
Note the exact IST time when this prompt is run.

Call this PROMPT_TIME.
Within 30 minutes of PROMPT_TIME → label [Live]
30 minutes to 3 hours old → label [Delayed HH:MM IST]
Older than 3 hours → do not use. Fall back to prev close.
All previous close data → label [Prev Close: DD MMM YYYY]
Never show any number without its freshness label.
NEWS FETCHING — STRICT RULES
For news, always run a live web search first.
Search across ALL of these sources every time:
Reuters, Moneycontrol, Economic Times, ET Markets,
Times of India, Mint, Business Standard, Bloomberg India,
NDTV Profit, Zee Business, NSE announcements,
broker research pages, Trendlyne, Screener.
Include only items with confirmed visible timestamps.
NEWS LINK RULE — MANDATORY FOR EVERY NEWS ITEM
Every news item must include a direct clickable link
that takes the reader to the actual news article page.
The link must open the original source article directly.
Do not link to a homepage or search page.
Do not link to an aggregator when original is available.
Format: [Read the full article →](direct article URL)
If a direct article link cannot be found, write:
"Link unavailable — search [headline] on [source name]"
No news item may appear without either a direct link
or this fallback instruction.
For each news item write only:
What happened: one line.
How it affects the market: one line.
[Read the full article →](direct article URL)
Published: [HH:MM IST DD MMM YYYY]
Do not reproduce article text.
Do not write long summaries.
If same news appears across multiple sources,
include once using the most credible source
and link directly to that source's article page.
LANGUAGE AND DISPLAY RULE
Write everything in simple, plain English.
Every line must be short — one sentence maximum.
No jargon without a simple explanation.
No long paragraphs anywhere in the output.

Numbers in bold. Green for positive. Red for negative.
Amber for neutral or caution.
The output must be an interactive widget inside Claude chat.
Do not generate any HTML file, external app, or document.
Tabs must switch on click. No page reload.
No description or explanation text outside the widget.
Disclaimer appears two lines below the widget always.
═══════════════════════════════════════════════════════
ROUTE A — INTRADAY REPORT
═══════════════════════════════════════════════════════
WHO THIS IS FOR:
Traders who buy and sell within the same day.
They need to know where the market will open,
what levels matter today, and what news could
move the market before and after 9:15 AM.
SEARCH SEQUENCE — run ALL searches via web search
before building the widget. Follow Step 1 to Step 4
of the NUMBER FETCHING rule for every single number.
Search 1: GIFT Nifty
→ Web search: "GIFT Nifty live price right now"
→ Try: nseindia.com/market-data/gift-nifty
→ Try: 5paisa.com/share-market-today/gift-nifty
→ Try: Google Finance "GIFT Nifty"
→ Cross-check two sources before displaying.
→ If live unavailable: web search "GIFT Nifty
previous close [today's date]"
Search 2: Nifty 50, Sensex, Bank Nifty
→ Web search: "Nifty 50 live price right now"
→ Web search: "Sensex live price right now"
→ Web search: "Bank Nifty live price right now"
→ Try: nseindia.com live market data
→ Try: Google Finance for each index
→ Cross-check two sources. Label live or prev close.
Search 3: India VIX
→ Web search: "India VIX current level"
→ Try: nseindia.com/market-data/vix
→ Try: Google Finance "India VIX"

Search 4: Nifty 50 previous day OHLC and candle
→ Web search: "Nifty 50 OHLC [yesterday's date]"
→ Try: nseindia.com historical data
→ Try: Moneycontrol Nifty chart
Search 5: Nifty technical indicators
→ RSI(14): Web search "Nifty 50 RSI today"
Try Yahoo Finance, Moneycontrol, Tickertape
→ MACD(12,26,9): Web search "Nifty 50 MACD today"
Try Yahoo Finance, Moneycontrol,
Investing.com, Trendlyne
If MACD unavailable: write
"MACD not available — check Yahoo Finance [link]"
Do not estimate or fabricate.
→ 20 DMA, 50 DMA, 200 DMA:
Web search "Nifty 50 moving averages today"
Try Yahoo Finance, Moneycontrol
Search 6: Nifty pivot levels for today
→ Web search: "Nifty pivot levels [today's date]"
→ Try: Moneycontrol, Investing.com
→ Classic pivots only. Fibonacci not required.
Search 7: Nifty Advance/Decline ratio
→ Web search: "Nifty advance decline ratio
[yesterday's date]"
→ Try: nseindia.com market breadth section
→ Try: bseindia.com market statistics
→ This is previous day data from exchange.
→ If unavailable: write "N/A — check NSE India [link]"
Search 8: F&O data for Nifty
→ Web search: "Nifty PCR today [today's date]"
→ Web search: "Nifty Max Pain [today's date]"
→ Web search: "Nifty option chain OI today"
→ Primary source: nseindia.com/option-chain
→ Secondary source: Moneycontrol F&O section
→ Fetch: PCR, Max Pain, top 3 CE OI strikes,
top 3 PE OI strikes, OI change from prev day
→ Every F&O number must show:
Value + [freshness label] + Source: [name + link]
→ PCR and Max Pain must specifically state:
"Source: NSE India Option Chain
(nseindia.com/option-chain)"

or whichever source was actually used.
Search 9: Commodities and currency
→ Web search: "USD INR live rate right now"
→ Web search: "Brent crude live price right now"
→ Web search: "WTI crude live price right now"
→ Web search: "Gold MCX live price today"
→ Web search: "Silver MCX live price today"
→ Try: Google Finance for USD/INR, Brent, WTI
→ Try: MCX India for Gold and Silver
→ Cross-check each against two sources.
Search 10: Today's news
→ Time window: last 12 hours before PROMPT_TIME
→ Web search: "India stock market news today
[today's date]"
→ Web search: "Nifty market news this morning
[today's date]"
→ Search across: Reuters, Moneycontrol,
Economic Times, ET Markets, Times of India,
Mint, Business Standard, Bloomberg India,
NDTV Profit, Zee Business, NSE announcements,
broker research pages, Trendlyne, Screener
→ Include only news affecting today's market
→ Confirmed timestamps only. Maximum 8 items.
→ For each item: fetch the direct article URL.
→ Format: [Read the full article →](direct URL)
BUILD a 7-tab interactive widget inside Claude chat.
News and Verdict are in separate tabs.
No text or description outside the widget.
TABS: [Opening Brief] [Levels] [Technicals]
[F&O Pulse] [Commodities] [News] [Verdict]
────────────────────────────────────
TAB 1 — OPENING BRIEF
────────────────────────────────────
One line: how Nifty closed yesterday and the mood.
One line: what GIFT Nifty says about today's open.
One line: overall market situation right now.
GIFT Nifty [level] [freshness]
Gap: [Flat / Small Gap Up / Small Gap Down /

Huge Gap Up / Huge Gap Down] ~[X] pts
Source: [name + link]
Nifty 50 [level] [freshness] [% change] ▲/▼
Source: [name + link]
Sensex 	[level] [freshness] [% change] ▲/▼
Source: [name + link]
Bank Nifty [level] [freshness] [% change] ▲/▼
Source: [name + link]
India VIX [level] [freshness]
[Low = calm / Normal / Elevated = caution /
Extreme = high fear]
Source: [name + link]
VIX explained simply:
Below 15 = market is calm.
Between 15 and 20 = some nervousness.
Above 20 = market is anxious.
Above 25 = high fear in the market.
────────────────────────────────────
TAB 2 — LEVELS
────────────────────────────────────
Previous day Nifty:
Open: [v] High: [v] Low: [v] Close: [v]
Source: NSE India (nseindia.com)
Candle type: [name]
What it means: [one plain line for today]
Advance/Decline [Prev Close: DD MMM YYYY]:
Stocks that went up: [number] ▲
Stocks that went down: [number] ▼
What this means: [one plain line]
Source: [NSE India / BSE India + link]
Pivot levels for today:
R2 [level] Strong resistance — market may reverse here
R1 [level] First resistance — watch for selling
Pivot [level] Balance point for the day
S1 [level] First support — watch for buying
S2 [level] Strong support — market may bounce here
Source: [name + link]
Level map:
R2 ───────────────── [level]

R1 ───────────────── [level] ← watch here
Pivot ───────────────── [level]
S1 ───────────────── [level] ← watch here
S2 ───────────────── [level]
Intraday time windows:
9:15–9:30 → [what to watch, one line]
10:30–11:30 → [likely market behaviour, one line]
2:30–3:30 → [closing tendency, one line]
────────────────────────────────────
TAB 3 — TECHNICALS
────────────────────────────────────
Moving averages — where is Nifty trading?
20 DMA: [level] Nifty is [above / below]
What it means: [one plain line]
Source: [name + link]
50 DMA: [level] Nifty is [above / below]
What it means: [one plain line]
Source: [name + link]
200 DMA: [level] Nifty is [above / below]
What it means: [one plain line]
Source: [name + link]
RSI(14): [reading]
RSI explained: Below 40 = market oversold and may
bounce. Between 40 and 60 = neutral. Above 60 =
market overbought and may cool off.
Current reading means: [one plain line]
Source: [name + link]
MACD(12,26,9):
MACD line: [value]
Signal line: [value]
Histogram: [positive / negative]
MACD explained: Positive histogram means momentum
is building upward. Negative means momentum is
fading or falling.
Current reading means: [one plain line]
Source: [name + link]
If unavailable: "MACD not fetched — check
Yahoo Finance or Moneycontrol [link]"
────────────────────────────────────

TAB 4 — F&O PULSE
────────────────────────────────────
F&O explained simply:
Options traders place bets at specific price levels.
Where they place the most bets becomes a magnet
for the market. These numbers show those levels.
PCR — Put Call Ratio: [reading] [freshness]
Source: NSE India Option Chain
(nseindia.com/option-chain)
Below 0.7 = more call bets = market may struggle
Between 0.7 and 1.0 = balanced bets
Above 1.0 = more put bets = market may hold or rise
Current reading means: [one plain line]
Max Pain: [level] [freshness]
Source: NSE India Option Chain
(nseindia.com/option-chain)
This is where most options expire worthless.
Market tends to move toward this level near expiry.
Top CE OI — where resistance may form:
Strike [level] — [contracts] — Change [▲/▼]
Strike [level] — [contracts] — Change [▲/▼]
Strike [level] — [contracts] — Change [▲/▼]
Source: NSE India Option Chain
(nseindia.com/option-chain)
Top PE OI — where support may form:
Strike [level] — [contracts] — Change [▲/▼]
Strike [level] — [contracts] — Change [▲/▼]
Strike [level] — [contracts] — Change [▲/▼]
Source: NSE India Option Chain
(nseindia.com/option-chain)
Today's expected range: [one line based on OI data]
If any F&O number was sourced from Moneycontrol
instead of NSE India, state clearly:
"Source: Moneycontrol F&O section (moneycontrol.com)"
────────────────────────────────────
TAB 5 — COMMODITIES
────────────────────────────────────

USD/INR [rate] [freshness] [% change] ▲/▼
[one line: rupee impact on market]
Source: [name + link]
Brent $[v]/bbl [freshness] [% change] ▲/▼
[one line: impact on India]
Source: [name + link]
WTI 	$[v]/bbl [freshness] [% change] ▲/▼
Source: [name + link]
Gold MCX ₹[v]/10g [freshness] [% change] ▲/▼
Source: [name + link]
Silver MCX ₹[v]/kg [freshness] [% change] ▲/▼
Source: [name + link]
────────────────────────────────────
TAB 6 — NEWS
────────────────────────────────────
Latest news — last 12 hours only.
Only news that affects today's market.
Most important items shown first.
Maximum 8 items.
Every item must have a direct link to the article.
Format per item:
[TAG] · What happened: [one line]
Market impact: [one line]
[Read the full article →](direct article URL)
Published: [HH:MM IST DD MMM YYYY]
Source: [publication name]
Tags: DOMESTIC / GLOBAL / CORP / SECTOR / MACRO / ALERT
If direct article URL unavailable:
"Link unavailable — search [headline] on
[source name]"
────────────────────────────────────
TAB 7 — VERDICT
────────────────────────────────────
Market is expected to [open gap up / open gap down /
open flat], bias [bullish / bearish / neutral].
Key level to watch today: [level]
If this level holds: [one line — what likely happens]
If this level breaks: [one line — what likely happens]

Confidence: High / Medium / Low
What this means for an intraday trader:
[Two lines maximum in plain simple English explaining
what the trader should keep in mind today.
No buy or sell calls. No position advice.
Just the market context in simple words.]
═══════════════════════════════════════════════════════
ROUTE B — SWING REPORT
═══════════════════════════════════════════════════════
WHO THIS IS FOR:
Traders holding positions for 3 to 10 days.
They need the weekly trend, sector rotation,
institutional flows, and news from the past week.
SEARCH SEQUENCE — follow Step 1 to Step 4 of
NUMBER FETCHING rule for every number below.
Cite source for every number displayed.
Search 1: Nifty 50 weekly close and trend
→ Web search: "Nifty 50 weekly performance
[current week dates]"
→ Try: nseindia.com, Google Finance
Search 2: Sensex and Bank Nifty weekly close
→ Web search: "Sensex Bank Nifty weekly close
[current week dates]"
→ Try: nseindia.com, Google Finance
Search 3: GIFT Nifty current or prev close
→ Same sequence as Route A Search 1
Search 4: Global indices
→ S&P 500: Web search "S&P 500 live price now"
Try Google Finance, Yahoo Finance
If live unavailable: "S&P 500 previous close
[today's date]"
→ Dow Jones: Same sequence
→ FTSE 100: Same sequence
→ Hang Seng: Web search "Hang Seng live price now"
If Asian market open at PROMPT_TIME: fetch live

If closed: fetch previous close
Label each [Live] or [Prev Close: DD MMM YYYY]
→ Nikkei 225: Same live/prev close logic as Hang Seng
→ Cite source for each index separately
Search 5: Sector performance past 5 trading days
→ Web search: "Nifty sector performance this week
[current week]"
→ Try: Moneycontrol sector performance page
→ Try: nseindia.com/market-data/sector-indices
→ Try: Trendlyne sector heatmap
→ All sectors: Auto, Bank, IT, Pharma, FMCG,
Metal, Realty, Energy, Infra, Financial Services,
PSU Bank, Media
→ Show weekly % change for each
→ Cite source used
Search 6: FII and DII weekly flows
→ Web search: "FII DII data this week [dates]"
→ Try: nseindia.com/reports/fii-dii
→ Try: upstox.com/fii-dii-data
→ Fetch daily net Mon to Fri this week
→ FII: cash net, futures net, options net
→ DII: cash net
→ Cite source for each row of data
Search 7: Top 5 Nifty gainers and losers this week
→ Web search: "Nifty top gainers this week
[current week]"
→ Web search: "Nifty top losers this week
[current week]"
→ Try: nseindia.com, Moneycontrol
→ Cite source
Search 8: Commodities and currency
→ Same sequence as Route A Search 9
→ Cite source for each commodity and currency
Search 9: IPO activity this month
→ Web search: "upcoming IPO [current month year]
mainboard NSE"
→ Try: nseindia.com/market-data/all-upcoming-ipos
→ Try: Moneycontrol IPO section
→ Only mainboard IPOs. Skip SME IPOs.

→ Cite source
Search 10: Corporate actions this week
→ Web search: "NSE corporate actions this week
[current week dates]"
→ Try: nseindia.com corporate actions calendar
→ Cite source
Search 11: Bulk and block deals this week
→ Web search: "NSE bulk deals block deals
[current week]"
→ Try: nseindia.com/market-data/bulk-deals
→ Only significant institutional transactions
→ Cite source
Search 12: Weekly news
→ Time window: previous 5 trading days
→ Web search: "India stock market news this week
[current week dates]"
→ Search across: Reuters, Moneycontrol,
Economic Times, ET Markets, Times of India,
Mint, Business Standard, Bloomberg India,
NDTV Profit, Zee Business, broker research,
Trendlyne, Screener
→ Confirmed timestamps only. Max 5 items per category.
→ For each item: fetch direct article URL.
→ Format: [Read the full article →](direct URL)
BUILD a 7-tab interactive widget inside Claude chat.
News and Verdict are in separate tabs.
No text or description outside the widget.
TABS: [Opening Brief] [Global Markets] [Sectors]
[FII Flows] [Commodities] [News] [Verdict]
────────────────────────────────────
TAB 1 — OPENING BRIEF
────────────────────────────────────
One line: how Nifty closed this week and trend.
One line: what global markets are signalling.
One line: overall swing sentiment right now.
Nifty 50 [level] [freshness] [weekly % change] ▲/▼
Source: [name + link]

Sensex [level] [freshness] [weekly % change] ▲/▼
Source: [name + link]
Bank Nifty [level] [freshness] [weekly % change] ▲/▼
Source: [name + link]
GIFT Nifty [level] [freshness] Gap: [type] ~[X] pts
Source: [name + link]
Weekly key levels:
Weekly resistance: [level]
Weekly support: [level]
200 DMA: 	[level]
Source: [name + link]
Nifty is [above / below] 200 DMA
What this means: [one plain line]
────────────────────────────────────
TAB 2 — GLOBAL MARKETS
────────────────────────────────────
US MARKETS
S&P 500 [level] [freshness] [% change] ▲/▼
Source: [name + link]
Dow Jones [level] [freshness] [% change] ▲/▼
Source: [name + link]
EUROPEAN MARKETS
FTSE 100 [level] [freshness] [% change] ▲/▼
Source: [name + link]
ASIAN MARKETS
Hang Seng [level] [freshness] [% change] ▲/▼
Source: [name + link]
Nikkei 225 [level] [freshness] [% change] ▲/▼
Source: [name + link]
Note: Asian markets show live price if open at
PROMPT_TIME. Otherwise show previous close.
Global mood: [Positive / Negative / Mixed]
What is driving this mood: [one plain line]
────────────────────────────────────
TAB 3 — SECTORS
────────────────────────────────────
All sectors ranked by weekly % change.

Green for gainers. Red for losers.
Source: [name + link] shown once at top of section.
Sector 	Weekly % Change
[Sector name] [% change] ▲/▼
(all sectors shown best to worst)
Top sector this week: [name] — [one line why]
Weakest sector this week: [name] — [one line why]
Where money is moving: [one plain line]
────────────────────────────────────
TAB 4 — FII FLOWS
────────────────────────────────────
FII = foreign investors.
DII = Indian mutual funds and institutions.
When FIIs sell and DIIs buy, markets stay supported.
When both sell together, expect sharper falls.
WEEKLY FLOW TABLE
Source: NSE India (nseindia.com/reports/fii-dii)
Day FII Net DII Net
Mon ₹[v]cr 	₹[v]cr
Tue ₹[v]cr 	₹[v]cr
Wed ₹[v]cr 	₹[v]cr
Thu ₹[v]cr 	₹[v]cr
Fri ₹[v]cr 	₹[v]cr
Total ₹[v]cr 	₹[v]cr
Last session breakdown:
FII cash net: ₹[v]cr [Bought / Sold]
FII futures net: ₹[v]cr [Bought / Sold]
FII options net: ₹[v]cr [Bought / Sold]
DII cash net: ₹[v]cr [Bought / Sold]
Source: [name + link]
What this means for next week: [two plain lines]
────────────────────────────────────
TAB 5 — COMMODITIES
────────────────────────────────────
USD/INR [rate] [freshness] [% change] ▲/▼
[one line: rupee impact on market]
Source: [name + link]

Brent $[v]/bbl [freshness] [% change] ▲/▼
[one line: impact on India]
Source: [name + link]
Gold MCX ₹[v]/10g [freshness] [% change] ▲/▼
Source: [name + link]
Silver MCX ₹[v]/kg [freshness] [% change] ▲/▼
Source: [name + link]
┌─────────────────────────────────┐
│ UPCOMING IPOs THIS MONTH 	│
│ [IPO Name] · Open: [dates] │
│ Expected premium: [%] or N/A │
│ Mainboard only. 	│
│ Source: NSE India (nseindia.com)│
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ CORPORATE ACTIONS THIS WEEK │
│ [Stock] · [Action type] 	│
│ Ex-date: [date] 	│
│ Source: NSE India (nseindia.com)│
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ BULK / BLOCK DEALS THIS WEEK │
│ [Stock] · [Buyer or Seller] │
│ Qty: [v] · Price: ₹[v] 	│
│ Source: NSE India (nseindia.com)│
└─────────────────────────────────┘
────────────────────────────────────
TAB 6 — NEWS
────────────────────────────────────
Major news from past 5 trading days.
Confirmed timestamps only.
Most important first within each category.
Every item has a direct link to the article.
DOMESTIC
[TAG] · [What happened — one line]
[Market impact — one line]
[Read the full article →](direct article URL)
Published: [timestamp] · Source: [publication]

GLOBAL
[TAG] · [What happened — one line]
[Market impact — one line]
[Read the full article →](direct article URL)
Published: [timestamp] · Source: [publication]
SECTOR
[TAG] · [What happened — one line]
[Sector affected — one line]
[Read the full article →](direct article URL)
Published: [timestamp] · Source: [publication]
CORPORATE
[TAG] · [What happened — one line]
[Stock affected — one line]
[Read the full article →](direct article URL)
Published: [timestamp] · Source: [publication]
If direct article URL unavailable:
"Link unavailable — search [headline] on
[source name]"
────────────────────────────────────
TAB 7 — VERDICT
────────────────────────────────────
Market is expected to [trend up / trend down /
consolidate] this week, bias [bullish / bearish /
neutral].
Key level to watch this week: [level]
If this level holds: [one line — what likely happens]
If this level breaks: [one line — what likely happens]
Confidence: High / Medium / Low
What this means for a swing trader:
[Two lines maximum in plain simple English explaining
what the trader should keep in mind this week.
No buy or sell calls. No position advice.
Just the weekly market context in simple words.]
═══════════════════════════════════════════════════════
ROUTE C — FULL REPORT
═══════════════════════════════════════════════════════

WHO THIS IS FOR:
Investors, researchers, and serious market
participants who want the complete picture —
all indices, all flows, all news, all context.
SEARCH SEQUENCE — run all searches from Route A
and Route B above following Step 1 to Step 4
for every number. Cite source for every number.
Plus these additional searches:
Search 13: Top 5 Nifty gainers last session
→ Web search: "Nifty top gainers [yesterday's date]"
→ Try: nseindia.com top gainers
→ Try: Moneycontrol Nifty gainers
→ Cite source
Search 14: Top 5 Nifty losers last session
→ Web search: "Nifty top losers [yesterday's date]"
→ Try: nseindia.com top losers
→ Try: Moneycontrol Nifty losers
→ Cite source
Search 15: Major stock news and market trends
→ Web search: "Nifty stock market news today
[today's date] impact"
→ Web search: "India market moving news
[today's date]"
→ Search across all sources listed above
→ Include all news that affects Nifty 50,
individual stocks, sectors, macro economy,
global markets, domestic policy, geopolitics,
company events, person-specific news,
industry-specific developments
→ For each item:
What happened: one line.
How it affects the market: one line.
[Read the full article →](direct article URL)
If URL unavailable: "Search [headline] on [source]"
→ Maximum 15 items total.
Search 16: Upcoming earnings calls
→ Web search: "India company earnings results
scheduled next 7 days [dates]"

→ Try: nseindia.com corporate filings
→ Try: Moneycontrol earnings calendar
→ Only if scheduled within next 7 days
→ Show: company, date, what to watch
→ Cite source
Search 17: Additional global indices
→ Web search: "Nasdaq live price now"
→ Web search: "DAX live price now"
→ Web search: "Shanghai composite live price now"
→ Web search: "DXY dollar index live now"
→ Web search: "US 10 year yield right now"
→ Try: Google Finance, Yahoo Finance for each
→ Cite source for each
→ Label [Live] or [Prev Close: DD MMM YYYY]
BUILD a 8-tab interactive widget inside Claude chat.
News and Verdict are in separate tabs.
No text or description outside the widget.
TABS: [Opening Brief] [Global Markets] [India Levels]
[F&O Pulse] [FII Flows] [Commodities & Actions]
[News] [Verdict]
────────────────────────────────────
TAB 1 — OPENING BRIEF
────────────────────────────────────
One line: how Nifty closed yesterday and weekly trend.
One line: what GIFT Nifty says about today's open.
One line: what global markets are signalling.
One line: overall market situation right now.
GIFT Nifty [level] [freshness]
Gap: [type] ~[X] pts
Source: [name + link]
Nifty 50 [level] [freshness] [% change] ▲/▼
Source: [name + link]
Sensex 	[level] [freshness] [% change] ▲/▼
Source: [name + link]
Bank Nifty [level] [freshness] [% change] ▲/▼
Source: [name + link]
India VIX [level] [freshness]
[Low = calm / Normal / Elevated = caution /
Extreme = high fear]

Source: [name + link]
────────────────────────────────────
TAB 2 — GLOBAL MARKETS
────────────────────────────────────
US MARKETS
S&P 500 [level] [freshness] [% change] ▲/▼
Source: [name + link]
Dow Jones [level] [freshness] [% change] ▲/▼
Source: [name + link]
Nasdaq [level] [freshness] [% change] ▲/▼
Source: [name + link]
EUROPEAN MARKETS
FTSE 100 [level] [freshness] [% change] ▲/▼
Source: [name + link]
DAX 	[level] [freshness] [% change] ▲/▼
Source: [name + link]
ASIAN MARKETS
Hang Seng [level] [freshness] [% change] ▲/▼
Source: [name + link]
Nikkei 225 [level] [freshness] [% change] ▲/▼
Source: [name + link]
Shanghai [level] [freshness] [% change] ▲/▼
Source: [name + link]
DXY Dollar Index: [level] [freshness] [% change] ▲/▼
Source: [name + link]
US 10Y Yield: [%] [freshness] [bps change] ▲/▼
Source: [name + link]
Global mood: [Positive / Negative / Mixed]
What is driving this mood: [one plain line]
────────────────────────────────────
TAB 3 — INDIA LEVELS
────────────────────────────────────
INDIAN INDICES
Nifty 50 [level] [freshness] [% change] ▲/▼
Source: [name + link]
Sensex [level] [freshness] [% change] ▲/▼
Source: [name + link]
Bank Nifty [level] [freshness] [% change] ▲/▼

Source: [name + link]
India VIX [level] [freshness] [signal]
Source: [name + link]
Previous day Nifty OHLC:
Open: [v] High: [v] Low: [v] Close: [v]
Source: NSE India (nseindia.com)
Candle: [type]
What it means: [one plain line]
Advance/Decline [Prev Close: DD MMM YYYY]:
Stocks that went up: [number] ▲
Stocks that went down: [number] ▼
What this means: [one plain line]
Source: [NSE India / BSE India + link]
Moving averages:
20 DMA: [level] [above / below] — [plain meaning]
Source: [name + link]
50 DMA: [level] [above / below] — [plain meaning]
Source: [name + link]
200 DMA: [level] [above / below] — [plain meaning]
Source: [name + link]
RSI(14): [reading] — [plain meaning]
Source: [name + link]
MACD(12,26,9):
Momentum: [positive / negative] — [plain meaning]
Source: [name + link]
Pivot levels:
R2 [level] · R1 [level] · Pivot [level]
S1 [level] · S2 [level]
Source: [name + link]
Weekly key levels:
Weekly resistance: [level]
Weekly support: [level]
Source: [name + link]
TOP GAINERS last session:
Stock · Price · % Gain
Source: [name + link]

TOP LOSERS last session:
Stock · Price · % Loss
Source: [name + link]
────────────────────────────────────
TAB 4 — F&O PULSE
────────────────────────────────────
F&O explained simply:
Options traders place bets at specific price levels.
Where they place the most bets becomes a magnet
for the market. These numbers show those levels.
PCR — Put Call Ratio: [reading] [freshness]
Source: NSE India Option Chain
(nseindia.com/option-chain)
Below 0.7 = more call bets = market may struggle
Between 0.7 and 1.0 = balanced bets
Above 1.0 = more put bets = market may hold or rise
Current reading means: [one plain line]
Max Pain: [level] [freshness]
Source: NSE India Option Chain
(nseindia.com/option-chain)
This is where most options expire worthless.
Market tends to move toward this level near expiry.
Top CE OI — where resistance may form:
Strike [level] — [contracts] — Change [▲/▼]
Strike [level] — [contracts] — Change [▲/▼]
Strike [level] — [contracts] — Change [▲/▼]
Source: NSE India Option Chain
(nseindia.com/option-chain)
Top PE OI — where support may form:
Strike [level] — [contracts] — Change [▲/▼]
Strike [level] — [contracts] — Change [▲/▼]
Strike [level] — [contracts] — Change [▲/▼]
Source: NSE India Option Chain
(nseindia.com/option-chain)
Today's expected range: [one line based on OI data]
If any F&O number used Moneycontrol instead:

"Source: Moneycontrol F&O (moneycontrol.com)"
────────────────────────────────────
TAB 5 — FII FLOWS
────────────────────────────────────
FII = foreign investors.
DII = Indian mutual funds and institutions.
When FIIs sell and DIIs buy, markets stay supported.
When both sell together, expect sharper falls.
WEEKLY FLOW TABLE
Source: NSE India (nseindia.com/reports/fii-dii)
Day FII Net DII Net
Mon ₹[v]cr 	₹[v]cr
Tue ₹[v]cr 	₹[v]cr
Wed ₹[v]cr 	₹[v]cr
Thu ₹[v]cr 	₹[v]cr
Fri ₹[v]cr 	₹[v]cr
Total ₹[v]cr 	₹[v]cr
Last session breakdown:
FII cash net: ₹[v]cr [Bought / Sold]
FII futures net: ₹[v]cr [Bought / Sold]
FII options net: ₹[v]cr [Bought / Sold]
DII cash net: ₹[v]cr [Bought / Sold]
Source: [name + link]
What this means: [two plain lines]
────────────────────────────────────
TAB 6 — COMMODITIES & ACTIONS
────────────────────────────────────
COMMODITIES
USD/INR [rate] [freshness] [% change] ▲/▼
[one line: rupee impact on market]
Source: [name + link]
Brent $[v]/bbl [freshness] [% change] ▲/▼
[one line: crude impact on India]
Source: [name + link]
WTI 	$[v]/bbl [freshness] [% change] ▲/▼
Source: [name + link]
Gold MCX ₹[v]/10g [freshness] [% change] ▲/▼
Source: [name + link]
Silver MCX ₹[v]/kg [freshness] [% change] ▲/▼

Source: [name + link]
SECTOR PERFORMANCE THIS WEEK
All sectors ranked by weekly % change.
Sector · Weekly % Change (green/red)
Source: [name + link]
┌─────────────────────────────────┐
│ UPCOMING IPOs 	│
│ [IPO Name] · Open: [dates] │
│ Expected premium: [%] or N/A │
│ Mainboard only. 	│
│ Source: NSE India (nseindia.com)│
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ CORPORATE ACTIONS THIS WEEK │
│ [Stock] · [Action] · [Ex-date] │
│ Source: NSE India (nseindia.com)│
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ BULK / BLOCK DEALS 	│
│ [Stock] · [Buyer or Seller] │
│ Qty: [v] · Price: ₹[v] 	│
│ Source: NSE India (nseindia.com)│
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ UPCOMING EARNINGS CALLS 	│
│ [Company] · [Date] 	│
│ What to watch: [one line] 	│
│ Source: [name + link] 	│
└─────────────────────────────────┘
────────────────────────────────────
TAB 7 — NEWS
────────────────────────────────────
All major news — today and past 5 trading days.
Every category. Most important first.
What happened and market impact — one line each.
No reproduced article text.
Every item must have a direct link to the article.

DOMESTIC MACRO
[What happened — one line]
[Market impact — one line]
[Read the full article →](direct article URL)
Published: [timestamp] · Source: [publication]
GLOBAL
[What happened — one line]
[Market impact — one line]
[Read the full article →](direct article URL)
Published: [timestamp] · Source: [publication]
SECTOR
[What happened — one line]
[Sector affected — one line]
[Read the full article →](direct article URL)
Published: [timestamp] · Source: [publication]
CORPORATE
[What happened — one line]
[Stock affected — one line]
[Read the full article →](direct article URL)
Published: [timestamp] · Source: [publication]
ALERT — most urgent items
[What happened — one line]
[Market impact — one line]
[Read the full article →](direct article URL)
Published: [timestamp] · Source: [publication]
If direct article URL unavailable:
"Link unavailable — search [headline] on
[source name]"
────────────────────────────────────
TAB 8 — VERDICT
────────────────────────────────────
TODAY:
Market is expected to [open gap up / open gap down /
open flat], bias [bullish / bearish / neutral].
Key level today: [level]
If holds: [one line — what likely happens]
If breaks: [one line — what likely happens]

THIS WEEK:
Market is expected to [trend up / trend down /
consolidate], bias [bullish / bearish / neutral].
Key level this week: [level]
If holds: [one line — what likely happens]
If breaks: [one line — what likely happens]
Overall confidence: High / Medium / Low
What this means overall:
[Three lines maximum in plain simple English.
Summarise the key market context for today and
the week ahead. No buy or sell calls.
No position advice. Just clear plain context
that any reader can understand immediately.]
═══════════════════════════════════════════════════════
MANDATORY DESIGN RULES — ALL ROUTES
═══════════════════════════════════════════════════════
Render entirely inside Claude chat as interactive widget.
Do not generate HTML file, app, or external page.
Tabs switch on click. No page reload.
No text or description of any kind outside the widget.
Everything visible to the user must be inside the tabs.
Green = positive / bullish.
Red = negative / bearish.
Amber = neutral / caution.
Every line: short and crisp. One sentence only.
No blank lines between data points within a section.
Every number must show its source name and link.
Every news item must have a direct clickable article link.
Every number must have its freshness label.
Info boxes use visual borders to stand apart clearly.
At the very bottom of every widget:
All sources used: [list every source with links]
Report generated at: [PROMPT_TIME in IST]
═══════════════════════════════════════════════════════
DISCLAIMER — TWO LINES BELOW EVERY WIDGET
═══════════════════════════════════════════════════════

This briefing is for education and market awareness only.
Not for trading or investment decisions.
Consult a SEBI-registered advisor before acting on
any information shown here.
═══════════════════════════════════════════════════════
END OF PROMPT
═══════════════════════════════════════════════════════
`;
