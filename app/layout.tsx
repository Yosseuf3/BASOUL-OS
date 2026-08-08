import type { Metadata } from "next";
import "./globals.css";
import "./foundation-architecture.css";

export const metadata: Metadata = {
  title: "BASOUL",
  description: "Unified organization-aware platform for BASOUL business modules.",
  applicationName: "BASOUL",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "BASOUL", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
