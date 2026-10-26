import assert from "node:assert/strict";
import test from "node:test";
import { classifyCadChanges, main } from "../scripts/vercel-ignore-cad-build.mjs";

const cases = [
  ["Web-only change", ["app/page.tsx", "packages/ui/index.ts"], true],
  ["RLS migration", ["supabase/migrations/20261025043233_project_files_organization_correlation.sql"], true],
  ["Mobile and docs", ["mobile/app.json", "docs/operations/readme.md"], true],
  ["CAD source", ["tools/cad-ingestion/server.py"], false],
  ["CAD Dockerfile", ["tools/cad-ingestion/Dockerfile.vercel"], false],
  ["Vercel configuration", ["vercel.json"], false],
  ["CAD ignore script", ["scripts/vercel-ignore-cad-build.mjs"], false],
  ["shared ignore script", ["scripts/vercel-ignore-build.mjs"], false],
  ["root npm lock is not a Python container input", ["package-lock.json"], true],
  ["root Web manifest is not a Python container input", ["package.json"], true],
  ["unknown root file", ["unclassified.config"], false],
  ["unknown folder", ["new-root/thing.txt"], false],
  ["mixed CAD and Web", ["app/page.tsx", "tools/cad-ingestion/requirements.txt"], false],
  ["empty diff", [], false],
  ["path traversal", ["../tools/cad-ingestion/server.py"], false],
];
for (const [name, files, skip] of cases) {
  test(name, () => assert.equal(classifyCadChanges(files).skip, skip));
}
test("missing Vercel Git metadata fails open (build)", () => assert.equal(main({}), 1));
