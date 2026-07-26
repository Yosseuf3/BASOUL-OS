import { StatusBar } from "expo-status-bar";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { isMobileConfigured } from "./src/config/supabase";
import { tokens } from "./src/theme/tokens";

const priorities = ["راجع المشروع الأقرب للتسليم", "أنشئ مهام للمشروعات النشطة", "تابع المعاملات المالية المعلقة"];

export default function App() {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.kicker}>YOSSEUF OS · MOBILE FOUNDATION</Text>
        <Text style={styles.title}>مركز القيادة</Text>
        <Text style={styles.subtitle}>وصول سريع إلى قراراتك ومشروعاتك من أي مكان.</Text>

        <View style={styles.brief}>
          <Text style={styles.label}>الملخص التنفيذي</Text>
          <Text style={styles.briefTitle}>مساء النور، Yosseuf</Text>
          <Text style={styles.body}>تطبيق الهاتف أصبح جزءًا من معمارية المنصة. الخطوة التالية ربط الجلسة والبيانات الحية.</Text>
        </View>

        <View style={styles.row}>
          <View style={styles.metric}><Text style={styles.metricValue}>2</Text><Text style={styles.metricLabel}>مشاريع نشطة</Text></View>
          <View style={styles.metric}><Text style={styles.metricValue}>76%</Text><Text style={styles.metricLabel}>صحة العمل</Text></View>
        </View>

        <Text style={styles.sectionTitle}>ماذا أفعل الآن؟</Text>
        {priorities.map((item, index) => <View key={item} style={styles.priority}><Text style={styles.priorityIndex}>{index + 1}</Text><Text style={styles.priorityText}>{item}</Text></View>)}

        <TouchableOpacity style={styles.primary}><Text style={styles.primaryText}>فتح المشروعات</Text></TouchableOpacity>
        <Text style={styles.status}>{isMobileConfigured ? "Supabase configured" : "أضف مفاتيح Supabase في ملف .env لبدء الربط"}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.colors.background },
  container: { padding: tokens.space.lg, direction: "rtl" },
  kicker: { color: tokens.colors.gold, fontWeight: "800", letterSpacing: 1, marginTop: tokens.space.lg },
  title: { color: tokens.colors.text, fontSize: 36, fontWeight: "900", marginTop: tokens.space.sm, textAlign: "right" },
  subtitle: { color: tokens.colors.muted, fontSize: 16, lineHeight: 26, textAlign: "right", marginBottom: tokens.space.xl },
  brief: { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border, borderWidth: 1, borderRadius: tokens.radius.lg, padding: tokens.space.lg },
  label: { color: tokens.colors.gold, fontWeight: "800", textAlign: "right" },
  briefTitle: { color: tokens.colors.text, fontSize: 24, fontWeight: "900", textAlign: "right", marginTop: tokens.space.sm },
  body: { color: tokens.colors.muted, lineHeight: 24, textAlign: "right", marginTop: tokens.space.sm },
  row: { flexDirection: "row", gap: tokens.space.md, marginTop: tokens.space.md },
  metric: { flex: 1, backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border, borderWidth: 1, borderRadius: tokens.radius.md, padding: tokens.space.lg },
  metricValue: { color: tokens.colors.success, fontSize: 26, fontWeight: "900", textAlign: "right" },
  metricLabel: { color: tokens.colors.muted, textAlign: "right", marginTop: 4 },
  sectionTitle: { color: tokens.colors.text, fontSize: 22, fontWeight: "900", textAlign: "right", marginTop: tokens.space.xl, marginBottom: tokens.space.md },
  priority: { flexDirection: "row-reverse", alignItems: "center", gap: tokens.space.md, backgroundColor: tokens.colors.surface, borderRadius: tokens.radius.md, padding: tokens.space.md, marginBottom: tokens.space.sm },
  priorityIndex: { color: tokens.colors.background, backgroundColor: tokens.colors.gold, width: 30, height: 30, borderRadius: 15, textAlign: "center", lineHeight: 30, fontWeight: "900" },
  priorityText: { color: tokens.colors.text, flex: 1, textAlign: "right" },
  primary: { backgroundColor: tokens.colors.gold, padding: tokens.space.md, borderRadius: tokens.radius.md, marginTop: tokens.space.lg },
  primaryText: { color: tokens.colors.background, fontWeight: "900", textAlign: "center", fontSize: 17 },
  status: { color: tokens.colors.muted, textAlign: "center", marginTop: tokens.space.md, marginBottom: tokens.space.xl },
});
