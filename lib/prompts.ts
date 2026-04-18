import type { TraderMode } from "@/types/report";

const BASE_PROMPT = `
You are generating a pre-market analysis report for India markets.
Follow the user-provided master prompt policy and route instructions exactly.
Return ONLY strict JSON (no markdown, no code fences, no prose outside JSON).
Every numeric/news item must include freshness and source fields.
Keep explanations short, plain English, one sentence where possible.
Do not invent source URLs. Use only valid official source domains.
If exact article URL is unavailable, provide source homepage URL and state this in text.
Prefer official exchange sources where applicable (NSE/BSE) before tertiary sources.
For Indian index metrics (Nifty, Sensex, Bank Nifty, India VIX), ensure NSE/BSE official citation is included.
When a LIVE_INDICES_SERVER_FETCH block appears below, treat its numbers as mandatory ground truth for those indices across the entire JSON (including verdict).
`;

const MODE_PROMPTS: Record<TraderMode, string> = {
  A: "Route A (Intraday): Build the 7-tab intraday report.",
  B: "Route B (Swing): Build the 7-tab swing report.",
  C: "Route C (Full Report): Build the 8-tab comprehensive report.",
};

export const REPORT_JSON_CONTRACT = `
{
  "mode": "A|B|C",
  "generatedAt": "ISO timestamp",
  "promptTimeIst": "HH:MM IST DD MMM YYYY",
  "sourcesUsed": [{ "name": "string", "url": "https://..." }],
  "sections": [
    {
      "id": "opening-brief",
      "title": "Opening Brief",
      "summary": "optional",
      "metrics": [
        {
          "label": "metric name",
          "value": "latest fetched value",
          "freshness": "[Live] | [Delayed HH:MM IST] | [Prev Close: DD MMM YYYY]",
          "change": "optional percentage or points",
          "tone": "positive|negative|neutral",
          "note": "optional",
          "source": { "name": "NSE India", "url": "https://..." }
        }
      ],
      "bullets": ["short line"],
      "news": [
        {
          "tag": "DOMESTIC",
          "happened": "short line",
          "impact": "short line",
          "publishedAt": "HH:MM IST DD MMM YYYY",
          "source": { "name": "Reuters", "url": "https://..." }
        }
      ]
    }
  ],
  "verdict": {
    "title": "Verdict",
    "bias": "bullish|bearish|neutral",
    "confidence": "High|Medium|Low",
    "bullets": ["short line", "short line"]
  },
  "disclaimer": [
    "This briefing is for education and market awareness only.",
    "Not for trading or investment decisions."
  ]
}
`;

export function buildPrompt(mode: TraderMode, masterPrompt: string, liveIndicesAppendix: string): string {
  const nowIst = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour12: false,
  });

  return `
${BASE_PROMPT}
Current IST timestamp (ground truth): ${nowIst}
Critical freshness rule: reject any stale historical value that is not relevant to current session.
Do not reuse static examples. Use newly fetched data only.

${liveIndicesAppendix.trim()}

Master Prompt:
${masterPrompt}

Selected Mode:
${MODE_PROMPTS[mode]}

Output Contract (strict JSON required):
${REPORT_JSON_CONTRACT}
`;
}
