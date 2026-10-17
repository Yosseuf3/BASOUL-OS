import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync("supabase/functions/architectural-analyze-v2/index.ts", "utf8");

test("hybrid Architecture parser decompresses AutoCAD PDF streams", () => {
  assert.match(source, /DecompressionStream\("deflate"\)/);
  assert.match(source, /\/FlateDecode\\b/);
  assert.match(source, /pdfContentStreams/);
});

test("hybrid parser applies PDF transformation matrices and topology-aware vector geometry", () => {
  assert.match(source, /function multiply\(/);
  assert.match(source, /token\s*===\s*"cm"/);
  assert.match(source, /token\s*===\s*"m"/);
  assert.match(source, /token\s*===\s*"l"/);
  assert.match(source, /token\s*===\s*"re"/);
  assert.match(source, /function inferWalls\(/);
  assert.match(source, /paired_lines_v4/);
  assert.match(source, /topology_line_v4/);
  assert.match(source, /function inferOpenings\(/);
});

test("hybrid parser reads both Tj and TJ text operators", () => {
  assert.match(source, /\\s\*Tj/);
  assert.match(source, /\\s\*TJ/);
});

test("vision augments vector extraction with dedicated architectural semantic passes", () => {
  assert.match(source, /visionPass/);
  assert.match(source, /\["structure","openings","spaces"\]/);
  assert.match(source, /Promise\.all/);
  assert.match(source, /mergeHybrid\(vectorElements,visionElements\)/);
  assert.doesNotMatch(source, /planElements\.length\s*===\s*0[\s\S]{0,160}visionPass/);
});

test("Architectural Understanding v4 persists fusion diagnostics and counts", () => {
  assert.match(source, /architectural-understanding-v4/);
  assert.match(source, /vectorElementCount/);
  assert.match(source, /visionElementCount/);
  assert.match(source, /counts/);
  assert.match(source, /ARCH_UNDERSTANDING_V4/);
});
