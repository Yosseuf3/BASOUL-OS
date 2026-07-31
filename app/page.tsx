"use client";

import type { Session } from "@supabase/supabase-js";
import {
  AlertTriangle, Brain, CalendarDays, CheckCircle2, ChevronLeft,
  ClipboardList, FolderKanban, LayoutDashboard, LogOut, Menu, MoreHorizontal, Users, Mail, Phone, Building2,
  Pencil, Plus, Search, Trash2, X, List, Columns3, ArrowUpDown, Clock3, Film, Hash, Send, BookOpen, Star, FileText, Lightbulb, Library, Wallet, Activity, Bell, ScanLine,
} from "lucide-react";
import { FormEvent, ReactNode, useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Client, ClientInput, ClientStatus, ContentItem, ContentInput, ContentPlatform, ContentStatus, ActivityEvent, Notification, FinanceTransaction, FinanceTransactionInput, KnowledgeInput, KnowledgeItem, KnowledgeType, PriorityLevel, Project, ProjectInput, ProjectStatus, ProjectType, DesignPhase, Task, TaskInput, TaskStatus } from "@/lib/types";
import { deleteRow, saveRow } from "@/lib/data/os-repository";
import { loadWorkspaceData } from "@/lib/data/workspace-service";
import { FinanceModal, FinanceView } from "@/features/finance/finance-view";
import { DashboardView } from "@/features/dashboard/dashboard-view";
import { GlobalSearch } from "@/features/global-search";
import { ActivityView } from "@/features/activity/activity-view";
import { NotificationsView } from "@/features/notifications/notifications-view";
import { ArchitectureReviewView } from "@/features/architecture/architecture-review-view";
import { deleteNotification, markAllNotificationsRead, markNotificationRead } from "@/lib/notifications/notification-service";
import { recordActivity } from "@/lib/events/activity-service";
import { WorkspaceSwitcher } from "@/components/shell/workspace-switcher";
import { QuickCreate } from "@/components/commands/quick-create";
import type { QuickCreateTarget, WorkspaceId } from "@/packages/types/src";
import { DEFAULT_WORKSPACE } from "@/packages/core/src";
import { APP_INFO } from "@/lib/config/app-info";
import { foundationColorValues } from "@yosseuf/ui-tokens";
import {
  createProjectFileDownloadUrl,
  deleteProjectFile,
  listProjectFiles,
  uploadProjectFile,
  type ProjectFile,
} from "@/lib/projects/project-file-service";
import {
  convertProjectNoteToTask,
  createProjectNote,
  deleteProjectNote,
  listProjectNotes,
  setProjectNoteStatus,
  type ProjectNote,
  type ProjectNoteType,
} from "@/lib/projects/project-note-service";

type View = "dashboard" | "projects" | "tasks" | "clients" | "content" | "knowledge" | "finance" | "activity" | "notifications" | "architecture";
type ProjectFilter = "All" | ProjectStatus;
type TaskFilter = "All" | TaskStatus;
type ClientFilter = "All" | ClientStatus;
type ContentFilter = "All" | ContentStatus;
type PlatformFilter = "All" | ContentPlatform;
type KnowledgeFilter = "All" | KnowledgeType;
type TaskViewMode = "cards" | "list" | "kanban";
type TaskSort = "updated" | "due" | "priority" | "progress";
type ProjectModalState = { mode: "create"; project: null } | { mode: "edit"; project: Project } | null;
type TaskModalState = { mode: "create"; task: null } | { mode: "edit"; task: Task } | null;
type ClientModalState = { mode: "create"; client: null } | { mode: "edit"; client: Client } | null;
type ContentModalState = { mode: "create"; item: null } | { mode: "edit"; item: ContentItem } | null;
type KnowledgeModalState = { mode: "create"; item: null } | { mode: "edit"; item: KnowledgeItem } | null;
type Toast = { message: string; tone: "success" | "error" } | null;

