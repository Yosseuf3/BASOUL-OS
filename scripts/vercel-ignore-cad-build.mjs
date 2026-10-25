import { fileURLToPath } from "node:url";
import { changedFilesFromVercel } from "./vercel-ignore-build.mjs";

const WEB_ONLY_ROOTS = [
  "app/", "components/", "features/", "lib/", "core/", "packages/",
  "public/", "design-system/", "brand/", "supabase/", "database/",
  "mobile/", "docs/", "tests/", ".github/workflows/",
];

export function classifyCadChanges(files) {
  if (!Array.isArray(files) || files.length === 0) return { skip: false, reason: "empty or ambiguous change set" };
  for (const original of files) {
    const path = typeof original === "string" ? original.replaceAll("\\", "/").replace(/^\.\//, "") : "";
    if (!path || path.startsWith("../") || path.startsWith("/") || path.includes("/../")) {
      return { skip: false, reason: "invalid path" };
    }
    if (path.startsWith("tools/cad-ingestion/") || path === "vercel.json" ||
        path === "scripts/vercel-ignore-build.mjs" || path === "scripts/vercel-ignore-cad-build.mjs") {
      return { skip: false, reason: `CAD deployment input changed: ${path}` };
    }
    const webOnly = WEB_ONLY_ROOTS.some((root) => path.startsWith(root)) ||
      (path.startsWith("scripts/") && path.endsWith(".mjs")) ||
      (!path.includes("/") && /^(README|CHANGELOG|LICENSE)(\..+)?$/i.test(path));
    if (!webOnly) return { skip: false, reason: `unclassified file: ${path}` };
  }
  return { skip: true, reason: "no CAD container inputs changed" };
}

export function main(env = process.env) {
  try {
    const result = classifyCadChanges(changedFilesFromVercel(env));
    console.log(`CAD container: ${result.skip ? "SKIP" : "BUILD"} — ${result.reason}`);
    return result.skip ? 0 : 1;
  } catch (error) {
    console.log(`CAD container: BUILD — cannot verify changes: ${error instanceof Error ? error.message : "unknown error"}`);
    return 1;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.exitCode = main();
}
