"use client";

import type { Session } from "@supabase/supabase-js";
import {
  AlertTriangle, Brain, CalendarDays, CheckCircle2, ChevronLeft, CirclePause,
  ClipboardList, FolderKanban, LayoutDashboard, LogOut, Menu, MoreHorizontal, Users, Mail, Phone, Building2,
  Pencil, Plus, Search, Trash2, X, List, Columns3, ArrowUpDown, Clock3, Film, Hash, Send, BookOpen, Star, FileText, Lightbulb, Library, Wallet, Activity, Bell,
} from "lucide-react";
import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Client, ClientInput, ClientStatus, ContentItem, ContentInput, ContentPlatform, ContentStatus, ActivityEvent, Notification, FinanceTransaction, FinanceTransactionInput, KnowledgeInput, KnowledgeItem, KnowledgeType, PriorityLevel, Project, ProjectInput, ProjectStatus, Task, TaskInput, TaskStatus } from "@/lib/types";
import { deleteRow, saveRow } from "@/lib/data/os-repository";
import { loadWorkspaceData } from "@/lib/data/workspace-service";
import { FinanceModal, FinanceView } from "@/features/finance/finance-view";
import { DashboardView } from "@/features/dashboard/dashboard-view";
import { GlobalSearch } from "@/features/global-search";
import { ActivityView } from "@/features/activity/activity-view";
import { NotificationsView } from "@/features/notifications/notifications-view";
import { deleteNotification, markAllNotificationsRead, markNotificationRead } from "@/lib/notifications/notification-service";
import { recordActivity } from "@/lib/events/activity-service";
import { WorkspaceSwitcher } from "@/components/shell/workspace-switcher";
import { QuickCreate } from "@/components/commands/quick-create";
import type { QuickCreateTarget, WorkspaceId } from "@/packages/types/src";
import { DEFAULT_WORKSPACE } from "@/packages/core/src";

type View = "dashboard" | "projects" | "tasks" | "clients" | "content" | "knowledge" | "finance" | "activity" | "notifications";
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

  const activeProjects = projects.filter((p) => p.status === "Active").length;
  const completedProjects = projects.filter((p) => p.status === "Completed").length;
  const doneTasks = tasks.filter((t) => t.status === "Done").length;
  const today = new Date().toISOString().slice(0, 10);
  const overdueTasks = tasks.filter((t) => t.status !== "Done" && t.due_date && t.due_date < today).length;

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
      <div className="logo"><div className="logo-mark"><Brain size={25} /></div><div><strong>YOSSEUF OS</strong><span>v1.0.0 · Stable</span></div></div>
      <WorkspaceSwitcher value={workspace} onChange={(next) => { setWorkspace(next); if (next === "executive") navigate("dashboard"); else if (next === "operations") navigate("projects"); else if (next === "knowledge") navigate("knowledge"); }} />
      <nav>
        <button className={view === "dashboard" ? "active" : ""} onClick={() => navigate("dashboard")}><LayoutDashboard size={18}/> لوحة القيادة</button>
        <button className={view === "projects" ? "active" : ""} onClick={() => navigate("projects")}><FolderKanban size={18}/> المشاريع</button>
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
      {view === "projects" && <ProjectsView projects={filteredProjects} totalCount={projects.length} query={projectQuery} filter={projectFilter} onQuery={setProjectQuery} onFilter={setProjectFilter} onCreate={() => setProjectModal({ mode: "create", project: null })} onEdit={(project) => setProjectModal({ mode: "edit", project })} onDelete={setDeleteProjectTarget} />}
      {view === "tasks" && <TasksView tasks={filteredTasks} allTasks={tasks} projects={projects} query={taskQuery} filter={taskFilter} projectFilter={taskProjectFilter} onQuery={setTaskQuery} onFilter={setTaskFilter} onProjectFilter={setTaskProjectFilter} onCreate={requestCreateTask} onEdit={(task) => setTaskModal({ mode: "edit", task })} onDelete={setDeleteTaskTarget} />}
      {view === "clients" && <ClientsView clients={filteredClients} allClients={clients} projects={projects} query={clientQuery} filter={clientFilter} onQuery={setClientQuery} onFilter={setClientFilter} onCreate={() => setClientModal({ mode: "create", client: null })} onEdit={(client) => setClientModal({ mode: "edit", client })} onDelete={setDeleteClientTarget} />}
      {view === "finance" && <FinanceView items={financeItems} projects={projects} clients={clients} onCreate={() => setFinanceModal("create")} onEdit={setFinanceModal} onDelete={setDeleteFinanceTarget} />}
      {view === "knowledge" && <KnowledgeView items={filteredKnowledge} allItems={knowledgeItems} query={knowledgeQuery} filter={knowledgeFilter} favoriteOnly={favoriteKnowledgeOnly} onQuery={setKnowledgeQuery} onFilter={setKnowledgeFilter} onFavoriteOnly={setFavoriteKnowledgeOnly} onCreate={() => setKnowledgeModal({ mode: "create", item: null })} onEdit={(item) => setKnowledgeModal({ mode: "edit", item })} onDelete={setDeleteKnowledgeTarget} />}
      {view === "content" && <ContentView items={filteredContent} allItems={contentItems} projects={projects} clients={clients} query={contentQuery} filter={contentFilter} platformFilter={platformFilter} onQuery={setContentQuery} onFilter={setContentFilter} onPlatformFilter={setPlatformFilter} onCreate={() => setContentModal({ mode: "create", item: null })} onEdit={(item) => setContentModal({ mode: "edit", item })} onDelete={setDeleteContentTarget} />}
    </main>

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

