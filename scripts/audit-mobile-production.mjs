import { readFileSync, readdirSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const mobileRoot = join(repositoryRoot, "mobile");
const loadJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const fail = (message, details) => {
  if (details) process.stderr.write(`${details}\n`);
  console.error(message);
  process.exit(1);
};
const manifest = loadJson(join(mobileRoot, "package.json"));
const packages = loadJson(join(mobileRoot, "package-lock.json")).packages ?? {};
const app = loadJson(join(mobileRoot, "app.json")).expo ?? {};

// Official node-forge 1.4.2 includes the canonical DigestInfo fix for
// CVE-2026-85393 (also GHSA-2g46-22mc-6gwp). No local crypto patch.
// GHSA-vfj7-8cjw-p6xm was withdrawn on 2026-10-23. Every reported
// HIGH/CRITICAL fails; there are no allowlists or expiry bypasses.
const expectedVersions = {
  "node_modules/expo": "57.0.31",
  "node_modules/expo/node_modules/@expo/cli": "57.0.32",
  "node_modules/@expo/code-signing-certificates": "0.0.6",
  "node_modules/node-forge": "1.4.2",
  "node_modules/zod": "4.6.6",
};
for (const [path, version] of Object.entries(expectedVersions)) {
  if (packages[path]?.version !== version) fail(`Unreviewed mobile dependency: ${path}.`);
}
if (manifest.dependencies?.expo !== "57.0.31" || manifest.overrides?.zod !== "4.6.6" ||
    manifest.scripts?.postinstall || manifest.overrides?.["node-forge"]) {
  fail("Mobile security dependency or install policy changed.");
}
const parentsOf = (name) => Object.entries(packages)
  .filter(([, metadata]) => metadata.dependencies?.[name]).map(([path]) => path).sort();
const installationsOf = (name) => Object.keys(packages)
  .filter((path) => path.endsWith(`node_modules/${name}`)).sort();
if (JSON.stringify(parentsOf("node-forge")) !== JSON.stringify([
  "node_modules/@expo/code-signing-certificates", "node_modules/expo/node_modules/@expo/cli",
].sort()) || JSON.stringify(installationsOf("node-forge")) !== JSON.stringify(["node_modules/node-forge"]) ||
    JSON.stringify(parentsOf("zod")) !== JSON.stringify(["node_modules/expo/node_modules/@expo/cli"]) ||
    JSON.stringify(installationsOf("zod")) !== JSON.stringify(["node_modules/zod"])) {
  fail("Mobile tooling dependency topology changed.");
}
if (app.android?.package !== "com.yosseufradwan.os" ||
    app.extra?.eas?.projectId !== "6f770730-8c8e-49b0-81b9-f9773faf567a" ||
    app.updates || JSON.stringify(app).includes("codeSigningCertificate") ||
    JSON.stringify(app).includes("codeSigningMetadata") ||
    manifest.dependencies?.["expo-updates"] || manifest.devDependencies?.["expo-updates"]) {
  fail("Mobile identity or code-signing boundary changed.");
}

const runtimeFiles = [join(mobileRoot, "App.tsx")];
const collect = (directory) => {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) collect(path);
    else if ([".js", ".jsx", ".ts", ".tsx"].includes(extname(entry.name))) runtimeFiles.push(path);
  }
};
collect(join(mobileRoot, "src"));
const tooling = ["node-forge", "zod", "@expo/cli", "@expo/code-signing-certificates",
  "braces", "micromatch", "@expo/metro-file-map", "metro-file-map", "@expo/metro", "metro"];
for (const path of runtimeFiles) {
  const source = readFileSync(path, "utf8");
  if (tooling.some((name) => source.includes(`"${name}"`) || source.includes(`'${name}'`))) {
    fail(`Build tooling referenced by Android runtime: ${path}.`);
  }
}

const npmCli = process.env.npm_execpath;
const audit = spawnSync(npmCli ? process.execPath : process.platform === "win32" ? "npm.cmd" : "npm",
  [...(npmCli ? [npmCli] : []), "audit", "--omit=dev", "--audit-level=high", "--json"],
  { cwd: mobileRoot, encoding: "utf8", shell: false });
let report;
try {
  report = JSON.parse(audit.stdout);
} catch {
  fail("Mobile security audit failed: missing or invalid npm audit evidence.", audit.stderr);
}
const counts = report.metadata?.vulnerabilities;
const reportedHigh = Object.values(report.vulnerabilities ?? {}).some(
  (vulnerability) => ["high", "critical"].includes(vulnerability.severity) ||
    (vulnerability.via ?? []).some((via) => typeof via === "object" &&
      ["high", "critical"].includes(via.severity)));
if (audit.error || audit.status !== 0 || report.error || !counts ||
    !report.vulnerabilities || typeof report.vulnerabilities !== "object" ||
    Array.isArray(report.vulnerabilities) ||
    !Number.isInteger(counts.high) || !Number.isInteger(counts.critical) ||
    counts.high !== 0 || counts.critical !== 0 || reportedHigh) {
  fail("Mobile security audit failed: HIGH/CRITICAL finding or incomplete scanner evidence.", audit.stdout);
}
console.log(`Mobile production dependency audit: 0 HIGH/CRITICAL; ${counts.low ?? 0} LOW, ${counts.moderate ?? 0} MODERATE. No security exceptions.`);
