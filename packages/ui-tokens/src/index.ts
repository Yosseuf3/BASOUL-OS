/** YOSSEUF Design System Foundation v1.0.0 semantic contract. */
export const foundationVersion = "1.0.0" as const;

export const tokens = {
  color: {
    background: "var(--ys-surface-canvas)",
    surface: "var(--ys-surface-base)",
    surfaceSubtle: "var(--ys-surface-subtle)",
    surfaceRaised: "var(--ys-surface-raised)",
    primary: "var(--ys-action-primary)",
    primaryHover: "var(--ys-action-primary-hover)",
    text: "var(--ys-text-primary)",
    textSecondary: "var(--ys-text-secondary)",
    muted: "var(--ys-text-muted)",
    border: "var(--ys-border-default)",
    borderStrong: "var(--ys-border-strong)",
    success: "var(--ys-status-success)",
    danger: "var(--ys-status-danger)",
    warning: "var(--ys-status-warning)",
    info: "var(--ys-status-info)",
  },
  spacing: { xs: "var(--ys-space-2)", sm: "var(--ys-space-4)", md: "var(--ys-space-6)", lg: "var(--ys-space-8)", xl: "var(--ys-space-10)" },
  radius: { sm: "var(--ys-radius-sm)", md: "var(--ys-radius-md)", lg: "var(--ys-radius-lg)", xl: "var(--ys-radius-xl)" },
  motion: { fast: "var(--ys-motion-duration-fast)", normal: "var(--ys-motion-duration-normal)", slow: "var(--ys-motion-duration-slow)" },
} as const;