function ProjectsView({ projects, totalCount, query, filter, onQuery, onFilter, onCreate, onEdit, onDelete }: { projects: Project[]; totalCount: number; query: string; filter: ProjectFilter; onQuery: (v:string)=>void; onFilter:(v:ProjectFilter)=>void; onCreate:()=>void; onEdit:(p:Project)=>void; onDelete:(p:Project)=>void }) {
  return <section className="panel projects-panel"><Toolbar title="كل المشاريع" count={totalCount} query={query} placeholder="ابحث بالاسم أو العميل…" onQuery={onQuery} onCreate={onCreate}/><div className="filter-tabs">{projectFilters.map((f)=><button key={f} className={filter===f?"active":""} onClick={()=>onFilter(f)}>{f==="All"?"الكل":projectStatusLabels[f]}</button>)}</div>{projects.length?<div className="project-grid">{projects.map((p)=><ProjectCard key={p.id} project={p} onEdit={()=>onEdit(p)} onDelete={()=>onDelete(p)}/>)}</div>:<EmptyState onCreate={onCreate}/>}</section>;
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

function ProjectCard({ project, onEdit, onDelete }: { project:Project; onEdit:()=>void; onDelete:()=>void }) { const [open,setOpen]=useState(false); return <article className="project-card"><div className="project-card-top"><span className={`status-pill ${projectStatusClass(project.status)}`}>{projectStatusLabels[project.status]}</span><CardMenu open={open} setOpen={setOpen} onEdit={onEdit} onDelete={onDelete}/></div><button className="project-card-body" onClick={onEdit}><span className="project-icon"><FolderKanban size={21}/></span><h3>{project.name}</h3><p>{project.notes||project.client_name||project.area||"مشروع جديد"}</p></button><div className="project-meta"><span><b>الأولوية</b><i className={`priority ${project.priority.toLowerCase()}`}>{priorityLabels[project.priority]}</i></span><span><b>موعد التسليم</b>{formatDate(project.due_date)}</span></div><div className="card-progress-head"><span>التقدم</span><b>{project.progress}%</b></div><div className="progress"><i style={{width:`${project.progress}%`}}/></div></article>; }

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

function ProjectModal({ state, clients, onClose, onSave }: { state:Exclude<ProjectModalState,null>; clients:Client[]; onClose:()=>void; onSave:(i:ProjectInput,p?:Project)=>Promise<boolean> }) { const p=state.project; const [saving,setSaving]=useState(false); async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setSaving(true);const f=new FormData(e.currentTarget);const input:ProjectInput={name:String(f.get("name")||"").trim(),status:String(f.get("status")) as ProjectStatus,priority:String(f.get("priority")) as PriorityLevel,progress:clamp(Number(f.get("progress")||0)),client_name:nullableText(f.get("client_name")),area:nullableText(f.get("area")),start_date:dateValue(f.get("start_date")),due_date:dateValue(f.get("due_date")),notes:nullableText(f.get("notes")),client_id:nullableText(f.get("client_id"))};if(!await onSave(input,p??undefined))setSaving(false);} return <Modal title={state.mode==="create"?"إنشاء مشروع جديد":"تعديل المشروع"} kicker="PROJECT" onClose={onClose}><form className="project-form" onSubmit={submit}><Field name="name" label="اسم المشروع *" defaultValue={p?.name} required full/><Select name="status" label="الحالة" defaultValue={p?.status||"Planning"} options={projectStatusLabels}/><Select name="priority" label="الأولوية" defaultValue={p?.priority||"Medium"} options={priorityLabels}/><label><span>العميل المرتبط</span><select name="client_id" defaultValue={p?.client_id??""}><option value="">بدون عميل</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}{c.company?` — ${c.company}`:""}</option>)}</select></label><Field name="client_name" label="اسم عميل يدوي (اختياري)" defaultValue={p?.client_name}/><Field name="area" label="المجال" defaultValue={p?.area}/><Field name="progress" label="نسبة التقدم" type="number" defaultValue={p?.progress??0} min={0} max={100}/><Field name="start_date" label="تاريخ البداية" type="date" defaultValue={p?.start_date}/><Field name="due_date" label="موعد التسليم" type="date" defaultValue={p?.due_date}/><label className="full"><span>الملاحظات</span><textarea name="notes" rows={4} defaultValue={p?.notes??""}/></label><Actions saving={saving} onClose={onClose}/></form></Modal>; }

