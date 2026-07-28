# YOSSEUF OS v3.0.0-alpha.16 — Test Checklist

## Release quality

- [ ] `npm run check:release`
- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] `npm run mobile:typecheck`
- [ ] `npm run mobile:doctor`

## Raster PDF vision

- [ ] Upload a raster-heavy PDF and verify that vision fallback runs.
- [ ] Verify that detected elements are stored with `vision_bbox` geometry.
- [ ] Verify that confidence never exceeds 78 before human confirmation.
- [ ] Verify that a file with no reliable elements returns `needs_better_source`.
- [ ] Verify that vector PDFs continue to use deterministic extraction first.
- [ ] Verify that files above 20 MB skip vision and return an explainable warning.
- [ ] Confirm `OPENAI_API_KEY` exists only as an encrypted Edge Function secret.
- [ ] Confirm the OpenAI request uses `store: false`.

## Human review

- [ ] Confirm or reject a vision-detected element from mobile.
- [ ] Verify that no opening is automatically classified as a door or window without visible evidence.

