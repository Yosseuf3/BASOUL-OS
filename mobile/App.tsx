import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { Session } from "@supabase/supabase-js";
import { StatusBar } from "expo-status-bar";
import { LoginScreen } from "./src/features/auth/LoginScreen";
import { DashboardScreen } from "./src/features/dashboard/DashboardScreen";
import { NotificationsScreen } from "./src/features/notifications/NotificationsScreen";
import { ProjectsScreen } from "./src/features/projects/ProjectsScreen";
import { isMobileConfigured, supabase } from "./src/config/supabase";
import { loadMobileWorkspace, markMobileNotificationRead } from "./src/services/workspace";
import { tokens } from "./src/theme/tokens";
import type { MobileWorkspaceData } from "./src/types/domain";

const emptyData: MobileWorkspaceData = { projects: [], tasks: [], notifications: [] };
type ScreenName = "dashboard" | "projects" | "notifications";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [booting, setBooting] = useState(true);
  const [loading, setLoading] = useState(false);
  const [screen, setScreen] = useState<ScreenName>("dashboard");
  const [data, setData] = useState<MobileWorkspaceData>(emptyData);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!session?.user.id) return;
    setLoading(true);
    setError(null);
    try {
      setData(await loadMobileWorkspace(session.user.id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر تحميل بيانات مساحة العمل.");
    } finally {
      setLoading(false);
    }
  }, [session?.user.id]);

  useEffect(() => {
    if (!supabase) {
      setBooting(false);
      return;
    }
    void supabase.auth.getSession().then(({ data: result }) => {
      setSession(result.session);
      setBooting(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setScreen("dashboard");
      if (!nextSession) setData(emptyData);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) void refresh();
  }, [session, refresh]);

  async function readNotification(id: string) {
    try {
      await markMobileNotificationRead(id);
      setData((current) => ({ ...current, notifications: current.notifications.map((item) => item.id === id ? { ...item, is_read: true } : item) }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر تحديث الإشعار.");
    }
  }

  if (booting) {
    return <View style={styles.center}><StatusBar style="light" /><ActivityIndicator color={tokens.colors.gold} size="large" /></View>;
  }

  if (!isMobileConfigured || !session) return <><StatusBar style="light" /><LoginScreen /></>;

  return (
    <View style={styles.app}>
      <StatusBar style="light" />
      {error ? <View style={styles.errorBar}><Text style={styles.errorText}>{error}</Text><TouchableOpacity onPress={() => setError(null)}><Text style={styles.dismiss}>×</Text></TouchableOpacity></View> : null}
      {screen === "dashboard" ? <DashboardScreen data={data} onNavigate={setScreen} onRefresh={refresh} refreshing={loading} /> : null}
      {screen === "projects" ? <ProjectsScreen projects={data.projects} onBack={() => setScreen("dashboard")} /> : null}
      {screen === "notifications" ? <NotificationsScreen notifications={data.notifications} onBack={() => setScreen("dashboard")} onRead={readNotification} /> : null}
      <View style={styles.footer}>
        <Text style={styles.version}>v1.5.1 · Cross Platform Stabilization</Text>
        <TouchableOpacity onPress={() => void supabase?.auth.signOut()}><Text style={styles.logout}>تسجيل الخروج</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: tokens.colors.background },
  center: { flex: 1, backgroundColor: tokens.colors.background, alignItems: "center", justifyContent: "center" },
  errorBar: { backgroundColor: "#4a2020", paddingHorizontal: 16, paddingVertical: 10, flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" },
  errorText: { color: "#ffdada", flex: 1, textAlign: "right" },
  dismiss: { color: "#ffdada", fontSize: 24, marginLeft: 12 },
  footer: { borderTopWidth: 1, borderTopColor: tokens.colors.border, paddingHorizontal: 18, paddingVertical: 10, flexDirection: "row-reverse", justifyContent: "space-between", backgroundColor: tokens.colors.surface },
  version: { color: tokens.colors.muted, fontSize: 11 },
  logout: { color: "#df8d8d", fontWeight: "800" },
});
