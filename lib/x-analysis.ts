import { z } from "zod";
import { describeActiveAiModel, generateJsonTextFromPrompt } from "@/lib/ai";
import {
  completeAnalysisRun,
  createAnalysisRun,
  ensureAnalysisTemplate,
  insertAnalysisOutput,
  loadRecentTweetTexts,
} from "@/lib/x-repo";

const xFeedAnalysisPayloadSchema = z.object({
  summary: z.string(),
  sentiment: z.enum(["risk_off", "neutral", "risk_on"]),
  themes: z.array(z.string()).max(24),
  risks: z.array(z.string()).max(24),
  tradingIdeas: z.array(z.string()).max(24),
  citedTweetIds: z.array(z.string()),
});

export type XFeedAnalysisPayload = z.infer<typeof xFeedAnalysisPayloadSchema>;

function buildBatchPrompt(handle: string, tweets: { tweetId: string; createdAt: string; text: string }[]): string {
  const lines = tweets
    .slice()
    .reverse()
    .map((t) => `- (${t.createdAt}) [${t.tweetId}] ${t.text.replace(/\s+/g, " ").trim()}`);
  return `You are Twickers — an assistant that reads curated X accounts for market-aware traders.

Account: @${handle}

Below are recent posts (oldest→newest within this window). Infer cross-post context; avoid inventing instruments or catalysts not supported by the text.

POSTS:
${lines.join("\n")}

TASK:
Return ONE JSON object only (no markdown fences) matching this schema:
{
  "summary": string (compact paragraph),
  "sentiment": "risk_off" | "neutral" | "risk_on" (markets tone implied by posts),
  "themes": string[] (up to 8 concise themes),
  "risks": string[] (explicit risk factors mentioned or clearly implied),
  "tradingIdeas": string[] (hypothesis-level ideas — not instructions; emphasize uncertainty),
  "citedTweetIds": string[] (subset of tweet ids from this prompt that materially informed your synthesis)
}

Rules:
- Never promise returns or certainty.
- If posts are ambiguous, use "neutral" and shorter lists.
- citedTweetIds must only include ids that appear above.
`;
}

export async function runBatchAnalysisForAccount(accountId: string, handle: string): Promise<{ outputId: string } | null> {
  const tweets = await loadRecentTweetTexts(accountId, 40);
  if (tweets.length === 0) return null;

  const { id: templateId } = await ensureAnalysisTemplate();
  const tweetIds = tweets.map((t) => t.tweetId);
  const modelLabel = describeActiveAiModel();
  const runId = await createAnalysisRun({
    templateId,
    accountId,
    tweetIds,
    modelLabel,
  });

  try {
    const prompt = buildBatchPrompt(handle, tweets);
    const jsonText = await generateJsonTextFromPrompt(prompt);
    const parsed: unknown = JSON.parse(jsonText);
    const normalized = xFeedAnalysisPayloadSchema.safeParse(parsed);

    const payload: unknown = normalized.success
      ? normalized.data
      : {
          raw: parsed,
          parseError: "Payload did not match Twickers X-feed schema.",
        };

    const outputId = await insertAnalysisOutput({
      runId,
      accountId,
      payload,
      schemaVersion: 1,
      tweetIds,
    });

    await completeAnalysisRun(runId, { status: normalized.success ? "ok" : "partial" });

    return { outputId };
  } catch (e) {
    await completeAnalysisRun(runId, { status: "error" });
    throw e;
  }
}