function TaskModal({ state, projects, onClose, onSave }: { state:Exclude<TaskModalState,null>; projects:Project[]; onClose:()=>void; onSave:(i:TaskInput,t?:Task)=>Promise<boolean> }) { const t=state.task; const [saving,setSaving]=useState(false); async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setSaving(true);const f=new FormData(e.currentTarget);const status=String(f.get("status")) as TaskStatus;const input:TaskInput={project_id:String(f.get("project_id")),title:String(f.get("title")||"").trim(),description:nullableText(f.get("description")),status,priority:String(f.get("priority")) as PriorityLevel,progress:status==="Done"?100:clamp(Number(f.get("progress")||0)),due_date:dateValue(f.get("due_date"))};if(!await onSave(input,t??undefined))setSaving(false);} return <Modal title={state.mode==="create"?"إنشاء مهمة جديدة":"تعديل المهمة"} kicker="TASK ENGINE" onClose={onClose}><form className="project-form" onSubmit={submit}><label className="full"><span>المشروع *</span><select name="project_id" defaultValue={t?.project_id||projects[0]?.id} required>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><Field name="title" label="عنوان المهمة *" defaultValue={t?.title} required full maxLength={160}/><Select name="status" label="الحالة" defaultValue={t?.status||"To Do"} options={taskStatusLabels}/><Select name="priority" label="الأولوية" defaultValue={t?.priority||"Medium"} options={priorityLabels}/><Field name="progress" label="نسبة التقدم" type="number" defaultValue={t?.progress??0} min={0} max={100}/><Field name="due_date" label="موعد الاستحقاق" type="date" defaultValue={t?.due_date}/><label className="full"><span>الوصف</span><textarea name="description" rows={5} defaultValue={t?.description??""}/></label><Actions saving={saving} onClose={onClose}/></form></Modal>; }

