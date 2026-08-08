export const yvlColors = {
  background: "#05070A", surface: "#0B1017", surfaceElevated: "#111A24",
  electricBlue: "#1976FF", cyan: "#24D6FF", silver: "#B8C3D1", white: "#F7FAFC",
  textMuted: "#8391A3", border: "#253244", focus: "#69E4FF",
  success: "#31D19A", warning: "#F4B740", danger: "#FF5D73",
} as const;

export const yvlColorCssVariables = {
  "--yvl-color-background": yvlColors.background, "--yvl-color-surface": yvlColors.surface,
  "--yvl-color-surface-elevated": yvlColors.surfaceElevated, "--yvl-color-electric-blue": yvlColors.electricBlue,
  "--yvl-color-cyan": yvlColors.cyan, "--yvl-color-silver": yvlColors.silver, "--yvl-color-white": yvlColors.white,
  "--yvl-color-text-muted": yvlColors.textMuted, "--yvl-color-border": yvlColors.border, "--yvl-color-focus": yvlColors.focus,
  "--yvl-color-success": yvlColors.success, "--yvl-color-warning": yvlColors.warning, "--yvl-color-danger": yvlColors.danger,
} as const;
