# YOSSEUF OS v1.0.0 — Official Launch Checklist

## Repository

- [ ] Upload the contents of this package to the repository root.
- [ ] Confirm the default branch contains `package.json` version `1.0.0`.
- [ ] Confirm the README screenshot renders correctly.
- [ ] Confirm no secrets or `.env.local` files are committed.
- [ ] Protect the stable branch and require the Quality Gate before merging.

## Validation

- [ ] GitHub Actions Quality Gate passes.
- [ ] Vercel production deployment is Ready.
- [ ] Sign-in and sign-out work.
- [ ] Dashboard loads without visible errors.
- [ ] Projects, tasks, clients, knowledge, finance, activity, and notifications open correctly.
- [ ] Universal Quick Create and Global Search work.
- [ ] Desktop and mobile smoke tests pass.

## Git release

```bash
git add .
git commit -m "release: YOSSEUF OS v1.0.0 stable"
git push origin main
git tag -a v1.0.0 -m "YOSSEUF OS v1.0.0 Stable"
git push origin v1.0.0
```

## GitHub Release

- [ ] Create a new release from tag `v1.0.0`.
- [ ] Title it `YOSSEUF OS v1.0.0 Stable — First Official Release`.
- [ ] Paste the contents of `GITHUB_RELEASE_v1.0.0.md`.
- [ ] Attach `YOSSEUF-OS-v1.0.0-STABLE-OFFICIAL-LAUNCH.zip`.
- [ ] Mark the release as the latest release.
- [ ] Do not mark it as a pre-release.

## Post-launch

- [ ] Create branch `develop` from `main`.
- [ ] Create milestone `v1.1 Business Intelligence`.
- [ ] Keep v1.0.0 stable while new features are developed separately.
