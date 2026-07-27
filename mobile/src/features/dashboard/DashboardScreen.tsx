import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Screen } from "../../components/Screen";
import { buildExecutiveSnapshot } from "../../decision/executive";
import { tokens } from "../../theme/tokens";
import type { MobileWorkspaceData } from "../../types/domain";

type Destination = "projects" | "tasks" | "notifications";

export function DashboardScreen({ data, onNavigate, onRefresh, refreshing }: { data: MobileWorkspaceData; onNavigate: (screen: Destination) => void; onRefresh: () => void; refreshing: boolean }) {
  const snapshot = buildExecutiveSnapshot(data);
  return <Screen>
    <View style={styles.headerRow}><View><Text style={styles.kicker}>YOSSEUF OS · EXECUTIVE WORKSPACE</Text><Text style={styles.title}>مركز القيادة</Text></View><TouchableOpacity onPress={onRefresh} style={styles.refresh}><Text style={styles.refreshText}>{refreshing ? "…" : "تحديث"}</Text></TouchableOpacity></View>

    <View style={styles.brief}><View style={styles.briefTop}><Text style={styles.confidence}>ثقة التحليل {snapshot.confidence}%</Text><Text style={styles.label}>ماذا أفعل الآن؟</Text></View><Text style={styles.briefTitle}>{snapshot.headline}</Text><Text style={styles.body}>{snapshot.summary}</Text></View>

    <View style={styles.metrics}><Metric value={`${snapshot.health}%`} label="صحة العمل" tone={snapshot.health < 60 ? "danger" : "success"} /><Metric value={String(snapshot.activeProjects)} label="مشاريع نشطة" /></View>
    <View style={styles.metrics}><Metric value={String(snapshot.openTasks)} label="مهام مفتوحة" /><Metric value={String(snapshot.overdueTasks)} label="مهام متأخرة" tone={snapshot.overdueTasks ? "danger" : "success"} /></View>

    <View style={styles.sectionHeader}><TouchableOpacity onPress={() => onNavigate("tasks")}><Text style={styles.link}>عرض المهام</Text></TouchableOpacity><Text style={styles.sectionTitle}>تركيز اليوم</Text></View>
    {snapshot.focusTasks.length === 0 ? <Text style={styles.empty}>لا توجد مهام مفتوحة.</Text> : snapshot.focusTasks.map((task, index) => <TouchableOpacity key={task.id} style={styles.focus} onPress={() => onNavigate("tasks")}><Text style={styles.focusRank}>0{index + 1}</Text><View style={styles.focusBody}><Text style={styles.focusTitle}>{task.title}</Text><Text style={styles.focusMeta}>{task.priority} · {task.status} · {task.due_date || "بدون موعد"}</Text></View></TouchableOpacity>)}

    <Text style={styles.sectionTitle}>توصيات تنفيذية</Text>
    {snapshot.recommendations.map((item) => <View key={item.id} style={[styles.recommendation, item.severity === "critical" && styles.critical]}><Text style={styles.recommendationTitle}>{item.title}</Text><Text style={styles.recommendationReason}>{item.reason}</Text><Text style={styles.recommendationAction}>الإجراء: {item.action}</Text></View>)}

    <Text style={styles.sectionTitle}>وصول سريع</Text>
    <View style={styles.quickGrid}><Quick title="المشاريع" meta={`${data.projects.length} مشروع`} onPress={() => onNavigate("projects")} /><Quick title="المهام" meta={`${snapshot.openTasks} مفتوحة`} onPress={() => onNavigate("tasks")} /></View>
    <TouchableOpacity style={styles.action} onPress={() => onNavigate("notifications")}><Text style={styles.actionTitle}>الإشعارات</Text><Text style={styles.actionMeta}>{snapshot.unreadAlerts ? `${snapshot.unreadAlerts} غير مقروءة` : "كل الإشعارات تمت مراجعتها"}</Text></TouchableOpacity>
  </Screen>;
}

