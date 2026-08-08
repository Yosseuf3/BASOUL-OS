
import { spawnSync } from "node:child_process";

const exceptionExpiresOn = "2026-09-08";
const allowedAdvisories = new Set([
  "GHSA-5p2g-fcmc-qvqq",
  "GHSA-w3rx-r6r6-pgpr",
]);

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const audit = spawnSync(
  npmCommand,
  ["audit", "--omit=dev", "--audit-level=high", "--json"],
  { encoding: "utf8", shell: false },
);

if (!audit.stdout) {
  process.stderr.write(audit.stderr || "npm audit produced no JSON output.\n");
  process.exit(1);
}

let report;
try {
  report = JSON.parse(audit.stdout);
} catch {
  process.stderr.write(audit.stdout);
  process.stderr.write(audit.stderr || "Unable to parse npm audit output.\n");
  process.exit(1);
}

if (audit.status === 0) {
  console.log("Mobile production dependency audit: 0 high/critical vulnerabilities.");
  process.exit(0);
}

if (new Date(`${exceptionExpiresOn}T00:00:00Z`) < new Date()) {
  console.error(`Mobile audit exception expired on ${exceptionExpiresOn}.`);
  process.exit(1);
}

const highOrCriticalAdvisories = Object.values(report.vulnerabilities ?? {})
  .flatMap((vulnerability) => vulnerability.via ?? [])
  .filter(
    (via) =>
      typeof via === "object" &&
      (via.severity === "high" || via.severity === "critical"),
  );

const getGhsaId = (advisory) =>
  advisory.url?.match(/GHSA-[\w-]+$/)?.[0] ?? null;

const unexpectedAdvisories = highOrCriticalAdvisories.filter(
  (advisory) =>
    advisory.name !== "image-size" ||
    !allowedAdvisories.has(getGhsaId(advisory)),
);

const criticalCount = report.metadata?.vulnerabilities?.critical ?? 0;
if (
  criticalCount > 0 ||
  highOrCriticalAdvisories.length !== allowedAdvisories.size ||
  unexpectedAdvisories.length > 0
) {
  process.stderr.write(audit.stdout);
  console.error("Mobile audit failed: an unapproved high/critical advisory is present.");
  process.exit(1);
}

console.warn(
  [
    "Mobile production dependency audit: only the two approved image-size no-fix advisories remain.",
    `Advisories: ${[...allowedAdvisories].join(", ")}.`,
    `Exception expires: ${exceptionExpiresOn}.`,
    "GitHub lists no patched release; image-size is pinned to the latest compatible 2.0.2 release.",
    "Any other high/critical advisory still fails this gate.",
  ].join(" "),
);
