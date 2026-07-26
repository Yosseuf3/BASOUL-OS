import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Screen } from "../../components/Screen";
import { tokens } from "../../theme/tokens";
import type { Notification } from "../../types/domain";

export function NotificationsScreen({ notifications, onBack, onRead }: { notifications: Notification[]; onBack: () => void; onRead: (id: string) => void }) {
  return (
    <Screen>
      <View style={styles.header}><TouchableOpacity onPress={onBack} style={styles.back}><Text style={styles.backText}>عودة</Text></TouchableOpacity><Text style={styles.title}>الإشعارات</Text></View>
      <Text style={styles.summary}>{notifications.filter((item) => !item.is_read).length} غير مقروء</Text>
      {notifications.length === 0 ? <Text style={styles.empty}>لا توجد إشعارات حاليًا.</Text> : notifications.map((item) => (
        <TouchableOpacity key={item.id} style={[styles.card, !item.is_read && styles.unread]} onPress={() => !item.is_read && onRead(item.id)}>
          <View style={styles.cardTop}><Text style={styles.priority}>{item.priority === "high" ? "عاجل" : item.priority === "medium" ? "مهم" : "معلومة"}</Text><Text style={styles.date}>{new Intl.DateTimeFormat("ar-SA", { month: "short", day: "numeric" }).format(new Date(item.created_at))}</Text></View>
          <Text style={styles.name}>{item.title}</Text>
          {item.message ? <Text style={styles.message}>{item.message}</Text> : null}
          {!item.is_read ? <Text style={styles.hint}>اضغط لتحديده كمقروء</Text> : null}
        </TouchableOpacity>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: tokens.space.md },
  title: { color: tokens.colors.text, fontSize: 32, fontWeight: "900", textAlign: "right" },
  back: { borderWidth: 1, borderColor: tokens.colors.border, borderRadius: tokens.radius.md, paddingHorizontal: 14, paddingVertical: 9 },
  backText: { color: tokens.colors.gold, fontWeight: "800" },
  summary: { color: tokens.colors.muted, textAlign: "right", marginTop: tokens.space.sm, marginBottom: tokens.space.lg },
  empty: { color: tokens.colors.muted, textAlign: "center", marginTop: tokens.space.xl },
  card: { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border, borderWidth: 1, borderRadius: tokens.radius.md, padding: tokens.space.lg, marginBottom: tokens.space.sm },
  unread: { borderColor: tokens.colors.gold },
  cardTop: { flexDirection: "row-reverse", justifyContent: "space-between" },
  priority: { color: tokens.colors.gold, fontWeight: "900" },
  date: { color: tokens.colors.muted, fontSize: 12 },
  name: { color: tokens.colors.text, fontSize: 18, fontWeight: "900", textAlign: "right", marginTop: tokens.space.sm },
  message: { color: tokens.colors.muted, textAlign: "right", lineHeight: 22, marginTop: 5 },
  hint: { color: tokens.colors.success, textAlign: "right", marginTop: tokens.space.sm, fontSize: 12 },
});
