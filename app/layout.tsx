import type { Metadata } from "next";
import "./globals.css";
import "./foundation-architecture.css";
import "@basoul/yvl-adapter/web.css";
import "@/components/ui/yvl-primitives.css";
import "./basoul-visual-truth.css";
import "./basoul-approved-assets.css";
import "./basoul-polish.css";
import "./basoul-product-surfaces.css";
import "./basoul-i18n.css";
import { LanguageProvider } from "@/components/i18n/language-provider";
import { LanguageToggle } from "@/components/i18n/language-toggle";

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
      <body><LanguageProvider><LanguageToggle />{children}</LanguageProvider></body>
    </html>
  );
}
