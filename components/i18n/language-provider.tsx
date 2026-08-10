"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type BasoulLocale = "ar" | "en";

type LanguageContextValue = {
  locale: BasoulLocale;
  direction: "rtl" | "ltr";
  setLocale: (locale: BasoulLocale) => void;
  toggleLocale: () => void;
  text: (ar: string, en: string) => string;
};

const STORAGE_KEY = "basoul.locale";
const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<BasoulLocale>("ar");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "ar" || saved === "en") setLocaleState(saved);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = locale;
    root.dir = locale === "ar" ? "rtl" : "ltr";
    root.dataset.locale = locale;
    window.localStorage.setItem(STORAGE_KEY, locale);
  }, [locale]);

  const value = useMemo<LanguageContextValue>(() => ({
    locale,
    direction: locale === "ar" ? "rtl" : "ltr",
    setLocale: setLocaleState,
    toggleLocale: () => setLocaleState((current) => current === "ar" ? "en" : "ar"),
    text: (ar, en) => locale === "ar" ? ar : en,
  }), [locale]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
