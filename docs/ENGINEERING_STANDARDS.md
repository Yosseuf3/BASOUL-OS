# YOSSEUF OS Engineering Standards

1. UI components must not contain business decision logic.
2. Feature modules communicate through exported contracts, not internal files.
3. Executive intelligence is accessed through `ExecutiveEngine`.
4. Every recommendation must expose evidence, priority, tone, and confidence where applicable.
5. Release metadata must be sourced from `lib/config/app-info.ts`.
6. Every change must pass release consistency, TypeScript, lint, and production build checks.