function Metric({ value, label, tone }: { value: string; label: string; tone?: "danger" | "success" }) { return <View style={styles.metric}><Text style={[styles.metricValue, tone === "danger" && styles.metricDanger]}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>; }
function Quick({ title, meta, onPress }: { title: string; meta: string; onPress: () => void }) { return <TouchableOpacity style={styles.quick} onPress={onPress}><Text style={styles.actionTitle}>{title}</Text><Text style={styles.actionMeta}>{meta}</Text></TouchableOpacity>; }

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "flex-start", marginTop: tokens.space.md, marginBottom: tokens.space.xl }, kicker: { color: tokens.colors.gold, fontWeight: "900", letterSpacing: .7, textAlign: "right", fontSize: 12 }, title: { color: tokens.colors.text, fontSize: 34, fontWeight: "900", textAlign: "right", marginTop: 6 }, refresh: { borderWidth: 1, borderColor: tokens.colors.border, borderRadius: tokens.radius.md, paddingHorizontal: 14, paddingVertical: 10 }, refreshText: { color: tokens.colors.gold, fontWeight: "800" },
  brief: { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.gold, borderWidth: 1, borderRadius: tokens.radius.lg, padding: tokens.space.lg }, briefTop: { flexDirection: "row-reverse", justifyContent: "space-between" }, label: { color: tokens.colors.gold, fontWeight: "900" }, confidence: { color: tokens.colors.muted, fontSize: 12 }, briefTitle: { color: tokens.colors.text, fontSize: 23, fontWeight: "900", textAlign: "right", lineHeight: 34, marginTop: tokens.space.sm }, body: { color: tokens.colors.muted, lineHeight: 23, textAlign: "right", marginTop: tokens.space.sm },
  metrics: { flexDirection: "row", gap: tokens.space.md, marginTop: tokens.space.md }, metric: { flex: 1, backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border, borderWidth: 1, borderRadius: tokens.radius.md, padding: tokens.space.lg }, metricValue: { color: tokens.colors.success, fontSize: 26, fontWeight: "900", textAlign: "right" }, metricDanger: { color: "#ff8f8f" }, metricLabel: { color: tokens.colors.muted, textAlign: "right", marginTop: 4 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: tokens.space.xl }, sectionTitle: { color: tokens.colors.text, fontSize: 21, fontWeight: "900", textAlign: "right", marginTop: tokens.space.xl, marginBottom: tokens.space.md }, link: { color: tokens.colors.gold, fontWeight: "800" }, empty: { color: tokens.colors.muted, textAlign: "center", padding: 18 },
  focus: { flexDirection: "row-reverse", gap: 13, alignItems: "center", backgroundColor: tokens.colors.surface, borderWidth: 1, borderColor: tokens.colors.border, borderRadius: tokens.radius.md, padding: 15, marginBottom: 9 }, focusRank: { color: tokens.colors.gold, fontSize: 20, fontWeight: "900" }, focusBody: { flex: 1 }, focusTitle: { color: tokens.colors.text, fontWeight: "900", textAlign: "right", fontSize: 16 }, focusMeta: { color: tokens.colors.muted, textAlign: "right", marginTop: 4, fontSize: 12 },
  recommendation: { backgroundColor: tokens.colors.surface, borderLeftWidth: 3, borderLeftColor: tokens.colors.gold, borderRadius: tokens.radius.md, padding: 15, marginBottom: 10 }, critical: { borderLeftColor: "#ff7777" }, recommendationTitle: { color: tokens.colors.text, fontWeight: "900", textAlign: "right", fontSize: 16 }, recommendationReason: { color: tokens.colors.muted, textAlign: "right", lineHeight: 21, marginTop: 5 }, recommendationAction: { color: tokens.colors.gold, textAlign: "right", fontWeight: "700", marginTop: 7 },
  quickGrid: { flexDirection: "row", gap: 10 }, quick: { flex: 1, backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border, borderWidth: 1, borderRadius: tokens.radius.md, padding: tokens.space.lg }, action: { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border, borderWidth: 1, borderRadius: tokens.radius.md, padding: tokens.space.lg, marginTop: 10 }, actionTitle: { color: tokens.colors.text, fontSize: 18, fontWeight: "900", textAlign: "right" }, actionMeta: { color: tokens.colors.muted, textAlign: "right", marginTop: 5 },
});
