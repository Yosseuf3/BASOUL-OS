import type { PropsWithChildren } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { basoulYvlNative as tokens } from "@basoul/yvl-adapter/native";

export function Screen({ children }: PropsWithChildren) {
  return (
    <ScrollView style={styles.safe} contentContainerStyle={styles.scroll} contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled">
        <View style={styles.content}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.colors.background },
  scroll: { flexGrow: 1 },
  content: { flex: 1, padding: tokens.space.lg, direction: "rtl" },
});
