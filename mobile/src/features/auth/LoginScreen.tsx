import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Screen } from "../../components/Screen";
import { isMobileConfigured, supabase } from "../../config/supabase";
import { tokens } from "../../theme/tokens";

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function signIn() {
    setMessage(null);
    if (!supabase) {
      setMessage("أضف مفاتيح Supabase داخل ملف .env أولًا.");
      return;
    }
    if (!email.trim() || !password) {
      setMessage("أدخل البريد الإلكتروني وكلمة المرور.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) setMessage(error.message);
  }

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.kicker}>YOSSEUF OS · MOBILE</Text>
        <Text style={styles.title}>مركز القيادة معك دائمًا</Text>
        <Text style={styles.subtitle}>سجّل الدخول إلى نفس مساحة العمل المستخدمة على الويب.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>تسجيل الدخول</Text>
        <Text style={styles.label}>البريد الإلكتروني</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="name@example.com"
          placeholderTextColor={tokens.colors.muted}
          style={styles.input}
          textAlign="right"
        />
        <Text style={styles.label}>كلمة المرور</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
          placeholderTextColor={tokens.colors.muted}
          style={styles.input}
          textAlign="right"
        />
        {message ? <Text style={styles.error}>{message}</Text> : null}
        <TouchableOpacity style={[styles.button, loading && styles.disabled]} onPress={signIn} disabled={loading}>
          {loading ? <ActivityIndicator color={tokens.colors.background} /> : <Text style={styles.buttonText}>دخول</Text>}
        </TouchableOpacity>
        <Text style={styles.config}>{isMobileConfigured ? "الاتصال بالمنصة جاهز" : "إعداد Supabase مطلوب"}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { marginTop: tokens.space.xl, marginBottom: tokens.space.xl },
  kicker: { color: tokens.colors.gold, fontWeight: "900", letterSpacing: 1, textAlign: "right" },
  title: { color: tokens.colors.text, fontSize: 34, fontWeight: "900", textAlign: "right", marginTop: tokens.space.sm, lineHeight: 46 },
  subtitle: { color: tokens.colors.muted, fontSize: 16, lineHeight: 26, textAlign: "right", marginTop: tokens.space.sm },
  card: { backgroundColor: tokens.colors.surface, borderWidth: 1, borderColor: tokens.colors.border, borderRadius: tokens.radius.lg, padding: tokens.space.lg },
  cardTitle: { color: tokens.colors.text, fontSize: 24, fontWeight: "900", textAlign: "right", marginBottom: tokens.space.lg },
  label: { color: tokens.colors.muted, textAlign: "right", marginBottom: 7, fontWeight: "700" },
  input: { color: tokens.colors.text, backgroundColor: tokens.colors.background, borderWidth: 1, borderColor: tokens.colors.border, borderRadius: tokens.radius.md, paddingHorizontal: tokens.space.md, paddingVertical: 14, marginBottom: tokens.space.md },
  error: { color: "#ef8f8f", textAlign: "right", lineHeight: 21, marginBottom: tokens.space.md },
  button: { backgroundColor: tokens.colors.gold, borderRadius: tokens.radius.md, padding: tokens.space.md, alignItems: "center" },
  disabled: { opacity: 0.7 },
  buttonText: { color: tokens.colors.background, fontWeight: "900", fontSize: 17 },
  config: { color: tokens.colors.muted, textAlign: "center", marginTop: tokens.space.md },
});
