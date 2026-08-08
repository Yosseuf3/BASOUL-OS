"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("BASOUL runtime error", error); }, [error]);
  return <html lang="ar" dir="rtl"><body><main className="error-boundary"><div className="error-boundary-card"><span><AlertTriangle size={28}/></span><h1>حدث خطأ غير متوقع</h1><p>بياناتك لم تُحذف. أعد محاولة تحميل الواجهة، وإن استمر الخطأ فتحقق من الاتصال وإعدادات Supabase.</p><button onClick={reset}><RotateCcw size={17}/> إعادة المحاولة</button></div></main></body></html>;
}
