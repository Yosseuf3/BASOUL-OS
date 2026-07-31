import type { Metadata } from "next";
import "./globals.css";
import "./foundation-architecture.css";

export const metadata: Metadata = {
  title: "YOSSEUF OS",
  description: "Executive operating system for architectural workspaces.",
  applicationName: "YOSSEUF OS",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "YOSSEUF OS", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
