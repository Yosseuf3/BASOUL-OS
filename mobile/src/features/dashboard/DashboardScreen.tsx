import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Screen } from "../../components/Screen";
import { tokens } from "../../theme/tokens";
import type { MobileWorkspaceData } from "../../types/domain";

function dueSoon(date: string | null): boolean {
  if (!date) return false;
  const days = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
  return days >= 0 && days <= 7;
}

export function DashboardScreen({ data, onNavigate, onRefresh, refreshing }: { data: MobileWorkspaceData; onNavigate: (screen: "projects" | "notifications") => void; onRefresh: () => void; refreshing: boolean }) {
  const activeProjects = data.projects.filter((project) => project.status === "Active").length;
  const overdueTasks = data.tasks.filter((task) => task.status !== "Done" && task.due_date && new Date(task.due_date).getTime() < Date.now()).length;
  const unread = data.notifications.filter((notification) => !notification.is_read).length;
  const urgentProject = data.projects.find((project) => project.status === "Active" && dueSoon(project.due_date) && project.progress < 80);
  const priority = overdueTasks > 0
    ? `ابدأ بمعالجة ${overdueTasks} مهام متأخرة.`
    : urgentProject
      ? `راجع مشروع ${urgentProject.name} قبل موعد التسليم القريب.`
      : activeProjects > 0
        ? "حافظ على إيقاع التنفيذ وحدث تقدم المشاريع النشطة."
        : "أنشئ أول مشروع نشط لبدء خطة التنفيذ.";

  const health = Math.max(35, Math.min(100, 90 - overdueTasks * 8 - data.projects.filter((project) => project.status === "On Hold").length * 5));

  return (
    <Screen>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.kicker}>YOSSEUF OS · EXECUTIVE MOBILE</Text>
          <Text style={styles.title}>لوحة القيادة</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refresh}><Text style={styles.refreshText}>{refreshing ? "…" : "تحديث"}</Text></TouchableOpacity>
      </View>

      <View style={styles.brief}>
        <Text style={styles.label}>القرار التنفيذي الآن</Text>
        <Text style={styles.briefTitle}>{priority}</Text>
        <Text style={styles.body}>البيانات متزامنة مع نفس مساحة العمل الموجودة على الموقع.</Text>
      </View>

      <View style={styles.metrics}>
        <Metric value={String(activeProjects)} label="مشاريع نشطة" />
        <Metric value={`${health}%`} label="صحة العمل" />
      </View>
      <View style={styles.metrics}>
        <Metric value={String(data.tasks.filter((task) => task.status !== "Done").length)} label="مهام مفتوحة" />
        <Metric value={String(unread)} label="تنبيهات جديدة" />
      </View>

      <Text style={styles.sectionTitle}>وصول سريع</Text>
      <TouchableOpacity style={styles.action} onPress={() => onNavigate("projects")}><Text style={styles.actionTitle}>المشاريع</Text><Text style={styles.actionMeta}>عرض الحالات والتقدم ومواعيد التسليم</Text></TouchableOpacity>
      <TouchableOpacity style={styles.action} onPress={() => onNavigate("notifications")}><Text style={styles.actionTitle}>الإشعارات</Text><Text style={styles.actionMeta}>{unread ? `${unread} إشعارات غير مقروءة` : "كل الإشعارات تمت مراجعتها"}</Text></TouchableOpacity>
    </Screen>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return <View style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "flex-start", marginTop: tokens.space.md, marginBottom: tokens.space.xl },
  kicker: { color: tokens.colors.gold, fontWeight: "900", letterSpacing: 0.8, textAlign: "right" },
  title: { color: tokens.colors.text, fontSize: 34, fontWeight: "900", textAlign: "right", marginTop: 6 },
  refresh: { borderWidth: 1, borderColor: tokens.colors.border, borderRadius: tokens.radius.md, paddingHorizontal: 14, paddingVertical: 10 },
  refreshText: { color: tokens.colors.gold, fontWeight: "800" },
  brief: { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border, borderWidth: 1, borderRadius: tokens.radius.lg, padding: tokens.space.lg },
  label: { color: tokens.colors.gold, fontWeight: "900", textAlign: "right" },
  briefTitle: { color: tokens.colors.text, fontSize: 23, fontWeight: "900", textAlign: "right", lineHeight: 34, marginTop: tokens.space.sm },
  body: { color: tokens.colors.muted, lineHeight: 23, textAlign: "right", marginTop: tokens.space.sm },
  metrics: { flexDirection: "row", gap: tokens.space.md, marginTop: tokens.space.md },
  metric: { flex: 1, backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border, borderWidth: 1, borderRadius: tokens.radius.md, padding: tokens.space.lg },
  metricValue: { color: tokens.colors.success, fontSize: 26, fontWeight: "900", textAlign: "right" },
  metricLabel: { color: tokens.colors.muted, textAlign: "right", marginTop: 4 },
  sectionTitle: { color: tokens.colors.text, fontSize: 22, fontWeight: "900", textAlign: "right", marginTop: tokens.space.xl, marginBottom: tokens.space.md },
  action: { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border, borderWidth: 1, borderRadius: tokens.radius.md, padding: tokens.space.lg, marginBottom: tokens.space.sm },
  actionTitle: { color: tokens.colors.text, fontSize: 18, fontWeight: "900", textAlign: "right" },
  actionMeta: { color: tokens.colors.muted, textAlign: "right", marginTop: 5 },
});
