# @yosseuf/yvl-tokens

Canonical YVL v1.0 tokens for TypeScript, web, React Native, and Expo. Values use platform-neutral numbers where native APIs require them; `yvlColorCssVariables` maps semantic colors to web custom properties.

```ts
import { yvlTokens, yvlColorCssVariables } from "@yosseuf/yvl-tokens";
```

This package is additive. Do not globally replace existing product styles without a separately approved migration.

Run `npm run generate:yvl` after an approved canonical JSON change. Committed output in `generated/` provides CSS variables, typed web tokens, and numeric React Native/Expo maps. `npm run validate:yvl` rejects invalid canonical data or stale generated files. Host applications remain responsible for loading Sora and Inter; neither font is installed here.
