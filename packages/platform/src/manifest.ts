export const PLATFORM_MANIFEST = {
  schemaVersion: 1,
  id: "basoul-platform",
  name: "BASOUL",
  version: "4.0.0-beta.1",
  channel: "beta",
  authority: "BASOUL HQ",
  compatibility: {
    product: "BASOUL OS",
    minimumVersion: "3.1.0",
    mode: "additive",
  },
  boundaries: {
    production: "read-only-unless-approved",
    staging: "migration-validation",
    research: "isolated",
  },
} as const;

export type PlatformManifest = typeof PLATFORM_MANIFEST;
