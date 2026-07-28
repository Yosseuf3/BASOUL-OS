import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { Session } from "@supabase/supabase-js";
import { StatusBar } from "expo-status-bar";
import { LoginScreen } from "./src/features/auth/LoginScreen";
import { completeMobileAuthUrl, getInitialAuthUrl } from "./src/features/auth/mobileAuth";
import { DashboardScreen } from "./src/features/dashboard/DashboardScreen";
import { NotificationsScreen } from "./src/features/notifications/NotificationsScreen";
import { ProjectsScreen } from "./src/features/projects/ProjectsScreen";
import { TasksScreen } from "./src/features/tasks/TasksScreen";
import { CommandCenterScreen } from "./src/features/command-center/CommandCenterScreen";
import { CreateTaskScreen, type NewTaskInput } from "./src/features/create/CreateTaskScreen";
import { TimelineScreen } from "./src/features/timeline/TimelineScreen";
import { GlobalSearchScreen } from "./src/features/search/GlobalSearchScreen";
import { ArchitectureReviewScreen } from "./src/features/architecture/architecture-review-screen";
import { isMobileConfigured, supabase } from "./src/config/supabase";
import {
  advanceMobileTask,
  convertMobileFindingToTask,
  createMobileTask,
  loadMobileWorkspace,
  markMobileNotificationRead,
  updateMobileFindingDecision,
  updateMobilePlanElementStatus,
  uploadMobileDrawing,
  type MobileFindingDecision,
} from "./src/services/workspace";
import { tokens } from "./src/theme/tokens";
import type { ArchitecturalFinding, MobileWorkspaceData, Task } from "./src/types/domain";

