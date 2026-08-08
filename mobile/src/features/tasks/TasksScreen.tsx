import { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Screen } from "../../components/Screen";
import { nativeDarkTheme as tokens } from "@yosseuf/ui-tokens/native";
import type { Project, Task } from "../../types/domain";

type Filter = "Open" | "Overdue" | "All";
const statusLabels: Record<Task["status"], string> = { "To Do": "للعمل", "In Progress": "قيد التنفيذ", Review: "مراجعة", Done: "مكتملة" };
const priorityLabels: Record<Task["priority"], string> = { Low: "منخفضة", Medium: "متوسطة", High: "عالية", Critical: "حرجة" };

export function TasksScreen({ tasks, projects, onBack, onCreate, onAdvance }: { tasks: Task[]; projects: Project[]; onBack: () => void; onCreate: () => void; onAdvance: (task: Task) => void }) {
  const [filter, setFilter] = useState<Filter>("Open");
  const today = new Date().toISOString().slice(0, 10);
  const filtered = useMemo(() => tasks.filter((task) => filter === "All" || (filter === "Open" ? task.status !== "Done" : task.status !== "Done" && Boolean(task.due_date && task.due_date < today))).sort((a, b) => (a.due_date || "9999").localeCompare(b.due_date || "9999")), [tasks, filter, today]);
  const projectName = (id: string) => projects.find((project) => project.id === id)?.name || "مشروع غير متاح";

  return <Screen>
    <View style={styles.header}><TouchableOpacity onPress={onBack} style={styles.outline}><Text style={styles.outlineText}>عودة</Text></TouchableOpacity><Text style={styles.title}>المهام</Text></View>
    <View style={styles.toolbar}><TouchableOpacity style={styles.create} onPress={onCreate}><Text style={styles.createText}>+ مهمة جديدة</Text></TouchableOpacity><Text style={styles.summary}>{filtered.length} مهمة</Text></View>
    <View style={styles.filters}>{(["Open", "Overdue", "All"] as Filter[]).map((item) => <TouchableOpacity key={item} onPress={() => setFilter(item)} style={[styles.filter, filter === item && styles.filterActive]}><Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item === "Open" ? "مفتوحة" : item === "Overdue" ? "متأخرة" : "الكل"}</Text></TouchableOpacity>)}</View>
    {filtered.length === 0 ? <Text style={styles.empty}>لا توجد مهام ضمن هذا التصنيف.</Text> : filtered.map((task) => {
      const overdue = task.status !== "Done" && Boolean(task.due_date && task.due_date < today);
      return <View key={task.id} style={[styles.card, overdue && styles.cardDanger]}>
        <View style={styles.cardTop}><Text style={[styles.priority, task.priority === "Critical" && styles.critical]}>{priorityLabels[task.priority]}</Text><Text style={styles.status}>{statusLabels[task.status]}</Text></View>
        <Text style={styles.name}>{task.title}</Text>
        <Text style={styles.project}>{projectName(task.project_id)}</Text>
        <View style={styles.metaRow}><Text style={[styles.date, overdue && styles.danger]}>{task.due_date ? (overdue ? `متأخرة · ${task.due_date}` : `الموعد · ${task.due_date}`) : "بدون موعد"}</Text><Text style={styles.progress}>{task.progress}%</Text></View>
        <View style={styles.track}><View style={[styles.fill, { width: `${Math.max(0, Math.min(100, task.progress))}%` }]} /></View>
        {task.status !== "Done" ? <TouchableOpacity style={styles.advance} onPress={() => onAdvance(task)}><Text style={styles.advanceText}>تحديث للمرحلة التالية</Text></TouchableOpacity> : null}
      </View>;
    })}
  </Screen>;
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: tokens.space.md }, title: { color: tokens.colors.text, fontSize: 32, fontWeight: "900" },
  outline: { borderWidth: 1, borderColor: tokens.colors.border, borderRadius: tokens.radius.md, paddingHorizontal: 14, paddingVertical: 9 }, outlineText: { color: tokens.colors.primary, fontWeight: "800" },
  toolbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: tokens.space.md }, create: { backgroundColor: tokens.colors.primary, borderRadius: tokens.radius.md, paddingHorizontal: 15, paddingVertical: 11 }, createText: { color: tokens.colors.background, fontWeight: "900" }, summary: { color: tokens.colors.muted },
  filters: { flexDirection: "row-reverse", gap: 8, marginVertical: tokens.space.lg }, filter: { borderWidth: 1, borderColor: tokens.colors.border, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 }, filterActive: { backgroundColor: tokens.colors.primary, borderColor: tokens.colors.primary }, filterText: { color: tokens.colors.muted, fontWeight: "800" }, filterTextActive: { color: tokens.colors.background },
  empty: { color: tokens.colors.muted, textAlign: "center", marginTop: tokens.space.xl }, card: { backgroundColor: tokens.colors.surface, borderWidth: 1, borderColor: tokens.colors.border, borderRadius: tokens.radius.lg, padding: tokens.space.lg, marginBottom: tokens.space.md }, cardDanger: { borderColor: tokens.colors.dangerBorder },
  cardTop: { flexDirection: "row-reverse", justifyContent: "space-between" }, priority: { color: tokens.colors.primary, fontWeight: "900" }, critical: { color: tokens.colors.danger }, status: { color: tokens.colors.success, fontWeight: "800" }, name: { color: tokens.colors.text, fontSize: 20, fontWeight: "900", textAlign: "right", marginTop: 12 }, project: { color: tokens.colors.muted, textAlign: "right", marginTop: 5 },
  metaRow: { flexDirection: "row-reverse", justifyContent: "space-between", marginTop: 15 }, date: { color: tokens.colors.muted }, danger: { color: tokens.colors.danger }, progress: { color: tokens.colors.text, fontWeight: "800" }, track: { height: 7, backgroundColor: tokens.colors.background, borderRadius: 5, overflow: "hidden", marginTop: 9 }, fill: { height: "100%", backgroundColor: tokens.colors.primary }, advance: { alignSelf: "flex-end", marginTop: 14, borderWidth: 1, borderColor: tokens.colors.border, borderRadius: tokens.radius.sm, paddingHorizontal: 12, paddingVertical: 9 }, advanceText: { color: tokens.colors.primary, fontWeight: "800" },
});
