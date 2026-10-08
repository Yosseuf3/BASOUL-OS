import { readFileSync, readdirSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

// Temporary BUILD/TOOLING-ONLY exception for GHSA-86w9-cpqp-85rv.
// Revalidated 2026-10-08: expo@57.0.27 -> @expo/cli@57.0.28 -> node-forge@1.4.0,
// including @expo/code-signing-certificates@0.0.6 -> node-forge@1.4.0.
// node-forge is not reachable from the BASOUL Android runtime graph. Upstream
// has no patched release as of approval. This exception expires 2026-10-16.
const nodeForgeException = {
  advisory: "GHSA-86w9-cpqp-85rv",
  expiresAt: "2026-10-16T00:00:00Z",
  versions: {
    expo: "57.0.27",
    cli: "57.0.28",
    certificates: "0.0.6",
    forge: "1.4.0",
  },
};

// Separate temporary BUILD/TOOLING-ONLY exception for GHSA-vfj7-8cjw-p6xm.
// Exact topology: one braces@3.0.3 installation, introduced only by
// micromatch@4.0.8, whose only parent is metro-file-map@0.84.5.
// Revalidated 2026-10-08: @expo/metro-file-map@57.0.4 no longer uses micromatch.
// Metro file watching runs on the build host and is not
// reachable from the BASOUL Android runtime. This exception expires 2026-10-16.
const bracesException = {
  advisory: "GHSA-vfj7-8cjw-p6xm",
  expiresAt: "2026-10-16T00:00:00Z",
  versions: {
    braces: "3.0.3",
    micromatch: "4.0.8",
    expoMetroFileMap: "57.0.4",
    metroFileMap: "0.84.5",
  },
};

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "..");
const mobileRoot = join(repositoryRoot, "mobile");
const loadJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const fail = (message, details) => {
  if (details) process.stderr.write(`${details}\n`);
  console.error(message);
  process.exit(1);
};

if (Date.now() >= new Date(nodeForgeException.expiresAt).getTime()) {
  fail("Mobile node-forge audit exception expired on 2026-10-16.");
}
if (Date.now() >= new Date(bracesException.expiresAt).getTime()) {
  fail("Mobile braces audit exception expired on 2026-10-16.");
}

const manifest = loadJson(join(mobileRoot, "package.json"));
const lockfile = loadJson(join(mobileRoot, "package-lock.json"));
const appConfig = loadJson(join(mobileRoot, "app.json"));
const packages = lockfile.packages ?? {};
const packageAt = (path, version) =>
  packages[path]?.version === version ? packages[path] : null;

const expo = packageAt("node_modules/expo", nodeForgeException.versions.expo);
const cli = packageAt(
  "node_modules/expo/node_modules/@expo/cli",
  nodeForgeException.versions.cli,
);
const certificates = packageAt(
  "node_modules/@expo/code-signing-certificates",
  nodeForgeException.versions.certificates,
);
const forge = packageAt("node_modules/node-forge", nodeForgeException.versions.forge);

if (
  manifest.dependencies?.expo !== "57.0.27" ||
  !expo ||
  !cli ||
  !certificates ||
  !forge ||
  expo.dependencies?.["@expo/cli"] !== "^57.0.28" ||
  cli.dependencies?.["node-forge"] !== "^1.3.3" ||
  cli.dependencies?.["@expo/code-signing-certificates"] !== "^0.0.6" ||
  certificates.dependencies?.["node-forge"] !== "^1.3.3"
) {
  fail("Mobile audit exception topology or pinned versions changed.");
}

const forgeParents = Object.entries(packages)
  .filter(([, metadata]) => metadata.dependencies?.["node-forge"])
  .map(([path]) => path)
  .sort();
const expectedForgeParents = [
  "node_modules/@expo/code-signing-certificates",
  "node_modules/expo/node_modules/@expo/cli",
].sort();
const forgeInstallations = Object.entries(packages)
  .filter(([path]) => path.endsWith("node_modules/node-forge"))
  .map(([path]) => path);

if (
  JSON.stringify(forgeParents) !== JSON.stringify(expectedForgeParents) ||
  forgeInstallations.length !== 1 ||
  forgeInstallations[0] !== "node_modules/node-forge"
) {
  fail("Mobile audit exception dependency topology changed.");
}

const braces = packageAt("node_modules/braces", bracesException.versions.braces);
const micromatch = packageAt(
  "node_modules/micromatch",
  bracesException.versions.micromatch,
);
const expoMetroFileMap = packageAt(
  "node_modules/@expo/metro-file-map",
  bracesException.versions.expoMetroFileMap,
);
const metroFileMap = packageAt(
  "node_modules/metro-file-map",
  bracesException.versions.metroFileMap,
);
const bracesParents = Object.entries(packages)
  .filter(([, metadata]) => metadata.dependencies?.braces)
  .map(([path]) => path)
  .sort();
const micromatchParents = Object.entries(packages)
  .filter(([, metadata]) => metadata.dependencies?.micromatch)
  .map(([path]) => path)
  .sort();
const bracesInstallations = Object.entries(packages)
  .filter(([path]) => path.endsWith("node_modules/braces"))
  .map(([path]) => path);
const expectedMicromatchParents = [
  "node_modules/metro-file-map",
].sort();

if (
  !braces ||
  !micromatch ||
  !expoMetroFileMap ||
  !metroFileMap ||
  micromatch.dependencies?.braces !== "^3.0.3" ||
  expoMetroFileMap.dependencies?.micromatch !== undefined ||
  metroFileMap.dependencies?.micromatch !== "^4.0.4" ||
  JSON.stringify(bracesParents) !== JSON.stringify(["node_modules/micromatch"]) ||
  JSON.stringify(micromatchParents) !== JSON.stringify(expectedMicromatchParents) ||
  bracesInstallations.length !== 1 ||
  bracesInstallations[0] !== "node_modules/braces"
) {
  fail("Mobile braces audit exception topology or pinned versions changed.");
}