function Modal({ title, kicker, onClose, children }: { title:string; kicker:string; onClose:()=>void; children:ReactNode }) { return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal" onMouseDown={(e)=>e.stopPropagation()}><div className="modal-head"><div><span className="section-kicker">{kicker}</span><h2>{title}</h2></div><button className="icon-button" onClick={onClose}><X size={20}/></button></div>{children}</div></div>; }
function Field({ name,label,defaultValue,type="text",required,full,min,max,maxLength }: { name:string;label:string;defaultValue?:string|number|null;type?:string;required?:boolean;full?:boolean;min?:number;max?:number;maxLength?:number }) { return <label className={full?"full":""}><span>{label}</span><input name={name} type={type} defaultValue={defaultValue??""} required={required} min={min} max={max} maxLength={maxLength}/></label>; }
function Select<T extends string>({ name,label,defaultValue,options }: { name:string;label:string;defaultValue:T;options:Record<T,string> }) { return <label><span>{label}</span><select name={name} defaultValue={defaultValue}>{Object.entries(options).map(([v,l])=><option key={v} value={v}>{String(l)}</option>)}</select></label>; }
function Actions({ saving,onClose }: { saving:boolean;onClose:()=>void }) { return <div className="form-actions full"><button type="button" onClick={onClose}>إلغاء</button><button className="primary" disabled={saving}>{saving?"جارٍ الحفظ…":"حفظ"}</button></div>; }

function ConfirmDelete({ title,text,onCancel,onConfirm }: { title:string;text:string;onCancel:()=>void;onConfirm:()=>void }) { return <div className="modal-backdrop"><div className="confirm-modal"><div className="warning-icon"><AlertTriangle/></div><h2>{title}</h2><p>{text}</p><div className="form-actions"><button onClick={onCancel}>إلغاء</button><button className="delete-button" onClick={onConfirm}>حذف نهائي</button></div></div></div>; }
function Metric({ icon,label,value,detail,danger }: { icon:ReactNode;label:string;value:string|number;detail:string;danger?:boolean }) { return <div className={`metric-card ${danger?"danger":""}`}><span>{icon}</span><div><small>{label}</small><strong>{value}</strong><em>{detail}</em></div></div>; }
function EmptyState({ text="لا توجد بيانات بعد.",compact,onCreate }: { text?:string;compact?:boolean;onCreate?:()=>void }) { return <div className={`empty-state ${compact?"compact":""}`}><span><ClipboardList/></span><h3>{text}</h3>{onCreate&&<button className="primary compact" onClick={onCreate}><Plus size={16}/> إضافة الآن</button>}</div>; }

function Auth(){const[email,setEmail]=useState("");const[message,setMessage]=useState("");const[busy,setBusy]=useState(false);async function submit(e:FormEvent){e.preventDefault();setBusy(true);const{error}=await supabase.auth.signInWithOtp({email,options:{emailRedirectTo:window.location.origin}});setMessage(error?error.message:"تم إرسال رابط الدخول الآمن إلى بريدك.");setBusy(false);}return <div className="auth-page"><div className="auth-card"><div className="logo-mark auth-logo"><Brain/></div><span className="section-kicker">PERSONAL OPERATING SYSTEM</span><h1>YOSSEUF OS</h1><p>سجّل الدخول للوصول إلى مشاريعك ومهامك.</p><form onSubmit={submit}><label><span>البريد الإلكتروني</span><input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required/></label><button className="primary" disabled={busy}>{busy?"جارٍ الإرسال…":"إرسال رابط الدخول"}</button></form>{message&&<div className="auth-message">{message}</div>}</div></div>}
function LoadingScreen(){return <div className="center-screen"><div className="loader"><Brain size={38}/><span>جارٍ تشغيل YOSSEUF OS…</span></div></div>}

const clamp=(n:number)=>Math.max(0,Math.min(100,Number.isFinite(n)?n:0));
const nullableText=(v:FormDataEntryValue|null)=>{const s=String(v??"").trim();return s||null};
const dateValue=(v:FormDataEntryValue|null)=>String(v||"")||null;
const projectName=(projects:Project[],id:string)=>projects.find(p=>p.id===id)?.name||"مشروع غير متاح";
const formatDate=(v:string|null)=>v?new Intl.DateTimeFormat("ar-SA",{day:"numeric",month:"short",year:"numeric"}).format(new Date(`${v}T00:00:00`)):"غير محدد";
const projectStatusClass=(s:ProjectStatus)=>s.toLowerCase().replaceAll(" ","-");
const taskStatusClass=(s:TaskStatus)=>s.toLowerCase().replaceAll(" ","-");
const isOverdue=(t:Task)=>Boolean(t.status!=="Done"&&t.due_date&&t.due_date<new Date().toISOString().slice(0,10));
