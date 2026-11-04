import { useState } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import { basoulYvlNative as tokens } from "@basoul/yvl-adapter/native";
import { YvlButton } from "./yvl-primitives";

// Release prerequisite: publish and approve both public pages before shipping.
// No account identifier, session or document is appended to these URLs.
const links = [
  { label: "سياسة الخصوصية / Privacy policy", url: "https://os.basoul.net/privacy" },
  { label: "طلب حذف الحساب / Request account deletion", url: "https://os.basoul.net/account-deletion" },
] as const;

export function PrivacyLinks() {
  const [opening, setOpening] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function openPage(url: string) {
    setError(null);
    setOpening(url);
    try {
      await Linking.openURL(url);
    } catch {
      setError("تعذر فتح الرابط. حاول مجددًا أو تواصل مع الدعم. Unable to open the link. Retry or contact support.");
    } finally {
      setOpening(null);
    }
  }

  return <View style={styles.container}>
    {links.map(link => <YvlButton key={link.url} tone="neutral" accessibilityRole="link"
      accessibilityLabel={link.label} loading={opening === link.url} disabled={opening !== null}
      onPress={() => void openPage(link.url)}>
      <Text style={styles.text}>{link.label}</Text>
    </YvlButton>)}
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
  </View>;
}

const styles = StyleSheet.create({
  container: { gap: tokens.space.sm, marginTop: tokens.space.md },
  text: { color: tokens.colors.textPrimary, textAlign: "right" },
  error: { color: tokens.colors.danger, textAlign: "right" },
});
