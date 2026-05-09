import { z } from "zod";
import type { TradeJournalFilters } from "@/types/trading-journal";

export const tradeInstrumentTypeSchema = z.enum(["equity", "futures", "options"]);
export const tradeSideSchema = z.enum(["long", "short"]);
export const tradeStatusSchema = z.enum(["open", "closed"]);

const optionalTextSchema = z
  .string()
  .trim()
  .max(2000)
  .transform((value) => value || null)
  .nullable()
  .optional();

const optionalShortTextSchema = z
  .string()
  .trim()
  .max(120)
  .transform((value) => value || null)
  .nullable()
  .optional();

const positiveNumberSchema = z.coerce.number().finite().positive();
const optionalPositiveNumberSchema = z.coerce.number().finite().positive().nullable().optional();
const optionalNonNegativeNumberSchema = z.coerce.number().finite().min(0).nullable().optional();
const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected date in YYYY-MM-DD format.");

export const tradeJournalEntryInputSchema = z
  .object({
    tradeDate: isoDateSchema,
    exitDate: isoDateSchema.nullable().optional(),
    symbol: z.string().trim().min(1).max(40).transform((value) => value.toUpperCase()),
    instrumentType: tradeInstrumentTypeSchema,
    side: tradeSideSchema,
    quantity: positiveNumberSchema,
    entryPrice: positiveNumberSchema,
    exitPrice: optionalPositiveNumberSchema,
    stopLoss: optionalPositiveNumberSchema,
    targetPrice: optionalPositiveNumberSchema,
    fees: optionalNonNegativeNumberSchema,
    broker: optionalShortTextSchema,
    setupTag: optionalShortTextSchema,
    entryReason: optionalTextSchema,
    exitReason: optionalTextSchema,
    mistakes: optionalTextSchema,
    lessons: optionalTextSchema,
    status: tradeStatusSchema,
  })
  .superRefine((value, ctx) => {
    if (value.status === "closed" && value.exitPrice == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["exitPrice"],
        message: "Exit price is required for closed trades.",
      });
    }

    if (value.status === "open" && value.exitPrice != null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["exitPrice"],
        message: "Open trades cannot have an exit price.",
      });
    }

    if (value.status === "closed" && value.exitDate == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["exitDate"],
        message: "Exit date is required for closed trades.",
      });
    }

    if (value.status === "open" && value.exitDate != null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["exitDate"],
        message: "Open trades cannot have an exit date.",
      });
    }

    if (value.exitDate && value.exitDate < value.tradeDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["exitDate"],
        message: "Exit date cannot be before trade date.",
      });
    }
  });

export const tradeJournalEntryPatchSchema = tradeJournalEntryInputSchema.partial();

export const tradeJournalFiltersSchema = z.object({
  status: z.enum(["all", "open", "closed"]).default("all"),
  instrumentType: z.enum(["all", "equity", "futures", "options"]).default("all"),
  setupTag: z.string().trim().max(120).optional().transform((value) => value || undefined),
  search: z.string().trim().max(120).optional().transform((value) => value || undefined),
});

export function normalizeTradeJournalFilters(raw: Record<string, string | undefined>): TradeJournalFilters {
  const parsed = tradeJournalFiltersSchema.parse(raw);
  return {
    status: parsed.status,
    instrumentType: parsed.instrumentType,
    setupTag: parsed.setupTag,
    search: parsed.search,
  };
}

export type TradeJournalEntryInput = z.infer<typeof tradeJournalEntryInputSchema>;
export type TradeJournalEntryPatch = z.infer<typeof tradeJournalEntryPatchSchema>;
