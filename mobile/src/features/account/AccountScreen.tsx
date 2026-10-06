import { StyleSheet, Text, View } from "react-native";
import { basoulYvlNative as tokens } from "@basoul/yvl-adapter/native";
import { Screen } from "../../components/Screen";
import { YvlButton, YvlCard } from "../../components/yvl-primitives";

export function AccountScreen({ email, onBack, onSignOut, signingOut, error }: {
  email?: string;
  onBack: () => void;
  onSignOut: () => void;
  signingOut: boolean;
  error: string | null;
}) {
  return <Screen>
    <View style={styles.header}>
      <Text style={styles.title}>الحساب</Text>
      <YvlButton tone="neutral" onPress={onBack} accessibilityLabel="العودة إلى مساحة العمل"><Text style={styles.text}>العودة</Text></YvlButton>
    </View>
    <YvlCard>
      <Text style={styles.text}>الجلسة الحالية</Text>
      {email ? <Text selectable style={styles.email}>{email}</Text> : null}
      <YvlButton tone="neutral" onPress={onSignOut} loading={signingOut} disabled={signingOut} accessibilityLabel="تسجيل الخروج"><Text style={styles.text}>تسجيل الخروج</Text></YvlButton>
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    </YvlCard>
  </Screen>;
}

const styles = StyleSheet.create({
  header: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", marginBottom: tokens.space.lg },
  title: { color: tokens.colors.textPrimary, fontSize: 24, fontWeight: "700" },
  text: { color: tokens.colors.textPrimary, fontWeight: "700", textAlign: "right" },
  email: { color: tokens.colors.textSecondary, textAlign: "right", marginBottom: tokens.space.md },
  error: { color: tokens.colors.danger, textAlign: "right" },
});
