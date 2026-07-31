import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Screen } from "../../components/Screen";
import { nativeDarkTheme as tokens } from "@yosseuf/ui-tokens/native";
import type { Notification } from "../../types/domain";

export function NotificationsScreen({ notifications, onBack, onRead }: { notifications: Notification[]; onBack: () => void; onRead: (id: string) => void }) {
  return (
    <Screen>
      <View style={styles.header}><TouchableOpacity onPress={onBack} style={styles.back}><Text style={styles.backText}>Ø¹ÙˆØ¯Ø©</Text></TouchableOpacity><Text style={styles.title}>Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª</Text></View>
      <Text style={styles.summary}>{notifications.filter((item) => !item.is_read).length} ØºÙŠØ± Ù…Ù‚Ø±ÙˆØ¡</Text>
      {notifications.length === 0 ? <Text style={styles.empty}>Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø­Ø§Ù„ÙŠÙ‹Ø§.</Text> : notifications.map((item) => (
        <TouchableOpacity key={item.id} style={[styles.card, !item.is_read && styles.unread]} onPress={() => !item.is_read && onRead(item.id)}>
          <View style={styles.cardTop}><Text style={styles.priority}>{item.priority === "high" ? "Ø¹Ø§Ø¬Ù„" : item.priority === "medium" ? "Ù…Ù‡Ù…" : "Ù…Ø¹Ù„ÙˆÙ…Ø©"}</Text><Text style={styles.date}>{new Intl.DateTimeFormat("ar-SA", { month: "short", day: "numeric" }).format(new Date(item.created_at))}</Text></View>
          <Text style={styles.name}>{item.title}</Text>
          {item.message ? <Text style={styles.message}>{item.message}</Text> : null}
          {!item.is_read ? <Text style={styles.hint}>Ø§Ø¶ØºØ· Ù„ØªØ­Ø¯ÙŠØ¯Ù‡ ÙƒÙ…Ù‚Ø±ÙˆØ¡</Text> : null}
        </TouchableOpacity>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: tokens.space.md },
  title: { color: tokens.colors.text, fontSize: 32, fontWeight: "900", textAlign: "right" },
  back: { borderWidth: 1, borderColor: tokens.colors.border, borderRadius: tokens.radius.md, paddingHorizontal: 14, paddingVertical: 9 },
  backText: { color: tokens.colors.primary, fontWeight: "800" },
  summary: { color: tokens.colors.muted, textAlign: "right", marginTop: tokens.space.sm, marginBottom: tokens.space.lg },
  empty: { color: tokens.colors.muted, textAlign: "center", marginTop: tokens.space.xl },
  card: { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border, borderWidth: 1, borderRadius: tokens.radius.md, padding: tokens.space.lg, marginBottom: tokens.space.sm },
  unread: { borderColor: tokens.colors.primary },
  cardTop: { flexDirection: "row-reverse", justifyContent: "space-between" },
  priority: { color: tokens.colors.primary, fontWeight: "900" },
  date: { color: tokens.colors.muted, fontSize: 12 },
  name: { color: tokens.colors.text, fontSize: 18, fontWeight: "900", textAlign: "right", marginTop: tokens.space.sm },
  message: { color: tokens.colors.muted, textAlign: "right", lineHeight: 22, marginTop: 5 },
  hint: { color: tokens.colors.success, textAlign: "right", marginTop: tokens.space.sm, fontSize: 12 },
});
