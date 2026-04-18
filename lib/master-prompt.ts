import { HOLY_GRAIL_BODY } from "./master-prompt-holy-grail";

/**
 * API/runtime layer prepended to the full canonical Holy Grail text.
 * The body matches the PDF / desktop prompt; overrides here resolve JSON-only, no-chat workflow.
 */
const MASTER_PROMPT_API_ADAPTER = `
=== API RUNTIME OVERRIDES (read first; these supersede conflicting instructions below) ===

The application has already selected trader mode A, B, or C. Ignore the "CRITICAL INSTRUCTION" block that asks for only the opening question: do NOT print the greeting, do NOT wait for a reply, and do NOT stop after the question. Generate the full report for the selected mode immediately.

Output: ONE JSON object only, matching the Output Contract supplied later in the prompt. No HTML document, no Claude chat-only interactive widget, no wrapping the entire answer in markdown code fences.

Map each PDF route tab to sections[] with stable id and matching title:
- Route A: id opening-brief | levels | technicals | fno-pulse | commodities | news | verdict
- Route B: id opening-brief | global-markets | sectors | fii-flows | commodities | news | verdict
- Route C: id opening-brief | global-markets | india-levels | fno-pulse | fii-flows | commodities-actions | news | verdict

Styling: use each metric's tone field (positive | negative | neutral) instead of describing green/red/amber in prose. News must use happened, impact, publishedAt, source.url (no markdown link-only lines).

GROUND TRUTH: If LIVE_INDICES_SERVER_FETCH (or equivalent) appears in the surrounding prompt, treat those figures as authoritative for those symbols everywhere in the JSON, including verdict.

Pivots: The server may overwrite Nifty 50 / Bank Nifty classical pivot rows (PP, R1–R3, S1–S3) in Levels-related sections with server-computed prior-EOD values; still emit coherent placeholder metrics for those rows.

No live browsing in this API: follow the canonical source order and verification rules; use N/A plus an official link when a value cannot be justified. Never fabricate numbers.

Disclaimer: populate disclaimer as a JSON string array with at least the two standard lines; include the SEBI advisory line from the canonical footer when appropriate.

─────────────────────────────────────────────────────
CANONICAL MASTER PROMPT (full text follows)
─────────────────────────────────────────────────────
`.trim();

export const MASTER_PROMPT = `${MASTER_PROMPT_API_ADAPTER}\n\n${HOLY_GRAIL_BODY}`;
