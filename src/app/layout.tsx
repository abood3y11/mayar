import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import type { ReactNode } from "react";
import { experienceConfig } from "@/config/experience";
import { palette } from "@/config/palette";
import "./globals.css";

// Cairo: Arabic-first typeface with matching Latin glyphs (numbers, BPM).
const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "600"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: experienceConfig.title,
  description: "غريبة كيف رسمة كانت بداية كل دا.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: palette.bg3,
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body>{children}</body>
    </html>
  );
}
