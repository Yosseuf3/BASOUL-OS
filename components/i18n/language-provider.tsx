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

// Compatibility bridge for the remaining legacy monolithic shell in app/page.tsx.
// New/extracted features must use useLanguage().text() directly instead of adding
// new entries here. The bridge lets Beta testers switch the whole visible shell
// while the monolith is progressively extracted without mutating stored data.
const LEGACY_UI_TEXT: ReadonlyArray<readonly [string, string]> = [
  ["لوحة القيادة", "Dashboard"],
  ["تابع أعمالك من مكان واحد.", "Track your work from one place."],
  ["المشاريع", "Projects"],
  ["الذكاء المعماري", "Architectural intelligence"],
  ["المهام", "Tasks"],
  ["العملاء", "Clients"],
  ["المحتوى", "Content"],
  ["المعرفة", "Knowledge"],
  ["المالية", "Finance"],
  ["النشاط", "Activity"],
  ["الإشعارات", "Notifications"],
  ["إدارة المشاريع", "Project management"],
  ["محرك المهام", "Task engine"],
  ["إدارة العملاء", "Client management"],
  ["استوديو المحتوى", "Content studio"],
  ["قاعدة المعرفة", "Knowledge base"],
  ["الإدارة المالية", "Financial management"],
  ["سجل النشاط", "Activity log"],
  ["مركز الإشعارات", "Notification center"],
  ["أنشئ المهام واربطها بمشاريعك وتابع التنفيذ.", "Create tasks, connect them to projects, and track execution."],
  ["نظّم بيانات العملاء واربطهم بأعمالك.", "Organize client data and connect it to your work."],
  ["حوّل الأفكار إلى محتوى منشور عبر دورة إنتاج واضحة.", "Turn ideas into published content through a clear production flow."],
  ["احفظ أفكارك وملاحظاتك وقوالبك ومراجعك في مكان واحد.", "Keep ideas, notes, templates, and references in one place."],
  ["سجّل الدخل والمصروفات وتابع صافي التدفق المالي.", "Record income and expenses and track net cash flow."],
  ["تابع كل ما يحدث داخل وحدات النظام في خط زمني واحد.", "Follow system activity in one unified timeline."],
  ["راجع التنبيهات المهمة وانتقل مباشرة إلى مصدرها.", "Review important alerts and jump directly to their source."],
  ["تسجيل الخروج", "Sign out"],
  ["إنشاء", "Create"],
  ["إضافة", "Add"],
  ["البيانات محدثة", "Data up to date"],
  ["مزامنة جزئية", "Partial sync"],
  ["جارٍ التحديث…", "Updating…"],
  ["إعادة المحاولة", "Retry"],
  ["فتح القائمة", "Open menu"],
  ["إغلاق القائمة", "Close menu"],
  ["كل المشاريع", "All projects"],
  ["كل المهام", "All tasks"],
  ["دليل العملاء", "Client directory"],
  ["الكل", "All"],
  ["آخر تحديث", "Last updated"],
  ["موعد الاستحقاق", "Due date"],
  ["الأولوية", "Priority"],
  ["نسبة الإنجاز", "Progress"],
  ["بطاقات", "Cards"],
  ["قائمة", "List"],
  ["كانبان", "Kanban"],
  ["المكتملة", "Completed"],
  ["قيد التنفيذ", "In progress"],
  ["للمراجعة", "In review"],
  ["المتأخرة", "Overdue"],
  ["كل المشاريع", "All projects"],
  ["Organization membership administration", "Organization membership administration"],
] as const;

const SYSTEM_EVENT_PREFIXES: ReadonlyArray<readonly [string, string]> = [
  ["تم تسجيل دفعة:", "Payment recorded:"],
  ["تم تحديث المشروع:", "Project updated:"],
  ["تم إنشاء مشروع جديد:", "Project created:"],
  ["اكتملت المهمة:", "Task completed:"],
  ["تم تحديث المهمة:", "Task updated:"],
  ["تم إنشاء مهمة جديدة:", "Task created:"],
  ["تم تحديث العميل:", "Client updated:"],
  ["تمت إضافة عميل جديد:", "Client added:"],
  ["تم نشر المحتوى:", "Content published:"],
  ["تم تحديث المحتوى:", "Content updated:"],
  ["تم إنشاء محتوى جديد:", "Content created:"],
  ["تم تحديث المعرفة:", "Knowledge updated:"],
  ["تمت إضافة عنصر معرفة:", "Knowledge item added:"],
  ["تم حذف المشروع:", "Project deleted:"],
  ["تم حذف المهمة:", "Task deleted:"],
  ["تم حذف العميل:", "Client deleted:"],
  ["تم حذف المحتوى:", "Content deleted:"],
  ["تم حذف عنصر المعرفة:", "Knowledge item deleted:"],
  ["تم حذف المعاملة:", "Transaction deleted:"],
] as const;

function translateLegacyValue(value: string, locale: BasoulLocale) {
  const trimmed = value.trim();
  if (!trimmed) return value;

  for (const [ar, en] of LEGACY_UI_TEXT) {
    const source = locale === "en" ? ar : en;
    const target = locale === "en" ? en : ar;
    if (trimmed === source && source !== target) return value.replace(trimmed, target);
  }

  for (const [arPrefix, enPrefix] of SYSTEM_EVENT_PREFIXES) {
    const source = locale === "en" ? arPrefix : enPrefix;
    const target = locale === "en" ? enPrefix : arPrefix;
    if (trimmed.startsWith(source)) {
      return value.replace(trimmed, `${target}${trimmed.slice(source.length)}`);
    }
  }

  return value;
}

function applyLegacyCompatibility(locale: BasoulLocale) {
  if (typeof document === "undefined" || !document.body) return;

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode as Text);

  for (const node of textNodes) {
    const parent = node.parentElement;
    if (!parent || parent.closest("script,style,textarea,[data-no-i18n],[contenteditable='true']")) continue;
    const current = node.nodeValue ?? "";
    const next = translateLegacyValue(current, locale);
    if (next !== current) node.nodeValue = next;
  }

  document.querySelectorAll<HTMLElement>("[placeholder],[aria-label],[title]").forEach((element) => {
    for (const attribute of ["placeholder", "aria-label", "title"] as const) {
      const current = element.getAttribute(attribute);
      if (!current) continue;
      const next = translateLegacyValue(current, locale);
      if (next !== current) element.setAttribute(attribute, next);
    }
  });
}

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

    let frame = 0;
    const schedule = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => applyLegacyCompatibility(locale));
    };

    schedule();
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["placeholder", "aria-label", "title"],
    });

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
    };
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
