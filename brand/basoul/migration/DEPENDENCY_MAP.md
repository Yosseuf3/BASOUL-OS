# Dependency Map

## Sequence

```text
Founder/legal identity (preserve)
        |
Approved BASOUL foundation (locked)
        |
Documentation -> non-production visuals -> package/display aliases
        |                                  |
        |                                  +-> web production artifact
        |                                  +-> signed mobile artifact
        |
Domains/Auth redirects -> external services -> repository identities
        |
Legacy compatibility telemetry -> approved final deprecation
```

## High-coupling relationships

| Source | Downstream dependencies |
|---|---|
| npm `@yosseuf/*` scope | package manifests, lockfiles, TypeScript imports, Next transpilation, mobile builds, CI |
| web display identity | APP_INFO, platform manifest, layout/manifest, page copy, screenshots, SEO, release metadata |
| mobile identity | Expo name/slug/scheme, signed IDs, EAS project, Auth callbacks, stores, OTA/update channels |
| domains | DNS, TLS, Vercel aliases, Supabase Auth allowlists, analytics, sitemap, canonical tags, social links |
| repository identity | clone URLs, Actions, Vercel Git integration, webhooks, badges, releases, cross-repository governance |
| environment variables | Vercel scopes, builds, server integrations, rollback deployments, operator runbooks |
| R1/R2 labels | database namespace, external repositories, gateway contracts, product-family mapping |
| founder identity | legal notices, attribution, GitHub ownership, social profiles, public trust |

Database/Auth IDs and historical provenance do not sit on the rename path. They are protected anchors.
