import { readFile } from "node:fs/promises";

const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const checks = [
  [layout.includes('lang="ar"') && layout.includes('dir="rtl"'), "Arabic language and RTL direction"],
  [css.includes(":focus-visible"), "visible keyboard focus"],
  [css.includes("prefers-reduced-motion"), "reduced-motion support"],
  [page.includes("aria-label"), "accessible control labels"],
  [!/<img(?![^>]*\balt=)[^>]*>/i.test(page), "image alternative text"],
];
const failures = checks.filter(([valid]) => !valid).map(([, label]) => label);
if (failures.length) { console.error(`Accessibility validation failed: ${failures.join(", ")}`); process.exit(1); }
console.log(`Accessibility baseline valid: ${checks.length} structural checks passed.`);
