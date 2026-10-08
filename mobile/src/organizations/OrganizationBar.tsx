import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { basoulYvlNative as tokens } from "@basoul/yvl-adapter/native";
import type { OrganizationSnapshot } from "./context";

export function OrganizationBar({ snapshot, busy, onSelect, onRefresh }: { snapshot: OrganizationSnapshot | null; busy: boolean; onSelect: (id: string) => void; onRefresh: () => void }) {
  return <View style={styles.bar}>
    {snapshot?.selected ? <><Text selectable style={styles.text}>{snapshot.selected.name} · {snapshot.selected.role}</Text><Text selectable style={styles.id}>{snapshot.selected.organizationId}</Text></>
      : <Text style={styles.text}>{busy ? "جارٍ التحقق من المؤسسة…" : snapshot?.memberships.length ? "اختر المؤسسة" : "لا توجد مؤسسة نشطة. أكمل إنشاء المؤسسة أو قبول الدعوة من واجهة الويب."}</Text>}
    {snapshot && snapshot.memberships.length > 1 ? <ScrollView style={styles.selector} accessibilityLabel="اختيار المؤسسة">{snapshot.memberships.map((membership) => <TouchableOpacity key={membership.organizationId} accessibilityRole="button" accessibilityState={{ selected: snapshot.selected?.organizationId === membership.organizationId, disabled: busy }} disabled={busy} onPress={() => onSelect(membership.organizationId)} style={styles.choice}><Text style={styles.text}>{membership.name} · {membership.role}</Text></TouchableOpacity>)}</ScrollView> : null}
    {!busy ? <TouchableOpacity accessibilityRole="button" onPress={onRefresh} style={styles.choice}><Text style={styles.text}>تحديث المؤسسة</Text></TouchableOpacity> : null}
  </View>;
}
const styles = StyleSheet.create({ bar: { paddingHorizontal: tokens.space.lg, paddingVertical: tokens.space.sm, borderBottomWidth: 1, borderColor: tokens.colors.border }, selector: { maxHeight: tokens.space.xl * 6 }, text: { color: tokens.colors.textPrimary, textAlign: "right" }, id: { color: tokens.colors.textSecondary, fontSize: 10, textAlign: "right" }, choice: { minHeight: 44, justifyContent: "center", borderWidth: 1, borderColor: tokens.colors.border, borderRadius: tokens.radius.md, paddingHorizontal: tokens.space.sm, marginTop: tokens.space.xs } });
