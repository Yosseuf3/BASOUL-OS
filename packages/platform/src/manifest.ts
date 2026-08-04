export const PLATFORM_MANIFEST = {
  schemaVersion: 1,
  id: "yosseuf-platform",
  name: "YOSSEUF Platform",
  version: "4.0.0-rc.1",
  channel: "release-candidate",
  authority: "YOSSEUF HQ",
  compatibility: {
    product: "YOSSEUF OS",
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
