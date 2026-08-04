import type { Metadata } from "next";
import "./globals.css";
import "./foundation-architecture.css";

export const metadata: Metadata = {
  title: "YOSSEUF Platform",
  description: "Unified organization-aware platform for YOSSEUF business modules.",
  applicationName: "YOSSEUF Platform",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "YOSSEUF Platform", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
