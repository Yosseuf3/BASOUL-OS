import { readFile, readdir } from "node:fs/promises";
import { extname, join } from "node:path";

const root = new URL("../", import.meta.url);
const css = await readFile(new URL("app/globals.css", root), "utf8");
const failures = [];

for (const token of [
  "--ys-surface-canvas",
  "--ys-surface-base",
  "--ys-surface-subtle",
  "--ys-surface-raised",
  "--ys-text-primary",
  "--ys-text-secondary",
  "--ys-text-muted",
  "--ys-border-default",
  "--ys-border-strong",
  "--ys-action-primary",
  "--ys-status-danger",
  "--ys-status-success",
  "--ys-status-warning",
  "--ys-status-info",
  "--ys-focus-ring",
]) {
  if (!css.includes(token)) failures.push(`Missing required Foundation role: ${token}`);
}

if (!css.includes(":focus-visible")) failures.push("Visible keyboard focus styling is missing.");
if (!css.includes("@media (prefers-reduced-motion: reduce)")) failures.push("Reduced-motion handling is missing.");
if (!/(margin|padding|border|inset)-(inline|block)/.test(css)) {
  failures.push("No RTL-safe logical property was found in app/globals.css.");
}

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (["node_modules", ".next", ".git"].includes(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectFiles(path));
    else if ([".ts", ".tsx", ".js", ".jsx"].includes(extname(entry.name))) files.push(path);
  }
  return files;
}

const appFiles = await collectFiles(new URL("app", root));
for (const path of appFiles) {
  const source = await readFile(path, "utf8");
  if (/#[0-9a-f]{3,8}\b/gi.test(source)) {
    failures.push(`${path.replace(new URL(".", root).pathname, "")} contains raw hexadecimal colors; use semantic CSS roles.`);
  }
}

if (failures.length) {
  console.error("YOSSEUF Design System validation failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("YOSSEUF Design System migration guard passed.");
