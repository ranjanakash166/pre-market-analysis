/**
 * Regenerate lib/master-prompt-holy-grail.ts from lib/master-prompt-holy-grail.md
 * after editing the markdown canonical prompt.
 * Usage: node scripts/embed-holy-grail-md.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const mdPath = path.join(repoRoot, "lib", "master-prompt-holy-grail.md");
const tsPath = path.join(repoRoot, "lib", "master-prompt-holy-grail.ts");

const body = fs.readFileSync(mdPath, "utf8").replace(/\r\n/g, "\n").trimEnd() + "\n";
const escaped = body.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");

fs.writeFileSync(
  tsPath,
  `/** Canonical Holy Grail master text. Edit master-prompt-holy-grail.md then run: node scripts/embed-holy-grail-md.mjs */\n` +
    `export const HOLY_GRAIL_BODY = \`${escaped}\`;\n`,
  "utf8",
);

console.log("Wrote", tsPath, "from", mdPath, "chars", body.length);
