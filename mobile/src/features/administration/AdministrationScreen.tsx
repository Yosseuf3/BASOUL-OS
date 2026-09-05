import { StyleSheet, Text, View } from "react-native";
import { basoulYvlNative as tokens } from "@basoul/yvl-adapter/native";
import { Screen } from "../../components/Screen";
import { YvlBadge, YvlButton, YvlCard } from "../../components/yvl-primitives";
import { hasMobilePermission, type MobileOrganizationRole } from "../../permissions/organization";

export function AdministrationScreen({ role, onBack }: { role: MobileOrganizationRole; onBack: () => void }) {
  const canManageMembers = hasMobilePermission(role, "manage_members");
  const canManageOrganization = hasMobilePermission(role, "manage_organization");
  return <Screen>
    <View style={styles.header}>
      <View style={styles.heading}>
        <Text selectable style={styles.context}>الإدارة والصلاحيات</Text>
        <Text selectable style={styles.title}>إدارة المؤسسة</Text>
      </View>
      <YvlButton tone="neutral" onPress={onBack}><Text selectable style={styles.backText}>العودة</Text></YvlButton>
    </View>
    <YvlCard raised>
      <Text selectable style={styles.label}>الدور الحالي</Text>
      <YvlBadge tone={role === "owner" ? "accent" : "success"}>{role}</YvlBadge>
    </YvlCard>
    <YvlCard>
      <Text selectable style={styles.cardTitle}>إدارة الأعضاء</Text>
      <Text selectable style={styles.description}>{canManageMembers ? "يمكنك إدارة الأعضاء من واجهة الويب الآمنة." : "قائمة الأعضاء للقراءة فقط وفقاً لدورك."}</Text>
      <YvlBadge tone={canManageMembers ? "success" : "neutral"}>{canManageMembers ? "مسموح" : "قراءة فقط"}</YvlBadge>
    </YvlCard>
    <YvlCard>
      <Text selectable style={styles.cardTitle}>إعدادات المؤسسة</Text>
      <Text selectable style={styles.description}>{canManageOrganization ? "إعدادات المؤسسة متاحة للمالك." : "إعدادات المؤسسة محمية ومقصورة على المالك."}</Text>
      <YvlBadge tone={canManageOrganization ? "accent" : "neutral"}>{canManageOrganization ? "صلاحية المالك" : "محمية"}</YvlBadge>
    </YvlCard>
  </Screen>;
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: tokens.space.md, marginBlockStart: tokens.space.sm, marginBlockEnd: tokens.space.lg },
  heading: { flex: 1, gap: tokens.space.xs },
  context: { color: tokens.colors.info, fontSize: tokens.typography.size.xs, fontWeight: "700", textAlign: "right" },
  title: { color: tokens.colors.textPrimary, fontSize: tokens.typography.size["2xl"], fontWeight: "700", textAlign: "right" },
  backText: { color: tokens.colors.textPrimary, fontWeight: "700" },
  label: { color: tokens.colors.textSecondary, fontSize: tokens.typography.size.sm, textAlign: "right" },
  cardTitle: { color: tokens.colors.textPrimary, fontSize: tokens.typography.size.lg, fontWeight: "700", textAlign: "right" },
  description: { color: tokens.colors.textSecondary, fontSize: tokens.typography.size.sm, lineHeight: 22, textAlign: "right" },
});