const projectStatusLabels: Record<ProjectStatus, string> = { Planning: "تخطيط", Active: "نشط", "On Hold": "متوقف مؤقتًا", Completed: "مكتمل" };
const taskStatusLabels: Record<TaskStatus, string> = { "To Do": "للعمل", "In Progress": "قيد التنفيذ", Review: "مراجعة", Done: "مكتملة" };
const priorityLabels: Record<PriorityLevel, string> = { Low: "منخفضة", Medium: "متوسطة", High: "مرتفعة", Critical: "حرجة" };
const projectFilters: ProjectFilter[] = ["All", "Planning", "Active", "On Hold", "Completed"];
const taskFilters: TaskFilter[] = ["All", "To Do", "In Progress", "Review", "Done"];
const clientStatusLabels: Record<ClientStatus, string> = { Lead: "عميل محتمل", Active: "نشط", Inactive: "غير نشط", Completed: "مكتمل" };
const clientFilters: ClientFilter[] = ["All", "Lead", "Active", "Inactive", "Completed"];
const contentStatusLabels: Record<ContentStatus, string> = { Idea: "فكرة", Draft: "مسودة", Recording: "تصوير", Editing: "مونتاج", Scheduled: "مجدول", Published: "منشور" };
const platformLabels: Record<ContentPlatform, string> = { TikTok: "TikTok", Instagram: "Instagram", YouTube: "YouTube", Facebook: "Facebook", LinkedIn: "LinkedIn", X: "X" };
const contentFilters: ContentFilter[] = ["All", "Idea", "Draft", "Recording", "Editing", "Scheduled", "Published"];
const platformFilters: PlatformFilter[] = ["All", "TikTok", "Instagram", "YouTube", "Facebook", "LinkedIn", "X"];
const knowledgeTypeLabels: Record<KnowledgeType, string> = { Note: "ملاحظة", Idea: "فكرة", Reference: "مرجع", Template: "قالب" };
const knowledgeFilters: KnowledgeFilter[] = ["All", "Note", "Idea", "Reference", "Template"];
const phaseLabels: Record<DesignPhase, string> = { Concept: "التصميم المفاهيمي", Schematic: "التصميم المبدئي", "Design Development": "تطوير التصميم", "Construction Documents": "مستندات التنفيذ", "Site Supervision": "الإشراف الموقعي", Handover: "التسليم" };

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [view, setView] = useState<View>("dashboard");
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [financeItems, setFinanceItems] = useState<FinanceTransaction[]>([]);
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadErrors, setLoadErrors] = useState<string[]>([]);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [projectQuery, setProjectQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState<ProjectFilter>("All");
  const [taskQuery, setTaskQuery] = useState("");
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("All");
  const [taskProjectFilter, setTaskProjectFilter] = useState("All");
  const [clientQuery, setClientQuery] = useState("");
  const [clientFilter, setClientFilter] = useState<ClientFilter>("All");
  const [contentQuery, setContentQuery] = useState("");
  const [contentFilter, setContentFilter] = useState<ContentFilter>("All");
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("All");
  const [knowledgeQuery, setKnowledgeQuery] = useState("");
  const [knowledgeFilter, setKnowledgeFilter] = useState<KnowledgeFilter>("All");
  const [favoriteKnowledgeOnly, setFavoriteKnowledgeOnly] = useState(false);
  const [projectModal, setProjectModal] = useState<ProjectModalState>(null);
  const [projectDetail, setProjectDetail] = useState<Project | null>(null);
  const [taskModal, setTaskModal] = useState<TaskModalState>(null);
  const [clientModal, setClientModal] = useState<ClientModalState>(null);
  const [contentModal, setContentModal] = useState<ContentModalState>(null);
  const [knowledgeModal, setKnowledgeModal] = useState<KnowledgeModalState>(null);
  const [financeModal, setFinanceModal] = useState<FinanceTransaction | "create" | null>(null);
  const [deleteProjectTarget, setDeleteProjectTarget] = useState<Project | null>(null);
  const [deleteTaskTarget, setDeleteTaskTarget] = useState<Task | null>(null);
  const [deleteClientTarget, setDeleteClientTarget] = useState<Client | null>(null);
  const [deleteContentTarget, setDeleteContentTarget] = useState<ContentItem | null>(null);
  const [deleteKnowledgeTarget, setDeleteKnowledgeTarget] = useState<KnowledgeItem | null>(null);
  const [deleteFinanceTarget, setDeleteFinanceTarget] = useState<FinanceTransaction | null>(null);
  const [toast, setToast] = useState<Toast>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [workspace, setWorkspace] = useState<WorkspaceId>(DEFAULT_WORKSPACE);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthLoading(false); });
    const { data } = supabase.auth.onAuthStateChange((_event, current) => { setSession(current); setAuthLoading(false); });
    return () => data.subscription.unsubscribe();
  }, []);

  const showToast = useCallback((message: string, tone: "success" | "error") => {
    setToast({ message, tone }); window.setTimeout(() => setToast(null), 3600);
  }, []);

  const loadData = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const result = await loadWorkspaceData();
      setProjects(result.data.projects);
      setTasks(result.data.tasks);
      setClients(result.data.clients);
      setContentItems(result.data.contentItems);
      setKnowledgeItems(result.data.knowledgeItems);
      setFinanceItems(result.data.financeItems);
      setActivityEvents(result.data.activityEvents);
      setNotifications(result.data.notifications);
      setLoadErrors(result.errors);
      setLastSyncedAt(result.loadedAt);
      if (result.errors.length) showToast(`تم تحميل مساحة العمل جزئيًا (${result.errors.length} وحدات تحتاج إعادة محاولة).`, "error");
    } catch (error) {
      const message = error instanceof Error ? error.message : "تعذر الاتصال بالخدمة";
      setLoadErrors([message]);
      showToast(`تعذر تحميل مساحة العمل: ${message}`, "error");
    } finally {
      setLoading(false);
    }
  }, [session, showToast]);

  useEffect(() => { if (session) void loadData(); }, [session, loadData]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.tagName === "SELECT" || target?.isContentEditable;
      if (event.key === "Escape") setQuickCreateOpen(false);
      if (!typing && event.key.toLowerCase() === "n" && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        setQuickCreateOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const filteredProjects = projects.filter((p) => {
    const q = projectQuery.trim().toLowerCase();
    return (!q || [p.name, p.client_name, p.area, p.notes].some((v) => (v ?? "").toLowerCase().includes(q))) && (projectFilter === "All" || p.status === projectFilter);
  });
  const filteredTasks = tasks.filter((t) => {
    const q = taskQuery.trim().toLowerCase();
    return (!q || [t.title, t.description].some((v) => (v ?? "").toLowerCase().includes(q))) &&
      (taskFilter === "All" || t.status === taskFilter) &&
      (taskProjectFilter === "All" || t.project_id === taskProjectFilter);
  });
  const filteredClients = clients.filter((c) => {
    const q = clientQuery.trim().toLowerCase();
    return (!q || [c.name, c.company, c.email, c.phone, c.source].some((v) => (v ?? "").toLowerCase().includes(q))) &&
      (clientFilter === "All" || c.status === clientFilter);
  });
  const filteredContent = contentItems.filter((item) => {
    const q = contentQuery.trim().toLowerCase();
    return (!q || [item.title, item.hook, item.script, item.cta, item.hashtags, item.notes].some((v) => (v ?? "").toLowerCase().includes(q))) &&
      (contentFilter === "All" || item.status === contentFilter) &&
      (platformFilter === "All" || item.platform === platformFilter);
  });

  const filteredKnowledge = knowledgeItems.filter((item) => {
    const q = knowledgeQuery.trim().toLowerCase();
    return (!q || [item.title, item.content, item.tags].some((v) => (v ?? "").toLowerCase().includes(q))) &&
      (knowledgeFilter === "All" || item.type === knowledgeFilter) &&
      (!favoriteKnowledgeOnly || item.is_favorite);
  });

  async function logActivity(module: Parameters<typeof recordActivity>[0]["module"], action: Parameters<typeof recordActivity>[0]["action"], title: string, entityId?: string | null, description?: string | null, metadata?: Record<string, unknown>) {
    if (!session) return;
    const error = await recordActivity({ userId: session.user.id, module, action, title, entityId, description, metadata });
    if (error) console.warn("Activity log failed:", error);
  }

  async function saveProject(input: ProjectInput, current?: Project) {
    if (!session) return false;
    const payload = { ...input, user_id: session.user.id };
    const { error } = current ? await supabase.from("projects").update(payload).eq("id", current.id) : await supabase.from("projects").insert(payload);
    if (error) { showToast(`لم يتم حفظ المشروع: ${error.message}`, "error"); return false; }
    await logActivity("projects", current ? "updated" : "created", current ? `تم تحديث المشروع: ${input.name}` : `تم إنشاء مشروع جديد: ${input.name}`, current?.id, input.status);
    showToast(current ? "تم تحديث المشروع." : "تم إنشاء المشروع.", "success"); await loadData(); return true;
  }

  async function saveTask(input: TaskInput, current?: Task) {
    if (!session) return false;
    const payload = { ...input, user_id: session.user.id, progress: input.status === "Done" ? 100 : input.progress };
    const { error } = current ? await supabase.from("tasks").update(payload).eq("id", current.id) : await supabase.from("tasks").insert(payload);
    if (error) { showToast(`لم يتم حفظ المهمة: ${error.message}`, "error"); return false; }
    await logActivity("tasks", input.status === "Done" && current?.status !== "Done" ? "completed" : current ? "updated" : "created", input.status === "Done" && current?.status !== "Done" ? `اكتملت المهمة: ${input.title}` : current ? `تم تحديث المهمة: ${input.title}` : `تم إنشاء مهمة جديدة: ${input.title}`, current?.id, input.status);
    showToast(current ? "تم تحديث المهمة." : "تم إنشاء المهمة.", "success"); await loadData(); return true;
  }


  async function saveClient(input: ClientInput, current?: Client) {
    if (!session) return false;
    const payload = { ...input, user_id: session.user.id };
    const { error } = current ? await supabase.from("clients").update(payload).eq("id", current.id) : await supabase.from("clients").insert(payload);
    if (error) { showToast(`لم يتم حفظ العميل: ${error.message}`, "error"); return false; }
    await logActivity("clients", current ? "updated" : "created", current ? `تم تحديث العميل: ${input.name}` : `تمت إضافة عميل جديد: ${input.name}`, current?.id, input.company);
    showToast(current ? "تم تحديث بيانات العميل." : "تم إنشاء العميل.", "success"); await loadData(); return true;
  }

  async function saveContent(input: ContentInput, current?: ContentItem) {
    if (!session) return false;
    const payload = { ...input, user_id: session.user.id };
    const { error } = current ? await supabase.from("content_items").update(payload).eq("id", current.id) : await supabase.from("content_items").insert(payload);
    if (error) { showToast(`لم يتم حفظ المحتوى: ${error.message}`, "error"); return false; }
    await logActivity("content", input.status === "Published" && current?.status !== "Published" ? "published" : current ? "updated" : "created", input.status === "Published" && current?.status !== "Published" ? `تم نشر المحتوى: ${input.title}` : current ? `تم تحديث المحتوى: ${input.title}` : `تم إنشاء محتوى جديد: ${input.title}`, current?.id, input.platform);
    showToast(current ? "تم تحديث المحتوى." : "تم إنشاء المحتوى.", "success"); await loadData(); return true;
  }

  async function deleteContent(item: ContentItem) {
    const { error } = await supabase.from("content_items").delete().eq("id", item.id);
    if (error) showToast(`تعذر حذف المحتوى: ${error.message}`, "error");
    else { await logActivity("content", "deleted", `تم حذف المحتوى: ${item.title}`, item.id); setDeleteContentTarget(null); showToast("تم حذف المحتوى.", "success"); await loadData(); }
  }


  async function saveKnowledge(input: KnowledgeInput, current?: KnowledgeItem) {
    if (!session) return false;
    const payload = { ...input, user_id: session.user.id };
    const { error } = current ? await supabase.from("knowledge_items").update(payload).eq("id", current.id) : await supabase.from("knowledge_items").insert(payload);
    if (error) { showToast(`لم يتم حفظ العنصر: ${error.message}`, "error"); return false; }
    await logActivity("knowledge", current ? "updated" : "created", current ? `تم تحديث المعرفة: ${input.title}` : `تمت إضافة عنصر معرفة: ${input.title}`, current?.id, input.type);
    showToast(current ? "تم تحديث عنصر المعرفة." : "تم إنشاء عنصر المعرفة.", "success"); await loadData(); return true;
  }

  async function deleteKnowledge(item: KnowledgeItem) {
    const { error } = await supabase.from("knowledge_items").delete().eq("id", item.id);
    if (error) showToast(`تعذر حذف العنصر: ${error.message}`, "error");
    else { await logActivity("knowledge", "deleted", `تم حذف عنصر المعرفة: ${item.title}`, item.id); setDeleteKnowledgeTarget(null); showToast("تم حذف عنصر المعرفة.", "success"); await loadData(); }
  }

  async function deleteProject(project: Project) {
    const { error } = await supabase.from("projects").delete().eq("id", project.id);
    if (error) showToast(`تعذر حذف المشروع: ${error.message}`, "error");
    else { await logActivity("projects", "deleted", `تم حذف المشروع: ${project.name}`, project.id); setDeleteProjectTarget(null); showToast("تم حذف المشروع ومهامه.", "success"); await loadData(); }
  }
  async function deleteTask(task: Task) {
    const { error } = await supabase.from("tasks").delete().eq("id", task.id);
    if (error) showToast(`تعذر حذف المهمة: ${error.message}`, "error");
    else { await logActivity("tasks", "deleted", `تم حذف المهمة: ${task.title}`, task.id); setDeleteTaskTarget(null); showToast("تم حذف المهمة.", "success"); await loadData(); }
  }


  async function deleteClient(client: Client) {
    const { error } = await supabase.from("clients").delete().eq("id", client.id);
    if (error) showToast(`تعذر حذف العميل: ${error.message}`, "error");
    else { await logActivity("clients", "deleted", `تم حذف العميل: ${client.name}`, client.id); setDeleteClientTarget(null); showToast("تم حذف العميل.", "success"); await loadData(); }
  }

  async function saveFinance(input: FinanceTransactionInput, current?: FinanceTransaction) {
    if (!session) return false;
    const error = await saveRow("finance_transactions", session.user.id, input, current);
    if (error) { showToast(`لم يتم حفظ المعاملة: ${error}`, "error"); return false; }
    await logActivity("finance", input.status === "Paid" && current?.status !== "Paid" ? "paid" : current ? "updated" : "created", input.status === "Paid" && current?.status !== "Paid" ? `تم تسجيل دفعة: ${input.description}` : current ? `تم تحديث المعاملة: ${input.description}` : `تم إنشاء معاملة مالية: ${input.description}`, current?.id, `${input.type} · ${input.amount} ${input.currency}`);
    showToast(current ? "تم تحديث المعاملة المالية." : "تم إنشاء المعاملة المالية.", "success"); await loadData(); return true;
  }
  async function deleteFinance(item: FinanceTransaction) {
    const error = await deleteRow("finance_transactions", item.id);
    if (error) showToast(`تعذر حذف المعاملة: ${error}`, "error");
    else { await logActivity("finance", "deleted", `تم حذف المعاملة: ${item.description}`, item.id); setDeleteFinanceTarget(null); showToast("تم حذف المعاملة المالية.", "success"); await loadData(); }
  }

  async function clearActivity() {
    if (!session || !activityEvents.length) return;
    const { error } = await supabase.from("activity_events").delete().eq("user_id", session.user.id);
    if (error) showToast(`تعذر مسح سجل النشاط: ${error.message}`, "error");
    else { setActivityEvents([]); showToast("تم مسح سجل النشاط.", "success"); }
  }

  async function toggleNotificationRead(notification: Notification) {
    const error = await markNotificationRead(notification.id, !notification.is_read);
    if (error) showToast(`تعذر تحديث الإشعار: ${error}`, "error"); else await loadData();
  }
  async function markAllRead() {
    if (!session) return; const error = await markAllNotificationsRead(session.user.id);
    if (error) showToast(`تعذر تحديث الإشعارات: ${error}`, "error"); else { showToast("تم تعليم جميع الإشعارات كمقروءة.", "success"); await loadData(); }
  }
  async function removeNotification(notification: Notification) {
    const error = await deleteNotification(notification.id);
    if (error) showToast(`تعذر حذف الإشعار: ${error}`, "error"); else await loadData();
  }

  if (authLoading) return <LoadingScreen />;
  if (!session) return <Auth />;

  const navigate = (next: View) => { setView(next); setSidebarOpen(false); };
  const requestCreateTask = () => {
    if (projects.length === 0) {
      showToast("أنشئ مشروعًا أولًا قبل إضافة مهمة.", "error");
      setView("projects");
      return;
    }
    setTaskModal({ mode: "create", task: null });
  };

  const openQuickCreate = (target: QuickCreateTarget) => {
    setQuickCreateOpen(false);
    if (target === "project") setProjectModal({ mode: "create", project: null });
    else if (target === "task") requestCreateTask();
    else if (target === "client") setClientModal({ mode: "create", client: null });
    else if (target === "finance") setFinanceModal("create");
    else if (target === "knowledge") setKnowledgeModal({ mode: "create", item: null });
    else setContentModal({ mode: "create", item: null });
  };

  return <div className="app-shell">
    <button className="mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="فتح القائمة"><Menu size={21} /></button>
    {sidebarOpen && <button className="sidebar-overlay" onClick={() => setSidebarOpen(false)} aria-label="إغلاق القائمة" />}
    <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
      <button className="sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="إغلاق القائمة"><X size={19} /></button>
      <div className="logo"><div className="logo-mark"><Brain size={25} /></div><div><strong>{APP_INFO.name}</strong><span>{APP_INFO.fullLabel}</span></div></div>
      <WorkspaceSwitcher value={workspace} onChange={(next) => { setWorkspace(next); if (next === "executive") navigate("dashboard"); else if (next === "operations") navigate("projects"); else if (next === "engineering") navigate("architecture"); else if (next === "knowledge") navigate("knowledge"); }} />
      <nav>
        <button className={view === "dashboard" ? "active" : ""} onClick={() => navigate("dashboard")}><LayoutDashboard size={18}/> لوحة القيادة</button>
        <button className={view === "projects" ? "active" : ""} onClick={() => navigate("projects")}><FolderKanban size={18}/> المشاريع</button>
        <button className={view === "architecture" ? "active" : ""} onClick={() => navigate("architecture")}><ScanLine size={18}/> الذكاء المعماري</button>
        <button className={view === "tasks" ? "active" : ""} onClick={() => navigate("tasks")}><ClipboardList size={18}/> المهام {tasks.length > 0 && <span className="nav-count">{tasks.length}</span>}</button>
        <button className={view === "clients" ? "active" : ""} onClick={() => navigate("clients")}><Users size={18}/> العملاء {clients.length > 0 && <span className="nav-count">{clients.length}</span>}</button>
        <button className={view === "content" ? "active" : ""} onClick={() => navigate("content")}><Film size={18}/> المحتوى {contentItems.length > 0 && <span className="nav-count">{contentItems.length}</span>}</button>
        <button className={view === "knowledge" ? "active" : ""} onClick={() => navigate("knowledge")}><BookOpen size={18}/> المعرفة {knowledgeItems.length > 0 && <span className="nav-count">{knowledgeItems.length}</span>}</button>
        <button className={view === "finance" ? "active" : ""} onClick={() => navigate("finance")}><Wallet size={18}/> المالية {financeItems.length > 0 && <span className="nav-count">{financeItems.length}</span>}</button>
        <button className={view === "activity" ? "active" : ""} onClick={() => navigate("activity")}><Activity size={18}/> النشاط {activityEvents.length > 0 && <span className="nav-count">{activityEvents.length}</span>}</button>
        <button className={view === "notifications" ? "active" : ""} onClick={() => navigate("notifications")}><Bell size={18}/> الإشعارات {notifications.filter(n=>!n.is_read).length > 0 && <span className="nav-count alert">{notifications.filter(n=>!n.is_read).length}</span>}</button>
      </nav>
      <div className="user-card"><div className="user-avatar">YR</div><div><b>Yosseuf</b><small>{session.user.email}</small></div></div>
      <button className="signout" onClick={() => void supabase.auth.signOut()}><LogOut size={17}/> تسجيل الخروج</button>
    </aside>

    <main className="main">
      <header className="topbar"><div><span className="eyebrow">YOSSEUF OS · {workspace === "executive" ? "EXECUTIVE" : workspace === "operations" ? "OPERATIONS" : workspace === "knowledge" ? "KNOWLEDGE" : "ENGINEERING"}</span><h1>{view === "dashboard" ? "لوحة القيادة" : view === "projects" ? "إدارة المشاريع" : view === "tasks" ? "محرك المهام" : view === "clients" ? "إدارة العملاء" : view === "content" ? "استوديو المحتوى" : view === "knowledge" ? "قاعدة المعرفة" : view === "finance" ? "الإدارة المالية" : view === "activity" ? "سجل النشاط" : "مركز الإشعارات"}</h1><p>{view === "tasks" ? "أنشئ المهام واربطها بمشاريعك وتابع التنفيذ." : view === "clients" ? "نظّم بيانات العملاء واربطهم بأعمالك." : view === "content" ? "حوّل الأفكار إلى محتوى منشور عبر دورة إنتاج واضحة." : view === "knowledge" ? "احفظ أفكارك وملاحظاتك وقوالبك ومراجعك في مكان واحد." : view === "finance" ? "سجّل الدخل والمصروفات وتابع صافي التدفق المالي." : view === "activity" ? "تابع كل ما يحدث داخل وحدات النظام في خط زمني واحد." : view === "notifications" ? "راجع التنبيهات المهمة وانتقل مباشرة إلى مصدرها." : "تابع أعمالك من مكان واحد."}</p></div><div className="topbar-actions"><div className={`sync-state ${loadErrors.length ? "warning" : "ok"}`}><span>{loading ? "جارٍ التحديث…" : loadErrors.length ? "مزامنة جزئية" : "البيانات محدثة"}</span><small>{lastSyncedAt ? new Intl.DateTimeFormat("ar-SA",{hour:"numeric",minute:"2-digit"}).format(new Date(lastSyncedAt)) : "—"}</small>{loadErrors.length > 0 && <button onClick={() => void loadData()} aria-label="إعادة المزامنة">إعادة المحاولة</button>}</div><GlobalSearch projects={projects} tasks={tasks} clients={clients} contentItems={contentItems} knowledgeItems={knowledgeItems} financeItems={financeItems} onNavigate={navigate} /><button className="primary universal-create-button" onClick={() => setQuickCreateOpen(true)}><Plus size={18}/> إنشاء <kbd>N</kbd></button></div></header>
      {loading && <div className="loading-bar"><i /></div>}
      {view === "dashboard" && loading && !lastSyncedAt ? <DashboardSkeleton /> : view === "dashboard" && <DashboardView projects={projects} tasks={tasks} clients={clients} financeItems={financeItems} activityEvents={activityEvents} notifications={notifications} userName="Yosseuf" onNavigate={navigate} onQuickAction={(action) => action === "project" ? setProjectModal({ mode: "create", project: null }) : action === "task" ? requestCreateTask() : action === "client" ? setClientModal({ mode: "create", client: null }) : action === "finance" ? setFinanceModal("create") : action === "knowledge" ? setKnowledgeModal({ mode: "create", item: null }) : setContentModal({ mode: "create", item: null })} />}
      {view === "activity" && <ActivityView events={activityEvents} onNavigate={navigate} onClear={() => void clearActivity()} />}
      {view === "notifications" && <NotificationsView notifications={notifications} onNavigate={navigate} onToggleRead={(n)=>void toggleNotificationRead(n)} onMarkAll={()=>void markAllRead()} onDelete={(n)=>void removeNotification(n)} />}
      {view === "architecture" && <ArchitectureReviewView projects={projects} />}
      {view === "projects" && <ProjectsView projects={filteredProjects} totalCount={projects.length} query={projectQuery} filter={projectFilter} onQuery={setProjectQuery} onFilter={setProjectFilter} onCreate={() => setProjectModal({ mode: "create", project: null })} onOpen={setProjectDetail} onEdit={(project) => setProjectModal({ mode: "edit", project })} onDelete={setDeleteProjectTarget} />}
      {view === "tasks" && <TasksView tasks={filteredTasks} allTasks={tasks} projects={projects} query={taskQuery} filter={taskFilter} projectFilter={taskProjectFilter} onQuery={setTaskQuery} onFilter={setTaskFilter} onProjectFilter={setTaskProjectFilter} onCreate={requestCreateTask} onEdit={(task) => setTaskModal({ mode: "edit", task })} onDelete={setDeleteTaskTarget} />}
      {view === "clients" && <ClientsView clients={filteredClients} allClients={clients} projects={projects} query={clientQuery} filter={clientFilter} onQuery={setClientQuery} onFilter={setClientFilter} onCreate={() => setClientModal({ mode: "create", client: null })} onEdit={(client) => setClientModal({ mode: "edit", client })} onDelete={setDeleteClientTarget} />}
      {view === "finance" && <FinanceView items={financeItems} projects={projects} clients={clients} onCreate={() => setFinanceModal("create")} onEdit={setFinanceModal} onDelete={setDeleteFinanceTarget} />}
      {view === "knowledge" && <KnowledgeView items={filteredKnowledge} allItems={knowledgeItems} query={knowledgeQuery} filter={knowledgeFilter} favoriteOnly={favoriteKnowledgeOnly} onQuery={setKnowledgeQuery} onFilter={setKnowledgeFilter} onFavoriteOnly={setFavoriteKnowledgeOnly} onCreate={() => setKnowledgeModal({ mode: "create", item: null })} onEdit={(item) => setKnowledgeModal({ mode: "edit", item })} onDelete={setDeleteKnowledgeTarget} />}
      {view === "content" && <ContentView items={filteredContent} allItems={contentItems} projects={projects} clients={clients} query={contentQuery} filter={contentFilter} platformFilter={platformFilter} onQuery={setContentQuery} onFilter={setContentFilter} onPlatformFilter={setPlatformFilter} onCreate={() => setContentModal({ mode: "create", item: null })} onEdit={(item) => setContentModal({ mode: "edit", item })} onDelete={setDeleteContentTarget} />}
    </main>

    {projectDetail && <ProjectWorkspace project={projectDetail} tasks={tasks.filter(t=>t.project_id===projectDetail.id)} financeItems={financeItems.filter(i=>i.project_id===projectDetail.id)} activityEvents={activityEvents.filter(e=>e.entity_id===projectDetail.id || (e.module==="tasks" && tasks.some(t=>t.project_id===projectDetail.id && t.id===e.entity_id)))} client={clients.find(c=>c.id===projectDetail.client_id)} onClose={()=>setProjectDetail(null)} onEdit={()=>{setProjectDetail(null);setProjectModal({mode:"edit",project:projectDetail});}} onCreateTask={()=>{setProjectDetail(null);setTaskModal({mode:"create",task:null});}} />}
    {financeModal && <FinanceModal item={financeModal === "create" ? null : financeModal} projects={projects} clients={clients} onClose={() => setFinanceModal(null)} onSave={async (input, item) => { const ok = await saveFinance(input, item); if (ok) setFinanceModal(null); return ok; }} />}
    {projectModal && <ProjectModal state={projectModal} clients={clients} onClose={() => setProjectModal(null)} onSave={async (input, project) => { const ok = await saveProject(input, project); if (ok) setProjectModal(null); return ok; }} />}
    {knowledgeModal && <KnowledgeModal state={knowledgeModal} onClose={() => setKnowledgeModal(null)} onSave={async (input, item) => { const ok = await saveKnowledge(input, item); if (ok) setKnowledgeModal(null); return ok; }} />}
    {contentModal && <ContentModal state={contentModal} projects={projects} clients={clients} onClose={() => setContentModal(null)} onSave={async (input, item) => { const ok = await saveContent(input, item); if (ok) setContentModal(null); return ok; }} />}
    {clientModal && <ClientModal state={clientModal} onClose={() => setClientModal(null)} onSave={async (input, client) => { const ok = await saveClient(input, client); if (ok) setClientModal(null); return ok; }} />}
    {taskModal && <TaskModal state={taskModal} projects={projects} onClose={() => setTaskModal(null)} onSave={async (input, task) => { const ok = await saveTask(input, task); if (ok) setTaskModal(null); return ok; }} />}
    {deleteFinanceTarget && <ConfirmDelete title="حذف المعاملة؟" text={`سيتم حذف «${deleteFinanceTarget.description}» نهائيًا.`} onCancel={() => setDeleteFinanceTarget(null)} onConfirm={() => void deleteFinance(deleteFinanceTarget)} />}
    {deleteProjectTarget && <ConfirmDelete title="حذف المشروع؟" text={`سيتم حذف «${deleteProjectTarget.name}» وجميع مهامه نهائيًا.`} onCancel={() => setDeleteProjectTarget(null)} onConfirm={() => void deleteProject(deleteProjectTarget)} />}
    {deleteClientTarget && <ConfirmDelete title="حذف العميل؟" text={`سيتم حذف «${deleteClientTarget.name}». ستبقى المشاريع المرتبطة دون عميل.`} onCancel={() => setDeleteClientTarget(null)} onConfirm={() => void deleteClient(deleteClientTarget)} />}
    {deleteKnowledgeTarget && <ConfirmDelete title="حذف عنصر المعرفة؟" text={`سيتم حذف «${deleteKnowledgeTarget.title}» نهائيًا.`} onCancel={() => setDeleteKnowledgeTarget(null)} onConfirm={() => void deleteKnowledge(deleteKnowledgeTarget)} />}
    {deleteContentTarget && <ConfirmDelete title="حذف المحتوى؟" text={`سيتم حذف «${deleteContentTarget.title}» نهائيًا.`} onCancel={() => setDeleteContentTarget(null)} onConfirm={() => void deleteContent(deleteContentTarget)} />}
    {deleteTaskTarget && <ConfirmDelete title="حذف المهمة؟" text={`سيتم حذف «${deleteTaskTarget.title}» نهائيًا.`} onCancel={() => setDeleteTaskTarget(null)} onConfirm={() => void deleteTask(deleteTaskTarget)} />}
    <button className="global-fab" onClick={() => setQuickCreateOpen(true)} aria-label="إنشاء سريع"><Plus size={22}/><span>إنشاء</span></button>
    <QuickCreate open={quickCreateOpen} onClose={() => setQuickCreateOpen(false)} onSelect={openQuickCreate} />
    {toast && <div className={`toast ${toast.tone}`}>{toast.message}</div>}
  </div>;
}

function DashboardSkeleton(){return <div className="dashboard-skeleton" aria-label="جارٍ تحميل لوحة القيادة"><div className="skeleton hero"/><div className="skeleton-grid"><div className="skeleton block"/><div className="skeleton block"/></div><div className="skeleton-kpis">{Array.from({length:4}).map((_,i)=><div className="skeleton kpi" key={i}/>)}</div><div className="skeleton-grid"><div className="skeleton block small"/><div className="skeleton block small"/></div></div>}

function ProjectsView({ projects, totalCount, query, filter, onQuery, onFilter, onCreate, onOpen, onEdit, onDelete }: { projects: Project[]; totalCount: number; query: string; filter: ProjectFilter; onQuery: (v:string)=>void; onFilter:(v:ProjectFilter)=>void; onCreate:()=>void; onOpen:(p:Project)=>void; onEdit:(p:Project)=>void; onDelete:(p:Project)=>void }) {
  return <section className="panel projects-panel"><Toolbar title="كل المشاريع" count={totalCount} query={query} placeholder="ابحث بالاسم أو العميل…" onQuery={onQuery} onCreate={onCreate}/><div className="filter-tabs">{projectFilters.map((f)=><button key={f} className={filter===f?"active":""} onClick={()=>onFilter(f)}>{f==="All"?"الكل":projectStatusLabels[f]}</button>)}</div>{projects.length?<div className="project-grid">{projects.map((p)=><ProjectCard key={p.id} project={p} onOpen={()=>onOpen(p)} onEdit={()=>onEdit(p)} onDelete={()=>onDelete(p)}/>)}</div>:<EmptyState onCreate={onCreate}/>}</section>;
}

function TasksView({ tasks, allTasks, projects, query, filter, projectFilter, onQuery, onFilter, onProjectFilter, onCreate, onEdit, onDelete }: { tasks:Task[]; allTasks:Task[]; projects:Project[]; query:string; filter:TaskFilter; projectFilter:string; onQuery:(v:string)=>void; onFilter:(v:TaskFilter)=>void; onProjectFilter:(v:string)=>void; onCreate:()=>void; onEdit:(t:Task)=>void; onDelete:(t:Task)=>void }) {
  const [viewMode,setViewMode]=useState<TaskViewMode>("cards");
  const [sort,setSort]=useState<TaskSort>("updated");
  const priorityOrder:Record<PriorityLevel,number>={Critical:4,High:3,Medium:2,Low:1};
  const sorted=[...tasks].sort((a,b)=>{
    if(sort==="due") return (a.due_date||"9999-12-31").localeCompare(b.due_date||"9999-12-31");
    if(sort==="priority") return priorityOrder[b.priority]-priorityOrder[a.priority];
    if(sort==="progress") return b.progress-a.progress;
    return new Date(b.updated_at).getTime()-new Date(a.updated_at).getTime();
  });
  const done=allTasks.filter(t=>t.status==="Done").length;
  const overdue=allTasks.filter(t=>t.status!=="Done"&&t.due_date&&t.due_date<new Date().toISOString().slice(0,10)).length;
  return <section className="panel projects-panel tasks-stable">
    <Toolbar title="كل المهام" count={allTasks.length} query={query} placeholder="ابحث بالعنوان أو الوصف…" onQuery={onQuery} onCreate={onCreate}/>
    <div className="task-summary enhanced"><span>المكتملة <b>{done}</b></span><span>قيد التنفيذ <b>{allTasks.filter(t=>t.status==="In Progress").length}</b></span><span>للمراجعة <b>{allTasks.filter(t=>t.status==="Review").length}</b></span><span className={overdue?"summary-danger":""}>المتأخرة <b>{overdue}</b></span></div>
    <div className="tasks-controlbar">
      <div className="tasks-filters"><div className="filter-tabs">{taskFilters.map((f)=><button key={f} className={filter===f?"active":""} onClick={()=>onFilter(f)}>{f==="All"?"الكل":taskStatusLabels[f]}</button>)}</div><select value={projectFilter} onChange={(e)=>onProjectFilter(e.target.value)}><option value="All">كل المشاريع</option>{projects.map(p=><option value={p.id} key={p.id}>{p.name}</option>)}</select></div>
      <div className="task-view-tools"><label className="sort-select"><ArrowUpDown size={15}/><select value={sort} onChange={e=>setSort(e.target.value as TaskSort)}><option value="updated">آخر تحديث</option><option value="due">موعد الاستحقاق</option><option value="priority">الأولوية</option><option value="progress">نسبة الإنجاز</option></select></label><div className="view-switch"><button className={viewMode==="cards"?"active":""} onClick={()=>setViewMode("cards")} title="بطاقات"><Columns3 size={17}/></button><button className={viewMode==="list"?"active":""} onClick={()=>setViewMode("list")} title="قائمة"><List size={17}/></button><button className={viewMode==="kanban"?"active":""} onClick={()=>setViewMode("kanban")} title="كانبان"><ClipboardList size={17}/></button></div></div>
    </div>
    {projects.length===0?<EmptyState text="أنشئ مشروعًا أولًا قبل إضافة المهام."/>:sorted.length===0?<EmptyState text="لا توجد مهام مطابقة." onCreate={onCreate}/>:viewMode==="cards"?<div className="task-grid">{sorted.map(t=><TaskCard key={t.id} task={t} project={projects.find(p=>p.id===t.project_id)} onEdit={()=>onEdit(t)} onDelete={()=>onDelete(t)}/>)}</div>:viewMode==="list"?<TaskList tasks={sorted} projects={projects} onEdit={onEdit} onDelete={onDelete}/>:<KanbanBoard tasks={sorted} projects={projects} onEdit={onEdit} onDelete={onDelete}/>}
  </section>;
}

function TaskList({tasks,projects,onEdit,onDelete}:{tasks:Task[];projects:Project[];onEdit:(t:Task)=>void;onDelete:(t:Task)=>void}){
  return <div className="task-table-wrap"><table className="task-table"><thead><tr><th>المهمة</th><th>المشروع</th><th>الحالة</th><th>الأولوية</th><th>الاستحقاق</th><th>التقدم</th><th></th></tr></thead><tbody>{tasks.map(t=><tr key={t.id}><td><button className="table-task-title" onClick={()=>onEdit(t)}><small>TSK-{t.id.slice(0,4).toUpperCase()}</small><b>{t.title}</b></button></td><td>{projectName(projects,t.project_id)}</td><td><span className={`status-pill ${taskStatusClass(t.status)}`}>{taskStatusLabels[t.status]}</span></td><td><i className={`priority ${t.priority.toLowerCase()}`}>{priorityLabels[t.priority]}</i></td><td className={isOverdue(t)?"overdue-text":""}>{formatDate(t.due_date)}</td><td><div className="table-progress"><span>{t.progress}%</span><div className="progress"><i style={{width:`${t.progress}%`}}/></div></div></td><td><div className="table-actions"><button onClick={()=>onEdit(t)}><Pencil size={15}/></button><button className="danger" onClick={()=>onDelete(t)}><Trash2 size={15}/></button></div></td></tr>)}</tbody></table></div>;
}

function KanbanBoard({tasks,projects,onEdit,onDelete}:{tasks:Task[];projects:Project[];onEdit:(t:Task)=>void;onDelete:(t:Task)=>void}){
  return <div className="kanban-board">{taskFilters.slice(1).map(rawStatus=>{const status=rawStatus as TaskStatus;const column=tasks.filter(t=>t.status===status);return <section className="kanban-column" key={status}><header><span className={`status-dot ${taskStatusClass(status)}`}/><h3>{taskStatusLabels[status]}</h3><b>{column.length}</b></header><div className="kanban-stack">{column.map(t=><article className="kanban-card" key={t.id}><button onClick={()=>onEdit(t)}><small>TSK-{t.id.slice(0,4).toUpperCase()}</small><strong>{t.title}</strong><span><FolderKanban size={13}/>{projectName(projects,t.project_id)}</span></button><footer><i className={`priority ${t.priority.toLowerCase()}`}>{priorityLabels[t.priority]}</i><span className={isOverdue(t)?"overdue-text":""}><Clock3 size={13}/>{formatDate(t.due_date)}</span><button className="kanban-delete" onClick={()=>onDelete(t)}><Trash2 size={14}/></button></footer></article>)}{!column.length&&<div className="kanban-empty">لا توجد مهام</div>}</div></section>})}</div>;
}

function Toolbar({ title, count, query, placeholder, onQuery, onCreate }: { title:string; count:number; query:string; placeholder:string; onQuery:(v:string)=>void; onCreate:()=>void }) { return <div className="projects-toolbar"><div><span className="section-kicker">DIRECTORY</span><h2>{title} <small>{count}</small></h2></div><div className="toolbar-actions"><label className="search-box"><Search size={17}/><input value={query} onChange={(e)=>onQuery(e.target.value)} placeholder={placeholder}/></label><button className="primary compact" onClick={onCreate}><Plus size={17}/> إضافة</button></div></div>; }

function ProjectCard({ project, onOpen, onEdit, onDelete }: { project:Project; onOpen:()=>void; onEdit:()=>void; onDelete:()=>void }) { const [open,setOpen]=useState(false); return <article className="project-card"><div className="project-card-top"><span className={`status-pill ${projectStatusClass(project.status)}`}>{projectStatusLabels[project.status]}</span><CardMenu open={open} setOpen={setOpen} onEdit={onEdit} onDelete={onDelete}/></div><button className="project-card-body" onClick={onOpen}><span className="project-icon"><FolderKanban size={21}/></span><h3>{project.name}</h3><p>{project.notes||project.client_name||project.area||"مشروع جديد"}</p></button><div className="project-meta"><span><b>الأولوية</b><i className={`priority ${project.priority.toLowerCase()}`}>{priorityLabels[project.priority]}</i></span><span><b>موعد التسليم</b>{formatDate(project.due_date)}</span></div><div className="card-progress-head"><span>التقدم</span><b>{project.progress}%</b></div><div className="progress"><i style={{width:`${project.progress}%`}}/></div></article>; }

function TaskCard({ task, project, onEdit, onDelete }: { task:Task; project?:Project; onEdit:()=>void; onDelete:()=>void }) { const [open,setOpen]=useState(false); return <article className="task-card"><div className="project-card-top"><span className={`status-pill ${taskStatusClass(task.status)}`}>{taskStatusLabels[task.status]}</span><CardMenu open={open} setOpen={setOpen} onEdit={onEdit} onDelete={onDelete}/></div><button className="task-card-body" onClick={onEdit}><div className="task-code">TSK-{task.id.slice(0,4).toUpperCase()}</div><h3>{task.title}</h3><p>{task.description||"بدون وصف"}</p></button><div className="task-project"><FolderKanban size={14}/>{project?.name||"مشروع غير متاح"}</div><div className="project-meta"><span><b>الأولوية</b><i className={`priority ${task.priority.toLowerCase()}`}>{priorityLabels[task.priority]}</i></span><span><b>الاستحقاق</b>{formatDate(task.due_date)}</span></div><div className="card-progress-head"><span>التقدم</span><b>{task.progress}%</b></div><div className="progress"><i style={{width:`${task.progress}%`}}/></div></article>; }

function CardMenu({ open, setOpen, onEdit, onDelete }: { open:boolean; setOpen:(v:boolean)=>void; onEdit:()=>void; onDelete:()=>void }) { return <div className="card-menu-wrap"><button className="icon-button" onClick={()=>setOpen(!open)}><MoreHorizontal size={19}/></button>{open&&<div className="card-menu"><button onClick={()=>{setOpen(false);onEdit();}}><Pencil size={15}/> تعديل</button><button className="danger" onClick={()=>{setOpen(false);onDelete();}}><Trash2 size={15}/> حذف</button></div>}</div>; }

function ClientsView({ clients, allClients, projects, query, filter, onQuery, onFilter, onCreate, onEdit, onDelete }: { clients:Client[]; allClients:Client[]; projects:Project[]; query:string; filter:ClientFilter; onQuery:(v:string)=>void; onFilter:(v:ClientFilter)=>void; onCreate:()=>void; onEdit:(c:Client)=>void; onDelete:(c:Client)=>void }) {
  const active=allClients.filter(c=>c.status==="Active").length;
  const leads=allClients.filter(c=>c.status==="Lead").length;
  return <section className="panel projects-panel clients-panel"><Toolbar title="دليل العملاء" count={allClients.length} query={query} placeholder="ابحث بالاسم أو الشركة أو البريد…" onQuery={onQuery} onCreate={onCreate}/><div className="task-summary enhanced"><span>العملاء المحتملون <b>{leads}</b></span><span>العملاء النشطون <b>{active}</b></span><span>المكتملون <b>{allClients.filter(c=>c.status==="Completed").length}</b></span><span>غير النشطين <b>{allClients.filter(c=>c.status==="Inactive").length}</b></span></div><div className="filter-tabs clients-tabs">{clientFilters.map(f=><button key={f} className={filter===f?"active":""} onClick={()=>onFilter(f)}>{f==="All"?"الكل":clientStatusLabels[f]}</button>)}</div>{clients.length?<div className="client-grid">{clients.map(c=><ClientCard key={c.id} client={c} projectCount={projects.filter(p=>p.client_id===c.id).length} onEdit={()=>onEdit(c)} onDelete={()=>onDelete(c)}/>)}</div>:<EmptyState text="لا توجد عملاء مطابقة." onCreate={onCreate}/>}</section>;
}

function ClientCard({ client, projectCount, onEdit, onDelete }: { client:Client; projectCount:number; onEdit:()=>void; onDelete:()=>void }) { const[open,setOpen]=useState(false); return <article className="client-card"><div className="project-card-top"><span className={`status-pill client-${client.status.toLowerCase()}`}>{clientStatusLabels[client.status]}</span><CardMenu open={open} setOpen={setOpen} onEdit={onEdit} onDelete={onDelete}/></div><button className="client-card-body" onClick={onEdit}><div className="client-avatar">{client.name.slice(0,2).toUpperCase()}</div><div><h3>{client.name}</h3><p>{client.company||"عميل فردي"}</p></div></button><div className="client-contact">{client.email&&<span><Mail size={14}/>{client.email}</span>}{client.phone&&<span><Phone size={14}/>{client.phone}</span>}{client.source&&<span><Building2 size={14}/>{client.source}</span>}</div><div className="client-footer"><span><FolderKanban size={14}/>{projectCount} مشروع</span><small>{client.next_follow_up?`المتابعة: ${formatDate(client.next_follow_up)}`:"لا توجد متابعة محددة"}</small></div></article>; }

function ClientModal({ state, onClose, onSave }: { state:Exclude<ClientModalState,null>; onClose:()=>void; onSave:(i:ClientInput,c?:Client)=>Promise<boolean> }) { const c=state.client; const[saving,setSaving]=useState(false); async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setSaving(true);const f=new FormData(e.currentTarget);const input:ClientInput={name:String(f.get("name")||"").trim(),company:nullableText(f.get("company")),email:nullableText(f.get("email")),phone:nullableText(f.get("phone")),status:String(f.get("status")) as ClientStatus,source:nullableText(f.get("source")),next_follow_up:dateValue(f.get("next_follow_up")),notes:nullableText(f.get("notes"))};if(!await onSave(input,c??undefined))setSaving(false);} return <Modal title={state.mode==="create"?"إضافة عميل جديد":"تعديل بيانات العميل"} kicker="CLIENT CRM" onClose={onClose}><form className="project-form" onSubmit={submit}><Field name="name" label="اسم العميل *" defaultValue={c?.name} required full/><Field name="company" label="الشركة" defaultValue={c?.company}/><Select name="status" label="الحالة" defaultValue={c?.status||"Lead"} options={clientStatusLabels}/><Field name="email" label="البريد الإلكتروني" type="email" defaultValue={c?.email}/><Field name="phone" label="رقم الهاتف" defaultValue={c?.phone}/><Field name="source" label="مصدر العميل" defaultValue={c?.source}/><Field name="next_follow_up" label="موعد المتابعة" type="date" defaultValue={c?.next_follow_up}/><label className="full"><span>الملاحظات</span><textarea name="notes" rows={5} defaultValue={c?.notes??""}/></label><Actions saving={saving} onClose={onClose}/></form></Modal>; }


