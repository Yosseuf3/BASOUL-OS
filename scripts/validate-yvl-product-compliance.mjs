import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrated = [
  "app/layout.tsx",
  "app/yvl-review/page.tsx",
  "components/ui/yvl-primitives.tsx",
  "components/ui/yvl-primitives.css",
  "features/administration/administration-view.tsx",
  "mobile/App.tsx",
  "mobile/src/components/Screen.tsx",
  "mobile/src/components/yvl-primitives.tsx",
  "mobile/src/features/auth/LoginScreen.tsx",
  "mobile/src/features/dashboard/DashboardScreen.tsx",
  "mobile/src/features/command-center/CommandCenterScreen.tsx",
  "mobile/src/features/administration/AdministrationScreen.tsx",
];
const inventory = JSON.parse(await readFile(path.join(root, "docs/design-system/yvl-style-inventory.json"), "utf8"));
const baseline = new Map(inventory.files.map((item) => [item.path, item]));
const rawColor = /#[\da-f]{3,8}\b|\b(?:rgb|rgba|hsl|hsla)\s*\(/gi;
const rawMetric = /\b(?:padding|paddingHorizontal|paddingVertical|margin|marginTop|marginBottom|marginLeft|marginRight|gap|borderRadius|fontSize|lineHeight)\s*:\s*(?:\d+(?:\.\d+)?|["'][\d.]+(?:px|rem)["'])/g;
const failures = [];

for (const file of migrated) {
  const source = await readFile(path.join(root, file), "utf8");
  const colors = [...source.matchAll(rawColor)].length;
  const metrics = [...source.matchAll(rawMetric)].length;
  const allowed = baseline.get(file);
  if (!allowed) failures.push(`${file}: missing from reviewed inventory`);
  else if (metrics > allowed.hardcodedMetrics) failures.push(`${file}: hardcoded metrics increased ${allowed.hardcodedMetrics} -> ${metrics}`);
  if (colors > 0) failures.push(`${file}: contains ${colors} forbidden raw color values`);
  if (/nativeDarkTheme|@yosseuf\/ui-tokens/.test(source) && file.startsWith("mobile/")) failures.push(`${file}: bypasses the BASOUL YVL adapter`);
}

for (const semantic of ["background","surface","surfaceRaised","textPrimary","textSecondary","border","accent","success","warning","danger","focus","disabled","spacing","radius","elevation","typography","motion"]) {
  if (inventory.missingSemanticMappings.includes(semantic)) failures.push(`adapter semantic missing: ${semantic}`);
}

if (failures.length) {
  console.error(`YVL product compliance failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log(`YVL product compliance passed for ${migrated.length} migrated areas; no raw colors or increased legacy metrics.`);
