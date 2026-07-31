import { readFile, readdir } from "node:fs/promises";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const rootPath = fileURLToPath(root);
const failures = [];
const required = ["surface-canvas", "surface-base", "text-primary", "text-muted", "border-default", "action-primary", "status-danger", "status-success", "focus-ring"];
const legacy = /var\(--(?:bg|panel|panel-soft|panel-raised|text|muted|line|gold|gold-soft|danger|success|shadow)\)/;

async function files(directory) {
  const found = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (["node_modules", ".next", ".git", "hq"].includes(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) found.push(...await files(path)); else found.push(path);
  }
  return found;
}

const cssFiles = [new URL("app/globals.css", root), new URL("app/foundation-architecture.css", root)];
const globals = await readFile(cssFiles[0], "utf8");
for (const role of required) if (!globals.includes(`--ys-${role}:`)) failures.push(`Missing --ys-${role}`);
const definitions = [...globals.matchAll(/^\s*(--ys-[\w-]+):/gm)].map((match) => match[1]);
for (const name of new Set(definitions)) if (definitions.filter((item) => item === name).length > 1) failures.push(`Duplicate token definition: ${name}`);

for (const file of cssFiles) {
  const source = await readFile(file, "utf8");
  const productCss = file === cssFiles[0] ? source.slice(source.indexOf("}") + 1) : source;
  if (legacy.test(productCss)) failures.push(`${relative(new URL(".", root).pathname, file.pathname)} uses a compatibility alias`);
  if (/(?:#[0-9a-f]{3,8}\b|rgba?\()/i.test(productCss)) failures.push(`${relative(new URL(".", root).pathname, file.pathname)} contains raw product color values`);
}

for (const path of [join(rootPath, "mobile/App.tsx"), ...await files(join(rootPath, "mobile/src"))]) {
  if (![".ts", ".tsx"].includes(extname(path))) continue;
  const source = await readFile(path, "utf8");
  if (/theme\/tokens|#[0-9a-f]{3,8}\b/i.test(source)) failures.push(`${relative(rootPath, path)} bypasses Foundation semantic tokens`);
}
if (failures.length) { console.error(failures.map((item) => `- ${item}`).join("\n")); process.exit(1); }
console.log(`Foundation contract valid: ${definitions.length} unique semantic tokens, no aliases or raw component colors.`);