function ContentView({ items, allItems, projects, clients, query, filter, platformFilter, onQuery, onFilter, onPlatformFilter, onCreate, onEdit, onDelete }: { items:ContentItem[]; allItems:ContentItem[]; projects:Project[]; clients:Client[]; query:string; filter:ContentFilter; platformFilter:PlatformFilter; onQuery:(v:string)=>void; onFilter:(v:ContentFilter)=>void; onPlatformFilter:(v:PlatformFilter)=>void; onCreate:()=>void; onEdit:(i:ContentItem)=>void; onDelete:(i:ContentItem)=>void }) {
  const published=allItems.filter(i=>i.status==="Published").length;
  const scheduled=allItems.filter(i=>i.status==="Scheduled").length;
  const ideas=allItems.filter(i=>i.status==="Idea").length;
  return <section className="panel projects-panel content-studio">
    <Toolbar title="مكتبة المحتوى" count={allItems.length} query={query} placeholder="ابحث بالعنوان أو Hook أو Script…" onQuery={onQuery} onCreate={onCreate}/>
    <div className="task-summary enhanced"><span>الأفكار <b>{ideas}</b></span><span>قيد الإنتاج <b>{allItems.filter(i=>["Draft","Recording","Editing"].includes(i.status)).length}</b></span><span>المجدول <b>{scheduled}</b></span><span>المنشور <b>{published}</b></span></div>
    <div className="content-controls"><div className="filter-tabs content-status-tabs">{contentFilters.map(f=><button key={f} className={filter===f?"active":""} onClick={()=>onFilter(f)}>{f==="All"?"الكل":contentStatusLabels[f]}</button>)}</div><select value={platformFilter} onChange={e=>onPlatformFilter(e.target.value as PlatformFilter)}><option value="All">كل المنصات</option>{platformFilters.slice(1).map(p=><option value={p} key={p}>{platformLabels[p as ContentPlatform]}</option>)}</select></div>
    {items.length===0?<EmptyState text="لا يوجد محتوى مطابق بعد." onCreate={onCreate}/>:<div className="content-grid">{items.map(item=><ContentCard key={item.id} item={item} project={projects.find(p=>p.id===item.project_id)} client={clients.find(c=>c.id===item.client_id)} onEdit={()=>onEdit(item)} onDelete={()=>onDelete(item)}/>)}</div>}
  </section>;
}

