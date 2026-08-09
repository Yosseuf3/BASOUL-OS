import { foundationColorValues } from "@yosseuf/ui-tokens";
import { yvlGeneratedTokens } from "@yosseuf/yvl-tokens/generated";

/** BASOUL product semantics. YVL governs behavior; Brand Foundation supplies identity accent only. */
export const basoulYvlVersion = "1.0.0" as const;
export const basoulYvl = {
  color: {
    background: "var(--basoul-background)",
    surface: "var(--basoul-surface)",
    surfaceRaised: "var(--basoul-surface-raised)",
    textPrimary: "var(--basoul-text-primary)",
    textSecondary: "var(--basoul-text-secondary)",
    border: "var(--basoul-border)",
    accent: "var(--basoul-accent)",
    success: "var(--basoul-success)",
    warning: "var(--basoul-warning)",
    danger: "var(--basoul-danger)",
    focus: "var(--basoul-focus)",
    disabled: "var(--basoul-disabled)",
  },
  spacing: yvlGeneratedTokens.spacing,
  radius: yvlGeneratedTokens.radii,
  elevation: yvlGeneratedTokens.shadows,
  typography: yvlGeneratedTokens.typography,
  motion: yvlGeneratedTokens.motion,
  identity: { accent: foundationColorValues.primary },
} as const;

export type BasoulYvl = typeof basoulYvl;