const emptyData: MobileWorkspaceData = { projects: [], tasks: [], notifications: [], drawings: [], reviews: [], planElements: [] };
type ScreenName = "dashboard" | "projects" | "tasks" | "notifications" | "intelligence" | "architecture" | "createTask" | "timeline" | "search";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [booting, setBooting] = useState(true);
  const [loading, setLoading] = useState(false);
  const [screen, setScreen] = useState<ScreenName>("dashboard");
  const [data, setData] = useState<MobileWorkspaceData>(emptyData);
  const [error, setError] = useState<string | null>(null);
  const [convertingFindingId, setConvertingFindingId] = useState("");
  const [decidingFindingId, setDecidingFindingId] = useState("");
  const [updatingPlanElementId, setUpdatingPlanElementId] = useState("");
  const [uploadingDrawing, setUploadingDrawing] = useState(false);

  const refresh = useCallback(async () => {
    if (!session?.user.id) return;
    setLoading(true); setError(null);
    try { setData(await loadMobileWorkspace(session.user.id)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "تعذر تحميل بيانات مساحة العمل."); }
    finally { setLoading(false); }
  }, [session?.user.id]);

  useEffect(() => {
    if (!supabase) { setBooting(false); return; }
    const client = supabase; let active = true;
    async function handleAuthUrl(url: string | null) { if (!url) return; const result = await completeMobileAuthUrl(client, url); if (active && result.handled && result.error) setError(result.error); }
    void (async () => { await handleAuthUrl(await getInitialAuthUrl()); const { data: result } = await client.auth.getSession(); if (active) { setSession(result.session); setBooting(false); } })();
    const urlListener = Linking.addEventListener("url", ({ url }) => { void handleAuthUrl(url); });
    const { data: authListener } = client.auth.onAuthStateChange((_event, nextSession) => { setSession(nextSession); setScreen("dashboard"); if (!nextSession) setData(emptyData); });
    return () => { active = false; urlListener.remove(); authListener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => { if (session) void refresh(); }, [session, refresh]);

  async function readNotification(id: string) { try { await markMobileNotificationRead(id); setData((current) => ({ ...current, notifications: current.notifications.map((item) => item.id === id ? { ...item, is_read: true } : item) })); } catch (cause) { setError(cause instanceof Error ? cause.message : "تعذر تحديث الإشعار."); } }
  async function createTask(input: NewTaskInput) { if (!session) return; await createMobileTask(session.user.id, input); await refresh(); setScreen("tasks"); }
  async function advanceTask(task: Task) { try { await advanceMobileTask(task); await refresh(); } catch (cause) { setError(cause instanceof Error ? cause.message : "تعذر تحديث المهمة."); } }
  async function convertFinding(finding: ArchitecturalFinding, projectId: string) {
    if (!session) return;
    setConvertingFindingId(finding.id);
    try {
      await convertMobileFindingToTask(session.user.id, projectId, finding);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر تحويل الملاحظة إلى مهمة.");
    } finally {
      setConvertingFindingId("");
    }
  }
  async function decideFinding(finding: ArchitecturalFinding, status: MobileFindingDecision) {
    if (!session) return;
    setDecidingFindingId(finding.id);
    try {
      await updateMobileFindingDecision(session.user.id, finding, status);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر حفظ قرار المراجعة.");
    } finally {
      setDecidingFindingId("");
    }
  }
  async function decidePlanElement(elementId: string, status: "confirmed" | "rejected") {
    if (!session) return;
    setUpdatingPlanElementId(elementId);
    try {
      await updateMobilePlanElementStatus(session.user.id, elementId, status);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر حفظ قرار عنصر المخطط.");
    } finally {
      setUpdatingPlanElementId("");
    }
  }
  async function uploadDrawing(input: { projectId: string; revision: string; uri: string; name: string; mimeType: string; size: number }) {
    if (!session) return;
    setUploadingDrawing(true);
    try {
      await uploadMobileDrawing(session.user.id, input.projectId, input.revision, input);
      await refresh();
    } finally {
      setUploadingDrawing(false);
    }
  }

  if (booting) return <View style={styles.center}><StatusBar style="light" /><ActivityIndicator color={tokens.colors.gold} size="large" /></View>;
  if (!isMobileConfigured || !session) return <><StatusBar style="light" /><LoginScreen /></>;

  return <View style={styles.app}>
    <StatusBar style="light" />
    {error ? <View style={styles.errorBar}><Text style={styles.errorText}>{error}</Text><TouchableOpacity onPress={() => setError(null)}><Text style={styles.dismiss}>?</Text></TouchableOpacity></View> : null}
    {screen === "dashboard" ? <DashboardScreen data={data} onNavigate={setScreen} onRefresh={refresh} refreshing={loading} /> : null}
    {screen === "projects" ? <ProjectsScreen projects={data.projects} onBack={() => setScreen("dashboard")} /> : null}
    {screen === "tasks" ? <TasksScreen tasks={data.tasks} projects={data.projects} onBack={() => setScreen("dashboard")} onCreate={() => setScreen("createTask")} onAdvance={(task) => void advanceTask(task)} /> : null}
    {screen === "notifications" ? <NotificationsScreen notifications={data.notifications} onBack={() => setScreen("dashboard")} onRead={readNotification} /> : null}
    {screen === "intelligence" ? <CommandCenterScreen data={data} onBack={() => setScreen("dashboard")} /> : null}
    {screen === "architecture" ? <ArchitectureReviewScreen data={data} onBack={() => setScreen("dashboard")} onConvertFinding={(finding, projectId) => void convertFinding(finding, projectId)} convertingFindingId={convertingFindingId} onDecideFinding={(finding, status) => void decideFinding(finding, status)} decidingFindingId={decidingFindingId} onDecidePlanElement={(elementId, status) => void decidePlanElement(elementId, status)} updatingPlanElementId={updatingPlanElementId} onUploadDrawing={uploadDrawing} uploadingDrawing={uploadingDrawing} /> : null}
    {screen === "createTask" ? <CreateTaskScreen projects={data.projects} onCancel={() => setScreen("dashboard")} onSubmit={createTask} /> : null}
    {screen === "timeline" ? <TimelineScreen data={data} onBack={() => setScreen("dashboard")} /> : null}
    {screen === "search" ? <GlobalSearchScreen data={data} onBack={() => setScreen("dashboard")} /> : null}
    <View style={styles.footer}><Text style={styles.version}>v3.0.0-alpha.12 · Automatic Plan Extraction</Text><TouchableOpacity onPress={() => void supabase?.auth.signOut()}><Text style={styles.logout}>تسجيل الخروج</Text></TouchableOpacity></View>
  </View>;
}

const styles = StyleSheet.create({ app: { flex: 1, backgroundColor: tokens.colors.background }, center: { flex: 1, backgroundColor: tokens.colors.background, alignItems: "center", justifyContent: "center" }, errorBar: { backgroundColor: "#4a2020", paddingHorizontal: 16, paddingVertical: 10, flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }, errorText: { color: "#ffdada", flex: 1, textAlign: "right" }, dismiss: { color: "#ffdada", fontSize: 24, marginLeft: 12 }, footer: { borderTopWidth: 1, borderTopColor: tokens.colors.border, paddingHorizontal: 18, paddingVertical: 10, flexDirection: "row-reverse", justifyContent: "space-between", backgroundColor: tokens.colors.surface }, version: { color: tokens.colors.muted, fontSize: 11 }, logout: { color: "#df8d8d", fontWeight: "800" } });
