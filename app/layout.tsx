import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
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
    default: `${SITE_NAME} — ${FEATURE_PRE_MARKET}`,
    template: `%s · ${SITE_NAME}`,
  },
  description: `${SITE_NAME}: ${FEATURE_PRE_MARKET}. ${SITE_TAGLINE}`,
  openGraph: {
    title: `${SITE_NAME} — ${FEATURE_PRE_MARKET}`,
    description: `${FEATURE_PRE_MARKET} — ${SITE_TAGLINE}`,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: `${SITE_NAME} — ${FEATURE_PRE_MARKET}`,
    description: SITE_TAGLINE,
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
      </body>
    </html>
  );
}
