import { readFile } from "fs/promises";
import { join } from "path";
import { strategyCatalogSchema, strategyDetailSchema } from "@/lib/strategy-schema";
import type { StrategyCatalog, StrategyDetail } from "@/lib/strategy-schema";

const strategiesDir = () => join(process.cwd(), "content", "strategies");

export async function loadStrategyCatalog(): Promise<StrategyCatalog> {
  const raw = await readFile(join(strategiesDir(), "index.json"), "utf8");
  return strategyCatalogSchema.parse(JSON.parse(raw));
}

export async function loadStrategy(slug: string): Promise<StrategyDetail> {
  const raw = await readFile(join(strategiesDir(), `${slug}.json`), "utf8");
  return strategyDetailSchema.parse(JSON.parse(raw));
}
