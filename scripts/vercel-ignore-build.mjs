import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SAFE_IGNORE_PATTERNS = [
  { label: "mobile-only changes", test: (path) => path.startsWith("mobile/") },
  { label: "documentation-only changes", test: (path) => path.startsWith("docs/") },
  { label: "documentation-only changes", test: (path) => !path.includes("/") && path.toLowerCase().endsWith(".md") },
  { label: "GitHub workflow-only changes", test: (path) => path.startsWith(".github/workflows/") },
];

function normalizePath(path) {
  return path.replaceAll("\\", "/").replace(/^\.\//, "");
}

export function classifyChangedFiles(files) {
  if (!Array.isArray(files) || files.length === 0) {
    return { skip: false, reason: "empty or ambiguous change set" };
  }

  const normalized = files.map(normalizePath);
  for (const path of normalized) {
    if (!path || path.startsWith("../") || !SAFE_IGNORE_PATTERNS.some(({ test }) => test(path))) {
      return { skip: false, reason: `web-relevant or unknown change detected: ${path || "<invalid path>"}` };
    }
  }

  const labels = new Set(normalized.map((path) => SAFE_IGNORE_PATTERNS.find(({ test }) => test(path)).label));
  return {
    skip: true,
    reason: labels.size === 1 ? [...labels][0] : "all changes are in verified web-irrelevant paths",
  };
}

function validSha(value) {
  return typeof value === "string" && /^[0-9a-f]{40}$/i.test(value);
}

export function changedFilesFromVercel(env = process.env) {
  const previousSha = env.VERCEL_GIT_PREVIOUS_SHA;
  const currentSha = env.VERCEL_GIT_COMMIT_SHA;

  if (!validSha(previousSha) || !validSha(currentSha) || previousSha === currentSha) {
    throw new Error("missing or ambiguous Vercel Git commit metadata");
  }

  for (const sha of [previousSha, currentSha]) {
    const check = spawnSync("git", ["cat-file", "-e", `${sha}^{commit}`], { encoding: "utf8" });
    if (check.status !== 0) throw new Error(`commit is unavailable in the checkout: ${sha.slice(0, 12)}`);
  }

  const diff = spawnSync("git", ["diff", "--name-only", "-z", previousSha, currentSha, "--"], {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
  if (diff.status !== 0 || diff.error) throw new Error("git diff failed");

  const files = diff.stdout.split("\0").filter(Boolean);
  if (files.length === 0) throw new Error("git diff returned no changed files");
  return files;
}

export function main(env = process.env) {
  console.log("Vercel Ignore Build:");
  try {
    const result = classifyChangedFiles(changedFilesFromVercel(env));
    console.log(`${result.skip ? "SKIP" : "BUILD"} — ${result.reason}`);
    return result.skip ? 0 : 1;
  } catch (error) {
    console.log(`BUILD — unable to determine a safe change set: ${error instanceof Error ? error.message : "unexpected error"}`);
    return 1;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.exitCode = main();
}
