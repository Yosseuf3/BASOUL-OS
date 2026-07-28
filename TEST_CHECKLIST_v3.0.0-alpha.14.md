# YOSSEUF OS v3.0.0-alpha.14 Test Checklist

## Release

- [ ] Release consistency reports `3.0.0-alpha.14`.
- [ ] Web TypeScript, lint, and production build pass.
- [ ] Mobile TypeScript and Expo Doctor pass.

## Paired Wall Inference

- [ ] A vector PDF with two parallel overlapping lines creates one paired wall candidate.
- [ ] Candidate geometry stores both source lines, centerline, orientation, thickness, and overlap ratio.
- [ ] A segment is not reused across competing paired candidates.
- [ ] Diagonal, implausibly short, or implausibly long segments are ignored.
- [ ] Unpaired axis-aligned segments remain lower-confidence line candidates.
- [ ] Every automatic wall candidate starts as `detected`.
- [ ] No opening is claimed or generated in this release.

## Human Review

- [ ] Web lists inferred candidates with confidence and proposed thickness.
- [ ] Mobile displays centerline, proposed thickness, and overlap evidence.
- [ ] Engineer can confirm or reject every candidate.
