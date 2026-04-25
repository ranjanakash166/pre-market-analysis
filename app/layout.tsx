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
  metadataBase: new URL("https://www.twickers.xyz"),
  title: {
    default: `${SITE_NAME} — AI pre-market intelligence`,
    template: `%s · ${SITE_NAME}`,
  },
  description: `${SITE_NAME} helps traders prepare with AI-powered pre-market briefings, adaptive briefing depth, and source-backed market context.`,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: "https://www.twickers.xyz",
    title: `${SITE_NAME} — AI pre-market intelligence`,
    description: `${FEATURE_PRE_MARKET} with actionable insights, scenarios, and source-backed context.`,
    siteName: SITE_NAME,
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — AI pre-market intelligence`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — AI pre-market intelligence`,
    description: `${FEATURE_PRE_MARKET}. ${SITE_TAGLINE}`,
    images: ["/twitter-image"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  return (
    <html lang="en" className={sans.variable}>
      <body
        suppressHydrationWarning
        className={`relative z-10 min-h-screen ${sans.className} text-slate-100 antialiased`}
      >
        <SessionProvider session={session}>
          <NavBar />
          <div className="relative z-10">{children}</div>
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  );
}
