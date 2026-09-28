import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { getSiteSettings } from "@/lib/site-settings";

const display = Fraunces({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-display", display: "swap" });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  return {
    metadataBase: new URL(siteUrl),
    title: { default: s.siteName, template: `%s — ${s.siteName}` },
    description: s.tagline || "Find the right property or service, and send an inquiry in seconds.",
    robots: { index: true, follow: true },
    openGraph: { type: "website", siteName: s.siteName },
    twitter: { card: "summary_large_image" },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="font-sans">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
