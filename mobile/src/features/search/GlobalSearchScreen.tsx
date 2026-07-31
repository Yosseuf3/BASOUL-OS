import { useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Screen } from "../../components/Screen";
import { nativeDarkTheme as tokens } from "@yosseuf/ui-tokens/native";
import type { MobileWorkspaceData } from "../../types/domain";

type Result = { id: string; type: "Ù…Ø´Ø±ÙˆØ¹" | "Ù…Ù‡Ù…Ø©" | "ØªÙ†Ø¨ÙŠÙ‡"; title: string; subtitle: string };

export function GlobalSearchScreen({ data, onBack }: { data: MobileWorkspaceData; onBack: () => void }) {
  const [query, setQuery] = useState("");
  const results = useMemo<Result[]>(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return [];
    const projects = data.projects.filter((item) => [item.name, item.client_name, item.project_number, item.location].some((value) => value?.toLocaleLowerCase().includes(needle))).map((item) => ({ id: `p-${item.id}`, type: "Ù…Ø´Ø±ÙˆØ¹" as const, title: item.name, subtitle: `${item.status} Â· ${item.progress}%` }));
    const tasks = data.tasks.filter((item) => item.title.toLocaleLowerCase().includes(needle)).map((item) => ({ id: `t-${item.id}`, type: "Ù…Ù‡Ù…Ø©" as const, title: item.title, subtitle: `${item.priority} Â· ${item.status}` }));
    const notifications = data.notifications.filter((item) => `${item.title} ${item.message || ""}`.toLocaleLowerCase().includes(needle)).map((item) => ({ id: `n-${item.id}`, type: "ØªÙ†Ø¨ÙŠÙ‡" as const, title: item.title, subtitle: item.message || "Ø¨Ø¯ÙˆÙ† ØªÙØ§ØµÙŠÙ„" }));
    return [...projects, ...tasks, ...notifications].slice(0, 30);
  }, [data, query]);

  return <Screen>
    <View style={styles.header}><TouchableOpacity onPress={onBack} style={styles.back}><Text style={styles.backText}>Ø¹ÙˆØ¯Ø©</Text></TouchableOpacity><View><Text style={styles.kicker}>GLOBAL SEARCH</Text><Text style={styles.title}>Ø¨Ø­Ø« Ø´Ø§Ù…Ù„</Text></View></View>
    <TextInput autoFocus value={query} onChangeText={setQuery} style={styles.input} placeholder="Ø§Ø¨Ø­Ø« ÙÙŠ Ø§Ù„Ù…Ø´Ø§Ø±ÙŠØ¹ ÙˆØ§Ù„Ù…Ù‡Ø§Ù… ÙˆØ§Ù„ØªÙ†Ø¨ÙŠÙ‡Ø§Øª" placeholderTextColor={tokens.colors.muted} textAlign="right" />
    {!query.trim() ? <Text style={styles.hint}>Ø§ÙƒØªØ¨ Ø§Ø³Ù… Ù…Ø´Ø±ÙˆØ¹ØŒ Ø¹Ù…ÙŠÙ„ØŒ Ù…Ù‡Ù…Ø© Ø£Ùˆ ÙƒÙ„Ù…Ø© Ù…Ù† ØªÙ†Ø¨ÙŠÙ‡.</Text> : results.length === 0 ? <Text style={styles.hint}>Ù„Ø§ ØªÙˆØ¬Ø¯ Ù†ØªØ§Ø¦Ø¬ Ù…Ø·Ø§Ø¨Ù‚Ø©.</Text> : results.map((result) => <View key={result.id} style={styles.card}><View style={styles.top}><Text style={styles.badge}>{result.type}</Text><Text style={styles.resultTitle}>{result.title}</Text></View><Text style={styles.subtitle}>{result.subtitle}</Text></View>)}
  </Screen>;
}
const styles = StyleSheet.create({ header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: tokens.space.md }, back: { borderWidth: 1, borderColor: tokens.colors.border, borderRadius: tokens.radius.md, paddingHorizontal: 14, paddingVertical: 9 }, backText: { color: tokens.colors.primary, fontWeight: "800" }, kicker: { color: tokens.colors.primary, fontSize: 10, fontWeight: "900", textAlign: "right" }, title: { color: tokens.colors.text, fontSize: 31, fontWeight: "900", textAlign: "right" }, input: { backgroundColor: tokens.colors.surface, color: tokens.colors.text, borderWidth: 1, borderColor: tokens.colors.border, borderRadius: tokens.radius.md, paddingHorizontal: 16, paddingVertical: 15, marginTop: 24, fontSize: 16 }, hint: { color: tokens.colors.muted, textAlign: "center", marginTop: 34 }, card: { backgroundColor: tokens.colors.surface, borderWidth: 1, borderColor: tokens.colors.border, borderRadius: tokens.radius.md, padding: 16, marginTop: 12 }, top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, badge: { color: tokens.colors.primary, fontWeight: "900", fontSize: 12 }, resultTitle: { color: tokens.colors.text, fontWeight: "900", fontSize: 17, flex: 1, textAlign: "right", marginLeft: 12 }, subtitle: { color: tokens.colors.muted, textAlign: "right", marginTop: 8 } });
