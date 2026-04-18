/** Product identity — import from UI and metadata. */

export const SITE_NAME = "Twickers";

/** Shipped feature on the home dashboard. */
export const FEATURE_PRE_MARKET = "India pre-market briefing";

/** Compact label for nav / tight UI. */
export const NAV_FEATURE_LABEL = "Pre-market";

/** Short positioning line (nav / meta / hero). */
export const SITE_TAGLINE = "Markets clarity — starting with pre-open India context.";

export function pageTitle(segment?: string): string {
  return segment ? `${segment} · ${SITE_NAME}` : SITE_NAME;
}
