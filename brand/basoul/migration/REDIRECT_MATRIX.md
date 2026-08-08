# Redirect Matrix

All destinations are proposals pending domain ownership, legal clearance, security review, and explicit approval.

| Old URL or route | Proposed new URL or route | Type | Duration | SEO implications | Rollback route |
|---|---|---|---|---|---|
| `https://yosseuf-os.vercel.app/` | approved BASOUL canonical web domain | 308 after staged 302 validation | minimum 24 months; reassess traffic | transfer canonical signals; preserve path/query; update sitemap and canonical tags | remove redirect and restore old host as canonical |
| future YOSSEUF custom web domain | matching BASOUL canonical path | 301 after validation | indefinite for public links | strongest authority transfer; monitor crawl errors and backlinks | restore DNS/origin and canonical metadata |
| GitHub `Yosseuf3/YOSSEUF--OS` | approved BASOUL repository URL | provider redirect plus documentation update | indefinite | code search and inbound documentation links depend on provider redirect | rename repository back and restore remotes |
| `yosseufos://auth/callback` | future BASOUL scheme callback | parallel allowlist; no forced redirect | entire installed-app compatibility lifetime | no SEO effect; critical Auth/deep-link compatibility | keep legacy callback primary |
| YOSSEUF Auth site/redirect URLs | matching approved BASOUL URLs | allowlist addition before canonical switch | minimum legacy session/app lifetime | canonical host consistency; avoid open redirects | restore prior site URL and keep old allowlist |
| `X-YOSSEUF-Organization` API selector | `X-BASOUL-Organization` | application compatibility alias, not HTTP redirect | at least two stable API releases | no SEO effect; client contract risk | continue old header as preferred |
| YOSSEUF documentation URLs | corresponding BASOUL documentation URLs | 301/308 path-preserving | indefinite | preserve indexed technical content and anchors | restore old docs routing |
| YOSSEUF social profile links | approved BASOUL technology profile links | profile-link transition | minimum 12 months | social discovery rather than crawler authority | restore prior links/bios |
