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
      setMessage("إعداد الاتصال بالمنصة غير مكتمل.");
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
      else if (value.includes("failed to fetch") || value.includes("network")) setMessage("تعذر الوصول إلى خدمة تسجيل الدخول. تحقق من الاتصال ثم أعد المحاولة.");
      else setMessage("تعذر تسجيل الدخول. تحقق من البيانات وحاول مرة أخرى.");
    }
  }

  return (
    <Screen>
      <View style={styles.shell}>
        <View style={styles.card}>
          <View style={styles.accentRail}>
            <View style={styles.accentPrimary} />
            <View style={styles.accentCyan} />
          </View>

          <View style={styles.brand}>
            <Text style={styles.ecosystem}>AI-NATIVE ECOSYSTEM</Text>
            <Text style={styles.wordmark}>BASOUL</Text>
          </View>

          <View style={styles.copy}>
            <Text style={styles.cardTitle}>تسجيل الدخول</Text>
            <Text style={styles.subtitle}>استخدم بريدك وكلمة المرور للوصول إلى مساحة العمل.</Text>
          </View>

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

          <YvlButton style={[styles.button, loading && styles.disabled]} onPress={() => void signIn()} disabled={loading || !email.trim() || !password}>
            {loading ? <ActivityIndicator color={tokens.colors.text} /> : <Text style={styles.buttonText}>تسجيل الدخول</Text>}
          </YvlButton>

          <View style={styles.statusRow}>
            <View style={[styles.statusDot, !isMobileConfigured && styles.statusDotError]} />
            <Text style={styles.config}>{isMobileConfigured ? "الاتصال بالمنصة جاهز" : "إعداد الاتصال مطلوب"}</Text>
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, justifyContent: "center", paddingVertical: tokens.space.xl },
  card: { backgroundColor: tokens.colors.surface, borderWidth: 1, borderColor: tokens.colors.border, borderRadius: tokens.radius.lg, padding: tokens.space.lg, overflow: "hidden" },
  accentRail: { position: "absolute", top: 0, left: 0, right: 0, height: 3, flexDirection: "row" },
  accentPrimary: { flex: 1, backgroundColor: tokens.colors.primary },
  accentCyan: { flex: 1, backgroundColor: tokens.colors.info },
  brand: { alignItems: "center", marginTop: tokens.space.md, marginBottom: tokens.space.lg },
  ecosystem: { color: tokens.colors.info, fontSize: 10, fontWeight: "800", letterSpacing: 2 },
  wordmark: { color: tokens.colors.text, fontSize: 38, lineHeight: 46, fontWeight: "900", letterSpacing: 3, marginTop: tokens.space.xs },
  copy: { alignItems: "center", marginBottom: tokens.space.lg },
  cardTitle: { color: tokens.colors.text, fontSize: 28, lineHeight: 36, fontWeight: "900", textAlign: "center" },
  subtitle: { color: tokens.colors.muted, fontSize: 14, lineHeight: 24, textAlign: "center", marginTop: tokens.space.sm },
  label: { color: tokens.colors.textSecondary, textAlign: "right", marginBottom: tokens.space.xs, fontWeight: "700", fontSize: 13 },
  input: { color: tokens.colors.text, backgroundColor: tokens.colors.background, borderWidth: 1, borderColor: tokens.colors.border, borderRadius: tokens.radius.md, paddingHorizontal: tokens.space.md, paddingVertical: 14, marginBottom: tokens.space.md },
  error: { color: tokens.colors.danger, textAlign: "right", lineHeight: 21, marginBottom: tokens.space.md },
  button: { backgroundColor: tokens.colors.primary, borderRadius: tokens.radius.md, padding: tokens.space.md, alignItems: "center" },
  disabled: { opacity: 0.55 },
  buttonText: { color: tokens.colors.text, fontWeight: "900", fontSize: 16 },
  statusRow: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", marginTop: tokens.space.md },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: tokens.colors.success, marginLeft: tokens.space.xs },
  statusDotError: { backgroundColor: tokens.colors.danger },
  config: { color: tokens.colors.muted, textAlign: "center", fontSize: 12 },
});
