import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Linking, Platform, SafeAreaView, StatusBar as NativeStatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { Session } from "@supabase/supabase-js";
import { StatusBar } from "expo-status-bar";
import appConfig from "./app.json";
import { basoulYvlNative as tokens } from "@basoul/yvl-adapter/native";
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
import { AdministrationScreen } from "./src/features/administration/AdministrationScreen";
import { AccountScreen } from "./src/features/account/AccountScreen";
import type { MobileOrganizationRole } from "./src/permissions/organization";
import { isMobileConfigured, supabase } from "./src/config/supabase";
import {
  advanceMobileTask,
  convertMobileFindingToTask,
  createMobileTask,
  loadMobileWorkspace,
  loadMobileOrganizationRole,
  markMobileNotificationRead,
  retryMobileDrawingAnalysis,
  updateMobileFindingDecision,
  updateMobilePlanElementStatus,
  updateMobileReviewCommentStatus,
  uploadMobileDrawing,
  type MobileFindingDecision,
} from "./src/services/workspace";
import type { ArchitecturalFinding, ArchitecturalReviewComment, MobileWorkspaceData, Task } from "./src/types/domain";

const emptyData: MobileWorkspaceData = { projects: [], tasks: [], notifications: [], drawings: [], reviews: [], planElements: [], reviewComments: [] };
type ScreenName = "dashboard" | "projects" | "tasks" | "notifications" | "intelligence" | "architecture" | "createTask" | "timeline" | "search" | "administration" | "account";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [booting, setBooting] = useState(true);
  const [loading, setLoading] = useState(false);
  const [screen, setScreen] = useState<ScreenName>("dashboard");
  const [data, setData] = useState<MobileWorkspaceData>(emptyData);
  const [error, setError] = useState<string | null>(null);
  const [organizationRole, setOrganizationRole] = useState<MobileOrganizationRole>("viewer");
  const [convertingFindingId, setConvertingFindingId] = useState("");
  const [decidingFindingId, setDecidingFindingId] = useState("");
  const [updatingPlanElementId, setUpdatingPlanElementId] = useState("");
  const [uploadingDrawing, setUploadingDrawing] = useState(false);
  const [retryingDrawingId, setRetryingDrawingId] = useState("");
  const [updatingReviewCommentId, setUpdatingReviewCommentId] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const sessionRevision = useRef(0);

  const refresh = useCallback(async () => {
    if (!session?.user.id) return;
    const revision = sessionRevision.current;
    setLoading(true); setError(null);
    try { const [workspaceData, role] = await Promise.all([loadMobileWorkspace(session.user.id), loadMobileOrganizationRole(session.user.id)]); if (revision !== sessionRevision.current) return; setData(workspaceData); setOrganizationRole(role); }
    catch (cause) { if (revision === sessionRevision.current) setError(cause instanceof Error ? cause.message : "تعذر تحميل بيانات مساحة العمل."); }
    finally { if (revision === sessionRevision.current) setLoading(false); }
  }, [session?.user.id]);

  useEffect(() => {
    if (!supabase) { setBooting(false); return; }
    const client = supabase; let active = true;
    async function handleAuthUrl(url: string | null) { if (!url) return; const result = await completeMobileAuthUrl(client, url); if (active && result.handled && result.error) setError(result.error); }
    void (async () => { await handleAuthUrl(await getInitialAuthUrl()); const { data: result } = await client.auth.getSession(); if (active) { setSession(result.session); setBooting(false); } })();
    const urlListener = Linking.addEventListener("url", ({ url }) => { void handleAuthUrl(url); });
    const { data: authListener } = client.auth.onAuthStateChange((_event, nextSession) => {
      sessionRevision.current += 1;
      setSession(nextSession); setScreen("dashboard"); setSignOutError(null);
      if (!nextSession) { setData(emptyData); setOrganizationRole("viewer"); setError(null); setLoading(false); }
    });
    return () => { active = false; urlListener.remove(); authListener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => { if (session) void refresh(); }, [session, refresh]);

  async function signOut() {
    if (!supabase || signingOut) return;
    setSigningOut(true); setSignOutError(null);
    try {
      const { error: signOutFailure } = await supabase.auth.signOut();
      if (signOutFailure) throw signOutFailure;
      // The existing auth listener clears session/navigation/workspace state.
    } catch {
      setSignOutError("تعذر تسجيل الخروج. يرجى المحاولة مرة أخرى.");
    } finally { setSigningOut(false); }
  }

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
  async function decideReviewComment(comment: ArchitecturalReviewComment, status: ArchitecturalReviewComment["status"]) {
    if (!session) return;
    setUpdatingReviewCommentId(comment.id);
    try {
      await updateMobileReviewCommentStatus(session.user.id, comment.id, status);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر تحديث ملاحظة المراجعة.");
    } finally {
      setUpdatingReviewCommentId("");
    }
  }
  async function uploadDrawing(input: { projectId: string; revision: string; uri: string; name: string; mimeType: string; size: number }) {
    if (!session) return { drawingId: "", analysisStatus: "needs_better_source" as const, detectedElements: 0, failureCode: null, retryable: false };
    setUploadingDrawing(true);
    try {
      const result = await uploadMobileDrawing(session.user.id, input.projectId, input.revision, input);
      await refresh();
      return result;
    } finally {
      setUploadingDrawing(false);
    }
  }
  async function retryDrawing(drawingId: string) {
    setRetryingDrawingId(drawingId);
    try {
      const result = await retryMobileDrawingAnalysis(drawingId);
      await refresh();
      return result;
    } finally {
      setRetryingDrawingId("");
    }
  }

  if (booting) return <View style={styles.center}><StatusBar style="light" /><ActivityIndicator color={tokens.colors.primary} size="large" /></View>;
  if (!isMobileConfigured || !session) return <><StatusBar style="light" /><LoginScreen /></>;

  return <SafeAreaView style={styles.app}>
    <StatusBar style="light" />
    <View style={styles.accountBar}><TouchableOpacity accessibilityRole="button" accessibilityLabel="الحساب" onPress={() => setScreen("account")} style={styles.accountButton}><Text style={styles.accountText}>الحساب</Text></TouchableOpacity></View>
    {error ? <View style={styles.errorBar}><Text style={styles.errorText}>{error}</Text><TouchableOpacity onPress={() => setError(null)}><Text style={styles.dismiss}>?</Text></TouchableOpacity></View> : null}
    {screen === "dashboard" ? <DashboardScreen data={data} onNavigate={setScreen} onRefresh={refresh} refreshing={loading} /> : null}
    {screen === "projects" ? <ProjectsScreen projects={data.projects} onBack={() => setScreen("dashboard")} /> : null}
    {screen === "tasks" ? <TasksScreen tasks={data.tasks} projects={data.projects} onBack={() => setScreen("dashboard")} onCreate={() => setScreen("createTask")} onAdvance={(task) => void advanceTask(task)} /> : null}
    {screen === "notifications" ? <NotificationsScreen notifications={data.notifications} onBack={() => setScreen("dashboard")} onRead={readNotification} /> : null}
    {screen === "intelligence" ? <CommandCenterScreen data={data} onBack={() => setScreen("dashboard")} /> : null}
    {screen === "architecture" ? <ArchitectureReviewScreen data={data} onBack={() => setScreen("dashboard")} onConvertFinding={(finding, projectId) => void convertFinding(finding, projectId)} convertingFindingId={convertingFindingId} onDecideFinding={(finding, status) => void decideFinding(finding, status)} decidingFindingId={decidingFindingId} onDecidePlanElement={(elementId, status) => void decidePlanElement(elementId, status)} updatingPlanElementId={updatingPlanElementId} onUpdateReviewComment={(comment, status) => void decideReviewComment(comment, status)} updatingReviewCommentId={updatingReviewCommentId} onUploadDrawing={uploadDrawing} uploadingDrawing={uploadingDrawing} onRetryDrawing={retryDrawing} retryingDrawingId={retryingDrawingId} /> : null}
    {screen === "createTask" ? <CreateTaskScreen projects={data.projects} onCancel={() => setScreen("dashboard")} onSubmit={createTask} /> : null}
    {screen === "timeline" ? <TimelineScreen data={data} onBack={() => setScreen("dashboard")} /> : null}
    {screen === "search" ? <GlobalSearchScreen data={data} onBack={() => setScreen("dashboard")} /> : null}
    {screen === "administration" ? <AdministrationScreen role={organizationRole} onBack={() => setScreen("dashboard")} /> : null}
    {screen === "account" ? <AccountScreen email={session.user.email} onBack={() => setScreen("dashboard")} onSignOut={signOut} signingOut={signingOut} error={signOutError} /> : null}
    <View style={styles.footer}><Text style={styles.version}>v{appConfig.expo.version}</Text></View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({ app: { flex: 1, backgroundColor: tokens.colors.background }, accountBar: { alignItems: "flex-end", paddingHorizontal: tokens.space.lg, paddingTop: Platform.OS === "android" ? NativeStatusBar.currentHeight ?? 0 : 0 }, accountButton: { minHeight: 44, minWidth: 44, justifyContent: "center", paddingHorizontal: tokens.space.md }, accountText: { color: tokens.colors.textPrimary, fontWeight: "700" }, center: { flex: 1, backgroundColor: tokens.colors.background, alignItems: "center", justifyContent: "center" }, errorBar: { backgroundColor: tokens.colors.dangerSubtle, paddingHorizontal: 16, paddingVertical: 10, flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }, errorText: { color: tokens.colors.danger, flex: 1, textAlign: "right" }, dismiss: { color: tokens.colors.danger, fontSize: 24, marginLeft: 12 }, footer: { borderTopWidth: 1, borderTopColor: tokens.colors.border, paddingHorizontal: 18, paddingVertical: 10, flexDirection: "row-reverse", justifyContent: "space-between", backgroundColor: tokens.colors.surface }, version: { color: tokens.colors.muted, fontSize: 11 } });
