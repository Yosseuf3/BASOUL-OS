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
      setMessage("أضف مفاتيح Supabase داخل ملف .env أولًا.");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setMessage("أدخل البريد الإلكتروني لإرسال رابط الدخول.");
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
    setMessage("تم إرسال رابط الدخول. افتح الرسالة من هذا الجهاز واضغط الرابط للعودة إلى التطبيق.");
  }

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.kicker}>BASOUL · MOBILE</Text>
        <Text style={styles.title}>مركز القيادة معك دائمًا</Text>
        <Text style={styles.subtitle}>استخدم رابط الدخول الآمن نفسه المستخدم في نسخة الويب.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>الدخول عبر البريد</Text>
        <Text style={styles.label}>البريد الإلكتروني</Text>
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
          {loading ? <ActivityIndicator color={tokens.colors.background} /> : <Text style={styles.buttonText}>إرسال رابط الدخول</Text>}
        </TouchableOpacity>
        <Text style={styles.help}>الرابط صالح لمرة واحدة. يجب فتحه على الجهاز الذي يحتوي على التطبيق.</Text>
        <Text style={styles.config}>{isMobileConfigured ? "الاتصال بالمنصة جاهز" : "إعداد Supabase مطلوب"}</Text>
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
