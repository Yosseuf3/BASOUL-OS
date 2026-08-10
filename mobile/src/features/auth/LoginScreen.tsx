import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Screen } from "../../components/Screen";
import { YvlButton, YvlTextInput } from "../../components/yvl-primitives";
import { isMobileConfigured, supabase } from "../../config/supabase";
import { basoulYvlNative as tokens } from "@basoul/yvl-adapter/native";

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

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setMessage("أدخل البريد الإلكتروني وكلمة المرور.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });
    setLoading(false);

    if (error) {
      const value = error.message.toLowerCase();
      if (value.includes("invalid login credentials")) setMessage("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
      else if (value.includes("email not confirmed")) setMessage("البريد الإلكتروني غير مؤكد بعد.");
      else if (value.includes("rate limit")) setMessage("تمت محاولات كثيرة خلال فترة قصيرة. حاول لاحقًا.");
      else setMessage("تعذر تسجيل الدخول. تحقق من البيانات والاتصال ثم أعد المحاولة.");
    }
  }

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.kicker}>BASOUL · MOBILE</Text>
        <Text style={styles.title}>مركز القيادة معك دائمًا</Text>
        <Text style={styles.subtitle}>استخدم البريد الإلكتروني وكلمة المرور للوصول إلى مساحة BASOUL.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>تسجيل الدخول</Text>
        <Text style={styles.label}>البريد الإلكتروني</Text>
        <YvlTextInput
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
          returnKeyType="next"
        />
        <Text style={styles.label}>كلمة المرور</Text>
        <YvlTextInput
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          placeholder="••••••••"
          placeholderTextColor={tokens.colors.muted}
          style={styles.input}
          textAlign="right"
          editable={!loading}
          onSubmitEditing={() => void signIn()}
          returnKeyType="done"
        />
        {message ? <Text style={styles.error}>{message}</Text> : null}
        <YvlButton style={[styles.button, loading && styles.disabled]} onPress={() => void signIn()} disabled={loading}>
          {loading ? <ActivityIndicator color={tokens.colors.background} /> : <Text style={styles.buttonText}>تسجيل الدخول</Text>}
        </YvlButton>
        <Text style={styles.help}>مسار التطوير المعتمد: Email + Password. لا يعتمد تسجيل الدخول الأساسي على Magic Link.</Text>
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
  button: { backgroundColor: tokens.colors.primary, borderRadius: tokens.radius.md, padding: tokens.space.md, alignItems: "center" },
  disabled: { opacity: 0.7 },
  buttonText: { color: tokens.colors.background, fontWeight: "900", fontSize: 17 },
  help: { color: tokens.colors.muted, textAlign: "center", marginTop: tokens.space.md, fontSize: 12, lineHeight: 19 },
  config: { color: tokens.colors.muted, textAlign: "center", marginTop: tokens.space.sm },
});
