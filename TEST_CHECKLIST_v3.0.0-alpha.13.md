# YOSSEUF OS v3.0.0-alpha.13 — Test Checklist

- [ ] Deploy `architectural-analyze` version 3 with JWT verification.
- [ ] Upload a vector PDF containing horizontal and vertical line operators.
- [ ] Verify axis-aligned segments become `wall` candidates.
- [ ] Verify diagonal, very short, and implausibly long segments are excluded.
- [ ] Verify duplicate segments are stored once.
- [ ] Verify geometry contains PDF start and end coordinates.
- [ ] Verify candidates use confidence 45 and status `detected`.
- [ ] Confirm, correct, and reject wall candidates through the existing review workflow.
- [ ] Verify the mobile screen displays candidate coordinates.
- [ ] Verify no openings are claimed without paired-line/gap evidence.
- [ ] Verify release consistency, TypeScript, lint, and production build.

This release reuses the Alpha.11 schema and requires a new Edge Function deployment.