function KnowledgeView({items,allItems,query,filter,favoriteOnly,onQuery,onFilter,onFavoriteOnly,onCreate,onEdit,onDelete}:{items:KnowledgeItem[];allItems:KnowledgeItem[];query:string;filter:KnowledgeFilter;favoriteOnly:boolean;onQuery:(v:string)=>void;onFilter:(v:KnowledgeFilter)=>void;onFavoriteOnly:(v:boolean)=>void;onCreate:()=>void;onEdit:(i:KnowledgeItem)=>void;onDelete:(i:KnowledgeItem)=>void}){
  return <section className="panel projects-panel knowledge-panel"><Toolbar title="مكتبة المعرفة" count={allItems.length} query={query} placeholder="ابحث في العناوين والمحتوى والوسوم…" onQuery={onQuery} onCreate={onCreate}/><div className="task-summary enhanced"><span>الملاحظات <b>{allItems.filter(i=>i.type==="Note").length}</b></span><span>الأفكار <b>{allItems.filter(i=>i.type==="Idea").length}</b></span><span>المراجع <b>{allItems.filter(i=>i.type==="Reference").length}</b></span><span>المفضلة <b>{allItems.filter(i=>i.is_favorite).length}</b></span></div><div className="knowledge-controls"><div className="filter-tabs">{knowledgeFilters.map(f=><button key={f} className={filter===f?"active":""} onClick={()=>onFilter(f)}>{f==="All"?"الكل":knowledgeTypeLabels[f]}</button>)}</div><button className={`favorite-filter ${favoriteOnly?"active":""}`} onClick={()=>onFavoriteOnly(!favoriteOnly)}><Star size={15}/> المفضلة فقط</button></div>{items.length?<div className="knowledge-grid">{items.map(i=><KnowledgeCard key={i.id} item={i} onEdit={()=>onEdit(i)} onDelete={()=>onDelete(i)}/>)}</div>:<EmptyState text="لا توجد عناصر معرفة مطابقة." onCreate={onCreate}/>}</section>;
}

