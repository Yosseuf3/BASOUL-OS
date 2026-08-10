"use client";

import { Languages } from "lucide-react";
import { useLanguage } from "@/components/i18n/language-provider";

export function LanguageToggle() {
  const { locale, toggleLocale, text } = useLanguage();
  return (
    <button type="button" className="basoul-language-toggle" onClick={toggleLocale} aria-label={text("Switch to English", "التبديل إلى العربية")}>
      <Languages size={16} aria-hidden="true" />
      <span>{locale === "ar" ? "EN" : "ع"}</span>
    </button>
  );
}
