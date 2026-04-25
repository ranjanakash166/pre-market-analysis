import { GoogleGenAI } from "@google/genai";
import { generatedCourseSchema, type GeneratedCourse } from "./learn-schema";

function getGeminiApiKey(): string {
  const k = process.env.AI_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim();
  if (!k) {
    throw new Error("Set AI_API_KEY or GEMINI_API_KEY to generate courses with Gemini.");
  }
  return k;
}

function geminiModelId(): string {
  return process.env.AI_MODEL?.trim() || process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
}

function extractJsonObjectText(raw: string): string {
  let t = raw.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  }
  return t;
}

const COURSE_JSON_CONTRACT = `You must output ONE JSON object only (no markdown fences) with this exact shape:
{
  "videoId": string (11 chars),
  "title": string (course title, clear and specific),
  "subtitle": string optional (one line),
  "summary": string (2-4 sentences overview of the course),
  "learningObjectives": string[] (4-8 measurable objectives; grounded in the transcript),
  "modules": [
    {
      "id": string (slug-like, unique within course, e.g. "m1-context"),
      "title": string,
      "summary": string optional (one sentence),
      "paragraphs": string[] (each item is 2-6 sentences of teaching copy; no bullet characters inside strings unless essential),
      "anchors": [{ "label": string, "seconds": number }] optional (only if you can approximate from transcript timing cues)
    }
  ],
  "keyTakeaways": string[] (5-12 short bullets),
  "disclaimer": string[] (2-4 items: caption-derived content may miss nuance; not financial advice; verify with primary sources),
  "tags": string[] optional (topics),
  "estimatedMinutes": number optional (rough viewing/reading time),
  "sourceVideoUrl": string (full https watch URL)
}

Rules:
- Ground every teaching claim in the TRANSCRIPT. Do not invent statistics, regulations, or personal facts not spoken.
- You may reorganize and clarify for readability (course structure), but do not add unrelated topics.
- India/markets context: keep terminology consistent with what the speaker used.
- Use neutral, educational tone.`;

export async function generateCourseFromTranscript(input: {
  videoId: string;
  sourceVideoUrl: string;
  transcript: string;
  oEmbedTitle?: string;
}): Promise<GeneratedCourse> {
  const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
  const model = geminiModelId();

  const header = input.oEmbedTitle ? `Suggested video title (from YouTube): ${input.oEmbedTitle}\n\n` : "";

  const prompt = `${header}${COURSE_JSON_CONTRACT}

videoId: ${input.videoId}
sourceVideoUrl: ${input.sourceVideoUrl}

TRANSCRIPT (caption-derived):
---
${input.transcript.slice(0, 1_200_000)}
---
`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      temperature: 0.25,
    },
  });

  const text = response.text;
  if (!text) throw new Error("Gemini returned empty response for course generation");

  const jsonText = extractJsonObjectText(text);
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("Gemini course output was not valid JSON");
  }

  return generatedCourseSchema.parse(parsed);
}
