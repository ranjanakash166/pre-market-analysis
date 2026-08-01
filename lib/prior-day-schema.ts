import { z } from "zod";

/** One trading-day prior analysis (Sensibull English fields; YouTube omitted). */
export const priorDayAnalysisSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().min(1),
  chart: z.string().default(""),
  openInterest: z.string().default(""),
  pcr: z.string().default(""),
  participantOptionsData: z.string().default(""),
  fiiFuturesData: z.string().default(""),
  fiiStockData: z.string().default(""),
  verdict: z.string().default(""),
  trades: z.string().default(""),
});

export const priorDayCatalogSchema = z.object({
  updatedAt: z.string().min(1),
  source: z.literal("sensibull"),
  days: z.array(priorDayAnalysisSchema).max(6),
});

export type PriorDayAnalysis = z.infer<typeof priorDayAnalysisSchema>;
export type PriorDayCatalog = z.infer<typeof priorDayCatalogSchema>;
