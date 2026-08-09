import { Text, TouchableOpacity, View } from "react-native";
import { Screen } from "../../components/Screen";
import { hasMobilePermission, type MobileOrganizationRole } from "../../permissions/organization";

export function AdministrationScreen({ role, onBack }: { role: MobileOrganizationRole; onBack: () => void }) {
  return <Screen>
    <TouchableOpacity onPress={onBack}><Text selectable>العودة</Text></TouchableOpacity>
    <Text selectable style={{ fontSize: 28, fontWeight: "900", textAlign: "right" }}>إدارة المؤسسة</Text>
    <View style={{ gap: 8 }}>
      <Text selectable style={{ textAlign: "right" }}>الدور الحالي: {role}</Text>
      <Text selectable style={{ textAlign: "right" }}>{hasMobilePermission(role, "manage_members") ? "يمكنك إدارة الأعضاء" : "قائمة الأعضاء للقراءة فقط"}</Text>
      <Text selectable style={{ textAlign: "right" }}>{hasMobilePermission(role, "manage_organization") ? "يمكنك إدارة إعدادات المؤسسة" : "إعدادات المؤسسة متاحة للمالك فقط"}</Text>
    </View>
  </Screen>;
}
