import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, AppState, Linking, Platform, SafeAreaView, StatusBar as NativeStatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { Session } from "@supabase/supabase-js";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
import { OrganizationContextStore, type OrganizationContext, type OrganizationSnapshot } from "./src/organizations/context";
import { OrganizationBar } from "./src/organizations/OrganizationBar";
import { loadMobileOrganizations } from "./src/services/organizations";
import { isMobileConfigured, supabase } from "./src/config/supabase";
import {
  advanceMobileTask,
  convertMobileFindingToTask,
  createMobileTask,
  loadMobileWorkspace,
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
  const [organization, setOrganization] = useState<OrganizationSnapshot | null>(null);
  const organizationStore = useRef(new OrganizationContextStore(AsyncStorage, loadMobileOrganizations));
  const authenticatedUser = useRef<string | null>(null);
  const [convertingFindingId, setConvertingFindingId] = useState("");
  const [decidingFindingId, setDecidingFindingId] = useState("");
  const [updatingPlanElementId, setUpdatingPlanElementId] = useState("");
  const [uploadingDrawing, setUploadingDrawing] = useState(false);
  const [retryingDrawingId, setRetryingDrawingId] = useState("");
  const [updatingReviewCommentId, setUpdatingReviewCommentId] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const sessionRevision = useRef(0);

  const refresh = useCallback(async (requestedOrganizationId?: string) => {
    if (!session?.user.id) return;
    if (authenticatedUser.current !== session.user.id) return;
    const sessionVersion = sessionRevision.current;
    setOrganization(null); setData(emptyData);
    setConvertingFindingId(""); setDecidingFindingId(""); setUpdatingPlanElementId(""); setUpdatingReviewCommentId(""); setUploadingDrawing(false); setRetryingDrawingId("");
    setLoading(true); setError(null);
    const pending = organizationStore.current.refresh(session.user.id, requestedOrganizationId);
    const requestRevision = organizationStore.current.currentRevision;
    try {
      const next = await pending;
      if (!next || sessionVersion !== sessionRevision.current) return;
      setOrganization(next);
      if (next.selected) {
        const workspaceData = await loadMobileWorkspace(next.selected);
        if (!organizationStore.current.isCurrent(next.revision) || sessionVersion !== sessionRevision.current) return;
        setData(workspaceData);
      }
    } catch (cause) {
      if (sessionVersion === sessionRevision.current && organizationStore.current.isCurrent(requestRevision)) {
        setOrganization(null); setData(emptyData);
        setError(cause instanceof Error ? cause.message : "تعذر تحميل بيانات مساحة العمل.");
      }
    } finally {
      if (sessionVersion === sessionRevision.current && organizationStore.current.isCurrent(requestRevision)) setLoading(false);
    }
  }, [session?.user.id]);

  useEffect(() => {
    if (!supabase) { setBooting(false); return; }
    const client = supabase; let active = true;
    async function handleAuthUrl(url: string | null) { if (!url) return; const result = await completeMobileAuthUrl(client, url); if (active && result.handled && result.error) setError(result.error); }
    void (async () => { await handleAuthUrl(await getInitialAuthUrl()); const revision = sessionRevision.current; const { data: result } = await client.auth.getSession(); if (active && revision === sessionRevision.current) { authenticatedUser.current = result.session?.user.id ?? null; setSession(result.session); } if (active) setBooting(false); })();
    const urlListener = Linking.addEventListener("url", ({ url }) => { void handleAuthUrl(url); });
    const { data: authListener } = client.auth.onAuthStateChange((_event, nextSession) => {
      sessionRevision.current += 1;
      if (authenticatedUser.current !== (nextSession?.user.id ?? null)) organizationStore.current.clear();
      authenticatedUser.current = nextSession?.user.id ?? null;
      setSession(nextSession); setScreen("dashboard"); setSignOutError(null);
      setOrganization(null); setData(emptyData); setError(null); setLoading(false);
    });
    return () => { active = false; urlListener.remove(); authListener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => { if (session) void refresh(); }, [session, refresh]);
  useEffect(() => {
    const listener = AppState.addEventListener("change", (state) => { if (state === "active" && session) void refresh(); });
    return () => listener.remove();
  }, [session, refresh]);

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

  function activeOrganization() {
    if (!organization?.selected || organization.userId !== authenticatedUser.current || !organizationStore.current.isCurrent(organization.revision)) throw new Error("Active organization required");
    return organization;
  }
  async function operate<T>(operation: (context: OrganizationContext) => Promise<T>, after?: () => void): Promise<T> {
    const snapshot = activeOrganization();
    const revision = sessionRevision.current;
    const current = () => revision === sessionRevision.current && organizationStore.current.isCurrent(snapshot.revision);
    try {
      const result = await operation(snapshot.selected!);
      if (current()) { after?.(); await refresh(); }
      return result;
    } catch (cause) {
      if (current()) {
        organizationStore.current.invalidate(); setOrganization(null); setData(emptyData);
        setError(cause instanceof Error ? cause.message : "تعذر إكمال العملية.");
      }
      throw cause;
    }
  }
  async function readNotification(id: string) { try { await operate((context) => markMobileNotificationRead(context, id)); } catch { /* Error displayed only for the current context. */ } }
  async function createTask(input: NewTaskInput) { await operate((context) => createMobileTask(context, input), () => setScreen("tasks")); }
  async function advanceTask(task: Task) { try { await operate((context) => advanceMobileTask(context, task)); } catch { /* Error displayed by operate. */ } }
  async function convertFinding(finding: ArchitecturalFinding, projectId: string) {
    if (!session) return;
    const actionRevision = activeOrganization().revision;
    setConvertingFindingId(finding.id);
    try {
      await operate((context) => convertMobileFindingToTask(context, projectId, finding));
    } catch {
      // Stale operations must not update another organization's error state.
    } finally {
      if (organizationStore.current.isCurrent(actionRevision)) setConvertingFindingId("");
    }
  }
  async function decideFinding(finding: ArchitecturalFinding, status: MobileFindingDecision) {
    if (!session) return;
    const actionRevision = activeOrganization().revision;
    setDecidingFindingId(finding.id);
    try {
      await operate((context) => updateMobileFindingDecision(context, finding, status));
    } catch {
      // Error is scoped by operate.
    } finally {
      if (organizationStore.current.isCurrent(actionRevision)) setDecidingFindingId("");
    }
  }
  async function decidePlanElement(elementId: string, status: "confirmed" | "rejected") {
    if (!session) return;
    const actionRevision = activeOrganization().revision;
    setUpdatingPlanElementId(elementId);
    try {
      await operate((context) => updateMobilePlanElementStatus(context, elementId, status));
    } catch {
      // Error is scoped by operate.
    } finally {
      if (organizationStore.current.isCurrent(actionRevision)) setUpdatingPlanElementId("");
    }
  }
  async function decideReviewComment(comment: ArchitecturalReviewComment, status: ArchitecturalReviewComment["status"]) {
    if (!session) return;
    const actionRevision = activeOrganization().revision;
    setUpdatingReviewCommentId(comment.id);
    try {
      await operate((context) => updateMobileReviewCommentStatus(context, comment.id, status));
    } catch {
      // Error is scoped by operate.
    } finally {
      if (organizationStore.current.isCurrent(actionRevision)) setUpdatingReviewCommentId("");
    }
  }
  async function uploadDrawing(input: { projectId: string; revision: string; uri: string; name: string; mimeType: string; size: number }) {
    if (!session) return { drawingId: "", analysisStatus: "needs_better_source" as const, detectedElements: 0, failureCode: null, retryable: false };
    const actionRevision = activeOrganization().revision;
    setUploadingDrawing(true);
    try {
      return await operate((context) => uploadMobileDrawing(context, input.projectId, input.revision, input));
    } finally {
      if (organizationStore.current.isCurrent(actionRevision)) setUploadingDrawing(false);
    }
  }
  async function retryDrawing(drawingId: string) {
    const actionRevision = activeOrganization().revision;
    setRetryingDrawingId(drawingId);
    try {
      return await operate((context) => retryMobileDrawingAnalysis(context, drawingId));
    } finally {
      if (organizationStore.current.isCurrent(actionRevision)) setRetryingDrawingId("");
    }
  }

  if (booting) return <View style={styles.center}><StatusBar style="light" /><ActivityIndicator color={tokens.colors.primary} size="large" /></View>;
  if (!isMobileConfigured || !session) return <><StatusBar style="light" /><LoginScreen /></>;

  // Render no cached tenant data while validating membership or after user change.
  const organizationReady = organization?.userId === session.user.id && Boolean(organization.selected) && organizationStore.current.isCurrent(organization.revision);

  return <SafeAreaView style={styles.app}>
    <StatusBar style="light" />
    <View style={styles.accountBar}><TouchableOpacity accessibilityRole="button" accessibilityLabel="الحساب" onPress={() => setScreen("account")} style={styles.accountButton}><Text style={styles.accountText}>الحساب</Text></TouchableOpacity></View>
    <OrganizationBar snapshot={organization?.userId === session.user.id ? organization : null} busy={loading} onRefresh={() => void refresh()} onSelect={(id) => { setScreen("dashboard"); void refresh(id); }} />
    {error ? <View style={styles.errorBar}><Text style={styles.errorText}>{error}</Text><TouchableOpacity onPress={() => setError(null)}><Text style={styles.dismiss}>?</Text></TouchableOpacity></View> : null}
    {organizationReady ? <>
    {screen === "dashboard" ? <DashboardScreen data={data} onNavigate={setScreen} onRefresh={() => void refresh()} refreshing={loading} /> : null}
    {screen === "projects" ? <ProjectsScreen projects={data.projects} onBack={() => setScreen("dashboard")} /> : null}
    {screen === "tasks" ? <TasksScreen tasks={data.tasks} projects={data.projects} onBack={() => setScreen("dashboard")} onCreate={() => setScreen("createTask")} onAdvance={(task) => void advanceTask(task)} /> : null}
    {screen === "notifications" ? <NotificationsScreen notifications={data.notifications} onBack={() => setScreen("dashboard")} onRead={readNotification} /> : null}
    {screen === "intelligence" ? <CommandCenterScreen data={data} onBack={() => setScreen("dashboard")} /> : null}
    {screen === "architecture" ? <ArchitectureReviewScreen data={data} onBack={() => setScreen("dashboard")} onConvertFinding={(finding, projectId) => void convertFinding(finding, projectId)} convertingFindingId={convertingFindingId} onDecideFinding={(finding, status) => void decideFinding(finding, status)} decidingFindingId={decidingFindingId} onDecidePlanElement={(elementId, status) => void decidePlanElement(elementId, status)} updatingPlanElementId={updatingPlanElementId} onUpdateReviewComment={(comment, status) => void decideReviewComment(comment, status)} updatingReviewCommentId={updatingReviewCommentId} onUploadDrawing={uploadDrawing} uploadingDrawing={uploadingDrawing} onRetryDrawing={retryDrawing} retryingDrawingId={retryingDrawingId} /> : null}
    {screen === "createTask" ? <CreateTaskScreen projects={data.projects} onCancel={() => setScreen("dashboard")} onSubmit={createTask} /> : null}
    {screen === "timeline" ? <TimelineScreen data={data} onBack={() => setScreen("dashboard")} /> : null}
    {screen === "search" ? <GlobalSearchScreen data={data} onBack={() => setScreen("dashboard")} /> : null}
    {screen === "administration" ? <AdministrationScreen role={organization!.selected!.role} onBack={() => setScreen("dashboard")} /> : null}
    </> : null}
    {screen === "account" ? <AccountScreen email={session.user.email} onBack={() => setScreen("dashboard")} onSignOut={signOut} signingOut={signingOut} error={signOutError} /> : null}
    <View style={styles.footer}><Text style={styles.version}>v{appConfig.expo.version}</Text></View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({ app: { flex: 1, backgroundColor: tokens.colors.background }, accountBar: { alignItems: "flex-end", paddingHorizontal: tokens.space.lg, paddingTop: Platform.OS === "android" ? NativeStatusBar.currentHeight ?? 0 : 0 }, accountButton: { minHeight: 44, minWidth: 44, justifyContent: "center", paddingHorizontal: tokens.space.md }, accountText: { color: tokens.colors.textPrimary, fontWeight: "700" }, center: { flex: 1, backgroundColor: tokens.colors.background, alignItems: "center", justifyContent: "center" }, errorBar: { backgroundColor: tokens.colors.dangerSubtle, paddingHorizontal: 16, paddingVertical: 10, flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }, errorText: { color: tokens.colors.danger, flex: 1, textAlign: "right" }, dismiss: { color: tokens.colors.danger, fontSize: 24, marginLeft: 12 }, footer: { borderTopWidth: 1, borderTopColor: tokens.colors.border, paddingHorizontal: 18, paddingVertical: 10, flexDirection: "row-reverse", justifyContent: "space-between", backgroundColor: tokens.colors.surface }, version: { color: tokens.colors.muted, fontSize: 11 } });
