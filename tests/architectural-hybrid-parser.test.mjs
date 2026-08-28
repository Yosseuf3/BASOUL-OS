import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync("supabase/functions/architectural-analyze-v2/index.ts", "utf8");

test("hybrid Architecture parser decompresses AutoCAD PDF streams", () => {
  assert.match(source, /DecompressionStream\("deflate"\)/);
  assert.match(source, /\/FlateDecode\\b/);
  assert.match(source, /pdfContentStreams/);
});

test("hybrid parser applies PDF transformation matrices and vector geometry", () => {
  assert.match(source, /function multiply\(/);
  assert.match(source, /token === "cm"/);
  assert.match(source, /token === "m"/);
  assert.match(source, /token === "l"/);
  assert.match(source, /token === "re"/);
  assert.match(source, /pairedWalls/);
  assert.match(source, /wallGaps/);
});

test("hybrid parser reads both Tj and TJ text operators", () => {
  assert.match(source, /\\s\*Tj/);
  assert.match(source, /\\s\*TJ/);
});

test("vision augments vector extraction instead of only zero-element fallback", () => {
  assert.match(source, /visionElements = await analyzeWithVision/);
  assert.doesNotMatch(source, /planElements\.length === 0[\s\S]{0,120}analyzeWithVision/);
  assert.match(source, /mergeHybrid\(vectorElements, visionElements\)/);
});

test("hybrid analysis has a distinct engine version and persists fusion metadata", () => {
  assert.match(source, /hybrid-autocad-pdf-v3/);
  assert.match(source, /vectorElementCount/);
  assert.match(source, /visionElementCount/);
  assert.match(source, /HYBRID_PARSER_V3/);
});
