import { Text, TouchableOpacity, View } from "react-native";
import { Screen } from "../../components/Screen";
import { hasMobilePermission, type MobileOrganizationRole } from "../../permissions/organization";

export function AdministrationScreen({ role, onBack }: { role: MobileOrganizationRole; onBack: () => void }) {
  return <Screen>
    <TouchableOpacity onPress={onBack}><Text selectable>Ø§Ù„Ø¹ÙˆØ¯Ø©</Text></TouchableOpacity>
    <Text selectable style={{ fontSize: 28, fontWeight: "900", textAlign: "right" }}>Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…Ø¤Ø³Ø³Ø©</Text>
    <View style={{ gap: 8 }}>
      <Text selectable style={{ textAlign: "right" }}>Ø§Ù„Ø¯ÙˆØ± Ø§Ù„Ø­Ø§Ù„ÙŠ: {role}</Text>
      <Text selectable style={{ textAlign: "right" }}>{hasMobilePermission(role, "manage_members") ? "ÙŠÙ…ÙƒÙ†Ùƒ Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø£Ø¹Ø¶Ø§Ø¡" : "Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø£Ø¹Ø¶Ø§Ø¡ Ù„Ù„Ù‚Ø±Ø§Ø¡Ø© ÙÙ‚Ø·"}</Text>
      <Text selectable style={{ textAlign: "right" }}>{hasMobilePermission(role, "manage_organization") ? "ÙŠÙ…ÙƒÙ†Ùƒ Ø¥Ø¯Ø§Ø±Ø© Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ù…Ø¤Ø³Ø³Ø©" : "Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ù…Ø¤Ø³Ø³Ø© Ù…ØªØ§Ø­Ø© Ù„Ù„Ù…Ø§Ù„Ùƒ ÙÙ‚Ø·"}</Text>
    </View>
  </Screen>;
}

