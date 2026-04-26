import { z } from "zod";

export const strategySnapshotSchema = z.object({
  script: z.string().min(1),
  duration: z.string().min(1),
  expiry: z.string().min(1),
  entryDate: z.string().min(1),
  entryTime: z.string().min(1),
  target: z.string().min(1),
  stopLoss: z.string().min(1),
  /** Optional extra rows from strategy sheets (e.g. debit/credit caps). */
  debitOnDownside: z.string().min(1).optional(),
  maxCredit: z.string().min(1).optional(),
});

export const strategyStrikeLegSchema = z.object({
  label: z.string().min(1),
  distanceFromSpot: z.string().min(1),
  optionType: z.enum(["CE", "PE"]),
  weight: z.string().min(1),
  side: z.enum(["Buy", "Sell"]),
});

export const strategyCatalogEntrySchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  category: z.string().min(1),
  thumbnailUrl: z.string().min(1).optional(),
  riskLevel: z.enum(["Low", "Medium", "High"]).optional(),
});

export const strategyCatalogSchema = z.object({
  strategies: z.array(strategyCatalogEntrySchema),
});

export const strategyDetailSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  category: z.string().min(1),
  riskLevel: z.enum(["Low", "Medium", "High"]).optional(),
  /** Short callout shown under snapshot (risk-first framing). */
  riskFirstNote: z.string().min(1).optional(),
  snapshot: strategySnapshotSchema,
  image: z.object({
    src: z.string().min(1),
    alt: z.string().min(1),
  }),
  strikeSelection: z.array(strategyStrikeLegSchema).min(1),
  rules: z.array(z.string().min(1)).min(1),
  riskNotes: z.array(z.string().min(1)).min(1),
  disclaimer: z.array(z.string().min(1)).min(1),
});

export type StrategyCatalog = z.infer<typeof strategyCatalogSchema>;
export type StrategyCatalogEntry = z.infer<typeof strategyCatalogEntrySchema>;
export type StrategyDetail = z.infer<typeof strategyDetailSchema>;
