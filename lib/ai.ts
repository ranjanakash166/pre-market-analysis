import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import { buildPrompt } from "@/lib/prompts";
import { enrichReportWithComputedPivotLevels } from "@/lib/levels-enrich";
import {
  buildLiveIndicesPromptAppendix,
  enrichReportWithLiveIndices,
  fetchLiveMarketData,
} from "@/lib/market-data";
import { generatedReportSchema } from "@/lib/schema";
import { MASTER_PROMPT } from "@/lib/master-prompt";
import { verifyAndNormalizeReport } from "@/lib/verification";
import type { GeneratedReport, TraderMode } from "@/types/report";

export type AiBackend = "google" | "anthropic";

function getAnthropicApiKey(): string | undefined {
  const k =
    process.env.ANTHROPIC_API_KEY?.trim() ||
    process.env.CLAUDE_API_KEY?.trim() ||
    process.env.AI_ANTHROPIC_API_KEY?.trim();
  return k || undefined;
}

/**
 * Chooses LLM backend:
 * - Explicit `AI_PROVIDER=google|gemini` → Google only.
 * - Explicit `AI_PROVIDER=anthropic|claude` → Anthropic only (needs key).
 * - Otherwise: Anthropic if any Anthropic key env is set, else Google if `AI_API_KEY` / `GEMINI_API_KEY` is set, else Anthropic (will error with a clear message if no keys at all).
 */
function resolveAiBackend(): AiBackend {
  const raw = (process.env.AI_PROVIDER ?? process.env.AI_BACKEND)?.toLowerCase().trim();
  if (raw === "google" || raw === "gemini") return "google";
  if (raw === "anthropic" || raw === "claude") return "anthropic";

  if (getAnthropicApiKey()) return "anthropic";
  if (process.env.AI_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim()) return "google";
  return "anthropic";
}

function getGoogleClient(): GoogleGenAI {
  const apiKey = process.env.AI_API_KEY ?? process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing AI_API_KEY (or legacy GEMINI_API_KEY) for Google provider");
  }
  return new GoogleGenAI({ apiKey });
}

function googleModelId(): string {
  return process.env.AI_MODEL ?? process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
}

/** Strip optional ```json fences so JSON.parse succeeds for both providers. */
function extractJsonObjectText(raw: string): string {
  let t = raw.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  }
  return t;
}

async function generateJsonFromAnthropic(fullPrompt: string): Promise<string> {
  const apiKey = getAnthropicApiKey();
  if (!apiKey) {
    throw new Error(
      "Missing Anthropic API key: set ANTHROPIC_API_KEY (or CLAUDE_API_KEY) in .env.local, or set AI_PROVIDER=google and keep AI_API_KEY / GEMINI_API_KEY for Gemini.",
    );
  }
  // Default tracks Anthropic’s current Sonnet; dated IDs (e.g. claude-sonnet-4-20250514) may 404 when retired.
  const model =
    process.env.ANTHROPIC_MODEL?.trim() ||
    process.env.CLAUDE_MODEL?.trim() ||
    "claude-sonnet-4-6";

  const client = new Anthropic({
    apiKey,
    timeout: 900_000,
    maxRetries: 4,
  });

  try {
    const message = await client.messages.create(
      {
        model,
        max_tokens: 16_384,
        temperature: 0.2,
        system:
          "You output ONLY one valid JSON object matching the user contract. No markdown, no code fences, no text before or after the JSON.",
        messages: [{ role: "user", content: fullPrompt }],
      },
      { timeout: 900_000 },
    );

    const block = message.content[0];
    if (!block || block.type !== "text") {
      throw new Error("Anthropic returned no text block");
    }
    return block.text;
  } catch (err) {
    throw new Error(
      `Anthropic request failed (${formatProviderError(err)}). If this repeats, try a faster model (e.g. claude-haiku-4-5), check VPN/firewall, or use AI_PROVIDER=google.`,
    );
  }
}

async function generateJsonFromGoogle(fullPrompt: string): Promise<string> {
  const ai = getGoogleClient();
  const model = googleModelId();
  const response = await ai.models.generateContent({
    model,
    contents: fullPrompt,
    config: {
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  });
  const text = response.text;
  if (!text) {
    throw new Error("The AI model returned an empty response");
  }
  return text;
}

function extractDates(text: string): Date[] {
  const matches = text.match(/\b(\d{1,2})\s([A-Za-z]{3,9})\s(\d{4})\b/g) ?? [];
  return matches
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()));
}

function hasStaleHistoricalDates(report: GeneratedReport): boolean {
  const now = new Date();
  const maxAgeMs = 45 * 24 * 60 * 60 * 1000;
  const fields: string[] = [report.promptTimeIst];

  fields.push(...report.verdict.bullets);
  for (const section of report.sections) {
    fields.push(section.summary ?? "");
    fields.push(...section.bullets);
    for (const metric of section.metrics) {
      fields.push(metric.value, metric.freshness, metric.note ?? "");
    }
    // Do not scan news timestamps: older articles are valid and would force a wasteful second LLM pass.
  }

  const allDates = fields.flatMap(extractDates);
  return allDates.some((date) => now.getTime() - date.getTime() > maxAgeMs);
}

