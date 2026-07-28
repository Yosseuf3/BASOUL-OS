# YOSSEUF OS v3.0.0-alpha.12 — Test Checklist

- [ ] Deploy the updated `architectural-analyze` Edge Function with JWT verification.
- [ ] Upload a vector PDF containing literal text labels.
- [ ] Verify explicit room keywords are stored as `room` elements.
- [ ] Verify numeric values with supported units are stored as `dimension` elements.
- [ ] Verify other readable text is stored as `label` elements.
- [ ] Verify every automatic element starts with status `detected`.
- [ ] Confirm, correct, and reject extracted elements from the web workflow.
- [ ] Confirm or reject extracted elements from the mobile workflow.
- [ ] Verify scanned images do not produce fabricated text elements.
- [ ] Verify release consistency, TypeScript, lint, and production build.

This release reuses the Alpha.11 database schema and requires a new Edge Function deployment.
