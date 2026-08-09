import fs from "node:fs";

const expected = "4.0.0-rc.1";
const expectedMobile = expected.split("-")[0];
const files = [
  ["package.json", JSON.parse(fs.readFileSync("package.json", "utf8")).version, expected],
  ["mobile/package.json", JSON.parse(fs.readFileSync("mobile/package.json", "utf8")).version, expected],
  ["mobile/app.json", JSON.parse(fs.readFileSync("mobile/app.json", "utf8")).expo.version, expectedMobile],
];

const appInfo = fs.readFileSync("lib/config/app-info.ts", "utf8");
if (!appInfo.includes(`version: "${expected}"`)) files.push(["lib/config/app-info.ts", "mismatch", expected]);

const staleLiveLabel = "v1.5.0 ? Mobile Live Foundation";
const page = fs.readFileSync("app/page.tsx", "utf8");
if (page.includes(staleLiveLabel)) files.push(["app/page.tsx stale label", staleLiveLabel, "absent"]);

const failures = files.filter(([, version, target]) => version !== target);
if (failures.length) {
  console.error("Release consistency check failed:");
  for (const [file, version, target] of failures) console.error(`- ${file}: ${version} (expected ${target})`);
  process.exit(1);
}
console.log(`Release consistency verified: platform v${expected}, mobile v${expectedMobile}`);
