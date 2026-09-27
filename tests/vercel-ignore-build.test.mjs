import assert from "node:assert/strict";
import test from "node:test";

import { classifyChangedFiles, main } from "../scripts/vercel-ignore-build.mjs";

const cases = [
  ["mobile source", ["mobile/src/example.ts"], true],
  ["documentation", ["docs/architecture.md"], true],
  ["mobile workflow", [".github/workflows/mobile-preview.yml"], true],
  ["web app", ["web/example.tsx"], false],
  ["root package manifest", ["package.json"], false],
  ["npm lockfile", ["package-lock.json"], false],
  ["pnpm lockfile", ["pnpm-lock.yaml"], false],
  ["yarn lockfile", ["yarn.lock"], false],
  ["Vercel config", ["vercel.json"], false],
  ["mixed mobile and web", ["mobile/example.ts", "web/example.tsx"], false],
  ["mixed docs and package manifest", ["docs/readme.md", "package.json"], false],
  ["unknown directory", ["unknown/new-directory/file.txt"], false],
  ["root Markdown", ["README.md"], true],
  ["empty change set", [], false],
];

for (const [name, files, expectedSkip] of cases) {
  test(name, () => assert.equal(classifyChangedFiles(files).skip, expectedSkip));
}

test("missing Git metadata fails open", () => {
  assert.equal(main({}), 1);
});

test("ambiguous commit range fails open", () => {
  const sha = "a".repeat(40);
  assert.equal(main({ VERCEL_GIT_PREVIOUS_SHA: sha, VERCEL_GIT_COMMIT_SHA: sha }), 1);
});
