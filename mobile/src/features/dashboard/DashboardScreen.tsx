import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Screen } from "../../components/Screen";
import { buildExecutiveSnapshot } from "../../decision/executive";
import { basoulYvlNative as tokens } from "@basoul/yvl-adapter/native";
import type { MobileWorkspaceData } from "../../types/domain";

type Destination = "projects" | "tasks" | "notifications" | "intelligence" | "architecture" | "createTask" | "timeline" | "search" | "administration";

export function DashboardScreen({ data, onNavigate, onRefresh, refreshing }: { data: MobileWorkspaceData; onNavigate: (screen: Destination) => void; onRefresh: () => void; refreshing: boolean }) {
  const snapshot = buildExecutiveSnapshot(data);
  const healthDelta = snapshot.overdueTasks === 0 ? "+6" : `-${Math.min(24, snapshot.overdueTasks * 8)}`;
  return <Screen>
    <View style={styles.headerRow}><TouchableOpacity onPress={onRefresh} style={styles.refresh}><Text style={styles.refreshText}>{refreshing ? "…" : "تحديث"}</Text></TouchableOpacity><Text style={styles.title}>مركز القيادة</Text></View>
    <Text style={styles.intro}>رؤية تنفيذية هادئة وواضحة لمساحة العمل.</Text>

    <TouchableOpacity style={styles.search} onPress={() => onNavigate("search")}><Text style={styles.searchIcon}>⌕</Text><Text style={styles.searchText}>بحث شامل في مساحة العمل</Text></TouchableOpacity>

    <View style={styles.brief}><View style={styles.briefAccent} /><View style={styles.briefTop}><Text style={styles.confidence}>ثقة التحليل {snapshot.confidence}%</Text><Text style={styles.label}>ماذا أفعل الآن؟</Text></View><Text style={styles.briefTitle}>{snapshot.headline}</Text><Text style={styles.body}>{snapshot.summary}</Text></View>

    <View style={styles.healthCard}><View><Text style={styles.healthDelta}>{healthDelta} منذ آخر مراجعة</Text><Text style={styles.healthReason}>{snapshot.overdueTasks === 0 ? "لا توجد مهام متأخرة" : `${snapshot.overdueTasks} مهمة متأخرة تؤثر على الأداء`}</Text></View><View><Text style={styles.healthValue}>{snapshot.health}%</Text><Text style={styles.healthLabel}>صحة مساحة العمل</Text></View></View>

    <View style={styles.metrics}><Metric value={String(snapshot.activeProjects)} label="مشاريع نشطة" /><Metric value={String(snapshot.openTasks)} label="مهام مفتوحة" /></View>

    <Text style={styles.sectionTitle}>إجراءات سريعة</Text>
    <View style={styles.quickGrid}><Quick title="+ مهمة" meta="إنشاء وتنفيذ" onPress={() => onNavigate("createTask")} /><Quick title="الخط الزمني" meta="المواعيد والأحداث" onPress={() => onNavigate("timeline")} /></View>

    <View style={styles.sectionHeader}><TouchableOpacity onPress={() => onNavigate("tasks")}><Text style={styles.link}>عرض المهام</Text></TouchableOpacity><Text style={styles.sectionTitleInline}>تركيز اليوم</Text></View>
    {snapshot.focusTasks.length === 0 ? <Text style={styles.empty}>لا توجد مهام مفتوحة.</Text> : snapshot.focusTasks.map((task, index) => <TouchableOpacity key={task.id} style={styles.focus} onPress={() => onNavigate("tasks")}><Text style={styles.focusRank}>0{index + 1}</Text><View style={styles.focusBody}><Text style={styles.focusTitle}>{task.title}</Text><Text style={styles.focusMeta}>{task.priority} · {task.status} · {task.due_date || "بدون موعد"}</Text></View></TouchableOpacity>)}

    <Text style={styles.sectionTitle}>توصيات تنفيذية</Text>
    {snapshot.recommendations.map((item) => <View key={item.id} style={[styles.recommendation, item.severity === "critical" && styles.critical]}><Text style={styles.recommendationTitle}>{item.title}</Text><Text style={styles.recommendationReason}>{item.reason}</Text><Text style={styles.recommendationAction}>الإجراء: {item.action}</Text></View>)}

    <TouchableOpacity style={styles.commandCenter} onPress={() => onNavigate("intelligence")}><View style={styles.commandAccent} /><Text style={styles.commandKicker}>EXECUTIVE KERNEL</Text><Text style={styles.commandTitle}>فتح مركز القيادة الذكي</Text><Text style={styles.actionMeta}>قرارات مرتبة، صحة مساحة العمل، ومخاطر متوقعة.</Text></TouchableOpacity>

    <Text style={styles.sectionTitle}>وصول سريع</Text><View style={styles.quickGrid}><Quick title="المشاريع" meta={`${data.projects.length} مشروع`} onPress={() => onNavigate("projects")} /><Quick title="الذكاء المعماري" meta={`${data.reviews.length} مراجعات`} onPress={() => onNavigate("architecture")} /></View>
    <TouchableOpacity style={styles.action} onPress={() => onNavigate("architecture")}><Text style={styles.actionTitle}>المخططات والمراجعات</Text><Text style={styles.actionMeta}>{data.drawings.length} مخططات محفوظة · {data.reviews.length} جلسات قابلة للتنفيذ</Text></TouchableOpacity>
    <TouchableOpacity style={styles.action} onPress={() => onNavigate("notifications")}><Text style={styles.actionTitle}>الإشعارات</Text><Text style={styles.actionMeta}>{snapshot.unreadAlerts ? `${snapshot.unreadAlerts} غير مقروءة` : "كل الإشعارات تمت مراجعتها"}</Text></TouchableOpacity>
    <TouchableOpacity style={styles.action} onPress={() => onNavigate("administration")}><Text style={styles.actionTitle}>الإدارة والصلاحيات</Text><Text style={styles.actionMeta}>المؤسسة، الأعضاء، وحدود الدور الحالي</Text></TouchableOpacity>
  </Screen>;
}
function Metric({ value, label }: { value: string; label: string }) { return <View style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>; }
function Quick({ title, meta, onPress }: { title: string; meta: string; onPress: () => void }) { return <TouchableOpacity style={styles.quick} onPress={onPress}><Text style={styles.actionTitle}>{title}</Text><Text style={styles.actionMeta}>{meta}</Text></TouchableOpacity>; }

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: tokens.space.sm },
  title: { color: tokens.colors.text, fontSize: 32, fontWeight: "800", textAlign: "right" },
  intro: { color: tokens.colors.muted, textAlign: "right", marginTop: 6, marginBottom: tokens.space.lg, lineHeight: 22 },
  refresh: { borderWidth: 1, borderColor: tokens.colors.border, borderRadius: tokens.radius.md, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: tokens.colors.surface },
  refreshText: { color: tokens.colors.info, fontWeight: "700" },
  search: { backgroundColor: tokens.colors.surface, borderWidth: 1, borderColor: tokens.colors.border, borderRadius: tokens.radius.md, padding: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  searchText: { color: tokens.colors.muted, textAlign: "right" }, searchIcon: { color: tokens.colors.info, fontSize: 22 },
  brief: { position: "relative", backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border, borderWidth: 1, borderRadius: tokens.radius.lg, padding: tokens.space.lg, overflow: "hidden" },
  briefAccent: { position: "absolute", top: 0, right: 0, bottom: 0, width: 3, backgroundColor: tokens.colors.info },
  briefTop: { flexDirection: "row", justifyContent: "space-between" }, label: { color: tokens.colors.info, fontWeight: "800" }, confidence: { color: tokens.colors.muted, fontSize: 12 },
  briefTitle: { color: tokens.colors.text, fontSize: 22, fontWeight: "800", textAlign: "right", lineHeight: 33, marginTop: tokens.space.sm }, body: { color: tokens.colors.muted, lineHeight: 23, textAlign: "right", marginTop: tokens.space.sm },
  healthCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: tokens.colors.surface, borderWidth: 1, borderColor: tokens.colors.border, borderRadius: tokens.radius.md, padding: 18, marginTop: 14 },
  healthValue: { color: tokens.colors.success, fontSize: 30, fontWeight: "800", textAlign: "right" }, healthLabel: { color: tokens.colors.muted, textAlign: "right", fontSize: 12 }, healthDelta: { color: tokens.colors.info, fontWeight: "700" }, healthReason: { color: tokens.colors.muted, marginTop: 5, maxWidth: 190 },
  metrics: { flexDirection: "row", gap: tokens.space.md, marginTop: tokens.space.md }, metric: { flex: 1, backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border, borderWidth: 1, borderRadius: tokens.radius.md, padding: tokens.space.lg }, metricValue: { color: tokens.colors.text, fontSize: 26, fontWeight: "800", textAlign: "right" }, metricLabel: { color: tokens.colors.muted, textAlign: "right", marginTop: 4 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: tokens.space.xl }, sectionTitle: { color: tokens.colors.text, fontSize: 20, fontWeight: "800", textAlign: "right", marginTop: tokens.space.xl, marginBottom: tokens.space.md }, sectionTitleInline: { color: tokens.colors.text, fontSize: 20, fontWeight: "800", textAlign: "right" }, link: { color: tokens.colors.info, fontWeight: "700" }, empty: { color: tokens.colors.muted, textAlign: "center", marginVertical: tokens.space.lg },
  focus: { flexDirection: "row", gap: 12, alignItems: "center", backgroundColor: tokens.colors.surface, borderWidth: 1, borderColor: tokens.colors.border, borderRadius: tokens.radius.md, padding: 15, marginTop: 10 }, focusRank: { color: tokens.colors.info, fontWeight: "800", fontSize: 17 }, focusBody: { flex: 1 }, focusTitle: { color: tokens.colors.text, fontWeight: "800", textAlign: "right", fontSize: 16 }, focusMeta: { color: tokens.colors.muted, textAlign: "right", marginTop: 4 },
  recommendation: { backgroundColor: tokens.colors.surface, borderWidth: 1, borderColor: tokens.colors.border, borderRadius: tokens.radius.md, padding: 16, marginBottom: 10 }, critical: { borderColor: tokens.colors.dangerBorder }, recommendationTitle: { color: tokens.colors.text, fontWeight: "800", fontSize: 17, textAlign: "right" }, recommendationReason: { color: tokens.colors.muted, textAlign: "right", lineHeight: 20, marginTop: 7 }, recommendationAction: { color: tokens.colors.info, textAlign: "right", fontWeight: "700", marginTop: 9 },
  commandCenter: { position: "relative", backgroundColor: tokens.colors.surfaceRaised, borderWidth: 1, borderColor: tokens.colors.border, borderRadius: tokens.radius.lg, padding: 19, marginTop: 8, overflow: "hidden" }, commandAccent: { position: "absolute", top: 0, left: 0, right: 0, height: 3, backgroundColor: tokens.colors.primary }, commandKicker: { color: tokens.colors.info, fontWeight: "800", fontSize: 10, textAlign: "right", letterSpacing: .8 }, commandTitle: { color: tokens.colors.text, fontWeight: "800", fontSize: 19, textAlign: "right", marginTop: 7 },
  quickGrid: { flexDirection: "row", gap: 12 }, quick: { flex: 1, backgroundColor: tokens.colors.surface, borderWidth: 1, borderColor: tokens.colors.border, borderRadius: tokens.radius.md, padding: 16 }, action: { backgroundColor: tokens.colors.surface, borderWidth: 1, borderColor: tokens.colors.border, borderRadius: tokens.radius.md, padding: 16, marginTop: 12 }, actionTitle: { color: tokens.colors.text, fontWeight: "800", textAlign: "right" }, actionMeta: { color: tokens.colors.muted, textAlign: "right", marginTop: 5 }
});
