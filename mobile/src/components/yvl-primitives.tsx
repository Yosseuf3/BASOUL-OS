import type { PropsWithChildren, ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type PressableProps, type TextInputProps, type ViewStyle } from "react-native";
import { basoulYvlNative as tokens } from "@basoul/yvl-adapter/native";

export function YvlCard({ children, raised = false, style }: PropsWithChildren<{ raised?: boolean; style?: ViewStyle }>) {
  return <View style={[styles.card, raised && styles.raised, style]}>{children}</View>;
}

export function YvlButton({ children, tone = "accent", loading = false, disabled, style, ...props }: PressableProps & {
  children: ReactNode;
  tone?: "accent" | "neutral" | "danger";
  loading?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: disabled || loading, busy: loading }} disabled={disabled || loading}
    style={(state) => [styles.button, styles[`button_${tone}`], state.pressed && styles.pressed, (disabled || loading) && styles.disabled, typeof style === "function" ? style(state) : style]} {...props}>
    {loading ? <ActivityIndicator color={tone === "neutral" ? tokens.colors.text : tokens.colors.background} /> : children}
  </Pressable>;
}

export function YvlTextInput(props: TextInputProps) {
  return <TextInput placeholderTextColor={tokens.colors.muted} style={[styles.input, props.style]} {...props} />;
}

export function YvlBadge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "accent" | "success" | "warning" | "danger" }) {
  return <View style={[styles.badge, styles[`badge_${tone}`]]}><Text selectable style={[styles.badgeText, styles[`text_${tone}`]]}>{children}</Text></View>;
}

export function YvlFeedback({ title, detail, tone = "neutral" }: { title: string; detail?: string; tone?: "neutral" | "danger" | "success" }) {
  return <YvlCard><Text selectable style={[styles.feedbackTitle, styles[`text_${tone}`]]}>{title}</Text>{detail ? <Text selectable style={styles.feedbackDetail}>{detail}</Text> : null}</YvlCard>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: tokens.colors.surface, borderWidth: 1, borderColor: tokens.colors.border, borderRadius: tokens.radius.lg, padding: tokens.space.lg, gap: tokens.space.sm, borderCurve: "continuous" },
  raised: { backgroundColor: tokens.colors.surfaceRaised, boxShadow: tokens.elevation.raised },
  button: { minHeight: 44, paddingHorizontal: tokens.space.md, paddingVertical: tokens.space.sm, borderWidth: 1, borderRadius: tokens.radius.md, alignItems: "center", justifyContent: "center", borderCurve: "continuous" },
  button_accent: { backgroundColor: tokens.colors.accent, borderColor: tokens.colors.accent },
  button_neutral: { backgroundColor: tokens.colors.surfaceRaised, borderColor: tokens.colors.border },
  button_danger: { backgroundColor: tokens.colors.danger, borderColor: tokens.colors.danger },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.55 },
  input: { minHeight: 48, color: tokens.colors.textPrimary, backgroundColor: tokens.colors.background, borderWidth: 1, borderColor: tokens.colors.border, borderRadius: tokens.radius.md, paddingHorizontal: tokens.space.md, paddingVertical: tokens.space.sm, textAlign: "right", borderCurve: "continuous" },
  badge: { alignSelf: "flex-start", paddingHorizontal: tokens.space.sm, paddingVertical: tokens.space.xs, borderWidth: 1, borderRadius: tokens.radius.pill },
  badge_neutral: { borderColor: tokens.colors.border }, badge_accent: { borderColor: tokens.colors.accent },
  badge_success: { borderColor: tokens.colors.success }, badge_warning: { borderColor: tokens.colors.warning }, badge_danger: { borderColor: tokens.colors.danger },
  badgeText: { fontSize: tokens.typography.size.xs, fontWeight: "700" },
  text_neutral: { color: tokens.colors.textSecondary }, text_accent: { color: tokens.colors.accent },
  text_success: { color: tokens.colors.success }, text_warning: { color: tokens.colors.warning }, text_danger: { color: tokens.colors.danger },
  feedbackTitle: { color: tokens.colors.textPrimary, fontSize: tokens.typography.size.lg, fontWeight: "700", textAlign: "right" },
  feedbackDetail: { color: tokens.colors.textSecondary, fontSize: tokens.typography.size.sm, lineHeight: 22, textAlign: "right" },
});
