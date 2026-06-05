import type { Metadata } from "next";
import { Geist_Mono, IBM_Plex_Sans, Syne } from "next/font/google";

import "./globals.css";

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const syne = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "Postyim";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} — Product Reviews & Affiliate Insights`,
    template: `%s | ${siteName}`,
  },
  description:
    "Expert product reviews and buying guides. AI-assisted editorial workflow with human approval for trustworthy affiliate content.",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName,
    title: `${siteName} — Product Reviews & Affiliate Insights`,
    description:
      "Expert product reviews and buying guides for global shoppers.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${ibmPlexSans.variable} ${syne.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
