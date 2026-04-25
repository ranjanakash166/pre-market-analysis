/**
 * Generate a structured course JSON from a YouTube URL (captions + Gemini).
 *
 * Usage:
 *   npm run learn:generate -- --url https://www.youtube.com/watch?v=VIDEO_ID
 *
 * Requires AI_API_KEY or GEMINI_API_KEY in the environment (or .env.local at repo root).
 */

import { readFileSync } from "node:fs";
import { writeFile, readFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { courseCatalogSchema, generatedCourseSchema } from "../lib/learn-schema";
import { generateCourseFromTranscript } from "../lib/learn-gemini";
import { fetchYouTubeTranscript, parseYouTubeVideoId } from "../lib/youtube-captions";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");

function loadEnvLocal(): void {
  const p = join(repoRoot, ".env.local");
  try {
    const raw = readFileSync(p, "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // optional file
  }
}

function parseArgs(argv: string[]): { url?: string } {
  const out: { url?: string } = {};
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--url" && argv[i + 1]) {
      out.url = argv[++i];
    }
  }
  return out;
}

type OEmbed = {
  title?: string;
  thumbnail_url?: string;
  author_name?: string;
};

async function fetchOEmbed(watchUrl: string): Promise<OEmbed> {
  const u = new URL("https://www.youtube.com/oembed");
  u.searchParams.set("url", watchUrl);
  u.searchParams.set("format", "json");
  const res = await fetch(u.toString());
  if (!res.ok) return {};
  return (await res.json()) as OEmbed;
}

async function main(): Promise<void> {
  loadEnvLocal();
  const { url } = parseArgs(process.argv);
  if (!url?.trim()) {
    console.error("Usage: npm run learn:generate -- --url <youtube_watch_url>");
    process.exit(1);
  }
  const videoId = parseYouTubeVideoId(url);
  if (!videoId) {
    console.error("Could not parse YouTube video id from URL");
    process.exit(1);
  }

  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  console.error(`Fetching oEmbed + captions for ${videoId}…`);
  const [oembed, { text: transcript }] = await Promise.all([fetchOEmbed(watchUrl), fetchYouTubeTranscript(videoId)]);

  console.error(`Transcript length: ${transcript.length} chars (${oembed.title ?? "no title"})`);
  console.error("Calling Gemini…");

  let course = await generateCourseFromTranscript({
    videoId,
    sourceVideoUrl: watchUrl,
    transcript,
    oEmbedTitle: oembed.title,
  });

  course = generatedCourseSchema.parse({
    ...course,
    videoId,
    sourceVideoUrl: watchUrl,
  });

  const outDir = join(repoRoot, "content", "courses");
  await mkdir(outDir, { recursive: true });
  const coursePath = join(outDir, `${videoId}.json`);
  await writeFile(coursePath, `${JSON.stringify(course, null, 2)}\n`, "utf8");
  console.error(`Wrote ${coursePath}`);

  const indexPath = join(outDir, "index.json");
  let catalog = {
    courses: [] as { videoId: string; category: string; title: string; summary?: string; thumbnailUrl?: string }[],
  };
  try {
    const existing = await readFile(indexPath, "utf8");
    catalog = courseCatalogSchema.parse(JSON.parse(existing));
  } catch {
    // fresh catalog
  }

  const thumb = oembed.thumbnail_url;
  const others = catalog.courses.filter((c) => c.videoId !== videoId);
  others.push({
    videoId,
    category: "Option Selling",
    title: course.title,
    summary: course.summary,
    thumbnailUrl: thumb,
  });
  others.sort((a, b) => a.title.localeCompare(b.title));
  const nextCatalog = courseCatalogSchema.parse({ courses: others });
  await writeFile(indexPath, `${JSON.stringify(nextCatalog, null, 2)}\n`, "utf8");
  console.error(`Updated ${indexPath}`);
  console.error("Done.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
