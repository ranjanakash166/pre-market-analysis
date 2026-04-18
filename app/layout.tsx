import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { auth } from "@/auth";
import { NavBar } from "@/components/nav-bar";
import { SessionProvider } from "@/components/providers/session-provider";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pre-Market Analysis",
  description: "A/B/C pre-market analysis dashboard powered by frontier AI models",
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