function KnowledgeCard({item,onEdit,onDelete}:{item:KnowledgeItem;onEdit:()=>void;onDelete:()=>void}){const[open,setOpen]=useState(false);const icon=item.type==="Idea"?<Lightbulb size={16}/>:item.type==="Reference"?<Library size={16}/>:<FileText size={16}/>;return <article className="knowledge-card"><div className="project-card-top"><span className={`knowledge-type type-${item.type.toLowerCase()}`}>{icon}{knowledgeTypeLabels[item.type]}</span><div className="knowledge-actions">{item.is_favorite&&<Star className="favorite-star" size={17}/>}<CardMenu open={open} setOpen={setOpen} onEdit={onEdit} onDelete={onDelete}/></div></div><button className="knowledge-card-body" onClick={onEdit}><h3>{item.title}</h3><p>{item.content||"عنصر معرفة جديد"}</p></button>{item.tags&&<div className="content-hashtags"><Hash size={13}/>{item.tags}</div>}<footer><span><Clock3 size={14}/>{new Intl.DateTimeFormat("ar-SA",{day:"numeric",month:"short",year:"numeric"}).format(new Date(item.updated_at))}</span></footer></article>}

function KnowledgeModal({state,onClose,onSave}:{state:Exclude<KnowledgeModalState,null>;onClose:()=>void;onSave:(i:KnowledgeInput,c?:KnowledgeItem)=>Promise<boolean>}){const item=state.item;const[saving,setSaving]=useState(false);async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setSaving(true);const f=new FormData(e.currentTarget);const input:KnowledgeInput={title:String(f.get("title")||"").trim(),content:nullableText(f.get("content")),type:String(f.get("type")) as KnowledgeType,tags:nullableText(f.get("tags")),is_favorite:f.get("is_favorite")==="on"};if(!await onSave(input,item??undefined))setSaving(false)}return <Modal title={state.mode==="create"?"إضافة عنصر معرفة":"تعديل عنصر المعرفة"} kicker="KNOWLEDGE BASE" onClose={onClose}><form className="project-form" onSubmit={submit}><Field name="title" label="العنوان *" defaultValue={item?.title} required full maxLength={180}/><Select name="type" label="النوع" defaultValue={item?.type||"Note"} options={knowledgeTypeLabels}/><label className="checkbox-field"><input name="is_favorite" type="checkbox" defaultChecked={item?.is_favorite??false}/><span><Star size={15}/> إضافة إلى المفضلة</span></label><label className="full"><span>المحتوى</span><textarea name="content" rows={12} defaultValue={item?.content??""}/></label><Field name="tags" label="الوسوم — افصل بينها بفواصل" defaultValue={item?.tags} full/><Actions saving={saving} onClose={onClose}/></form></Modal>}

function ContentCard({item,project,client,onEdit,onDelete}:{item:ContentItem;project?:Project;client?:Client;onEdit:()=>void;onDelete:()=>void}){
  const [open,setOpen]=useState(false);
  return <article className="content-card"><div className="project-card-top"><span className={`status-pill content-${item.status.toLowerCase()}`}>{contentStatusLabels[item.status]}</span><CardMenu open={open} setOpen={setOpen} onEdit={onEdit} onDelete={onDelete}/></div><button className="content-card-body" onClick={onEdit}><div className="content-platform"><Film size={15}/>{platformLabels[item.platform]}</div><h3>{item.title}</h3><p>{item.hook||item.script||"فكرة محتوى جديدة"}</p></button><div className="content-links">{project&&<span><FolderKanban size={13}/>{project.name}</span>}{client&&<span><Users size={13}/>{client.name}</span>}</div>{item.hashtags&&<div className="content-hashtags"><Hash size={13}/>{item.hashtags}</div>}<footer><span><CalendarDays size={14}/>{formatDate(item.publish_date)}</span>{item.cta&&<span><Send size={14}/> CTA</span>}</footer></article>;
}

function ContentModal({state,projects,clients,onClose,onSave}:{state:Exclude<ContentModalState,null>;projects:Project[];clients:Client[];onClose:()=>void;onSave:(i:ContentInput,c?:ContentItem)=>Promise<boolean>}){
  const item=state.item; const[saving,setSaving]=useState(false);
  async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setSaving(true);const f=new FormData(e.currentTarget);const input:ContentInput={title:String(f.get("title")||"").trim(),hook:nullableText(f.get("hook")),script:nullableText(f.get("script")),cta:nullableText(f.get("cta")),hashtags:nullableText(f.get("hashtags")),platform:String(f.get("platform")) as ContentPlatform,status:String(f.get("status")) as ContentStatus,publish_date:dateValue(f.get("publish_date")),project_id:nullableText(f.get("project_id")),client_id:nullableText(f.get("client_id")),notes:nullableText(f.get("notes"))};if(!await onSave(input,item??undefined))setSaving(false);}
  return <Modal title={state.mode==="create"?"إنشاء محتوى جديد":"تعديل المحتوى"} kicker="CONTENT STUDIO" onClose={onClose}><form className="project-form" onSubmit={submit}><Field name="title" label="عنوان المحتوى *" defaultValue={item?.title} required full maxLength={180}/><Select name="status" label="مرحلة الإنتاج" defaultValue={item?.status||"Idea"} options={contentStatusLabels}/><Select name="platform" label="المنصة" defaultValue={item?.platform||"TikTok"} options={platformLabels}/><label><span>المشروع المرتبط</span><select name="project_id" defaultValue={item?.project_id??""}><option value="">بدون مشروع</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label><span>العميل المرتبط</span><select name="client_id" defaultValue={item?.client_id??""}><option value="">بدون عميل</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><Field name="publish_date" label="موعد النشر" type="date" defaultValue={item?.publish_date}/><label className="full"><span>Hook</span><textarea name="hook" rows={2} defaultValue={item?.hook??""}/></label><label className="full"><span>Script</span><textarea name="script" rows={8} defaultValue={item?.script??""}/></label><Field name="cta" label="CTA" defaultValue={item?.cta} full/><Field name="hashtags" label="Hashtags" defaultValue={item?.hashtags} full/><label className="full"><span>ملاحظات الإنتاج</span><textarea name="notes" rows={4} defaultValue={item?.notes??""}/></label><Actions saving={saving} onClose={onClose}/></form></Modal>;
}

