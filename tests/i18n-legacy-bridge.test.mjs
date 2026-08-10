import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";

test("Beta 2 legacy shell compatibility bridge covers tester-reported mixed-language labels", async () => {
  const source = await readFile(new URL("../components/i18n/language-provider.tsx", import.meta.url), "utf8");
  for (const expected of [
    '["لوحة القيادة", "Dashboard"]',
    '["تابع أعمالك من مكان واحد.", "Track your work from one place."]',
    '["تم تسجيل دفعة:", "Payment recorded:"]',
    'MutationObserver',
    'attributeFilter: ["placeholder", "aria-label", "title"]',
  ]) assert.match(source, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});
