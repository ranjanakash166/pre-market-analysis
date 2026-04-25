import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { auth } from "@/auth";
import { FEATURE_PRE_MARKET, SITE_NAME, SITE_TAGLINE } from "@/lib/branding";
import { NavBar } from "@/components/nav-bar";
import { SessionProvider } from "@/components/providers/session-provider";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} — AI pre-market intelligence`,
    template: `%s · ${SITE_NAME}`,
  },
  description: `${SITE_NAME} helps traders prepare with AI-powered pre-market briefings, A/B/C modes, and source-backed market context.`,
  openGraph: {
    title: `${SITE_NAME} — AI pre-market intelligence`,
    description: `${FEATURE_PRE_MARKET} with actionable insights, scenarios, and source-backed context.`,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: `${SITE_NAME} — AI pre-market intelligence`,
    description: `${FEATURE_PRE_MARKET}. ${SITE_TAGLINE}`,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  return (
    <html lang="en" className={sans.variable}>
      <body className={`relative z-10 min-h-screen ${sans.className} text-slate-100 antialiased`}>
        <SessionProvider session={session}>
          <NavBar />
          <div className="relative z-10">{children}</div>
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  );
}
