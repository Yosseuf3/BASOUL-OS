import type { PropsWithChildren } from "react";
import { Image, ScrollView, StyleSheet, View } from "react-native";
import { basoulYvlNative as tokens } from "@basoul/yvl-adapter/native";

const APPROVED_ASSET_REF = "3122092e9bc18acd696911aeb54eee7a3dcc26e2";
const BASOUL_OS_LOCKUP = `https://raw.githubusercontent.com/Yosseuf3/BASOUL-OS/${APPROVED_ASSET_REF}/brand/basoul/assets/product-lockups/BASOUL_OS_Lockup.png`;

export function Screen({ children, showBrand = true }: PropsWithChildren<{ showBrand?: boolean }>) {
  return (
    <ScrollView style={styles.safe} contentContainerStyle={styles.scroll} contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled">
      <View style={styles.content}>
        {showBrand ? (
          <View style={styles.brandMasthead} accessibilityRole="image" accessibilityLabel="BASOUL OS">
            <Image source={{ uri: BASOUL_OS_LOCKUP }} resizeMode="contain" style={styles.brandLockup} />
          </View>
        ) : null}
        {children}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.colors.background },
  scroll: { flexGrow: 1 },
  content: { flex: 1, padding: tokens.space.lg, direction: "rtl" },
  brandMasthead: {
    alignItems: "flex-end",
    justifyContent: "center",
    minHeight: 54,
    marginTop: tokens.space.sm,
    marginBottom: tokens.space.md,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
    paddingBottom: tokens.space.sm,
  },
  brandLockup: { width: 170, height: 42 },
});
