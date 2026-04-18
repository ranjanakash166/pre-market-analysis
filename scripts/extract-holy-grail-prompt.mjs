/**
 * Extract Pre Market analysis.pdf → lib/master-prompt-holy-grail.md (+ .ts).
 * Strips page-number footers only; preserves full canonical wording (incl. opening gate, web search).
 * Then run embed: same script chains to master-prompt-holy-grail.ts
 *
 * Usage: node scripts/extract-holy-grail-prompt.mjs <path-to.pdf>
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PDFParse } from "pdf-parse";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const pdfPath =
  process.argv[2] ?? path.join(process.env.HOME ?? "", "Downloads", "Pre Market analysis.pdf");

const buf = fs.readFileSync(pdfPath);
const parser = new PDFParse({ data: buf });
const { text } = await parser.getText();
await parser.destroy();

let body = text.replace(/\r\n/g, "\n");
body = body.replace(/^-- \d+ of \d+ --\s*$/gm, "");
body = body.replace(/\n{3,}/g, "\n\n");
body = body.trim() + "\n";

const outMd = path.join(repoRoot, "lib", "master-prompt-holy-grail.md");
fs.writeFileSync(outMd, body, "utf8");

const escaped = body.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
const outTs = path.join(repoRoot, "lib", "master-prompt-holy-grail.ts");
fs.writeFileSync(
  outTs,
  `/** Canonical Holy Grail from PDF. Regenerate: \`node scripts/extract-holy-grail-prompt.mjs <path-to.pdf>\`. */\n` +
    `export const HOLY_GRAIL_BODY = \`${escaped}\`;\n`,
  "utf8",
);

console.log("Wrote", outMd, "and", outTs, "chars", body.length);
