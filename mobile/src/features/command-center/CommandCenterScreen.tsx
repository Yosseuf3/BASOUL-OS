import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { runExecutiveKernel } from "../../executive/executiveKernel";
import type { SignalSeverity } from "../../executive/types";
import { nativeDarkTheme as tokens } from "@yosseuf/ui-tokens/native";
import type { MobileWorkspaceData } from "../../types/domain";

type Props = { data: MobileWorkspaceData; onBack: () => void };

const severityLabel: Record<SignalSeverity, string> = {
  critical: "حرج",
  warning: "انتباه",
  positive: "مستقر",
  info: "معلومة",
};

export function CommandCenterScreen({ data, onBack }: Props) {
  const snapshot = runExecutiveKernel(data);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}><Text style={styles.back}>رجوع</Text></TouchableOpacity>
        <View><Text style={styles.eyebrow}>BASOUL · EXECUTIVE KERNEL</Text><Text style={styles.title}>مركز القيادة</Text></View>
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroLabel}>ماذا يجب أن تفعل الآن؟</Text>
        <Text style={styles.heroTitle}>{snapshot.headline}</Text>
        <Text style={styles.heroBrief}>{snapshot.brief}</Text>
        <Text style={styles.confidence}>ثقة التحليل {snapshot.confidence}%</Text>
      </View>

      <View style={styles.healthCard}>
        <Text style={styles.sectionTitle}>صحة مساحة العمل</Text>
        <Text style={styles.healthScore}>{snapshot.health.score}%</Text>
        {snapshot.health.factors.map((factor) => (
          <View key={factor.id} style={styles.factor}>
            <View style={styles.row}><Text style={styles.factorScore}>{factor.score}%</Text><Text style={styles.factorLabel}>{factor.label}</Text></View>
            <Text style={styles.explanation}>{factor.explanation}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>القرارات التنفيذية</Text>
      {snapshot.signals.map((signal, index) => (
        <View key={signal.id} style={styles.card}>
          <View style={styles.row}><Text style={styles.badge}>{severityLabel[signal.severity]}</Text><Text style={styles.rank}>#{index + 1}</Text></View>
          <Text style={styles.cardTitle}>{signal.title}</Text>
          <Text style={styles.explanation}>{signal.explanation}</Text>
          <Text style={styles.action}>الإجراء: {signal.recommendedAction}</Text>
        </View>
      ))}

      <Text style={styles.sectionTitle}>المخاطر المتوقعة</Text>
      {snapshot.risks.length === 0 ? <View style={styles.card}><Text style={styles.cardTitle}>لا توجد مخاطر تنبؤية واضحة حاليًا</Text></View> : null}
      {snapshot.risks.map((risk) => (
        <View key={risk.id} style={styles.card}>
          <View style={styles.row}><Text style={styles.badge}>{risk.probability}%</Text><Text style={styles.rank}>خلال {risk.horizonDays} أيام</Text></View>
          <Text style={styles.cardTitle}>{risk.title}</Text>
          <Text style={styles.explanation}>{risk.reason}</Text>
          <Text style={styles.action}>التخفيف: {risk.mitigation}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: tokens.colors.background },
  content: { padding: 18, paddingBottom: 42, gap: 14 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  back: { color: tokens.colors.primary, fontWeight: "800" },
  eyebrow: { color: tokens.colors.primary, fontSize: 10, fontWeight: "800", textAlign: "right" },
  title: { color: tokens.colors.text, fontSize: 27, fontWeight: "900", textAlign: "right" },
  hero: { backgroundColor: tokens.colors.surface, borderWidth: 1, borderColor: tokens.colors.border, borderRadius: 24, padding: 20 },
  heroLabel: { color: tokens.colors.primary, textAlign: "right", fontWeight: "800" },
  heroTitle: { color: tokens.colors.text, textAlign: "right", fontWeight: "900", fontSize: 24, marginTop: 9 },
  heroBrief: { color: tokens.colors.muted, textAlign: "right", marginTop: 8, lineHeight: 21 },
  confidence: { color: tokens.colors.primary, marginTop: 12, textAlign: "right", fontWeight: "700" },
  healthCard: { backgroundColor: tokens.colors.surface, borderRadius: 20, borderWidth: 1, borderColor: tokens.colors.border, padding: 17, gap: 12 },
  healthScore: { color: tokens.colors.primary, fontSize: 38, fontWeight: "900", textAlign: "right" },
  sectionTitle: { color: tokens.colors.text, fontSize: 19, fontWeight: "900", textAlign: "right", marginTop: 6 },
  factor: { borderTopWidth: 1, borderTopColor: tokens.colors.border, paddingTop: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  factorLabel: { color: tokens.colors.text, fontWeight: "800" },
  factorScore: { color: tokens.colors.primary, fontWeight: "900" },
  card: { backgroundColor: tokens.colors.surface, borderRadius: 18, borderWidth: 1, borderColor: tokens.colors.border, padding: 16 },
  cardTitle: { color: tokens.colors.text, fontSize: 17, fontWeight: "900", textAlign: "right", marginTop: 10 },
  explanation: { color: tokens.colors.muted, textAlign: "right", lineHeight: 20, marginTop: 6 },
  action: { color: tokens.colors.text, textAlign: "right", fontWeight: "700", lineHeight: 20, marginTop: 10 },
  badge: { color: tokens.colors.primary, fontWeight: "900" },
  rank: { color: tokens.colors.muted, fontWeight: "700" },
});
