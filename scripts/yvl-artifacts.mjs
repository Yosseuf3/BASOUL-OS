import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

export const root = new URL("../", import.meta.url);
export const tokenNames = ["colors", "typography", "spacing", "radii", "shadows", "motion"];
export const generatedHeader = "Generated from design-system/yvl/tokens. Do not edit directly.";

export async function loadTokens() {
  return Object.fromEntries(await Promise.all(tokenNames.map(async (name) => [name, JSON.parse(await readFile(new URL(`design-system/yvl/tokens/${name}.json`, root), "utf8"))])));
}

const camel = (value) => value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
const numeric = (value) => typeof value !== "string" ? value : value === "0" ? 0 : value.endsWith("rem") ? Number.parseFloat(value) * 16 : value.endsWith("px") || value.endsWith("ms") ? Number.parseFloat(value) : value;
const object = (entries) => Object.fromEntries(Object.entries(entries).map(([key, value]) => [camel(key), numeric(value)]));

export function artifacts(tokens) {
  const { colors, typography, spacing, radii, shadows, motion } = tokens;
  const cssGroups = { color: colors.color, font: typography.font, fontWeight: typography.weight, fontSize: typography.size, lineHeight: typography.lineHeight, space: spacing.spacing, radius: radii.radii, shadow: shadows.shadow, duration: motion.duration, easing: motion.easing };
  const css = [`/* ${generatedHeader} */`, ":root {"];
  for (const [group, values] of Object.entries(cssGroups)) for (const [key, value] of Object.entries(values)) css.push(`  --yvl-${group.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}-${key}: ${value};`);
  css.push("}", "");
  const tokenMap = { version: colors.version, color: object(colors.color), typography: { fontFamily: object(typography.font), fontWeight: object(typography.weight), fontSize: object(typography.size), lineHeight: object(typography.lineHeight) }, spacing: object(spacing.spacing), radii: object(radii.radii), shadows: object(shadows.shadow), motion: { duration: object(motion.duration), easing: object(motion.easing), reducedMotion: motion.reducedMotion } };
  const banner = `// ${generatedHeader}\n`;
  return {
    "packages/yvl-tokens/generated/yvl.css": css.join("\n"),
    "packages/yvl-tokens/generated/tokens.ts": `${banner}export const yvlGeneratedTokens = ${JSON.stringify(tokenMap, null, 2)} as const;\n`,
    "packages/yvl-tokens/generated/react-native.ts": `${banner}import { yvlGeneratedTokens } from "./tokens";\nexport const yvlNativeTokens = { color: yvlGeneratedTokens.color, typography: yvlGeneratedTokens.typography, spacing: yvlGeneratedTokens.spacing, radii: yvlGeneratedTokens.radii, shadows: yvlGeneratedTokens.shadows, motion: yvlGeneratedTokens.motion } as const;\n`,
    "packages/yvl-tokens/generated/manifest.json": `${JSON.stringify({ version: colors.version, source: "design-system/yvl/tokens", artifacts: ["yvl.css", "tokens.ts", "react-native.ts"] }, null, 2)}\n`,
  };
}

export const pathFor = (relativePath) => fileURLToPath(new URL(relativePath, root));
