import fs from "node:fs";

const packageVersion = JSON.parse(fs.readFileSync("package.json", "utf8")).version;
const expected = packageVersion;
const files = [
  ["package.json", packageVersion],
  ["mobile/package.json", JSON.parse(fs.readFileSync("mobile/package.json", "utf8")).version],
];

const appInfo = fs.readFileSync("lib/config/app-info.ts", "utf8");
if (!appInfo.includes(`version: "${expected}"`)) files.push(["lib/config/app-info.ts", "mismatch"]);

const appJson = JSON.parse(fs.readFileSync("mobile/app.json", "utf8"));
if (!appJson.expo.extra?.release?.includes(expected)) files.push(["mobile/app.json release", appJson.expo.extra?.release ?? "missing"]);

const staleLiveLabel = "v1.5.0 · Mobile Live Foundation";
const page = fs.readFileSync("app/page.tsx", "utf8");
if (page.includes(staleLiveLabel)) files.push(["app/page.tsx stale label", staleLiveLabel]);

const failures = files.filter(([, version]) => version !== expected && !String(version).includes(expected));
if (failures.length) {
  console.error("Release consistency check failed:");
  for (const [file, version] of failures) console.error(`- ${file}: ${version}`);
  process.exit(1);
}
console.log(`Release consistency verified: v${expected}`);
