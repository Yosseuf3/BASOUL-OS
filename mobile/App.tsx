import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { Session } from "@supabase/supabase-js";
import { StatusBar } from "expo-status-bar";
import { nativeDarkTheme as tokens } from "@yosseuf/ui-tokens/native";
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
type ScreenName = "dashboard" | "projects" | "tasks" | "notifications" | "intelligence" | "architecture" | "createTask" | "timeline" | "search" | "administration";

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

  const refresh = useCallback(async () => {
    if (!session?.user.id) return;
    setLoading(true); setError(null);
    try { const [workspaceData, role] = await Promise.all([loadMobileWorkspace(session.user.id), loadMobileOrganizationRole(session.user.id)]); setData(workspaceData); setOrganizationRole(role); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "ØªØ¹Ø°Ø± ØªØ­Ù…ÙŠÙ„ Ø¨ÙŠØ§Ù†Ø§Øª Ù…Ø³Ø§Ø­Ø© Ø§Ù„Ø¹Ù…Ù„."); }
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

  async function readNotification(id: string) { try { await markMobileNotificationRead(id); setData((current) => ({ ...current, notifications: current.notifications.map((item) => item.id === id ? { ...item, is_read: true } : item) })); } catch (cause) { setError(cause instanceof Error ? cause.message : "ØªØ¹Ø°Ø± ØªØ­Ø¯ÙŠØ« Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±."); } }
  async function createTask(input: NewTaskInput) { if (!session) return; await createMobileTask(session.user.id, input); await refresh(); setScreen("tasks"); }
  async function advanceTask(task: Task) { try { await advanceMobileTask(task); await refresh(); } catch (cause) { setError(cause instanceof Error ? cause.message : "ØªØ¹Ø°Ø± ØªØ­Ø¯ÙŠØ« Ø§Ù„Ù…Ù‡Ù…Ø©."); } }
  async function convertFinding(finding: ArchitecturalFinding, projectId: string) {
    if (!session) return;
    setConvertingFindingId(finding.id);
    try {
      await convertMobileFindingToTask(session.user.id, projectId, finding);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "ØªØ¹Ø°Ø± ØªØ­ÙˆÙŠÙ„ Ø§Ù„Ù…Ù„Ø§Ø­Ø¸Ø© Ø¥Ù„Ù‰ Ù…Ù‡Ù…Ø©.");
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
      setError(cause instanceof Error ? cause.message : "ØªØ¹Ø°Ø± Ø­ÙØ¸ Ù‚Ø±Ø§Ø± Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©.");
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
      setError(cause instanceof Error ? cause.message : "ØªØ¹Ø°Ø± Ø­ÙØ¸ Ù‚Ø±Ø§Ø± Ø¹Ù†ØµØ± Ø§Ù„Ù…Ø®Ø·Ø·.");
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
      setError(cause instanceof Error ? cause.message : "ØªØ¹Ø°Ø± ØªØ­Ø¯ÙŠØ« Ù…Ù„Ø§Ø­Ø¸Ø© Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©.");
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

  return <View style={styles.app}>
    <StatusBar style="light" />
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
    <View style={styles.footer}><Text style={styles.version}>v3.0.2 Â· Foundation v1 Migration</Text><TouchableOpacity onPress={() => void supabase?.auth.signOut()}><Text style={styles.logout}>ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø®Ø±ÙˆØ¬</Text></TouchableOpacity></View>
  </View>;
}

const styles = StyleSheet.create({ app: { flex: 1, backgroundColor: tokens.colors.background }, center: { flex: 1, backgroundColor: tokens.colors.background, alignItems: "center", justifyContent: "center" }, errorBar: { backgroundColor: tokens.colors.dangerSubtle, paddingHorizontal: 16, paddingVertical: 10, flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }, errorText: { color: tokens.colors.danger, flex: 1, textAlign: "right" }, dismiss: { color: tokens.colors.danger, fontSize: 24, marginLeft: 12 }, footer: { borderTopWidth: 1, borderTopColor: tokens.colors.border, paddingHorizontal: 18, paddingVertical: 10, flexDirection: "row-reverse", justifyContent: "space-between", backgroundColor: tokens.colors.surface }, version: { color: tokens.colors.muted, fontSize: 11 }, logout: { color: tokens.colors.danger, fontWeight: "800" } });

