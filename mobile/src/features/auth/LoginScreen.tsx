import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Screen } from "../../components/Screen";
import { isMobileConfigured, supabase } from "../../config/supabase";
import { nativeDarkTheme as tokens } from "@yosseuf/ui-tokens/native";
import { MOBILE_AUTH_CALLBACK } from "./mobileAuth";

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function sendMagicLink() {
    setMessage(null);
    setSent(false);

    if (!supabase) {
      setMessage("Ã˜Â£Ã˜Â¶Ã™Â Ã™â€¦Ã™ÂÃ˜Â§Ã˜ÂªÃ™Å Ã˜Â­ Supabase Ã˜Â¯Ã˜Â§Ã˜Â®Ã™â€ž Ã™â€¦Ã™â€žÃ™Â .env Ã˜Â£Ã™Ë†Ã™â€žÃ™â€¹Ã˜Â§.");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setMessage("Ø£Ø¯Ø®Ù„ Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ Ù„Ø¥Ø±Ø³Ø§Ù„ Ø±Ø§Ø¨Ø· Ø§Ù„Ø¯Ø®ÙˆÙ„.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo: MOBILE_AUTH_CALLBACK,
        shouldCreateUser: false,
      },
    });
    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setSent(true);
    setMessage("Ã˜ÂªÃ™â€¦ Ã˜Â¥Ã˜Â±Ã˜Â³Ã˜Â§Ã™â€ž Ã˜Â±Ã˜Â§Ã˜Â¨Ã˜Â· Ã˜Â§Ã™â€žÃ˜Â¯Ã˜Â®Ã™Ë†Ã™â€ž. Ã˜Â§Ã™ÂÃ˜ÂªÃ˜Â­ Ã˜Â§Ã™â€žÃ˜Â±Ã˜Â³Ã˜Â§Ã™â€žÃ˜Â© Ã™â€¦Ã™â€  Ã™â€¡Ã˜Â°Ã˜Â§ Ã˜Â§Ã™â€žÃ˜Â¬Ã™â€¡Ã˜Â§Ã˜Â² Ã™Ë†Ã˜Â§Ã˜Â¶Ã˜ÂºÃ˜Â· Ã˜Â§Ã™â€žÃ˜Â±Ã˜Â§Ã˜Â¨Ã˜Â· Ã™â€žÃ™â€žÃ˜Â¹Ã™Ë†Ã˜Â¯Ã˜Â© Ã˜Â¥Ã™â€žÃ™â€° Ã˜Â§Ã™â€žÃ˜ÂªÃ˜Â·Ã˜Â¨Ã™Å Ã™â€š.");
  }

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.kicker}>BASOUL Â· MOBILE</Text>
        <Text style={styles.title}>Ù…Ø±ÙƒØ² Ø§Ù„Ù‚ÙŠØ§Ø¯Ø© Ù…Ø¹Ùƒ Ø¯Ø§Ø¦Ù…Ù‹Ø§</Text>
        <Text style={styles.subtitle}>Ã˜Â§Ã˜Â³Ã˜ÂªÃ˜Â®Ã˜Â¯Ã™â€¦ Ã˜Â±Ã˜Â§Ã˜Â¨Ã˜Â· Ã˜Â§Ã™â€žÃ˜Â¯Ã˜Â®Ã™Ë†Ã™â€ž Ã˜Â§Ã™â€žÃ˜Â¢Ã™â€¦Ã™â€  Ã™â€ Ã™ÂÃ˜Â³Ã™â€¡ Ã˜Â§Ã™â€žÃ™â€¦Ã˜Â³Ã˜ÂªÃ˜Â®Ã˜Â¯Ã™â€¦ Ã™ÂÃ™Å  Ã™â€ Ã˜Â³Ã˜Â®Ã˜Â© Ã˜Â§Ã™â€žÃ™Ë†Ã™Å Ã˜Â¨.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø¹Ø¨Ø± Ø§Ù„Ø¨Ø±ÙŠØ¯</Text>
        <Text style={styles.label}>Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder="name@example.com"
          placeholderTextColor={tokens.colors.muted}
          style={styles.input}
          textAlign="right"
          editable={!loading}
          onSubmitEditing={() => void sendMagicLink()}
          returnKeyType="send"
        />
        {message ? <Text style={sent ? styles.success : styles.error}>{message}</Text> : null}
        <TouchableOpacity style={[styles.button, loading && styles.disabled]} onPress={() => void sendMagicLink()} disabled={loading}>
          {loading ? <ActivityIndicator color={tokens.colors.background} /> : <Text style={styles.buttonText}>Ø¥Ø±Ø³Ø§Ù„ Ø±Ø§Ø¨Ø· Ø§Ù„Ø¯Ø®ÙˆÙ„</Text>}
        </TouchableOpacity>
        <Text style={styles.help}>Ã˜Â§Ã™â€žÃ˜Â±Ã˜Â§Ã˜Â¨Ã˜Â· Ã˜ÂµÃ˜Â§Ã™â€žÃ˜Â­ Ã™â€žÃ™â€¦Ã˜Â±Ã˜Â© Ã™Ë†Ã˜Â§Ã˜Â­Ã˜Â¯Ã˜Â©. Ã™Å Ã˜Â¬Ã˜Â¨ Ã™ÂÃ˜ÂªÃ˜Â­Ã™â€¡ Ã˜Â¹Ã™â€žÃ™â€° Ã˜Â§Ã™â€žÃ˜Â¬Ã™â€¡Ã˜Â§Ã˜Â² Ã˜Â§Ã™â€žÃ˜Â°Ã™Å  Ã™Å Ã˜Â­Ã˜ÂªÃ™Ë†Ã™Å  Ã˜Â¹Ã™â€žÃ™â€° Ã˜Â§Ã™â€žÃ˜ÂªÃ˜Â·Ã˜Â¨Ã™Å Ã™â€š.</Text>
        <Text style={styles.config}>{isMobileConfigured ? "Ø§Ù„Ø§ØªØµØ§Ù„ Ø¨Ø§Ù„Ù…Ù†ØµØ© Ø¬Ø§Ù‡Ø²" : "Ø¥Ø¹Ø¯Ø§Ø¯ Supabase Ù…Ø·Ù„ÙˆØ¨"}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { marginTop: tokens.space.xl, marginBottom: tokens.space.xl },
  kicker: { color: tokens.colors.primary, fontWeight: "900", letterSpacing: 1, textAlign: "right" },
  title: { color: tokens.colors.text, fontSize: 34, fontWeight: "900", textAlign: "right", marginTop: tokens.space.sm, lineHeight: 46 },
  subtitle: { color: tokens.colors.muted, fontSize: 16, lineHeight: 26, textAlign: "right", marginTop: tokens.space.sm },
  card: { backgroundColor: tokens.colors.surface, borderWidth: 1, borderColor: tokens.colors.border, borderRadius: tokens.radius.lg, padding: tokens.space.lg },
  cardTitle: { color: tokens.colors.text, fontSize: 24, fontWeight: "900", textAlign: "right", marginBottom: tokens.space.lg },
  label: { color: tokens.colors.muted, textAlign: "right", marginBottom: 7, fontWeight: "700" },
  input: { color: tokens.colors.text, backgroundColor: tokens.colors.background, borderWidth: 1, borderColor: tokens.colors.border, borderRadius: tokens.radius.md, paddingHorizontal: tokens.space.md, paddingVertical: 14, marginBottom: tokens.space.md },
  error: { color: tokens.colors.danger, textAlign: "right", lineHeight: 21, marginBottom: tokens.space.md },
  success: { color: tokens.colors.success, textAlign: "right", lineHeight: 22, marginBottom: tokens.space.md },
  button: { backgroundColor: tokens.colors.primary, borderRadius: tokens.radius.md, padding: tokens.space.md, alignItems: "center" },
  disabled: { opacity: 0.7 },
  buttonText: { color: tokens.colors.background, fontWeight: "900", fontSize: 17 },
  help: { color: tokens.colors.muted, textAlign: "center", marginTop: tokens.space.md, fontSize: 12, lineHeight: 19 },
  config: { color: tokens.colors.muted, textAlign: "center", marginTop: tokens.space.sm },
});
