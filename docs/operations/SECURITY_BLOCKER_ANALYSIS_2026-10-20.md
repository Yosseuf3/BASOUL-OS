# Remaining security blockers — 2026-10-20

This is an exposure assessment, not an exception or suppression. No dependency was changed in this execution: no supported patched root package is available.

## Web: five HIGH affected packages, one root advisory

The path is eslint-config-next -> @next/eslint-plugin-next -> fast-glob -> micromatch -> braces 3.0.3. All five entries are in the development tooling graph. Lint/CI/build hosts can encounter crafted glob patterns; ordinary application source does not import this tooling. The production-only npm dependency audit is separately verified. This does not establish zero risk for build machines or a native binary.

| Package | Installed version/path | HIGH cause |
|---|---|---|
| @next/eslint-plugin-next | 16.2.12 at node_modules/@next/eslint-plugin-next | fast-glob |
| braces | 3.0.3 at node_modules/braces | https://github.com/advisories/GHSA-vfj7-8cjw-p6xm |
| eslint-config-next | 16.3.3 at node_modules/eslint-config-next | @next/eslint-plugin-next |
| fast-glob | 3.3.1 at node_modules/fast-glob | micromatch |
| micromatch | 4.0.8 at node_modules/micromatch | braces |

The current registry plugin 16.4.2 still depends on fast-glob 3.3.1; merely upgrading ESLint presets does not remove braces. The automated audit suggestion to downgrade eslint-config-next to 14.2.35 is incompatible with this Next 16 project and was rejected. Do not remove lint rules, relabel dependencies or override braces with an unsupported fork to manufacture a clean audit.

## Android: fifteen HIGH affected packages, two root advisories

The root paths are Expo CLI -> node-forge 1.4.0 (also through @expo/code-signing-certificates), and Metro file-map -> micromatch -> braces 3.0.3. React Native/Metro/Expo parents propagate the same findings; fifteen affected package entries are not fifteen independent advisories. These npm paths serve development, bundling and signing. Existing source import checks do not show direct tooling imports in the app, but are not proof about the installed binary or every generated build. Android release stays blocked.

| Package | Installed version/path | HIGH cause |
|---|---|---|
| @expo/cli | 57.0.31 at node_modules/expo/node_modules/@expo/cli | @expo/code-signing-certificates, @expo/config, @expo/config-plugins, @expo/inline-modules, @expo/metro, @expo/metro-config, @expo/prebuild-config, node-forge |
| @expo/code-signing-certificates | 0.0.6 at node_modules/@expo/code-signing-certificates | node-forge |
| @expo/metro | 56.0.2 at node_modules/@expo/metro | metro, metro-config, metro-file-map, metro-transform-worker |
| @expo/metro-config | 57.0.13 at node_modules/expo/node_modules/@expo/metro-config | @expo/config, @expo/metro |
| @react-native/community-cli-plugin | 0.86.3 at node_modules/@react-native/community-cli-plugin | metro, metro-config |
| @react-native/virtualized-lists | 0.86.3 at node_modules/@react-native/virtualized-lists | react-native |
| braces | 3.0.3 at node_modules/braces | https://github.com/advisories/GHSA-vfj7-8cjw-p6xm |
| expo | 57.0.30 at node_modules/expo | @expo/cli, @expo/config, @expo/config-plugins, @expo/local-build-cache-provider, @expo/metro, @expo/metro-config |
| metro | 0.84.5 at node_modules/metro | metro-config, metro-file-map, metro-transform-worker |
| metro-config | 0.84.5 at node_modules/metro-config | metro |
| metro-file-map | 0.84.5 at node_modules/metro-file-map | micromatch |
| metro-transform-worker | 0.84.5 at node_modules/metro-transform-worker | metro |
| micromatch | 4.0.8 at node_modules/micromatch | braces |
| node-forge | 1.4.0 at node_modules/node-forge | https://github.com/advisories/GHSA-86w9-cpqp-85rv |
| react-native | 0.86.3 at node_modules/react-native | @react-native/community-cli-plugin, @react-native/virtualized-lists |

## Supported remediation decision

Registry latest: node-forge 1.4.0; braces 3.0.3. Official advisories currently list no patched release: [node-forge](https://github.com/advisories/GHSA-86w9-cpqp-85rv), [braces](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). Audit suggestions to downgrade Expo to 44 or React Native to 0.72 are unsupported for the current SDK 57 contract and were not applied. Do not use a major SDK change, force override, expired exception or audit omit flag as remediation. The production-only Web audit is a separate exposure measurement, not a substitute for the full audit.

The existing Mobile audit gate continues to fail on its 2026-10-16 expired exception. It was not extended. Previously applied supported brace-expansion/js-yaml patches remain preserved. Full JSON findings and dependency explanations are stored under ignored .git/basoul-local/blocker-*-audit.json and blocker-*-paths.json.
