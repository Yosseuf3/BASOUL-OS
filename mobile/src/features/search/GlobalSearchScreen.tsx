import { useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Screen } from "../../components/Screen";
import { basoulYvlNative as tokens } from "@basoul/yvl-adapter/native";
import type { MobileWorkspaceData } from "../../types/domain";

type Result = { id: string; type: "مشروع" | "مهمة" | "تنبيه"; title: string; subtitle: string };

export function GlobalSearchScreen({ data, onBack }: { data: MobileWorkspaceData; onBack: () => void }) {
  const [query, setQuery] = useState("");
  const results = useMemo<Result[]>(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return [];
    const projects = data.projects.filter((item) => [item.name, item.client_name, item.project_number, item.location].some((value) => value?.toLocaleLowerCase().includes(needle))).map((item) => ({ id: `p-${item.id}`, type: "مشروع" as const, title: item.name, subtitle: `${item.status} · ${item.progress}%` }));
    const tasks = data.tasks.filter((item) => item.title.toLocaleLowerCase().includes(needle)).map((item) => ({ id: `t-${item.id}`, type: "مهمة" as const, title: item.title, subtitle: `${item.priority} · ${item.status}` }));
    const notifications = data.notifications.filter((item) => `${item.title} ${item.message || ""}`.toLocaleLowerCase().includes(needle)).map((item) => ({ id: `n-${item.id}`, type: "تنبيه" as const, title: item.title, subtitle: item.message || "بدون تفاصيل" }));
    return [...projects, ...tasks, ...notifications].slice(0, 30);
  }, [data, query]);

  return <Screen>
    <View style={styles.header}><TouchableOpacity onPress={onBack} style={styles.back}><Text style={styles.backText}>عودة</Text></TouchableOpacity><View><Text style={styles.kicker}>GLOBAL SEARCH</Text><Text style={styles.title}>بحث شامل</Text></View></View>
    <TextInput autoFocus value={query} onChangeText={setQuery} style={styles.input} placeholder="ابحث في المشاريع والمهام والتنبيهات" placeholderTextColor={tokens.colors.muted} textAlign="right" />
    {!query.trim() ? <Text style={styles.hint}>اكتب اسم مشروع، عميل، مهمة أو كلمة من تنبيه.</Text> : results.length === 0 ? <Text style={styles.hint}>لا توجد نتائج مطابقة.</Text> : results.map((result) => <View key={result.id} style={styles.card}><View style={styles.top}><Text style={styles.badge}>{result.type}</Text><Text style={styles.resultTitle}>{result.title}</Text></View><Text style={styles.subtitle}>{result.subtitle}</Text></View>)}
  </Screen>;
}
const styles = StyleSheet.create({ header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: tokens.space.md }, back: { borderWidth: 1, borderColor: tokens.colors.border, borderRadius: tokens.radius.md, paddingHorizontal: 14, paddingVertical: 9 }, backText: { color: tokens.colors.primary, fontWeight: "800" }, kicker: { color: tokens.colors.primary, fontSize: 10, fontWeight: "900", textAlign: "right" }, title: { color: tokens.colors.text, fontSize: 31, fontWeight: "900", textAlign: "right" }, input: { backgroundColor: tokens.colors.surface, color: tokens.colors.text, borderWidth: 1, borderColor: tokens.colors.border, borderRadius: tokens.radius.md, paddingHorizontal: 16, paddingVertical: 15, marginTop: 24, fontSize: 16 }, hint: { color: tokens.colors.muted, textAlign: "center", marginTop: 34 }, card: { backgroundColor: tokens.colors.surface, borderWidth: 1, borderColor: tokens.colors.border, borderRadius: tokens.radius.md, padding: 16, marginTop: 12 }, top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, badge: { color: tokens.colors.primary, fontWeight: "900", fontSize: 12 }, resultTitle: { color: tokens.colors.text, fontWeight: "900", fontSize: 17, flex: 1, textAlign: "right", marginLeft: 12 }, subtitle: { color: tokens.colors.muted, textAlign: "right", marginTop: 8 } });