function ProjectModal({ state, clients, onClose, onSave }: { state:Exclude<ProjectModalState,null>; clients:Client[]; onClose:()=>void; onSave:(i:ProjectInput,p?:Project)=>Promise<boolean> }) {
  const p=state.project;
  const [saving,setSaving]=useState(false);
  const [step,setStep]=useState(0);
  const [form,setForm]=useState({
    name:p?.name??"", project_number:p?.project_number??"", project_type:p?.project_type??"Villa", location:p?.location??"",
    description:p?.description??p?.notes??"", client_id:p?.client_id??"", client_name:p?.client_name??"", area:p?.area??"",
    status:p?.status??"Planning", priority:p?.priority??"Medium", design_phase:p?.design_phase??"Concept",
    start_date:p?.start_date??"", due_date:p?.due_date??"", progress:String(p?.progress??0), budget:p?.budget==null?"":String(p.budget),
    currency:p?.currency??"SAR", color:p?.color??foundationColorValues.primary, icon:p?.icon??"building"
  });
  const steps=["المعلومات الأساسية","الجدول والتنفيذ","الميزانية والهوية","المراجعة"];
  const projectTypeLabels:Record<ProjectType,string>={Villa:"فيلا","Residential Building":"مبنى سكني",Commercial:"تجاري",Office:"مكتب",Interior:"تصميم داخلي",Other:"أخرى"};
  const update=(key:string,value:string)=>setForm(current=>({...current,[key]:value}));
  const canContinue=step!==0||form.name.trim().length>0;
  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();
    if(step<steps.length-1){ if(canContinue)setStep(v=>v+1); return; }
    setSaving(true);
    const selectedClient=clients.find(c=>c.id===form.client_id);
    const input:ProjectInput={
      name:form.name.trim(), project_number:nullableText(form.project_number), project_type:form.project_type as ProjectType,
      location:nullableText(form.location), description:nullableText(form.description), status:form.status as ProjectStatus,
      priority:form.priority as PriorityLevel, design_phase:form.design_phase as DesignPhase, progress:clamp(Number(form.progress||0)),
      client_id:nullableText(form.client_id), client_name:selectedClient?.name??nullableText(form.client_name), area:nullableText(form.area),
      start_date:dateValue(form.start_date), due_date:dateValue(form.due_date), budget:form.budget===""?null:Math.max(0,Number(form.budget)),
      currency:form.currency||"SAR", color:nullableText(form.color), icon:nullableText(form.icon), notes:nullableText(form.description)
    };
    if(!await onSave(input,p??undefined))setSaving(false);
  }
  return <Modal title={state.mode==="create"?"إنشاء مشروع جديد":"تعديل المشروع"} kicker="PROJECT WIZARD · v1.1.1" onClose={onClose}>
    <div className="wizard-progress">{steps.map((label,index)=><button type="button" key={label} className={index===step?"active":index<step?"done":""} onClick={()=>index<=step&&setStep(index)}><b>{index+1}</b><span>{label}</span></button>)}</div>
    <form className="project-form wizard-form" onSubmit={submit}>
      {step===0&&<>
        <label className="full"><span>اسم المشروع *</span><input value={form.name} onChange={e=>update("name",e.target.value)} required maxLength={120}/></label>
        <label><span>رقم المشروع</span><input value={form.project_number} onChange={e=>update("project_number",e.target.value)} placeholder="YR-2026-001"/></label>
        <label><span>نوع المشروع</span><select value={form.project_type} onChange={e=>update("project_type",e.target.value)}>{Object.entries(projectTypeLabels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
        <label><span>العميل المرتبط</span><select value={form.client_id} onChange={e=>update("client_id",e.target.value)}><option value="">بدون عميل</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}{c.company?` — ${c.company}`:""}</option>)}</select></label>
        {!form.client_id&&<label><span>اسم عميل يدوي</span><input value={form.client_name} onChange={e=>update("client_name",e.target.value)}/></label>}
        <label><span>الموقع / المدينة</span><input value={form.location} onChange={e=>update("location",e.target.value)} placeholder="جدة، المملكة العربية السعودية"/></label>
        <label><span>المساحة أو المجال</span><input value={form.area} onChange={e=>update("area",e.target.value)} placeholder="450 م²"/></label>
        <label className="full"><span>وصف المشروع</span><textarea rows={5} value={form.description} onChange={e=>update("description",e.target.value)}/></label>
      </>}
      {step===1&&<>
        <label><span>الحالة</span><select value={form.status} onChange={e=>update("status",e.target.value)}>{Object.entries(projectStatusLabels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
        <label><span>الأولوية</span><select value={form.priority} onChange={e=>update("priority",e.target.value)}>{Object.entries(priorityLabels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
        <label className="full"><span>المرحلة التصميمية</span><select value={form.design_phase} onChange={e=>update("design_phase",e.target.value)}>{Object.entries(phaseLabels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
        <label><span>تاريخ البداية</span><input type="date" value={form.start_date} onChange={e=>update("start_date",e.target.value)}/></label>
        <label><span>موعد التسليم</span><input type="date" min={form.start_date||undefined} value={form.due_date} onChange={e=>update("due_date",e.target.value)}/></label>
        <label className="full"><span>نسبة التقدم: {form.progress}%</span><input type="range" min="0" max="100" value={form.progress} onChange={e=>update("progress",e.target.value)}/></label>
      </>}
      {step===2&&<>
        <label><span>الميزانية</span><input type="number" min="0" step="0.01" value={form.budget} onChange={e=>update("budget",e.target.value)} placeholder="0.00"/></label>
        <label><span>العملة</span><select value={form.currency} onChange={e=>update("currency",e.target.value)}><option value="SAR">SAR</option><option value="USD">USD</option><option value="EGP">EGP</option><option value="AED">AED</option></select></label>
        <label><span>لون المشروع</span><input type="color" value={form.color} onChange={e=>update("color",e.target.value)}/></label>
        <label><span>أيقونة المشروع</span><select value={form.icon} onChange={e=>update("icon",e.target.value)}><option value="building">مبنى</option><option value="home">منزل</option><option value="briefcase">أعمال</option><option value="palette">تصميم</option></select></label>
        <div className="project-identity-preview full" style={{borderInlineStartColor:form.color}}><span>معاينة بطاقة المشروع</span><b>{form.name||"اسم المشروع"}</b><small>{projectTypeLabels[form.project_type as ProjectType]} · {form.currency} {form.budget||"0"}</small></div>
      </>}
      {step===3&&<div className="project-review full">
        <div><span>المشروع</span><b>{form.name}</b><small>{form.project_number||"سيتم العمل بدون رقم مشروع"}</small></div>
        <div><span>العميل</span><b>{clients.find(c=>c.id===form.client_id)?.name||form.client_name||"غير محدد"}</b><small>{form.location||"الموقع غير محدد"}</small></div>
        <div><span>التنفيذ</span><b>{phaseLabels[form.design_phase as DesignPhase]}</b><small>{projectStatusLabels[form.status as ProjectStatus]} · {priorityLabels[form.priority as PriorityLevel]}</small></div>
        <div><span>الجدول</span><b>{formatDate(form.start_date)} ← {formatDate(form.due_date)}</b><small>التقدم المبدئي {form.progress}%</small></div>
        <div><span>الميزانية</span><b>{form.currency} {form.budget||"0"}</b><small>يمكن تعديلها لاحقًا من مساحة المشروع</small></div>
      </div>}
      <div className="form-actions full wizard-actions"><button type="button" onClick={step===0?onClose:()=>setStep(v=>v-1)}>{step===0?"إلغاء":"السابق"}</button><button className="primary" disabled={saving||!canContinue}>{saving?"جارٍ الحفظ…":step===steps.length-1?(state.mode==="create"?"إنشاء المشروع":"حفظ التعديلات"):"التالي"}</button></div>
    </form>
  </Modal>;
}

function ProjectWorkspace({project,tasks,financeItems,activityEvents,client,onClose,onEdit,onCreateTask}:{project:Project;tasks:Task[];financeItems:FinanceTransaction[];activityEvents:ActivityEvent[];client?:Client;onClose:()=>void;onEdit:()=>void;onCreateTask:()=>void}){
  type WorkspaceTab="overview"|"tasks"|"files"|"notes"|"timeline"|"finance"|"activity";
  const [tab,setTab]=useState<WorkspaceTab>("overview");
  const completed=tasks.filter(t=>t.status==="Done").length;
  const overdue=tasks.filter(t=>t.status!=="Done"&&t.due_date&&t.due_date<new Date().toISOString().slice(0,10)).length;
  const income=financeItems.filter(i=>i.type==="Income"&&i.status!=="Cancelled").reduce((sum,i)=>sum+i.amount,0);
  const expenses=financeItems.filter(i=>i.type==="Expense"&&i.status!=="Cancelled").reduce((sum,i)=>sum+i.amount,0);
  const taskProgress=tasks.length?Math.round(tasks.reduce((sum,t)=>sum+t.progress,0)/tasks.length):project.progress;
  const daysUntilDue=project.due_date?Math.ceil((new Date(`${project.due_date}T23:59:59`).getTime()-Date.now())/86400000):null;
  const brief=overdue>0
    ? `يحتاج المشروع إلى تدخل الآن: توجد ${overdue} ${overdue===1?"مهمة متأخرة":"مهام متأخرة"}. ابدأ بإعادة ترتيب الأولويات قبل متابعة الأعمال الجديدة.`
    : daysUntilDue!==null&&daysUntilDue>=0&&daysUntilDue<=7&&completed<tasks.length
      ? `موعد التسليم خلال ${daysUntilDue} ${daysUntilDue===1?"يوم":"أيام"}. راجع المهام المفتوحة وثبّت مسؤولية كل خطوة.`
      : tasks.length===0
        ? "المشروع جاهز للبدء، لكنه لا يحتوي على مهام بعد. أنشئ أول مهمة لتحويل الخطة إلى تنفيذ قابل للقياس."
        : `المشروع مستقر حاليًا، والتقدم المحسوب من المهام ${taskProgress}%. الأولوية التالية هي الحفاظ على تحديث التنفيذ يوميًا.`;
  const tabs:{id:WorkspaceTab;label:string;icon:ReactNode;count?:number}[]=[
    {id:"overview",label:"نظرة عامة",icon:<LayoutDashboard size={16}/>},
    {id:"tasks",label:"المهام",icon:<ClipboardList size={16}/>,count:tasks.length},
    {id:"files",label:"الملفات",icon:<FileText size={16}/>},
    {id:"notes",label:"الملاحظات",icon:<BookOpen size={16}/>},
    {id:"timeline",label:"الخط الزمني",icon:<CalendarDays size={16}/>},
    {id:"finance",label:"المالية",icon:<Wallet size={16}/>,count:financeItems.length},
    {id:"activity",label:"النشاط",icon:<Activity size={16}/>,count:activityEvents.length},
  ];
  const phases:DesignPhase[]=["Concept","Schematic","Design Development","Construction Documents","Site Supervision","Handover"];
  const currentPhase=Math.max(0,phases.indexOf(project.design_phase||"Concept"));
  const taskColumns:TaskStatus[]=["To Do","In Progress","Review","Done"];
  return <div className="modal-backdrop project-workspace-backdrop" onMouseDown={onClose}><section className="project-workspace project-workspace-v2" onMouseDown={e=>e.stopPropagation()}>
    <header className="project-workspace-head"><div><span className="section-kicker">PROJECT WORKSPACE · v3.0</span><div className="workspace-title-row"><span className={`status-dot ${projectStatusClass(project.status)}`}/><h2>{project.name}</h2><span className="workspace-status">{projectStatusLabels[project.status]}</span></div><p>{project.description||project.notes||project.location||project.area||"مساحة تنفيذ موحدة للمشروع."}</p></div><div className="project-workspace-actions"><button onClick={onEdit}><Pencil size={16}/> تعديل</button><button className="primary compact" onClick={onCreateTask}><Plus size={16}/> مهمة جديدة</button><button className="icon-button" onClick={onClose}><X size={20}/></button></div></header>
    <div className="executive-brief"><div className="executive-brief-icon"><Brain size={22}/></div><div><span className="section-kicker">EXECUTIVE BRIEF</span><strong>{brief}</strong></div><button onClick={()=>setTab("tasks")}>فتح التنفيذ <ChevronLeft size={16}/></button></div>
    <div className="project-workspace-kpis"><Metric icon={<FolderKanban/>} label="حالة المشروع" value={projectStatusLabels[project.status]} detail={priorityLabels[project.priority]}/><Metric icon={<ClipboardList/>} label="المهام" value={`${completed}/${tasks.length}`} detail={overdue?`${overdue} متأخرة`:"لا توجد مهام متأخرة"} danger={overdue>0}/><Metric icon={<Activity/>} label="تقدم التنفيذ" value={`${taskProgress}%`} detail={tasks.length?"محسوب من المهام":"التقدم المسجل"}/><Metric icon={<Wallet/>} label="صافي المشروع" value={new Intl.NumberFormat("en-US",{maximumFractionDigits:0}).format(income-expenses)} detail={financeItems[0]?.currency||project.currency||"SAR"}/></div>
    <nav className="project-workspace-tabs" aria-label="أقسام مساحة المشروع">{tabs.map(item=><button key={item.id} className={tab===item.id?"active":""} onClick={()=>setTab(item.id)}>{item.icon}<span>{item.label}</span>{item.count!==undefined&&item.count>0?<em>{item.count}</em>:null}</button>)}</nav>

    {tab==="overview"&&<div className="project-workspace-grid workspace-overview-v2">
      <article className="project-overview-card"><span className="section-kicker">PROJECT PROFILE</span><h3>بيانات المشروع</h3><dl><div><dt>العميل</dt><dd>{client?.name||project.client_name||"غير محدد"}</dd></div><div><dt>رقم المشروع</dt><dd>{project.project_number||"غير محدد"}</dd></div><div><dt>النوع</dt><dd>{project.project_type||"غير محدد"}</dd></div><div><dt>الموقع</dt><dd>{project.location||"غير محدد"}</dd></div><div><dt>المساحة / المجال</dt><dd>{project.area||"غير محدد"}</dd></div><div><dt>المرحلة الحالية</dt><dd>{project.design_phase||"غير محدد"}</dd></div><div><dt>الميزانية</dt><dd>{project.budget==null?"غير محددة":`${project.currency} ${new Intl.NumberFormat("en-US").format(project.budget)}`}</dd></div><div><dt>التسليم</dt><dd>{formatDate(project.due_date)}</dd></div></dl><div className="card-progress-head"><span>التقدم التنفيذي</span><b>{taskProgress}%</b></div><div className="progress"><i style={{width:`${taskProgress}%`}}/></div></article>
      <article className="project-overview-card architecture-phase-card"><span className="section-kicker">ARCHITECTURE MODE</span><h3>مراحل المشروع المعماري</h3><div className="phase-track">{phases.map((phase,index)=><div key={phase} className={`${index<currentPhase?"done":""} ${index===currentPhase?"current":""}`}><i>{index<currentPhase?<CheckCircle2 size={17}/>:index===currentPhase?<Clock3 size={17}/>:<span>{index+1}</span>}</i><div><b>{phaseLabels[phase]}</b><small>{index<currentPhase?"مكتملة":index===currentPhase?"المرحلة الحالية":"قادمة"}</small></div></div>)}</div></article>
      <article className="project-overview-card workspace-recent-card"><span className="section-kicker">NEXT ACTIONS</span><h3>الخطوات التالية</h3>{tasks.filter(t=>t.status!=="Done").length?<div className="workspace-task-list">{tasks.filter(t=>t.status!=="Done").sort((a,b)=>(a.due_date||"9999").localeCompare(b.due_date||"9999")).slice(0,5).map(t=><div key={t.id}><span className={`status-dot ${taskStatusClass(t.status)}`}/><div><b>{t.title}</b><small>{taskStatusLabels[t.status]} · {formatDate(t.due_date)}</small></div><strong>{priorityLabels[t.priority]}</strong></div>)}</div>:<EmptyState compact text="لا توجد خطوات مفتوحة." onCreate={onCreateTask}/>}</article>
    </div>}

    {tab==="tasks"&&<section className="workspace-tab-panel"><div className="workspace-panel-head"><div><span className="section-kicker">TASK BOARD</span><h3>لوحة تنفيذ المشروع</h3></div><button className="primary compact" onClick={onCreateTask}><Plus size={16}/> مهمة جديدة</button></div><div className="project-kanban">{taskColumns.map(status=><div className="project-kanban-column" key={status}><header><span>{taskStatusLabels[status]}</span><em>{tasks.filter(t=>t.status===status).length}</em></header>{tasks.filter(t=>t.status===status).map(t=><article key={t.id}><div className="kanban-priority"><span className={`priority-badge ${t.priority.toLowerCase()}`}>{priorityLabels[t.priority]}</span><b>{t.progress}%</b></div><h4>{t.title}</h4>{t.description&&<p>{t.description}</p>}<footer><span><CalendarDays size={14}/>{formatDate(t.due_date)}</span><div className="mini-progress"><i style={{width:`${t.progress}%`}}/></div></footer></article>)}{tasks.filter(t=>t.status===status).length===0&&<div className="kanban-empty">لا توجد مهام</div>}</div>)}</div></section>}

    {tab==="timeline"&&<section className="workspace-tab-panel"><div className="workspace-panel-head"><div><span className="section-kicker">PROJECT TIMELINE</span><h3>المحطات الرئيسية</h3></div></div><div className="workspace-timeline"><div className="done"><i><CheckCircle2 size={18}/></i><div><b>إنشاء المشروع</b><small>{formatDate(project.created_at)}</small></div></div>{phases.map((phase,index)=><div key={phase} className={index<currentPhase?"done":index===currentPhase?"current":""}><i>{index<currentPhase?<CheckCircle2 size={18}/>:<span/>}</i><div><b>{phaseLabels[phase]}</b><small>{index<currentPhase?"مرحلة مكتملة":index===currentPhase?"قيد التنفيذ":"بانتظار البدء"}</small></div></div>)}<div className={project.status==="Completed"?"done":""}><i>{project.status==="Completed"?<CheckCircle2 size={18}/>:<span/>}</i><div><b>التسليم النهائي</b><small>{formatDate(project.due_date)}</small></div></div></div></section>}

    {tab==="finance"&&<section className="workspace-tab-panel"><div className="workspace-panel-head"><div><span className="section-kicker">PROJECT FINANCE</span><h3>الملخص المالي</h3></div></div><div className="workspace-finance-summary"><Metric icon={<ArrowUpDown/>} label="الدخل" value={new Intl.NumberFormat("en-US").format(income)} detail={project.currency}/><Metric icon={<Wallet/>} label="المصروفات" value={new Intl.NumberFormat("en-US").format(expenses)} detail={project.currency}/><Metric icon={<Activity/>} label="الصافي" value={new Intl.NumberFormat("en-US").format(income-expenses)} detail={project.currency}/></div>{financeItems.length?<div className="workspace-finance-list">{financeItems.map(item=><div key={item.id}><span className={item.type==="Income"?"finance-in":"finance-out"}>{item.type==="Income"?"دخل":"مصروف"}</span><div><b>{item.description}</b><small>{formatDate(item.transaction_date)} · {item.status}</small></div><strong>{item.currency} {new Intl.NumberFormat("en-US").format(item.amount)}</strong></div>)}</div>:<EmptyState text="لا توجد معاملات مالية مرتبطة بهذا المشروع."/>}</section>}

    {tab==="activity"&&<section className="workspace-tab-panel"><div className="workspace-panel-head"><div><span className="section-kicker">ACTIVITY STREAM</span><h3>آخر نشاطات المشروع</h3></div></div>{activityEvents.length?<div className="workspace-activity-list">{activityEvents.slice(0,20).map(event=><div key={event.id}><i><Activity size={16}/></i><div><b>{event.title}</b><small>{event.description||event.module} · {new Intl.DateTimeFormat("ar-SA",{dateStyle:"medium",timeStyle:"short"}).format(new Date(event.created_at))}</small></div></div>)}</div>:<EmptyState text="لا يوجد نشاط مسجل للمشروع بعد."/>}</section>}

    {tab==="files"&&<ProjectFilesPanel projectId={project.id}/>}
    {tab==="notes"&&<ProjectNotesPanel projectId={project.id}/>}
  </section></div>;
}

function ProjectNotesPanel({projectId}:{projectId:string}) {
  const [notes,setNotes]=useState<ProjectNote[]>([]);
  const [files,setFiles]=useState<ProjectFile[]>([]);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [creating,setCreating]=useState(false);
  const [message,setMessage]=useState("");
  const refresh=useCallback(async()=>{
    setLoading(true);
    try {
      const [noteRows,fileRows]=await Promise.all([listProjectNotes(projectId),listProjectFiles(projectId)]);
      setNotes(noteRows);setFiles(fileRows);setMessage("");
    } catch(cause) { setMessage(cause instanceof Error?cause.message:"تعذر تحميل سجل المشروع."); }
    finally { setLoading(false); }
  },[projectId]);
  useEffect(()=>{void refresh();},[refresh]);

  async function submit(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault();setSaving(true);setMessage("");
    const form=new FormData(event.currentTarget);
    try {
      await createProjectNote({
        project_id:projectId,
        project_file_id:String(form.get("project_file_id")||"")||null,
        type:String(form.get("type")) as ProjectNoteType,
        title:String(form.get("title")||"").trim(),
        content:String(form.get("content")||"").trim()||null,
        assigned_to:String(form.get("assigned_to")||"").trim()||null,
        follow_up_date:String(form.get("follow_up_date")||"")||null,
      });
      setCreating(false);await refresh();
    } catch(cause) { setMessage(cause instanceof Error?cause.message:"تعذر حفظ الملاحظة."); }
    finally { setSaving(false); }
  }
  async function changeStatus(note:ProjectNote,status:"open"|"done"|"archived") {
    try { await setProjectNoteStatus(note,status);await refresh(); }
    catch(cause) { setMessage(cause instanceof Error?cause.message:"تعذر تحديث الحالة."); }
  }
  async function convert(note:ProjectNote) {
    try { await convertProjectNoteToTask(note);await refresh(); }
    catch(cause) { setMessage(cause instanceof Error?cause.message:"تعذر تحويل الملاحظة إلى مهمة."); }
  }
  async function remove(note:ProjectNote) {
    if(!window.confirm(`حذف «${note.title}»؟`))return;
    try { await deleteProjectNote(note);await refresh(); }
    catch(cause) { setMessage(cause instanceof Error?cause.message:"تعذر حذف الملاحظة."); }
  }
  const typeLabels:Record<ProjectNoteType,string>={decision:"قرار",meeting:"اجتماع",review:"مراجعة",general:"ملاحظة"};
  const fileName=(id:string|null)=>files.find(file=>file.id===id)?.name;
  return <section className="workspace-tab-panel project-notes-panel">
    <div className="workspace-panel-head">
      <div><span className="section-kicker">DECISION LOG</span><h3>ملاحظات وقرارات المشروع</h3><p>سجل القرارات والاجتماعات والمراجعات، ثم حوّلها إلى مهام قابلة للتنفيذ.</p></div>
      <button className="primary compact" onClick={()=>setCreating(value=>!value)}><Plus size={16}/>{creating?"إغلاق":"إضافة سجل"}</button>
    </div>
    {creating&&<form className="project-note-form" onSubmit={submit}>
      <label><span>النوع</span><select name="type" defaultValue="general"><option value="decision">قرار</option><option value="meeting">اجتماع</option><option value="review">مراجعة</option><option value="general">ملاحظة</option></select></label>
      <label className="note-title"><span>العنوان *</span><input name="title" required maxLength={180}/></label>
      <label><span>المسؤول</span><input name="assigned_to"/></label>
      <label><span>تاريخ المتابعة</span><input name="follow_up_date" type="date"/></label>
      <label className="note-file"><span>ملف مرتبط</span><select name="project_file_id"><option value="">بدون ملف</option>{files.map(file=><option key={file.id} value={file.id}>{file.name}</option>)}</select></label>
      <label className="note-content"><span>التفاصيل</span><textarea name="content" rows={4}/></label>
      <div className="form-actions note-actions"><button type="button" onClick={()=>setCreating(false)}>إلغاء</button><button className="primary" disabled={saving}>{saving?"جارٍ الحفظ…":"حفظ السجل"}</button></div>
    </form>}
    {message&&<div className="project-files-message">{message}</div>}
    {loading?<div className="project-files-loading">جارٍ تحميل السجل…</div>:notes.length===0
      ?<div className="project-files-empty"><BookOpen size={34}/><h4>لا توجد ملاحظات أو قرارات</h4><p>أضف أول قرار أو اجتماع أو مراجعة للمشروع.</p></div>
      :<div className="project-note-list">{notes.map(note=><article key={note.id} className={`note-${note.status}`}>
        <header><span className={`note-type ${note.type}`}>{typeLabels[note.type]}</span><em>{note.status==="open"?"مفتوح":note.status==="done"?"منفذ":"مؤرشف"}</em></header>
        <h4>{note.title}</h4>{note.content&&<p>{note.content}</p>}
        <footer><span>{note.assigned_to||"دون مسؤول"}</span><span>{note.follow_up_date?formatDate(note.follow_up_date):"دون موعد"}</span>{fileName(note.project_file_id)&&<span>📎 {fileName(note.project_file_id)}</span>}</footer>
        <div className="project-note-buttons">
          {note.status==="open"&&<><button onClick={()=>void convert(note)}>تحويل إلى مهمة</button><button onClick={()=>void changeStatus(note,"done")}>تعليم كمنفذ</button></>}
          {note.status==="done"&&<button onClick={()=>void changeStatus(note,"open")}>إعادة فتح</button>}
          <button onClick={()=>void changeStatus(note,"archived")}>أرشفة</button>
          <button className="delete" aria-label={`حذف ${note.title}`} onClick={()=>void remove(note)}><Trash2 size={15}/></button>
        </div>
      </article>)}</div>}
  </section>;
}

function ProjectFilesPanel({projectId}:{projectId:string}) {
  const [files,setFiles]=useState<ProjectFile[]>([]);
  const [loading,setLoading]=useState(true);
  const [uploading,setUploading]=useState(false);
  const [message,setMessage]=useState("");

  const refreshFiles=useCallback(async()=>{
    setLoading(true);
    try { setFiles(await listProjectFiles(projectId)); setMessage(""); }
    catch(cause) { setMessage(cause instanceof Error?cause.message:"تعذر تحميل ملفات المشروع."); }
    finally { setLoading(false); }
  },[projectId]);

  useEffect(()=>{ void refreshFiles(); },[refreshFiles]);

  async function onUpload(event:React.ChangeEvent<HTMLInputElement>) {
    const selected=event.target.files?.[0];
    event.target.value="";
    if(!selected)return;
    setUploading(true);setMessage("");
    try { await uploadProjectFile(projectId,selected); await refreshFiles(); }
    catch(cause) { setMessage(cause instanceof Error?cause.message:"تعذر رفع الملف."); }
    finally { setUploading(false); }
  }
  async function onDownload(file:ProjectFile) {
    try { window.location.assign(await createProjectFileDownloadUrl(file)); }
    catch(cause) { setMessage(cause instanceof Error?cause.message:"تعذر تنزيل الملف."); }
  }
  async function onDelete(file:ProjectFile) {
    if(!window.confirm(`حذف الملف «${file.name}» نهائيًا؟`))return;
    try { await deleteProjectFile(file); await refreshFiles(); }
    catch(cause) { setMessage(cause instanceof Error?cause.message:"تعذر حذف الملف."); }
  }
  const categoryLabels:Record<ProjectFile["category"],string>={
    drawing:"مخطط",document:"مستند",image:"صورة",model:"نموذج",other:"ملف",
  };
  const formatSize=(bytes:number)=>bytes>=1048576?`${(bytes/1048576).toFixed(1)} MB`:`${Math.max(1,Math.round(bytes/1024))} KB`;

  return <section className="workspace-tab-panel project-files-panel">
    <div className="workspace-panel-head">
      <div><span className="section-kicker">DOCUMENT CONTROL</span><h3>مركز ملفات المشروع</h3><p>ارفع المستندات والمخططات والنماذج واحفظها داخل المشروع.</p></div>
      <label className={`project-file-upload primary compact ${uploading?"disabled":""}`}>
        <Plus size={16}/>{uploading?"جارٍ الرفع…":"رفع ملف"}
        <input type="file" disabled={uploading} onChange={(event)=>void onUpload(event)} accept=".pdf,.dwg,.dxf,.ifc,.rvt,.nwd,.nwc,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*"/>
      </label>
    </div>
    <div className="project-files-meta"><span>PDF · DWG · IFC · Office · Images</span><em>الحد الأقصى 100 MB للملف</em></div>
    {message&&<div className="project-files-message">{message}</div>}
    {loading?<div className="project-files-loading">جارٍ تحميل الملفات…</div>:files.length===0
      ?<div className="project-files-empty"><FileText size={34}/><h4>لا توجد ملفات في المشروع</h4><p>استخدم زر «رفع ملف» لإضافة أول مستند.</p></div>
      :<div className="project-files-list">{files.map(file=><article key={file.id}>
        <span className="project-file-icon"><FileText size={20}/></span>
        <div><strong>{file.name}</strong><small>{categoryLabels[file.category]} · {formatSize(file.file_size)} · {new Intl.DateTimeFormat("ar-SA",{dateStyle:"medium"}).format(new Date(file.created_at))}</small></div>
        <button onClick={()=>void onDownload(file)}>تنزيل</button>
        <button className="delete" aria-label={`حذف ${file.name}`} onClick={()=>void onDelete(file)}><Trash2 size={16}/></button>
      </article>)}</div>}
  </section>;
}
function TaskModal({ state, projects, onClose, onSave }: { state:Exclude<TaskModalState,null>; projects:Project[]; onClose:()=>void; onSave:(i:TaskInput,t?:Task)=>Promise<boolean> }) { const t=state.task; const [saving,setSaving]=useState(false); async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setSaving(true);const f=new FormData(e.currentTarget);const status=String(f.get("status")) as TaskStatus;const input:TaskInput={project_id:String(f.get("project_id")),title:String(f.get("title")||"").trim(),description:nullableText(f.get("description")),status,priority:String(f.get("priority")) as PriorityLevel,progress:status==="Done"?100:clamp(Number(f.get("progress")||0)),due_date:dateValue(f.get("due_date"))};if(!await onSave(input,t??undefined))setSaving(false);} return <Modal title={state.mode==="create"?"إنشاء مهمة جديدة":"تعديل المهمة"} kicker="TASK ENGINE" onClose={onClose}><form className="project-form" onSubmit={submit}><label className="full"><span>المشروع *</span><select name="project_id" defaultValue={t?.project_id||projects[0]?.id} required>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><Field name="title" label="عنوان المهمة *" defaultValue={t?.title} required full maxLength={160}/><Select name="status" label="الحالة" defaultValue={t?.status||"To Do"} options={taskStatusLabels}/><Select name="priority" label="الأولوية" defaultValue={t?.priority||"Medium"} options={priorityLabels}/><Field name="progress" label="نسبة التقدم" type="number" defaultValue={t?.progress??0} min={0} max={100}/><Field name="due_date" label="موعد الاستحقاق" type="date" defaultValue={t?.due_date}/><label className="full"><span>الوصف</span><textarea name="description" rows={5} defaultValue={t?.description??""}/></label><Actions saving={saving} onClose={onClose}/></form></Modal>; }

function Modal({ title, kicker, onClose, children }: { title:string; kicker:string; onClose:()=>void; children:ReactNode }) { return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal" onMouseDown={(e)=>e.stopPropagation()}><div className="modal-head"><div><span className="section-kicker">{kicker}</span><h2>{title}</h2></div><button className="icon-button" onClick={onClose}><X size={20}/></button></div>{children}</div></div>; }
function Field({ name,label,defaultValue,type="text",required,full,min,max,maxLength }: { name:string;label:string;defaultValue?:string|number|null;type?:string;required?:boolean;full?:boolean;min?:number;max?:number;maxLength?:number }) { return <label className={full?"full":""}><span>{label}</span><input name={name} type={type} defaultValue={defaultValue??""} required={required} min={min} max={max} maxLength={maxLength}/></label>; }
function Select<T extends string>({ name,label,defaultValue,options }: { name:string;label:string;defaultValue:T;options:Record<T,string> }) { return <label><span>{label}</span><select name={name} defaultValue={defaultValue}>{Object.entries(options).map(([v,l])=><option key={v} value={v}>{String(l)}</option>)}</select></label>; }
function Actions({ saving,onClose }: { saving:boolean;onClose:()=>void }) { return <div className="form-actions full"><button type="button" onClick={onClose}>إلغاء</button><button className="primary" disabled={saving}>{saving?"جارٍ الحفظ…":"حفظ"}</button></div>; }

function ConfirmDelete({ title,text,onCancel,onConfirm }: { title:string;text:string;onCancel:()=>void;onConfirm:()=>void }) { return <div className="modal-backdrop"><div className="confirm-modal"><div className="warning-icon"><AlertTriangle/></div><h2>{title}</h2><p>{text}</p><div className="form-actions"><button onClick={onCancel}>إلغاء</button><button className="delete-button" onClick={onConfirm}>حذف نهائي</button></div></div></div>; }
function Metric({ icon,label,value,detail,danger }: { icon:ReactNode;label:string;value:string|number;detail:string;danger?:boolean }) { return <div className={`metric-card ${danger?"danger":""}`}><span>{icon}</span><div><small>{label}</small><strong>{value}</strong><em>{detail}</em></div></div>; }
function EmptyState({ text="لا توجد بيانات بعد.",compact,onCreate }: { text?:string;compact?:boolean;onCreate?:()=>void }) { return <div className={`empty-state ${compact?"compact":""}`}><span><ClipboardList/></span><h3>{text}</h3>{onCreate&&<button className="primary compact" onClick={onCreate}><Plus size={16}/> إضافة الآن</button>}</div>; }

function Auth(){
  const[email,setEmail]=useState("");
  const[message,setMessage]=useState("");
  const[messageTone,setMessageTone]=useState<"success"|"error"|"info">("info");
  const[busy,setBusy]=useState(false);

  async function verifyAuthEndpoint(){
    const baseUrl=process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if(!baseUrl||!anonKey) throw new Error("AUTH_CONFIG_MISSING");
    if(!navigator.onLine) throw new Error("BROWSER_OFFLINE");

    const controller=new AbortController();
    const timeout=window.setTimeout(()=>controller.abort(),8000);
    try{
      const response=await fetch(`${baseUrl.replace(/\/$/,"")}/auth/v1/health`,{
        method:"GET",
        headers:{apikey:anonKey},
        signal:controller.signal,
        cache:"no-store"
      });
      if(!response.ok) throw new Error(`AUTH_HEALTH_${response.status}`);
    }finally{
      window.clearTimeout(timeout);
    }
  }

  async function submit(e:FormEvent){
    e.preventDefault();
    setBusy(true);
    setMessageTone("info");
    setMessage("جارٍ التحقق من اتصال المصادقة…");
    try{
      await verifyAuthEndpoint();
      const{error}=await supabase.auth.signInWithOtp({
        email:email.trim(),
        options:{emailRedirectTo:window.location.origin}
      });
      if(error) throw error;
      setMessageTone("success");
      setMessage("تم إرسال رابط الدخول الآمن إلى بريدك. تحقق من صندوق الوارد والرسائل غير المرغوب فيها.");
    }catch(error){
      console.error("YOSSEUF OS authentication diagnostics",{
        error,
        online:navigator.onLine,
        origin:window.location.origin,
        supabaseHost:(()=>{try{return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL||"").host}catch{return "invalid"}})()
      });
      const raw=error instanceof Error?error.message:String(error);
      setMessageTone("error");
      if(raw==="AUTH_CONFIG_MISSING") setMessage("إعدادات Supabase غير مكتملة في بيئة النشر. راجع متغيرات Vercel ثم أعد النشر.");
      else if(raw==="BROWSER_OFFLINE") setMessage("الجهاز غير متصل بالإنترنت. تحقق من الاتصال ثم أعد المحاولة.");
      else if(error instanceof DOMException&&error.name==="AbortError") setMessage("انتهت مهلة الاتصال بخدمة المصادقة. جرّب شبكة أخرى أو تحقق من حظر نطاق supabase.co.");
      else if(error instanceof TypeError||raw.toLowerCase().includes("failed to fetch")) setMessage("تعذر الوصول إلى خدمة Supabase من هذه الشبكة. جرّب شبكة الهاتف أو اسمح للنطاق *.supabase.co في الجدار الناري. [AUTH-NETWORK]");
      else if(raw.startsWith("AUTH_HEALTH_")) setMessage(`خدمة المصادقة أعادت حالة غير متوقعة (${raw.replace("AUTH_HEALTH_","")}). [AUTH-HEALTH]`);
      else setMessage(`${raw} [AUTH-OTP]`);
    }finally{
      setBusy(false);
    }
  }

  return <div className="auth-page"><div className="auth-card"><div className="logo-mark auth-logo"><Brain/></div><span className="section-kicker">PERSONAL OPERATING SYSTEM</span><h1>YOSSEUF OS</h1><p>سجّل الدخول للوصول إلى مشاريعك ومهامك.</p><form onSubmit={submit}><label><span>البريد الإلكتروني</span><input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required autoComplete="email" inputMode="email"/></label><button className="primary" disabled={busy}>{busy?"جارٍ التحقق والإرسال…":"إرسال رابط الدخول"}</button></form>{message&&<div className={`auth-message ${messageTone}`} role="status" aria-live="polite">{message}</div>}<small className="auth-diagnostic-note">{APP_INFO.fullLabel}</small></div></div>
}
function LoadingScreen(){return <div className="center-screen"><div className="loader"><Brain size={38}/><span>جارٍ تشغيل YOSSEUF OS…</span></div></div>}

const clamp=(n:number)=>Math.max(0,Math.min(100,Number.isFinite(n)?n:0));
const nullableText=(v:FormDataEntryValue|null)=>{const s=String(v??"").trim();return s||null};
const dateValue=(v:FormDataEntryValue|null)=>String(v||"")||null;
const projectName=(projects:Project[],id:string)=>projects.find(p=>p.id===id)?.name||"مشروع غير متاح";
const formatDate=(v:string|null)=>v?new Intl.DateTimeFormat("ar-SA",{day:"numeric",month:"short",year:"numeric"}).format(new Date(`${v}T00:00:00`)):"غير محدد";
const projectStatusClass=(s:ProjectStatus)=>s.toLowerCase().replaceAll(" ","-");
const taskStatusClass=(s:TaskStatus)=>s.toLowerCase().replaceAll(" ","-");
const isOverdue=(t:Task)=>Boolean(t.status!=="Done"&&t.due_date&&t.due_date<new Date().toISOString().slice(0,10));
