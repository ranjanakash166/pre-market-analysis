import { z } from "zod";

export const traderModeSchema = z.enum(["A", "B", "C"]);

const sourceLinkSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
});

const metricSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
  freshness: z.string().min(1),
  change: z.string().optional(),
  tone: z.enum(["positive", "negative", "neutral"]),
  note: z.string().optional(),
  source: sourceLinkSchema,
});

const newsItemSchema = z.object({
  tag: z.string().min(1),
  happened: z.string().min(1),
  impact: z.string().min(1),
  publishedAt: z.string().min(1),
  source: sourceLinkSchema,
});

const reportSectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().optional(),
  metrics: z.array(metricSchema).default([]),
  bullets: z.array(z.string()).default([]),
  news: z.array(newsItemSchema).default([]),
});

export const generatedReportSchema = z.object({
  mode: traderModeSchema,
  generatedAt: z.string().min(1),
  promptTimeIst: z.string().min(1),
  sourcesUsed: z.array(sourceLinkSchema),
  sections: z.array(reportSectionSchema).min(1),
  verdict: z.object({
    title: z.string().min(1),
    bias: z.enum(["bullish", "bearish", "neutral"]),
    confidence: z.enum(["High", "Medium", "Low"]),
    bullets: z.array(z.string()).min(1),
  }),
  disclaimer: z.array(z.string()).min(2),
});

export const storedReportSchema = z.object({
  report: generatedReportSchema,
  updatedAt: z.string().min(1),
});

export type GeneratedReportSchema = z.infer<typeof generatedReportSchema>;
