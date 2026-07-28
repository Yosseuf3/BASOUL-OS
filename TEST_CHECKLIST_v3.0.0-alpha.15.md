# YOSSEUF OS v3.0.0-alpha.15 Test Checklist

## Release

- [ ] Release consistency reports `3.0.0-alpha.15`.
- [ ] Web TypeScript, lint, and production build pass.
- [ ] Mobile TypeScript and Expo Doctor pass.

## Opening Candidates

- [ ] A plausible gap between aligned paired-wall candidates creates an opening candidate.
- [ ] Overlapping or widely separated wall candidates do not create openings.
- [ ] Walls with incompatible orientation or thickness do not create openings.
- [ ] Candidate geometry stores endpoints, width, host wall indexes, and average wall thickness.
- [ ] Duplicate gaps are suppressed and no more than 20 candidates are returned.
- [ ] Candidate confidence remains below automatic-approval level.
- [ ] No candidate is classified automatically as a door or window.

## Human Review

- [ ] Web lists openings with width, confidence, and `detected` status.
- [ ] Mobile displays gap coordinates, width, and reference thickness.
- [ ] Engineer can confirm, correct, or reject every candidate.
