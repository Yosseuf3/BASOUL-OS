import { foundationColorValues } from "@yosseuf/ui-tokens";
import { yvlNativeTokens } from "@yosseuf/yvl-tokens/react-native";

const yvl = yvlNativeTokens;

/** React Native semantic adapter. Platform font families remain native-safe. */
export const basoulYvlNative = {
  colors: {
    background: yvl.color.background,
    surface: yvl.color.surface,
    surfaceSubtle: yvl.color.surface,
    raised: yvl.color.surfaceElevated,
    surfaceRaised: yvl.color.surfaceElevated,
    border: yvl.color.border,
    borderStrong: yvl.color.silver,
    primary: foundationColorValues.primary,
    accent: foundationColorValues.primary,
    primaryHover: foundationColorValues.primary,
    text: yvl.color.white,
    textPrimary: yvl.color.white,
    textSecondary: yvl.color.silver,
    muted: yvl.color.textMuted,
    success: yvl.color.success,
    warning: yvl.color.warning,
    danger: yvl.color.danger,
    dangerBorder: yvl.color.danger,
    dangerSubtle: yvl.color.surfaceElevated,
    info: yvl.color.cyan,
    focus: yvl.color.focus,
    disabled: yvl.color.textMuted,
    primarySubtle: yvl.color.surfaceElevated,
  },
  radius: yvl.radii,
  space: {
    xs: yvl.spacing[2],
    sm: yvl.spacing[3],
    md: yvl.spacing[4],
    lg: yvl.spacing[5],
    xl: yvl.spacing[6],
  },
  elevation: yvl.shadows,
  typography: {
    family: { display: "System", body: "System", mono: "monospace" },
    weight: yvl.typography.fontWeight,
    size: yvl.typography.fontSize,
    lineHeight: yvl.typography.lineHeight,
  },
  motion: yvl.motion.duration,
} as const;

export type BasoulYvlNative = typeof basoulYvlNative;
