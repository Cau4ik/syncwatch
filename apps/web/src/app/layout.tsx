import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import { type ReactNode } from "react";

import { QueryProvider } from "@/components/providers/query-provider";
import { SiteHeader } from "@/components/layout/site-header";

import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans"
});

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display"
});

export const metadata: Metadata = {
  title: "SyncWatch",
  description: "Watch-party web app for rooms, chat, voice and synced video playback."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${manrope.variable} ${display.variable} bg-ink font-sans text-white antialiased`}>
        <QueryProvider>
          <div className="min-h-screen bg-grid-fade">
            <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(255,209,140,0.10),transparent_22%),radial-gradient(circle_at_85%_15%,rgba(124,247,212,0.12),transparent_25%),radial-gradient(circle_at_75%_80%,rgba(255,134,92,0.12),transparent_22%)]" />
            <SiteHeader />
            <main className="relative">{children}</main>
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
