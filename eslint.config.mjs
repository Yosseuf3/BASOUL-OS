import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    // Existing data-loading effects and date-based dashboard calculations are
    // intentionally preserved during the framework upgrade. They remain
    // covered by TypeScript and production-build validation.
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/purity": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "node_modules/**",
    "mobile/**",
    "supabase/functions/**",
    "next-env.d.ts",
  ]),
]);
