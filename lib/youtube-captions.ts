/**
 * YouTube captions → plain text (no API key).
 * Uses `youtube-transcript` (InnerTube + caption XML) for reliable fetches.
 */

import { YoutubeTranscript } from "youtube-transcript";

export function parseYouTubeVideoId(input: string): string | null {
  const trimmed = input.trim();
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];
  const vMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (vMatch) return vMatch[1];
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  return null;
}

function mergeCaptionLines(parts: string[]): string {
  const lines: string[] = [];
  for (const p of parts) {
    const cleaned = p.replace(/\s+/g, " ").trim();
    if (!cleaned) continue;
    if (!lines.length) {
      lines.push(cleaned);
      continue;
    }
    const prev = lines[lines.length - 1];
    if (/[.!?…]$/.test(prev) || /^[A-Z(]/.test(cleaned)) {
      lines.push(cleaned);
    } else {
      lines[lines.length - 1] = `${prev} ${cleaned}`.trim();
    }
  }
  return lines.join("\n\n");
}

export type FetchYouTubeTranscriptResult = {
  text: string;
  languageCode?: string;
};

/**
 * Prefers English captions when available; otherwise uses the first track the library returns.
 */
export async function fetchYouTubeTranscript(videoId: string): Promise<FetchYouTubeTranscriptResult> {
  let items: { text: string; lang?: string }[];
  try {
    items = await YoutubeTranscript.fetchTranscript(videoId, { lang: "en" });
  } catch {
    items = await YoutubeTranscript.fetchTranscript(videoId);
  }

  const lang = items[0]?.lang;
  const text = mergeCaptionLines(items.map((i) => i.text));
  if (!text.trim()) {
    throw new Error("Caption track was empty after decode");
  }
  return { text, languageCode: lang };
}
