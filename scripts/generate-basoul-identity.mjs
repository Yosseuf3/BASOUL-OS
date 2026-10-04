import { readFile, writeFile } from "node:fs/promises";

const source = new URL("../packages/basoul-yvl-adapter/src/identity.json", import.meta.url);
const target = new URL("../packages/basoul-yvl-adapter/src/identity.css", import.meta.url);
const identity = JSON.parse(await readFile(source, "utf8"));
const css = "/* Generated from identity.json; approval provenance: docs/design-system/MOBILE_BRAND_REMEDIATION.md. */\n:root {\n" +
  Object.entries(identity).map(([key, value]) => `  --basoul-identity-${key.replace(/[A-Z]/g, (letter) => "-" + letter.toLowerCase())}: ${value};`).join("\n") + "\n}\n";
if (process.argv.includes("--check")) {
  if (await readFile(target, "utf8") !== css) throw new Error("BASOUL identity CSS is stale; run node scripts/generate-basoul-identity.mjs");
} else {
  await writeFile(target, css);
}
