import { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Screen } from "../../components/Screen";
import { nativeDarkTheme as tokens } from "@yosseuf/ui-tokens/native";
import type { MobileWorkspaceData } from "../../types/domain";

type TimelineItem = { id: string; date: string; time: string; title: string; meta: string; kind: "task" | "project" | "notification"; urgent: boolean };

function displayDate(value: string) {
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  return new Intl.DateTimeFormat("ar-SA", { weekday: "short", day: "numeric", month: "short" }).format(date);
}

export function TimelineScreen({ data, onBack }: { data: MobileWorkspaceData; onBack: () => void }) {
  const items = useMemo<TimelineItem[]>(() => {
    const today = new Date().toISOString().slice(0, 10);
    const taskItems = data.tasks.filter((task) => task.status !== "Done" && task.due_date).map((task) => ({ id: `task-${task.id}`, date: task.due_date!, time: "Ù…ÙˆØ¹Ø¯", title: task.title, meta: `${task.priority} Â· ${task.status}`, kind: "task" as const, urgent: task.due_date! <= today }));
    const projectItems = data.projects.filter((project) => project.due_date && project.status !== "Completed").map((project) => ({ id: `project-${project.id}`, date: project.due_date!, time: "ØªØ³Ù„ÙŠÙ…", title: project.name, meta: `${project.status} Â· ${project.progress}%`, kind: "project" as const, urgent: project.due_date! <= today }));
    const notificationItems = data.notifications.slice(0, 8).map((item) => ({ id: `notification-${item.id}`, date: item.created_at.slice(0, 10), time: new Date(item.created_at).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }), title: item.title, meta: item.message || "ØªÙ†Ø¨ÙŠÙ‡ ØªÙ†ÙÙŠØ°ÙŠ", kind: "notification" as const, urgent: item.priority === "high" && !item.is_read }));
    return [...taskItems, ...projectItems, ...notificationItems].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 30);
  }, [data]);

  return <Screen>
    <View style={styles.header}><TouchableOpacity onPress={onBack} style={styles.back}><Text style={styles.backText}>Ø¹ÙˆØ¯Ø©</Text></TouchableOpacity><View><Text style={styles.kicker}>EXECUTIVE TIMELINE</Text><Text style={styles.title}>Ø§Ù„Ø®Ø· Ø§Ù„Ø²Ù…Ù†ÙŠ</Text></View></View>
    <Text style={styles.summary}>Ø§Ù„Ù…ÙˆØ§Ø¹ÙŠØ¯ ÙˆØ§Ù„ØªØ³Ù„ÙŠÙ…Ø§Øª ÙˆØ§Ù„ØªÙ†Ø¨ÙŠÙ‡Ø§Øª ÙÙŠ Ù…Ø³Ø§Ø± ÙˆØ§Ø­Ø¯.</Text>
    {items.length === 0 ? <View style={styles.emptyCard}><Text style={styles.emptyTitle}>Ù„Ø§ ØªÙˆØ¬Ø¯ Ø£Ø­Ø¯Ø§Ø« Ù‚Ø§Ø¯Ù…Ø©</Text><Text style={styles.empty}>Ø£Ø¶Ù Ù…ÙˆØ§Ø¹ÙŠØ¯ Ù„Ù„Ù…Ù‡Ø§Ù… ÙˆØ§Ù„Ù…Ø´Ø§Ø±ÙŠØ¹ Ù„ØªØ¸Ù‡Ø± Ù‡Ù†Ø§.</Text></View> : items.map((item, index) => <View key={item.id} style={styles.row}>
      <View style={styles.rail}><View style={[styles.dot, item.urgent && styles.dotUrgent]} />{index < items.length - 1 ? <View style={styles.line} /> : null}</View>
      <View style={[styles.card, item.urgent && styles.cardUrgent]}><View style={styles.cardTop}><Text style={styles.time}>{item.time}</Text><Text style={styles.date}>{displayDate(item.date)}</Text></View><Text style={styles.itemTitle}>{item.title}</Text><Text style={styles.meta}>{item.kind === "task" ? "Ù…Ù‡Ù…Ø©" : item.kind === "project" ? "Ù…Ø´Ø±ÙˆØ¹" : "ØªÙ†Ø¨ÙŠÙ‡"} Â· {item.meta}</Text></View>
    </View>)}
  </Screen>;
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: tokens.space.md }, back: { borderWidth: 1, borderColor: tokens.colors.border, borderRadius: tokens.radius.md, paddingHorizontal: 14, paddingVertical: 9 }, backText: { color: tokens.colors.primary, fontWeight: "800" }, kicker: { color: tokens.colors.primary, fontSize: 10, fontWeight: "900", textAlign: "right" }, title: { color: tokens.colors.text, fontSize: 31, fontWeight: "900", textAlign: "right" }, summary: { color: tokens.colors.muted, textAlign: "right", marginTop: 10, marginBottom: 24 }, row: { flexDirection: "row", alignItems: "stretch" }, rail: { width: 26, alignItems: "center" }, dot: { width: 11, height: 11, borderRadius: 6, backgroundColor: tokens.colors.primary, marginTop: 22 }, dotUrgent: { backgroundColor: tokens.colors.danger }, line: { width: 1, flex: 1, backgroundColor: tokens.colors.border, marginVertical: 5 }, card: { flex: 1, backgroundColor: tokens.colors.surface, borderWidth: 1, borderColor: tokens.colors.border, borderRadius: tokens.radius.md, padding: 16, marginBottom: 12 }, cardUrgent: { borderColor: tokens.colors.dangerBorder }, cardTop: { flexDirection: "row", justifyContent: "space-between" }, time: { color: tokens.colors.primary, fontWeight: "800", fontSize: 12 }, date: { color: tokens.colors.muted, fontSize: 12 }, itemTitle: { color: tokens.colors.text, fontSize: 17, fontWeight: "900", textAlign: "right", marginTop: 10 }, meta: { color: tokens.colors.muted, textAlign: "right", marginTop: 6, lineHeight: 19 }, emptyCard: { backgroundColor: tokens.colors.surface, borderWidth: 1, borderColor: tokens.colors.border, borderRadius: tokens.radius.lg, padding: 24 }, emptyTitle: { color: tokens.colors.text, textAlign: "right", fontWeight: "900", fontSize: 18 }, empty: { color: tokens.colors.muted, textAlign: "right", marginTop: 8 }
});
