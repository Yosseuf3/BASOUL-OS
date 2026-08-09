import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const roots = ["app", "components", "features", "mobile"];
const extensions = new Set([".css", ".ts", ".tsx"]);
const ignored = new Set(["node_modules", ".next", "dist"]);
const rawColor = /#[\da-f]{3,8}\b|\b(?:rgb|rgba|hsl|hsla)\s*\(/gi;
const rawMetric = /\b(?:padding|paddingHorizontal|paddingVertical|margin|marginTop|marginBottom|marginLeft|marginRight|gap|borderRadius|fontSize|lineHeight)\s*:\s*(?:\d+(?:\.\d+)?|["'][\d.]+(?:px|rem)["'])/g;
const legacy = /var\(--ys-|@yosseuf\/ui-tokens|nativeDarkTheme/g;
const compliant = /var\(--(?:yvl|basoul)-|@basoul\/yvl-adapter|basoulYvl(?:Native)?/g;
const brand = /BASOUL|foundationColorValues|--ys-action-primary/g;

async function walk(directory) {
  const absolute = path.join(root, directory);
  const entries = await readdir(absolute, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (ignored.has(entry.name)) continue;
    const relative = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(relative));
    else if (extensions.has(path.extname(entry.name))) files.push(relative.replaceAll("\\", "/"));
  }
  return files;
}

const occurrences = (source, pattern) => [...source.matchAll(pattern)].length;
const files = (await Promise.all(roots.map(walk))).flat().sort();
const inventory = [];
for (const file of files) {
  const source = await readFile(path.join(root, file), "utf8");
  inventory.push({
    path: file,
    yvlCompliantReferences: occurrences(source, compliant),
    legacyTokenReferences: occurrences(source, legacy),
    brandSpecificReferences: occurrences(source, brand),
    hardcodedColors: occurrences(source, rawColor),
    hardcodedMetrics: occurrences(source, rawMetric),
  });
}

const requiredSemantics = ["background","surface","surfaceRaised","textPrimary","textSecondary","border","accent","success","warning","danger","focus","disabled","spacing","radius","elevation","typography","motion"];
const adapterSource = [
  await readFile(path.join(root, "packages/basoul-yvl-adapter/src/index.ts"), "utf8"),
  await readFile(path.join(root, "packages/basoul-yvl-adapter/src/native.ts"), "utf8"),
].join("\n");
const missingSemanticMappings = requiredSemantics.filter((semantic) => !new RegExp(`\\b${semantic}\\b`).test(adapterSource));
const totals = inventory.reduce((sum, item) => ({
  yvlCompliantReferences: sum.yvlCompliantReferences + item.yvlCompliantReferences,
  legacyTokenReferences: sum.legacyTokenReferences + item.legacyTokenReferences,
  brandSpecificReferences: sum.brandSpecificReferences + item.brandSpecificReferences,
  hardcodedColors: sum.hardcodedColors + item.hardcodedColors,
  hardcodedMetrics: sum.hardcodedMetrics + item.hardcodedMetrics,
}), { yvlCompliantReferences: 0, legacyTokenReferences: 0, brandSpecificReferences: 0, hardcodedColors: 0, hardcodedMetrics: 0 });

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  scope: roots,
  sourceOfTruth: ["packages/yvl-tokens/**", "design-system/yvl/**"],
  adapter: "packages/basoul-yvl-adapter",
  categories: {
    alreadyYvlCompliant: "References YVL or the BASOUL YVL adapter.",
    legacyTokens: "References compatibility variables or @yosseuf/ui-tokens.",
    brandSpecific: "References BASOUL identity only.",
    hardcoded: "Raw color or layout metric values requiring incremental migration.",
  },
  totals,
  missingSemanticMappings,
  files: inventory,
};

if (process.argv.includes("--write")) {
  const output = path.join(root, "docs/design-system/yvl-style-inventory.json");
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`YVL style inventory written: ${path.relative(root, output)}`);
} else {
  console.log(JSON.stringify(report, null, 2));
}