const expoConfig = appConfig.expo ?? {};
if (
  expoConfig.updates ||
  JSON.stringify(expoConfig).includes("codeSigningCertificate") ||
  JSON.stringify(expoConfig).includes("codeSigningMetadata") ||
  manifest.dependencies?.["expo-updates"] ||
  manifest.devDependencies?.["expo-updates"]
) {
  fail("Mobile audit exception invalid: Expo Updates/code-signing configuration is present.");
}

const runtimeFiles = [join(mobileRoot, "App.tsx")];
const collectRuntimeFiles = (directory) => {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) collectRuntimeFiles(path);
    else if ([".js", ".jsx", ".ts", ".tsx"].includes(extname(entry.name))) {
      runtimeFiles.push(path);
    }
  }
};
collectRuntimeFiles(join(mobileRoot, "src"));
const forbiddenRuntimeImports = [
  "node-forge",
  "@expo/cli",
  "@expo/code-signing-certificates",
  "braces",
  "micromatch",
  "@expo/metro-file-map",
  "metro-file-map",
  "@expo/metro",
  "metro",
];
for (const path of runtimeFiles) {
  const source = readFileSync(path, "utf8");
  if (
    forbiddenRuntimeImports.some(
      (specifier) =>
        source.includes(`"${specifier}"`) || source.includes(`'${specifier}'`),
    )
  ) {
    fail(`Mobile audit exception invalid: affected tooling is referenced by runtime source ${path}.`);
  }
}

const npmCli = process.env.npm_execpath;
const npmCommand = npmCli
  ? process.execPath
  : process.platform === "win32"
    ? "npm.cmd"
    : "npm";
const npmArgs = npmCli
  ? [npmCli, "audit", "--omit=dev", "--audit-level=high", "--json"]
  : ["audit", "--omit=dev", "--audit-level=high", "--json"];
const audit = spawnSync(npmCommand, npmArgs, { encoding: "utf8", shell: false });

if (!audit.stdout) {
  fail("npm audit produced no JSON output.", audit.stderr);
}

let report;
try {
  report = JSON.parse(audit.stdout);
} catch {
  fail("Unable to parse npm audit output.", `${audit.stdout}\n${audit.stderr ?? ""}`);
}

if (audit.status === 0) {
  console.log("Mobile production dependency audit: 0 high/critical vulnerabilities.");
  process.exit(0);
}

const highOrCriticalPackages = Object.entries(report.vulnerabilities ?? {})
  .filter(([, vulnerability]) =>
    ["high", "critical"].includes(vulnerability.severity),
  )
  .map(([name]) => name)
  .sort();
const expectedAffectedPackages = [
  "@expo/cli",
  "@expo/code-signing-certificates",
  "@expo/metro",
  "@expo/metro-config",
  "@react-native/community-cli-plugin",
  "@react-native/virtualized-lists",
  "braces",
  "expo",
  "metro",
  "metro-config",
  "metro-file-map",
  "metro-transform-worker",
  "micromatch",
  "node-forge",
  "react-native",
].sort();
const highOrCriticalAdvisories = Object.values(report.vulnerabilities ?? {})
  .flatMap((vulnerability) => vulnerability.via ?? [])
  .filter(
    (via) =>
      typeof via === "object" &&
      ["high", "critical"].includes(via.severity),
  );
const getGhsaId = (advisory) =>
  advisory.url?.match(/GHSA-[\w-]+$/)?.[0] ?? null;
const authorizedNodeForgeAdvisories = highOrCriticalAdvisories.filter(
  (advisory) =>
    advisory.name === "node-forge" &&
    getGhsaId(advisory) === nodeForgeException.advisory,
);
const authorizedBracesAdvisories = highOrCriticalAdvisories.filter(
  (advisory) =>
    advisory.name === "braces" &&
    getGhsaId(advisory) === bracesException.advisory,
);

if (
  (report.metadata?.vulnerabilities?.critical ?? 0) !== 0 ||
  highOrCriticalAdvisories.length !== 2 ||
  authorizedNodeForgeAdvisories.length !== 1 ||
  authorizedBracesAdvisories.length !== 1 ||
  JSON.stringify(highOrCriticalPackages) !==
    JSON.stringify(expectedAffectedPackages)
) {
  fail(
    "Mobile audit failed: an unapproved high/critical advisory or dependency path is present.",
    audit.stdout,
  );
}

console.warn(
  [
    `Mobile production dependency audit: only ${nodeForgeException.advisory} and ${bracesException.advisory} are separately and temporarily approved.`,
    "Classification: BUILD/TOOLING ONLY; not reachable from the BASOUL Android runtime.",
    `Node-forge exception: expo@${nodeForgeException.versions.expo}, @expo/cli@${nodeForgeException.versions.cli},`,
    `@expo/code-signing-certificates@${nodeForgeException.versions.certificates}, node-forge@${nodeForgeException.versions.forge}.`,
    `Braces exception: braces@${bracesException.versions.braces}, micromatch@${bracesException.versions.micromatch},`,
    `@expo/metro-file-map@${bracesException.versions.expoMetroFileMap}, metro-file-map@${bracesException.versions.metroFileMap}.`,
    "Exception expires: 2026-10-16.",
    "Any topology/version change or other high/critical advisory fails this gate.",
  ].join(" "),
);
