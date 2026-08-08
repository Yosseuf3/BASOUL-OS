import { readFile } from "node:fs/promises";
import { artifacts, loadTokens, pathFor, tokenNames } from "./yvl-artifacts.mjs";

const failures = [];
const kind = (value) => Array.isArray(value) ? "array" : value === null ? "null" : typeof value;

function validate(value, schema, path) {
  if (schema.type && kind(value) !== schema.type) failures.push(`${path}: expected ${schema.type}, received ${kind(value)}`);
  if (schema.const !== undefined && value !== schema.const) failures.push(`${path}: expected ${JSON.stringify(schema.const)}`);
  if (schema.pattern && typeof value === "string" && !new RegExp(schema.pattern).test(value)) failures.push(`${path}: does not match ${schema.pattern}`);
  if (schema.minLength !== undefined && typeof value === "string" && value.length < schema.minLength) failures.push(`${path}: expected at least ${schema.minLength} characters`);
  if (kind(value) !== "object") return;
  if (schema.minProperties !== undefined && Object.keys(value).length < schema.minProperties) failures.push(`${path}: expected at least ${schema.minProperties} properties`);
  if (schema.maxProperties !== undefined && Object.keys(value).length > schema.maxProperties) failures.push(`${path}: expected at most ${schema.maxProperties} properties`);
  for (const key of schema.required ?? []) if (!(key in value)) failures.push(`${path}: missing ${key}`);
  if (schema.additionalProperties === false) {
    const allowed = new Set([...(schema.required ?? []), ...Object.keys(schema.properties ?? {})]);
    for (const key of Object.keys(value)) if (!allowed.has(key)) failures.push(`${path}: unknown property ${key}`);
  }
  for (const [key, childSchema] of Object.entries(schema.properties ?? {})) if (key in value) validate(value[key], childSchema, `${path}.${key}`);
  if (kind(schema.additionalProperties) === "object") {
    const declared = new Set(Object.keys(schema.properties ?? {}));
    for (const [key, child] of Object.entries(value)) if (!declared.has(key)) validate(child, schema.additionalProperties, `${path}.${key}`);
  }
}

const tokens = await loadTokens();
for (const name of tokenNames) {
  const schema = JSON.parse(await readFile(pathFor(`design-system/yvl/schemas/${name}.schema.json`), "utf8"));
  validate(tokens[name], schema, name);
  if (tokens[name].$schema !== `../schemas/${name}.schema.json`) failures.push(`${name}: canonical $schema reference is missing or incorrect`);
}
if (process.argv.includes("--check-generated")) for (const [path, expected] of Object.entries(artifacts(tokens))) {
  let actual = "";
  try { actual = await readFile(pathFor(path), "utf8"); } catch { failures.push(`${path}: missing generated artifact`); continue; }
  if (actual !== expected) failures.push(`${path}: stale; run npm run generate:yvl`);
}
if (failures.length) { console.error(failures.map((failure) => `- ${failure}`).join("\n")); process.exit(1); }
console.log(`YVL schema validation passed for ${tokenNames.length} canonical token files; generated artifacts are current.`);