function formatProviderError(err: unknown): string {
  if (!(err instanceof Error)) return String(err);
  const base = err.message || "Unknown error";
  const c = err.cause;
  const causeMsg = c instanceof Error ? c.message : c != null ? String(c) : "";
  if (causeMsg && !base.toLowerCase().includes(causeMsg.toLowerCase().slice(0, 40))) {
    return `${base} — cause: ${causeMsg}`;
  }
  return base;
}

function normalizeTone(raw: unknown): "positive" | "negative" | "neutral" {
  const value = String(raw ?? "").toLowerCase().trim();
  if (value === "positive" || value === "bullish" || value === "up" || value === "green") {
    return "positive";
  }
  if (value === "negative" || value === "bearish" || value === "down" || value === "red") {
    return "negative";
  }
  return "neutral";
}

function normalizeParsedReport(raw: unknown, mode: TraderMode): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const report = raw as Record<string, unknown>;
  const sections = Array.isArray(report.sections) ? report.sections : [];

  const normalizedSections = sections.map((section) => {
    if (!section || typeof section !== "object") return section;
    const s = section as Record<string, unknown>;
    const metrics = Array.isArray(s.metrics) ? s.metrics : [];

    return {
      ...s,
      bullets: Array.isArray(s.bullets) ? s.bullets : [],
      metrics: metrics.map((metric) => {
        if (!metric || typeof metric !== "object") return metric;
        const m = metric as Record<string, unknown>;
        return {
          ...m,
          tone: normalizeTone(m.tone),
        };
      }),
      news: Array.isArray(s.news) ? s.news : [],
    };
  });

  const verdictCandidate = report.verdict;
  const verdict =
    verdictCandidate && typeof verdictCandidate === "object"
      ? (() => {
          const v = verdictCandidate as Record<string, unknown>;
          const rawBias = String(v.bias ?? "neutral").toLowerCase();
          const bias = rawBias === "bullish" || rawBias === "bearish" || rawBias === "neutral" ? rawBias : "neutral";
          const confidenceRaw = String(v.confidence ?? "Medium");
          const confidence = confidenceRaw === "High" || confidenceRaw === "Medium" || confidenceRaw === "Low" ? confidenceRaw : "Medium";
          return {
            title: String(v.title ?? "Verdict"),
            bias,
            confidence,
            bullets: Array.isArray(v.bullets) && v.bullets.length > 0 ? v.bullets : ["Context only. Verify key levels before action."],
          };
        })()
      : {
          title: "Verdict",
          bias: "neutral",
          confidence: "Medium",
          bullets: ["Context only. Verify key levels before action."],
        };

  return {
    ...report,
    mode: report.mode ?? mode,
    generatedAt: report.generatedAt ?? new Date().toISOString(),
    promptTimeIst:
      report.promptTimeIst ??
      new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour12: false,
      }),
    sections: normalizedSections,
    verdict,
    disclaimer:
      Array.isArray(report.disclaimer) && report.disclaimer.length >= 2
        ? report.disclaimer
        : [
            "This briefing is for education and market awareness only.",
            "Not for trading or investment decisions.",
          ],
  };
}

async function callAiModel(mode: TraderMode, liveAppendix: string, retryHint?: string): Promise<GeneratedReport> {
  const promptBase = buildPrompt(mode, MASTER_PROMPT, liveAppendix);
  const prompt = retryHint ? `${promptBase}\n\n${retryHint}` : promptBase;

  const backend = resolveAiBackend();
  const rawText =
    backend === "anthropic" ? await generateJsonFromAnthropic(prompt) : await generateJsonFromGoogle(prompt);

  const jsonText = extractJsonObjectText(rawText);
  let parsedUnknown: unknown;
  try {
    parsedUnknown = JSON.parse(jsonText);
  } catch {
    throw new Error(
      backend === "anthropic"
        ? "Anthropic response was not valid JSON. Try a larger model or shorten the prompt contract."
        : "Model response was not valid JSON",
    );
  }

  const parsed = normalizeParsedReport(parsedUnknown, mode);
  return generatedReportSchema.parse(parsed);
}

async function finalizeEnrichedReport(
  report: GeneratedReport,
  live: Awaited<ReturnType<typeof fetchLiveMarketData>>,
): Promise<GeneratedReport> {
  const withLive = enrichReportWithLiveIndices(report, live);
  const withPivots = await enrichReportWithComputedPivotLevels(withLive);
  return verifyAndNormalizeReport(withPivots);
}

export async function generateReport(mode: TraderMode): Promise<GeneratedReport> {
  let live = await fetchLiveMarketData();
  const firstPass = await callAiModel(mode, buildLiveIndicesPromptAppendix(live));
  const firstPassEnriched = enrichReportWithLiveIndices(firstPass, live);
  if (!hasStaleHistoricalDates(firstPassEnriched)) {
    return finalizeEnrichedReport(firstPass, live);
  }

  const retryHint = `
CRITICAL CORRECTION:
Your previous output appears stale. Regenerate with fresh current-market values only.
Do not include dates older than 45 days anywhere unless explicitly required and clearly marked with freshness.
If fresh data is unavailable, return N/A with source link instead of old values.
`;

  live = await fetchLiveMarketData();
  const secondPass = await callAiModel(mode, buildLiveIndicesPromptAppendix(live), retryHint);
  const secondPassEnriched = enrichReportWithLiveIndices(secondPass, live);
  if (hasStaleHistoricalDates(secondPassEnriched)) {
    throw new Error("Generated report still contains stale historical data. Please retry.");
  }
  return finalizeEnrichedReport(secondPass, live);
}
