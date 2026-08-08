# YVL review showcase

This deterministic static document is intentionally outside `app/`, `public/`, and `mobile/`. Open `index.html` directly for design review; it is not shipped by the Next.js or Expo applications.

Every review target has a stable `data-yvl-testid` selector. Content order and labels are fixed. Future screenshot tests should serve this directory as static files, set a 1440 × 1200 viewport, disable browser extensions, wait for `document.fonts.ready`, honor the `prefers-reduced-motion` variant, and capture sections by test ID. Baselines must be reviewed rather than auto-updated.

Sora and Inter are shown as declared stacks only. They are not downloaded or installed.
