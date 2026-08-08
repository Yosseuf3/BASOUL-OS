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
import { loadWorkspaceData } from "@/lib/data/workspace-service";
import { authorizedWorkspaceDelete, authorizedWorkspaceWrite } from "@/lib/data/authorized-workspace-client";
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

const projectStatusLabels: Record<ProjectStatus, string> = { Planning: "ØªØ®Ø·ÙŠØ·", Active: "Ù†Ø´Ø·", "On Hold": "Ù…ØªÙˆÙ‚Ù Ù…Ø¤Ù‚ØªÙ‹Ø§", Completed: "Ù…ÙƒØªÙ…Ù„" };
const taskStatusLabels: Record<TaskStatus, string> = { "To Do": "Ù„Ù„Ø¹Ù…Ù„", "In Progress": "Ù‚ÙŠØ¯ Ø§Ù„ØªÙ†ÙÙŠØ°", Review: "Ù…Ø±Ø§Ø¬Ø¹Ø©", Done: "Ù…ÙƒØªÙ…Ù„Ø©" };
const priorityLabels: Record<PriorityLevel, string> = { Low: "Ù…Ù†Ø®ÙØ¶Ø©", Medium: "Ù…ØªÙˆØ³Ø·Ø©", High: "Ù…Ø±ØªÙØ¹Ø©", Critical: "Ø­Ø±Ø¬Ø©" };
const projectFilters: ProjectFilter[] = ["All", "Planning", "Active", "On Hold", "Completed"];
const taskFilters: TaskFilter[] = ["All", "To Do", "In Progress", "Review", "Done"];
const clientStatusLabels: Record<ClientStatus, string> = { Lead: "Ø¹Ù…ÙŠÙ„ Ù…Ø­ØªÙ…Ù„", Active: "Ù†Ø´Ø·", Inactive: "ØºÙŠØ± Ù†Ø´Ø·", Completed: "Ù…ÙƒØªÙ…Ù„" };
const clientFilters: ClientFilter[] = ["All", "Lead", "Active", "Inactive", "Completed"];
const contentStatusLabels: Record<ContentStatus, string> = { Idea: "ÙÙƒØ±Ø©", Draft: "Ù…Ø³ÙˆØ¯Ø©", Recording: "ØªØµÙˆÙŠØ±", Editing: "Ù…ÙˆÙ†ØªØ§Ø¬", Scheduled: "Ù…Ø¬Ø¯ÙˆÙ„", Published: "Ù…Ù†Ø´ÙˆØ±" };
const platformLabels: Record<ContentPlatform, string> = { TikTok: "TikTok", Instagram: "Instagram", YouTube: "YouTube", Facebook: "Facebook", LinkedIn: "LinkedIn", X: "X" };
const contentFilters: ContentFilter[] = ["All", "Idea", "Draft", "Recording", "Editing", "Scheduled", "Published"];
const platformFilters: PlatformFilter[] = ["All", "TikTok", "Instagram", "YouTube", "Facebook", "LinkedIn", "X"];
const knowledgeTypeLabels: Record<KnowledgeType, string> = { Note: "Ù…Ù„Ø§Ø­Ø¸Ø©", Idea: "ÙÙƒØ±Ø©", Reference: "Ù…Ø±Ø¬Ø¹", Template: "Ù‚Ø§Ù„Ø¨" };
const knowledgeFilters: KnowledgeFilter[] = ["All", "Note", "Idea", "Reference", "Template"];
const phaseLabels: Record<DesignPhase, string> = { Concept: "Ø§Ù„ØªØµÙ…ÙŠÙ… Ø§Ù„Ù…ÙØ§Ù‡ÙŠÙ…ÙŠ", Schematic: "Ø§Ù„ØªØµÙ…ÙŠÙ… Ø§Ù„Ù…Ø¨Ø¯Ø¦ÙŠ", "Design Development": "ØªØ·ÙˆÙŠØ± Ø§Ù„ØªØµÙ…ÙŠÙ…", "Construction Documents": "Ù…Ø³ØªÙ†Ø¯Ø§Øª Ø§Ù„ØªÙ†ÙÙŠØ°", "Site Supervision": "Ø§Ù„Ø¥Ø´Ø±Ø§Ù Ø§Ù„Ù…ÙˆÙ‚Ø¹ÙŠ", Handover: "Ø§Ù„ØªØ³Ù„ÙŠÙ…" };

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
      if (result.errors.length) showToast(`ØªÙ… ØªØ­Ù…ÙŠÙ„ Ù…Ø³Ø§Ø­Ø© Ø§Ù„Ø¹Ù…Ù„ Ø¬Ø²Ø¦ÙŠÙ‹Ø§ (${result.errors.length} ÙˆØ­Ø¯Ø§Øª ØªØ­ØªØ§Ø¬ Ø¥Ø¹Ø§Ø¯Ø© Ù…Ø­Ø§ÙˆÙ„Ø©).`, "error");
    } catch (error) {
      const message = error instanceof Error ? error.message : "ØªØ¹Ø°Ø± Ø§Ù„Ø§ØªØµØ§Ù„ Ø¨Ø§Ù„Ø®Ø¯Ù…Ø©";
      setLoadErrors([message]);
      showToast(`ØªØ¹Ø°Ø± ØªØ­Ù…ÙŠÙ„ Ù…Ø³Ø§Ø­Ø© Ø§Ù„Ø¹Ù…Ù„: ${message}`, "error");
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
    const error = await authorizedWorkspaceWrite("projects", session, input, current?.id);
    if (error) { showToast(`Ù„Ù… ÙŠØªÙ… Ø­ÙØ¸ Ø§Ù„Ù…Ø´Ø±ÙˆØ¹: ${error}`, "error"); return false; }
    await logActivity("projects", current ? "updated" : "created", current ? `ØªÙ… ØªØ­Ø¯ÙŠØ« Ø§Ù„Ù…Ø´Ø±ÙˆØ¹: ${input.name}` : `ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ù…Ø´Ø±ÙˆØ¹ Ø¬Ø¯ÙŠØ¯: ${input.name}`, current?.id, input.status);
    showToast(current ? "ØªÙ… ØªØ­Ø¯ÙŠØ« Ø§Ù„Ù…Ø´Ø±ÙˆØ¹." : "ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ù…Ø´Ø±ÙˆØ¹.", "success"); await loadData(); return true;
  }

  async function saveTask(input: TaskInput, current?: Task) {
    if (!session) return false;
    const error = await authorizedWorkspaceWrite("tasks", session, { ...input, progress: input.status === "Done" ? 100 : input.progress }, current?.id);
    if (error) { showToast(`Ù„Ù… ÙŠØªÙ… Ø­ÙØ¸ Ø§Ù„Ù…Ù‡Ù…Ø©: ${error}`, "error"); return false; }
    await logActivity("tasks", input.status === "Done" && current?.status !== "Done" ? "completed" : current ? "updated" : "created", input.status === "Done" && current?.status !== "Done" ? `Ø§ÙƒØªÙ…Ù„Øª Ø§Ù„Ù…Ù‡Ù…Ø©: ${input.title}` : current ? `ØªÙ… ØªØ­Ø¯ÙŠØ« Ø§Ù„Ù…Ù‡Ù…Ø©: ${input.title}` : `ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ù…Ù‡Ù…Ø© Ø¬Ø¯ÙŠØ¯Ø©: ${input.title}`, current?.id, input.status);
    showToast(current ? "ØªÙ… ØªØ­Ø¯ÙŠØ« Ø§Ù„Ù…Ù‡Ù…Ø©." : "ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ù…Ù‡Ù…Ø©.", "success"); await loadData(); return true;
  }


  async function saveClient(input: ClientInput, current?: Client) {
    if (!session) return false;
    const error = await authorizedWorkspaceWrite("clients", session, input, current?.id);
    if (error) { showToast(`Ù„Ù… ÙŠØªÙ… Ø­ÙØ¸ Ø§Ù„Ø¹Ù…ÙŠÙ„: ${error}`, "error"); return false; }
    await logActivity("clients", current ? "updated" : "created", current ? `ØªÙ… ØªØ­Ø¯ÙŠØ« Ø§Ù„Ø¹Ù…ÙŠÙ„: ${input.name}` : `ØªÙ…Øª Ø¥Ø¶Ø§ÙØ© Ø¹Ù…ÙŠÙ„ Ø¬Ø¯ÙŠØ¯: ${input.name}`, current?.id, input.company);
    showToast(current ? "ØªÙ… ØªØ­Ø¯ÙŠØ« Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø¹Ù…ÙŠÙ„." : "ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø¹Ù…ÙŠÙ„.", "success"); await loadData(); return true;
  }

  async function saveContent(input: ContentInput, current?: ContentItem) {
    if (!session) return false;
    const error = await authorizedWorkspaceWrite("content_items", session, input, current?.id);
    if (error) { showToast(`Ù„Ù… ÙŠØªÙ… Ø­ÙØ¸ Ø§Ù„Ù…Ø­ØªÙˆÙ‰: ${error}`, "error"); return false; }
    await logActivity("content", input.status === "Published" && current?.status !== "Published" ? "published" : current ? "updated" : "created", input.status === "Published" && current?.status !== "Published" ? `ØªÙ… Ù†Ø´Ø± Ø§Ù„Ù…Ø­ØªÙˆÙ‰: ${input.title}` : current ? `ØªÙ… ØªØ­Ø¯ÙŠØ« Ø§Ù„Ù…Ø­ØªÙˆÙ‰: ${input.title}` : `ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ù…Ø­ØªÙˆÙ‰ Ø¬Ø¯ÙŠØ¯: ${input.title}`, current?.id, input.platform);
    showToast(current ? "ØªÙ… ØªØ­Ø¯ÙŠØ« Ø§Ù„Ù…Ø­ØªÙˆÙ‰." : "ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ù…Ø­ØªÙˆÙ‰.", "success"); await loadData(); return true;
  }

  async function deleteContent(item: ContentItem) {
    const { error } = await supabase.from("content_items").delete().eq("id", item.id);
    if (error) showToast(`ØªØ¹Ø°Ø± Ø­Ø°Ù Ø§Ù„Ù…Ø­ØªÙˆÙ‰: ${error.message}`, "error");
    else { await logActivity("content", "deleted", `ØªÙ… Ø­Ø°Ù Ø§Ù„Ù…Ø­ØªÙˆÙ‰: ${item.title}`, item.id); setDeleteContentTarget(null); showToast("ØªÙ… Ø­Ø°Ù Ø§Ù„Ù…Ø­ØªÙˆÙ‰.", "success"); await loadData(); }
  }


  async function saveKnowledge(input: KnowledgeInput, current?: KnowledgeItem) {
    if (!session) return false;
    const error = await authorizedWorkspaceWrite("knowledge_items", session, input, current?.id);
    if (error) { showToast(`Ù„Ù… ÙŠØªÙ… Ø­ÙØ¸ Ø§Ù„Ø¹Ù†ØµØ±: ${error}`, "error"); return false; }
    await logActivity("knowledge", current ? "updated" : "created", current ? `ØªÙ… ØªØ­Ø¯ÙŠØ« Ø§Ù„Ù…Ø¹Ø±ÙØ©: ${input.title}` : `ØªÙ…Øª Ø¥Ø¶Ø§ÙØ© Ø¹Ù†ØµØ± Ù…Ø¹Ø±ÙØ©: ${input.title}`, current?.id, input.type);
    showToast(current ? "ØªÙ… ØªØ­Ø¯ÙŠØ« Ø¹Ù†ØµØ± Ø§Ù„Ù…Ø¹Ø±ÙØ©." : "ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø¹Ù†ØµØ± Ø§Ù„Ù…Ø¹Ø±ÙØ©.", "success"); await loadData(); return true;
  }

  async function deleteKnowledge(item: KnowledgeItem) {
    const { error } = await supabase.from("knowledge_items").delete().eq("id", item.id);
    if (error) showToast(`ØªØ¹Ø°Ø± Ø­Ø°Ù Ø§Ù„Ø¹Ù†ØµØ±: ${error.message}`, "error");
    else { await logActivity("knowledge", "deleted", `ØªÙ… Ø­Ø°Ù Ø¹Ù†ØµØ± Ø§Ù„Ù…Ø¹Ø±ÙØ©: ${item.title}`, item.id); setDeleteKnowledgeTarget(null); showToast("ØªÙ… Ø­Ø°Ù Ø¹Ù†ØµØ± Ø§Ù„Ù…Ø¹Ø±ÙØ©.", "success"); await loadData(); }
  }

  async function deleteProject(project: Project) {
    const { error } = await supabase.from("projects").delete().eq("id", project.id);
    if (error) showToast(`ØªØ¹Ø°Ø± Ø­Ø°Ù Ø§Ù„Ù…Ø´Ø±ÙˆØ¹: ${error.message}`, "error");
    else { await logActivity("projects", "deleted", `ØªÙ… Ø­Ø°Ù Ø§Ù„Ù…Ø´Ø±ÙˆØ¹: ${project.name}`, project.id); setDeleteProjectTarget(null); showToast("ØªÙ… Ø­Ø°Ù Ø§Ù„Ù…Ø´Ø±ÙˆØ¹ ÙˆÙ…Ù‡Ø§Ù…Ù‡.", "success"); await loadData(); }
  }
  async function deleteTask(task: Task) {
    const { error } = await supabase.from("tasks").delete().eq("id", task.id);
    if (error) showToast(`ØªØ¹Ø°Ø± Ø­Ø°Ù Ø§Ù„Ù…Ù‡Ù…Ø©: ${error.message}`, "error");
    else { await logActivity("tasks", "deleted", `ØªÙ… Ø­Ø°Ù Ø§Ù„Ù…Ù‡Ù…Ø©: ${task.title}`, task.id); setDeleteTaskTarget(null); showToast("ØªÙ… Ø­Ø°Ù Ø§Ù„Ù…Ù‡Ù…Ø©.", "success"); await loadData(); }
  }


  async function deleteClient(client: Client) {
    const { error } = await supabase.from("clients").delete().eq("id", client.id);
    if (error) showToast(`ØªØ¹Ø°Ø± Ø­Ø°Ù Ø§Ù„Ø¹Ù…ÙŠÙ„: ${error.message}`, "error");
    else { await logActivity("clients", "deleted", `ØªÙ… Ø­Ø°Ù Ø§Ù„Ø¹Ù…ÙŠÙ„: ${client.name}`, client.id); setDeleteClientTarget(null); showToast("ØªÙ… Ø­Ø°Ù Ø§Ù„Ø¹Ù…ÙŠÙ„.", "success"); await loadData(); }
  }

  async function saveFinance(input: FinanceTransactionInput, current?: FinanceTransaction) {
    if (!session) return false;
    const error = await authorizedWorkspaceWrite("finance_transactions", session, input, current?.id);
    if (error) { showToast(`Ù„Ù… ÙŠØªÙ… Ø­ÙØ¸ Ø§Ù„Ù…Ø¹Ø§Ù…Ù„Ø©: ${error}`, "error"); return false; }
    await logActivity("finance", input.status === "Paid" && current?.status !== "Paid" ? "paid" : current ? "updated" : "created", input.status === "Paid" && current?.status !== "Paid" ? `ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø¯ÙØ¹Ø©: ${input.description}` : current ? `ØªÙ… ØªØ­Ø¯ÙŠØ« Ø§Ù„Ù…Ø¹Ø§Ù…Ù„Ø©: ${input.description}` : `ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ù…Ø¹Ø§Ù…Ù„Ø© Ù…Ø§Ù„ÙŠØ©: ${input.description}`, current?.id, `${input.type} Â· ${input.amount} ${input.currency}`);
    showToast(current ? "ØªÙ… ØªØ­Ø¯ÙŠØ« Ø§Ù„Ù…Ø¹Ø§Ù…Ù„Ø© Ø§Ù„Ù…Ø§Ù„ÙŠØ©." : "ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ù…Ø¹Ø§Ù…Ù„Ø© Ø§Ù„Ù…Ø§Ù„ÙŠØ©.", "success"); await loadData(); return true;
  }
  async function deleteFinance(item: FinanceTransaction) {
    if (!session) return;
    const error = await authorizedWorkspaceDelete("finance_transactions", session, item.id);
    if (error) showToast(`ØªØ¹Ø°Ø± Ø­Ø°Ù Ø§Ù„Ù…Ø¹Ø§Ù…Ù„Ø©: ${error}`, "error");
    else { await logActivity("finance", "deleted", `ØªÙ… Ø­Ø°Ù Ø§Ù„Ù…Ø¹Ø§Ù…Ù„Ø©: ${item.description}`, item.id); setDeleteFinanceTarget(null); showToast("ØªÙ… Ø­Ø°Ù Ø§Ù„Ù…Ø¹Ø§Ù…Ù„Ø© Ø§Ù„Ù…Ø§Ù„ÙŠØ©.", "success"); await loadData(); }
  }

  async function clearActivity() {
    if (!session || !activityEvents.length) return;
    const { error } = await supabase.from("activity_events").delete().eq("user_id", session.user.id);
    if (error) showToast(`ØªØ¹Ø°Ø± Ù…Ø³Ø­ Ø³Ø¬Ù„ Ø§Ù„Ù†Ø´Ø§Ø·: ${error.message}`, "error");
    else { setActivityEvents([]); showToast("ØªÙ… Ù…Ø³Ø­ Ø³Ø¬Ù„ Ø§Ù„Ù†Ø´Ø§Ø·.", "success"); }
  }

  async function toggleNotificationRead(notification: Notification) {
    const error = await markNotificationRead(notification.id, !notification.is_read);
    if (error) showToast(`ØªØ¹Ø°Ø± ØªØ­Ø¯ÙŠØ« Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±: ${error}`, "error"); else await loadData();
  }
  async function markAllRead() {
    if (!session) return; const error = await markAllNotificationsRead(session.user.id);
    if (error) showToast(`ØªØ¹Ø°Ø± ØªØ­Ø¯ÙŠØ« Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª: ${error}`, "error"); else { showToast("ØªÙ… ØªØ¹Ù„ÙŠÙ… Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª ÙƒÙ…Ù‚Ø±ÙˆØ¡Ø©.", "success"); await loadData(); }
  }
  async function removeNotification(notification: Notification) {
    const error = await deleteNotification(notification.id);
    if (error) showToast(`ØªØ¹Ø°Ø± Ø­Ø°Ù Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±: ${error}`, "error"); else await loadData();
  }

  if (authLoading) return <LoadingScreen />;
  if (!session) return <Auth />;

  const navigate = (next: View) => { setView(next); setSidebarOpen(false); };
  const requestCreateTask = () => {
    if (projects.length === 0) {
      showToast("Ø£Ù†Ø´Ø¦ Ù…Ø´Ø±ÙˆØ¹Ù‹Ø§ Ø£ÙˆÙ„Ù‹Ø§ Ù‚Ø¨Ù„ Ø¥Ø¶Ø§ÙØ© Ù…Ù‡Ù…Ø©.", "error");
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
    <button className="mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="ÙØªØ­ Ø§Ù„Ù‚Ø§Ø¦Ù…Ø©"><Menu size={21} /></button>
    {sidebarOpen && <button className="sidebar-overlay" onClick={() => setSidebarOpen(false)} aria-label="Ø¥ØºÙ„Ø§Ù‚ Ø§Ù„Ù‚Ø§Ø¦Ù…Ø©" />}
    <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
      <button className="sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Ø¥ØºÙ„Ø§Ù‚ Ø§Ù„Ù‚Ø§Ø¦Ù…Ø©"><X size={19} /></button>
      <div className="logo"><div className="logo-mark"><Brain size={25} /></div><div><strong>{APP_INFO.name}</strong><span>{APP_INFO.fullLabel}</span></div></div>
      <WorkspaceSwitcher value={workspace} onChange={(next) => { setWorkspace(next); if (next === "executive") navigate("dashboard"); else if (next === "operations") navigate("projects"); else if (next === "engineering") navigate("architecture"); else if (next === "knowledge") navigate("knowledge"); }} />
      <nav>
        <button className={view === "dashboard" ? "active" : ""} onClick={() => navigate("dashboard")}><LayoutDashboard size={18}/> Ù„ÙˆØ­Ø© Ø§Ù„Ù‚ÙŠØ§Ø¯Ø©</button>
        <button className={view === "projects" ? "active" : ""} onClick={() => navigate("projects")}><FolderKanban size={18}/> Ø§Ù„Ù…Ø´Ø§Ø±ÙŠØ¹</button>
        <button className={view === "architecture" ? "active" : ""} onClick={() => navigate("architecture")}><ScanLine size={18}/> Ø§Ù„Ø°ÙƒØ§Ø¡ Ø§Ù„Ù…Ø¹Ù…Ø§Ø±ÙŠ</button>
        <button className={view === "tasks" ? "active" : ""} onClick={() => navigate("tasks")}><ClipboardList size={18}/> Ø§Ù„Ù…Ù‡Ø§Ù… {tasks.length > 0 && <span className="nav-count">{tasks.length}</span>}</button>
        <button className={view === "clients" ? "active" : ""} onClick={() => navigate("clients")}><Users size={18}/> Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡ {clients.length > 0 && <span className="nav-count">{clients.length}</span>}</button>
        <button className={view === "content" ? "active" : ""} onClick={() => navigate("content")}><Film size={18}/> Ø§Ù„Ù…Ø­ØªÙˆÙ‰ {contentItems.length > 0 && <span className="nav-count">{contentItems.length}</span>}</button>
        <button className={view === "knowledge" ? "active" : ""} onClick={() => navigate("knowledge")}><BookOpen size={18}/> Ø§Ù„Ù…Ø¹Ø±ÙØ© {knowledgeItems.length > 0 && <span className="nav-count">{knowledgeItems.length}</span>}</button>
        <button className={view === "finance" ? "active" : ""} onClick={() => navigate("finance")}><Wallet size={18}/> Ø§Ù„Ù…Ø§Ù„ÙŠØ© {financeItems.length > 0 && <span className="nav-count">{financeItems.length}</span>}</button>
        <button className={view === "activity" ? "active" : ""} onClick={() => navigate("activity")}><Activity size={18}/> Ø§Ù„Ù†Ø´Ø§Ø· {activityEvents.length > 0 && <span className="nav-count">{activityEvents.length}</span>}</button>
        <button className={view === "notifications" ? "active" : ""} onClick={() => navigate("notifications")}><Bell size={18}/> Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª {notifications.filter(n=>!n.is_read).length > 0 && <span className="nav-count alert">{notifications.filter(n=>!n.is_read).length}</span>}</button>
      </nav>
      <div className="user-card"><div className="user-avatar">YR</div><div><b>Yosseuf</b><small>{session.user.email}</small></div></div>
      <button className="signout" onClick={() => void supabase.auth.signOut()}><LogOut size={17}/> ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø®Ø±ÙˆØ¬</button>
    </aside>

    <main className="main">
      <header className="topbar"><div><span className="eyebrow">BASOUL Â· {workspace === "executive" ? "EXECUTIVE" : workspace === "operations" ? "OPERATIONS" : workspace === "knowledge" ? "KNOWLEDGE" : "ENGINEERING"}</span><h1>{view === "dashboard" ? "Ù„ÙˆØ­Ø© Ø§Ù„Ù‚ÙŠØ§Ø¯Ø©" : view === "projects" ? "Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…Ø´Ø§Ø±ÙŠØ¹" : view === "tasks" ? "Ù…Ø­Ø±Ùƒ Ø§Ù„Ù…Ù‡Ø§Ù…" : view === "clients" ? "Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡" : view === "content" ? "Ø§Ø³ØªÙˆØ¯ÙŠÙˆ Ø§Ù„Ù…Ø­ØªÙˆÙ‰" : view === "knowledge" ? "Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ù…Ø¹Ø±ÙØ©" : view === "finance" ? "Ø§Ù„Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…Ø§Ù„ÙŠØ©" : view === "activity" ? "Ø³Ø¬Ù„ Ø§Ù„Ù†Ø´Ø§Ø·" : "Ù…Ø±ÙƒØ² Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª"}</h1><p>{view === "tasks" ? "Ø£Ù†Ø´Ø¦ Ø§Ù„Ù…Ù‡Ø§Ù… ÙˆØ§Ø±Ø¨Ø·Ù‡Ø§ Ø¨Ù…Ø´Ø§Ø±ÙŠØ¹Ùƒ ÙˆØªØ§Ø¨Ø¹ Ø§Ù„ØªÙ†ÙÙŠØ°." : view === "clients" ? "Ù†Ø¸Ù‘Ù… Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡ ÙˆØ§Ø±Ø¨Ø·Ù‡Ù… Ø¨Ø£Ø¹Ù…Ø§Ù„Ùƒ." : view === "content" ? "Ø­ÙˆÙ‘Ù„ Ø§Ù„Ø£ÙÙƒØ§Ø± Ø¥Ù„Ù‰ Ù…Ø­ØªÙˆÙ‰ Ù…Ù†Ø´ÙˆØ± Ø¹Ø¨Ø± Ø¯ÙˆØ±Ø© Ø¥Ù†ØªØ§Ø¬ ÙˆØ§Ø¶Ø­Ø©." : view === "knowledge" ? "Ø§Ø­ÙØ¸ Ø£ÙÙƒØ§Ø±Ùƒ ÙˆÙ…Ù„Ø§Ø­Ø¸Ø§ØªÙƒ ÙˆÙ‚ÙˆØ§Ù„Ø¨Ùƒ ÙˆÙ…Ø±Ø§Ø¬Ø¹Ùƒ ÙÙŠ Ù…ÙƒØ§Ù† ÙˆØ§Ø­Ø¯." : view === "finance" ? "Ø³Ø¬Ù‘Ù„ Ø§Ù„Ø¯Ø®Ù„ ÙˆØ§Ù„Ù…ØµØ±ÙˆÙØ§Øª ÙˆØªØ§Ø¨Ø¹ ØµØ§ÙÙŠ Ø§Ù„ØªØ¯ÙÙ‚ Ø§Ù„Ù…Ø§Ù„ÙŠ." : view === "activity" ? "ØªØ§Ø¨Ø¹ ÙƒÙ„ Ù…Ø§ ÙŠØ­Ø¯Ø« Ø¯Ø§Ø®Ù„ ÙˆØ­Ø¯Ø§Øª Ø§Ù„Ù†Ø¸Ø§Ù… ÙÙŠ Ø®Ø· Ø²Ù…Ù†ÙŠ ÙˆØ§Ø­Ø¯." : view === "notifications" ? "Ø±Ø§Ø¬Ø¹ Ø§Ù„ØªÙ†Ø¨ÙŠÙ‡Ø§Øª Ø§Ù„Ù…Ù‡Ù…Ø© ÙˆØ§Ù†ØªÙ‚Ù„ Ù…Ø¨Ø§Ø´Ø±Ø© Ø¥Ù„Ù‰ Ù…ØµØ¯Ø±Ù‡Ø§." : "ØªØ§Ø¨Ø¹ Ø£Ø¹Ù…Ø§Ù„Ùƒ Ù…Ù† Ù…ÙƒØ§Ù† ÙˆØ§Ø­Ø¯."}</p></div><div className="topbar-actions"><div className={`sync-state ${loadErrors.length ? "warning" : "ok"}`}><span>{loading ? "Ø¬Ø§Ø±Ù Ø§Ù„ØªØ­Ø¯ÙŠØ«â€¦" : loadErrors.length ? "Ù…Ø²Ø§Ù…Ù†Ø© Ø¬Ø²Ø¦ÙŠØ©" : "Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ù…Ø­Ø¯Ø«Ø©"}</span><small>{lastSyncedAt ? new Intl.DateTimeFormat("ar-SA",{hour:"numeric",minute:"2-digit"}).format(new Date(lastSyncedAt)) : "â€”"}</small>{loadErrors.length > 0 && <button onClick={() => void loadData()} aria-label="Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„Ù…Ø²Ø§Ù…Ù†Ø©">Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø©</button>}</div><GlobalSearch projects={projects} tasks={tasks} clients={clients} contentItems={contentItems} knowledgeItems={knowledgeItems} financeItems={financeItems} onNavigate={navigate} /><button className="primary universal-create-button" onClick={() => setQuickCreateOpen(true)}><Plus size={18}/> Ø¥Ù†Ø´Ø§Ø¡ <kbd>N</kbd></button></div></header>
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
    {deleteFinanceTarget && <ConfirmDelete title="Ø­Ø°Ù Ø§Ù„Ù…Ø¹Ø§Ù…Ù„Ø©ØŸ" text={`Ø³ÙŠØªÙ… Ø­Ø°Ù Â«${deleteFinanceTarget.description}Â» Ù†Ù‡Ø§Ø¦ÙŠÙ‹Ø§.`} onCancel={() => setDeleteFinanceTarget(null)} onConfirm={() => void deleteFinance(deleteFinanceTarget)} />}
    {deleteProjectTarget && <ConfirmDelete title="Ø­Ø°Ù Ø§Ù„Ù…Ø´Ø±ÙˆØ¹ØŸ" text={`Ø³ÙŠØªÙ… Ø­Ø°Ù Â«${deleteProjectTarget.name}Â» ÙˆØ¬Ù…ÙŠØ¹ Ù…Ù‡Ø§Ù…Ù‡ Ù†Ù‡Ø§Ø¦ÙŠÙ‹Ø§.`} onCancel={() => setDeleteProjectTarget(null)} onConfirm={() => void deleteProject(deleteProjectTarget)} />}
    {deleteClientTarget && <ConfirmDelete title="Ø­Ø°Ù Ø§Ù„Ø¹Ù…ÙŠÙ„ØŸ" text={`Ø³ÙŠØªÙ… Ø­Ø°Ù Â«${deleteClientTarget.name}Â». Ø³ØªØ¨Ù‚Ù‰ Ø§Ù„Ù…Ø´Ø§Ø±ÙŠØ¹ Ø§Ù„Ù…Ø±ØªØ¨Ø·Ø© Ø¯ÙˆÙ† Ø¹Ù…ÙŠÙ„.`} onCancel={() => setDeleteClientTarget(null)} onConfirm={() => void deleteClient(deleteClientTarget)} />}
    {deleteKnowledgeTarget && <ConfirmDelete title="Ø­Ø°Ù Ø¹Ù†ØµØ± Ø§Ù„Ù…Ø¹Ø±ÙØ©ØŸ" text={`Ø³ÙŠØªÙ… Ø­Ø°Ù Â«${deleteKnowledgeTarget.title}Â» Ù†Ù‡Ø§Ø¦ÙŠÙ‹Ø§.`} onCancel={() => setDeleteKnowledgeTarget(null)} onConfirm={() => void deleteKnowledge(deleteKnowledgeTarget)} />}
    {deleteContentTarget && <ConfirmDelete title="Ø­Ø°Ù Ø§Ù„Ù…Ø­ØªÙˆÙ‰ØŸ" text={`Ø³ÙŠØªÙ… Ø­Ø°Ù Â«${deleteContentTarget.title}Â» Ù†Ù‡Ø§Ø¦ÙŠÙ‹Ø§.`} onCancel={() => setDeleteContentTarget(null)} onConfirm={() => void deleteContent(deleteContentTarget)} />}
    {deleteTaskTarget && <ConfirmDelete title="Ø­Ø°Ù Ø§Ù„Ù…Ù‡Ù…Ø©ØŸ" text={`Ø³ÙŠØªÙ… Ø­Ø°Ù Â«${deleteTaskTarget.title}Â» Ù†Ù‡Ø§Ø¦ÙŠÙ‹Ø§.`} onCancel={() => setDeleteTaskTarget(null)} onConfirm={() => void deleteTask(deleteTaskTarget)} />}
    <button className="global-fab" onClick={() => setQuickCreateOpen(true)} aria-label="Ø¥Ù†Ø´Ø§Ø¡ Ø³Ø±ÙŠØ¹"><Plus size={22}/><span>Ø¥Ù†Ø´Ø§Ø¡</span></button>
    <QuickCreate open={quickCreateOpen} onClose={() => setQuickCreateOpen(false)} onSelect={openQuickCreate} />
    {toast && <div className={`toast ${toast.tone}`}>{toast.message}</div>}
  </div>;
}

function DashboardSkeleton(){return <div className="dashboard-skeleton" aria-label="Ø¬Ø§Ø±Ù ØªØ­Ù…ÙŠÙ„ Ù„ÙˆØ­Ø© Ø§Ù„Ù‚ÙŠØ§Ø¯Ø©"><div className="skeleton hero"/><div className="skeleton-grid"><div className="skeleton block"/><div className="skeleton block"/></div><div className="skeleton-kpis">{Array.from({length:4}).map((_,i)=><div className="skeleton kpi" key={i}/>)}</div><div className="skeleton-grid"><div className="skeleton block small"/><div className="skeleton block small"/></div></div>}

function ProjectsView({ projects, totalCount, query, filter, onQuery, onFilter, onCreate, onOpen, onEdit, onDelete }: { projects: Project[]; totalCount: number; query: string; filter: ProjectFilter; onQuery: (v:string)=>void; onFilter:(v:ProjectFilter)=>void; onCreate:()=>void; onOpen:(p:Project)=>void; onEdit:(p:Project)=>void; onDelete:(p:Project)=>void }) {
  return <section className="panel projects-panel"><Toolbar title="ÙƒÙ„ Ø§Ù„Ù…Ø´Ø§Ø±ÙŠØ¹" count={totalCount} query={query} placeholder="Ø§Ø¨Ø­Ø« Ø¨Ø§Ù„Ø§Ø³Ù… Ø£Ùˆ Ø§Ù„Ø¹Ù…ÙŠÙ„â€¦" onQuery={onQuery} onCreate={onCreate}/><div className="filter-tabs">{projectFilters.map((f)=><button key={f} className={filter===f?"active":""} onClick={()=>onFilter(f)}>{f==="All"?"Ø§Ù„ÙƒÙ„":projectStatusLabels[f]}</button>)}</div>{projects.length?<div className="project-grid">{projects.map((p)=><ProjectCard key={p.id} project={p} onOpen={()=>onOpen(p)} onEdit={()=>onEdit(p)} onDelete={()=>onDelete(p)}/>)}</div>:<EmptyState onCreate={onCreate}/>}</section>;
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
    <Toolbar title="ÙƒÙ„ Ø§Ù„Ù…Ù‡Ø§Ù…" count={allTasks.length} query={query} placeholder="Ø§Ø¨Ø­Ø« Ø¨Ø§Ù„Ø¹Ù†ÙˆØ§Ù† Ø£Ùˆ Ø§Ù„ÙˆØµÙâ€¦" onQuery={onQuery} onCreate={onCreate}/>
    <div className="task-summary enhanced"><span>Ø§Ù„Ù…ÙƒØªÙ…Ù„Ø© <b>{done}</b></span><span>Ù‚ÙŠØ¯ Ø§Ù„ØªÙ†ÙÙŠØ° <b>{allTasks.filter(t=>t.status==="In Progress").length}</b></span><span>Ù„Ù„Ù…Ø±Ø§Ø¬Ø¹Ø© <b>{allTasks.filter(t=>t.status==="Review").length}</b></span><span className={overdue?"summary-danger":""}>Ø§Ù„Ù…ØªØ£Ø®Ø±Ø© <b>{overdue}</b></span></div>
    <div className="tasks-controlbar">
      <div className="tasks-filters"><div className="filter-tabs">{taskFilters.map((f)=><button key={f} className={filter===f?"active":""} onClick={()=>onFilter(f)}>{f==="All"?"Ø§Ù„ÙƒÙ„":taskStatusLabels[f]}</button>)}</div><select value={projectFilter} onChange={(e)=>onProjectFilter(e.target.value)}><option value="All">ÙƒÙ„ Ø§Ù„Ù…Ø´Ø§Ø±ÙŠØ¹</option>{projects.map(p=><option value={p.id} key={p.id}>{p.name}</option>)}</select></div>
      <div className="task-view-tools"><label className="sort-select"><ArrowUpDown size={15}/><select value={sort} onChange={e=>setSort(e.target.value as TaskSort)}><option value="updated">Ø¢Ø®Ø± ØªØ­Ø¯ÙŠØ«</option><option value="due">Ù…ÙˆØ¹Ø¯ Ø§Ù„Ø§Ø³ØªØ­Ù‚Ø§Ù‚</option><option value="priority">Ø§Ù„Ø£ÙˆÙ„ÙˆÙŠØ©</option><option value="progress">Ù†Ø³Ø¨Ø© Ø§Ù„Ø¥Ù†Ø¬Ø§Ø²</option></select></label><div className="view-switch"><button className={viewMode==="cards"?"active":""} onClick={()=>setViewMode("cards")} title="Ø¨Ø·Ø§Ù‚Ø§Øª"><Columns3 size={17}/></button><button className={viewMode==="list"?"active":""} onClick={()=>setViewMode("list")} title="Ù‚Ø§Ø¦Ù…Ø©"><List size={17}/></button><button className={viewMode==="kanban"?"active":""} onClick={()=>setViewMode("kanban")} title="ÙƒØ§Ù†Ø¨Ø§Ù†"><ClipboardList size={17}/></button></div></div>
    </div>
    {projects.length===0?<EmptyState text="Ø£Ù†Ø´Ø¦ Ù…Ø´Ø±ÙˆØ¹Ù‹Ø§ Ø£ÙˆÙ„Ù‹Ø§ Ù‚Ø¨Ù„ Ø¥Ø¶Ø§ÙØ© Ø§Ù„Ù…Ù‡Ø§Ù…."/>:sorted.length===0?<EmptyState text="Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…Ù‡Ø§Ù… Ù…Ø·Ø§Ø¨Ù‚Ø©." onCreate={onCreate}/>:viewMode==="cards"?<div className="task-grid">{sorted.map(t=><TaskCard key={t.id} task={t} project={projects.find(p=>p.id===t.project_id)} onEdit={()=>onEdit(t)} onDelete={()=>onDelete(t)}/>)}</div>:viewMode==="list"?<TaskList tasks={sorted} projects={projects} onEdit={onEdit} onDelete={onDelete}/>:<KanbanBoard tasks={sorted} projects={projects} onEdit={onEdit} onDelete={onDelete}/>}
  </section>;
}

function TaskList({tasks,projects,onEdit,onDelete}:{tasks:Task[];projects:Project[];onEdit:(t:Task)=>void;onDelete:(t:Task)=>void}){
  return <div className="task-table-wrap"><table className="task-table"><thead><tr><th>Ø§Ù„Ù…Ù‡Ù…Ø©</th><th>Ø§Ù„Ù…Ø´Ø±ÙˆØ¹</th><th>Ø§Ù„Ø­Ø§Ù„Ø©</th><th>Ø§Ù„Ø£ÙˆÙ„ÙˆÙŠØ©</th><th>Ø§Ù„Ø§Ø³ØªØ­Ù‚Ø§Ù‚</th><th>Ø§Ù„ØªÙ‚Ø¯Ù…</th><th></th></tr></thead><tbody>{tasks.map(t=><tr key={t.id}><td><button className="table-task-title" onClick={()=>onEdit(t)}><small>TSK-{t.id.slice(0,4).toUpperCase()}</small><b>{t.title}</b></button></td><td>{projectName(projects,t.project_id)}</td><td><span className={`status-pill ${taskStatusClass(t.status)}`}>{taskStatusLabels[t.status]}</span></td><td><i className={`priority ${t.priority.toLowerCase()}`}>{priorityLabels[t.priority]}</i></td><td className={isOverdue(t)?"overdue-text":""}>{formatDate(t.due_date)}</td><td><div className="table-progress"><span>{t.progress}%</span><div className="progress"><i style={{width:`${t.progress}%`}}/></div></div></td><td><div className="table-actions"><button onClick={()=>onEdit(t)}><Pencil size={15}/></button><button className="danger" onClick={()=>onDelete(t)}><Trash2 size={15}/></button></div></td></tr>)}</tbody></table></div>;
}

function KanbanBoard({tasks,projects,onEdit,onDelete}:{tasks:Task[];projects:Project[];onEdit:(t:Task)=>void;onDelete:(t:Task)=>void}){
  return <div className="kanban-board">{taskFilters.slice(1).map(rawStatus=>{const status=rawStatus as TaskStatus;const column=tasks.filter(t=>t.status===status);return <section className="kanban-column" key={status}><header><span className={`status-dot ${taskStatusClass(status)}`}/><h3>{taskStatusLabels[status]}</h3><b>{column.length}</b></header><div className="kanban-stack">{column.map(t=><article className="kanban-card" key={t.id}><button onClick={()=>onEdit(t)}><small>TSK-{t.id.slice(0,4).toUpperCase()}</small><strong>{t.title}</strong><span><FolderKanban size={13}/>{projectName(projects,t.project_id)}</span></button><footer><i className={`priority ${t.priority.toLowerCase()}`}>{priorityLabels[t.priority]}</i><span className={isOverdue(t)?"overdue-text":""}><Clock3 size={13}/>{formatDate(t.due_date)}</span><button className="kanban-delete" onClick={()=>onDelete(t)}><Trash2 size={14}/></button></footer></article>)}{!column.length&&<div className="kanban-empty">Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…Ù‡Ø§Ù…</div>}</div></section>})}</div>;
}

function Toolbar({ title, count, query, placeholder, onQuery, onCreate }: { title:string; count:number; query:string; placeholder:string; onQuery:(v:string)=>void; onCreate:()=>void }) { return <div className="projects-toolbar"><div><span className="section-kicker">DIRECTORY</span><h2>{title} <small>{count}</small></h2></div><div className="toolbar-actions"><label className="search-box"><Search size={17}/><input value={query} onChange={(e)=>onQuery(e.target.value)} placeholder={placeholder}/></label><button className="primary compact" onClick={onCreate}><Plus size={17}/> Ø¥Ø¶Ø§ÙØ©</button></div></div>; }

function ProjectCard({ project, onOpen, onEdit, onDelete }: { project:Project; onOpen:()=>void; onEdit:()=>void; onDelete:()=>void }) { const [open,setOpen]=useState(false); return <article className="project-card"><div className="project-card-top"><span className={`status-pill ${projectStatusClass(project.status)}`}>{projectStatusLabels[project.status]}</span><CardMenu open={open} setOpen={setOpen} onEdit={onEdit} onDelete={onDelete}/></div><button className="project-card-body" onClick={onOpen}><span className="project-icon"><FolderKanban size={21}/></span><h3>{project.name}</h3><p>{project.notes||project.client_name||project.area||"Ù…Ø´Ø±ÙˆØ¹ Ø¬Ø¯ÙŠØ¯"}</p></button><div className="project-meta"><span><b>Ø§Ù„Ø£ÙˆÙ„ÙˆÙŠØ©</b><i className={`priority ${project.priority.toLowerCase()}`}>{priorityLabels[project.priority]}</i></span><span><b>Ù…ÙˆØ¹Ø¯ Ø§Ù„ØªØ³Ù„ÙŠÙ…</b>{formatDate(project.due_date)}</span></div><div className="card-progress-head"><span>Ø§Ù„ØªÙ‚Ø¯Ù…</span><b>{project.progress}%</b></div><div className="progress"><i style={{width:`${project.progress}%`}}/></div></article>; }

function TaskCard({ task, project, onEdit, onDelete }: { task:Task; project?:Project; onEdit:()=>void; onDelete:()=>void }) { const [open,setOpen]=useState(false); return <article className="task-card"><div className="project-card-top"><span className={`status-pill ${taskStatusClass(task.status)}`}>{taskStatusLabels[task.status]}</span><CardMenu open={open} setOpen={setOpen} onEdit={onEdit} onDelete={onDelete}/></div><button className="task-card-body" onClick={onEdit}><div className="task-code">TSK-{task.id.slice(0,4).toUpperCase()}</div><h3>{task.title}</h3><p>{task.description||"Ø¨Ø¯ÙˆÙ† ÙˆØµÙ"}</p></button><div className="task-project"><FolderKanban size={14}/>{project?.name||"Ù…Ø´Ø±ÙˆØ¹ ØºÙŠØ± Ù…ØªØ§Ø­"}</div><div className="project-meta"><span><b>Ø§Ù„Ø£ÙˆÙ„ÙˆÙŠØ©</b><i className={`priority ${task.priority.toLowerCase()}`}>{priorityLabels[task.priority]}</i></span><span><b>Ø§Ù„Ø§Ø³ØªØ­Ù‚Ø§Ù‚</b>{formatDate(task.due_date)}</span></div><div className="card-progress-head"><span>Ø§Ù„ØªÙ‚Ø¯Ù…</span><b>{task.progress}%</b></div><div className="progress"><i style={{width:`${task.progress}%`}}/></div></article>; }

function CardMenu({ open, setOpen, onEdit, onDelete }: { open:boolean; setOpen:(v:boolean)=>void; onEdit:()=>void; onDelete:()=>void }) { return <div className="card-menu-wrap"><button className="icon-button" onClick={()=>setOpen(!open)}><MoreHorizontal size={19}/></button>{open&&<div className="card-menu"><button onClick={()=>{setOpen(false);onEdit();}}><Pencil size={15}/> ØªØ¹Ø¯ÙŠÙ„</button><button className="danger" onClick={()=>{setOpen(false);onDelete();}}><Trash2 size={15}/> Ø­Ø°Ù</button></div>}</div>; }

function ClientsView({ clients, allClients, projects, query, filter, onQuery, onFilter, onCreate, onEdit, onDelete }: { clients:Client[]; allClients:Client[]; projects:Project[]; query:string; filter:ClientFilter; onQuery:(v:string)=>void; onFilter:(v:ClientFilter)=>void; onCreate:()=>void; onEdit:(c:Client)=>void; onDelete:(c:Client)=>void }) {
  const active=allClients.filter(c=>c.status==="Active").length;
  const leads=allClients.filter(c=>c.status==="Lead").length;
  return <section className="panel projects-panel clients-panel"><Toolbar title="Ø¯Ù„ÙŠÙ„ Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡" count={allClients.length} query={query} placeholder="Ø§Ø¨Ø­Ø« Ø¨Ø§Ù„Ø§Ø³Ù… Ø£Ùˆ Ø§Ù„Ø´Ø±ÙƒØ© Ø£Ùˆ Ø§Ù„Ø¨Ø±ÙŠØ¯â€¦" onQuery={onQuery} onCreate={onCreate}/><div className="task-summary enhanced"><span>Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡ Ø§Ù„Ù…Ø­ØªÙ…Ù„ÙˆÙ† <b>{leads}</b></span><span>Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡ Ø§Ù„Ù†Ø´Ø·ÙˆÙ† <b>{active}</b></span><span>Ø§Ù„Ù…ÙƒØªÙ…Ù„ÙˆÙ† <b>{allClients.filter(c=>c.status==="Completed").length}</b></span><span>ØºÙŠØ± Ø§Ù„Ù†Ø´Ø·ÙŠÙ† <b>{allClients.filter(c=>c.status==="Inactive").length}</b></span></div><div className="filter-tabs clients-tabs">{clientFilters.map(f=><button key={f} className={filter===f?"active":""} onClick={()=>onFilter(f)}>{f==="All"?"Ø§Ù„ÙƒÙ„":clientStatusLabels[f]}</button>)}</div>{clients.length?<div className="client-grid">{clients.map(c=><ClientCard key={c.id} client={c} projectCount={projects.filter(p=>p.client_id===c.id).length} onEdit={()=>onEdit(c)} onDelete={()=>onDelete(c)}/>)}</div>:<EmptyState text="Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¹Ù…Ù„Ø§Ø¡ Ù…Ø·Ø§Ø¨Ù‚Ø©." onCreate={onCreate}/>}</section>;
}

function ClientCard({ client, projectCount, onEdit, onDelete }: { client:Client; projectCount:number; onEdit:()=>void; onDelete:()=>void }) { const[open,setOpen]=useState(false); return <article className="client-card"><div className="project-card-top"><span className={`status-pill client-${client.status.toLowerCase()}`}>{clientStatusLabels[client.status]}</span><CardMenu open={open} setOpen={setOpen} onEdit={onEdit} onDelete={onDelete}/></div><button className="client-card-body" onClick={onEdit}><div className="client-avatar">{client.name.slice(0,2).toUpperCase()}</div><div><h3>{client.name}</h3><p>{client.company||"Ø¹Ù…ÙŠÙ„ ÙØ±Ø¯ÙŠ"}</p></div></button><div className="client-contact">{client.email&&<span><Mail size={14}/>{client.email}</span>}{client.phone&&<span><Phone size={14}/>{client.phone}</span>}{client.source&&<span><Building2 size={14}/>{client.source}</span>}</div><div className="client-footer"><span><FolderKanban size={14}/>{projectCount} Ù…Ø´Ø±ÙˆØ¹</span><small>{client.next_follow_up?`Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø©: ${formatDate(client.next_follow_up)}`:"Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…ØªØ§Ø¨Ø¹Ø© Ù…Ø­Ø¯Ø¯Ø©"}</small></div></article>; }

function ClientModal({ state, onClose, onSave }: { state:Exclude<ClientModalState,null>; onClose:()=>void; onSave:(i:ClientInput,c?:Client)=>Promise<boolean> }) { const c=state.client; const[saving,setSaving]=useState(false); async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setSaving(true);const f=new FormData(e.currentTarget);const input:ClientInput={name:String(f.get("name")||"").trim(),company:nullableText(f.get("company")),email:nullableText(f.get("email")),phone:nullableText(f.get("phone")),status:String(f.get("status")) as ClientStatus,source:nullableText(f.get("source")),next_follow_up:dateValue(f.get("next_follow_up")),notes:nullableText(f.get("notes"))};if(!await onSave(input,c??undefined))setSaving(false);} return <Modal title={state.mode==="create"?"Ø¥Ø¶Ø§ÙØ© Ø¹Ù…ÙŠÙ„ Ø¬Ø¯ÙŠØ¯":"ØªØ¹Ø¯ÙŠÙ„ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø¹Ù…ÙŠÙ„"} kicker="CLIENT CRM" onClose={onClose}><form className="project-form" onSubmit={submit}><Field name="name" label="Ø§Ø³Ù… Ø§Ù„Ø¹Ù…ÙŠÙ„ *" defaultValue={c?.name} required full/><Field name="company" label="Ø§Ù„Ø´Ø±ÙƒØ©" defaultValue={c?.company}/><Select name="status" label="Ø§Ù„Ø­Ø§Ù„Ø©" defaultValue={c?.status||"Lead"} options={clientStatusLabels}/><Field name="email" label="Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ" type="email" defaultValue={c?.email}/><Field name="phone" label="Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ" defaultValue={c?.phone}/><Field name="source" label="Ù…ØµØ¯Ø± Ø§Ù„Ø¹Ù…ÙŠÙ„" defaultValue={c?.source}/><Field name="next_follow_up" label="Ù…ÙˆØ¹Ø¯ Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø©" type="date" defaultValue={c?.next_follow_up}/><label className="full"><span>Ø§Ù„Ù…Ù„Ø§Ø­Ø¸Ø§Øª</span><textarea name="notes" rows={5} defaultValue={c?.notes??""}/></label><Actions saving={saving} onClose={onClose}/></form></Modal>; }


function ContentView({ items, allItems, projects, clients, query, filter, platformFilter, onQuery, onFilter, onPlatformFilter, onCreate, onEdit, onDelete }: { items:ContentItem[]; allItems:ContentItem[]; projects:Project[]; clients:Client[]; query:string; filter:ContentFilter; platformFilter:PlatformFilter; onQuery:(v:string)=>void; onFilter:(v:ContentFilter)=>void; onPlatformFilter:(v:PlatformFilter)=>void; onCreate:()=>void; onEdit:(i:ContentItem)=>void; onDelete:(i:ContentItem)=>void }) {
  const published=allItems.filter(i=>i.status==="Published").length;
  const scheduled=allItems.filter(i=>i.status==="Scheduled").length;
  const ideas=allItems.filter(i=>i.status==="Idea").length;
  return <section className="panel projects-panel content-studio">
    <Toolbar title="Ù…ÙƒØªØ¨Ø© Ø§Ù„Ù…Ø­ØªÙˆÙ‰" count={allItems.length} query={query} placeholder="Ø§Ø¨Ø­Ø« Ø¨Ø§Ù„Ø¹Ù†ÙˆØ§Ù† Ø£Ùˆ Hook Ø£Ùˆ Scriptâ€¦" onQuery={onQuery} onCreate={onCreate}/>
    <div className="task-summary enhanced"><span>Ø§Ù„Ø£ÙÙƒØ§Ø± <b>{ideas}</b></span><span>Ù‚ÙŠØ¯ Ø§Ù„Ø¥Ù†ØªØ§Ø¬ <b>{allItems.filter(i=>["Draft","Recording","Editing"].includes(i.status)).length}</b></span><span>Ø§Ù„Ù…Ø¬Ø¯ÙˆÙ„ <b>{scheduled}</b></span><span>Ø§Ù„Ù…Ù†Ø´ÙˆØ± <b>{published}</b></span></div>
    <div className="content-controls"><div className="filter-tabs content-status-tabs">{contentFilters.map(f=><button key={f} className={filter===f?"active":""} onClick={()=>onFilter(f)}>{f==="All"?"Ø§Ù„ÙƒÙ„":contentStatusLabels[f]}</button>)}</div><select value={platformFilter} onChange={e=>onPlatformFilter(e.target.value as PlatformFilter)}><option value="All">ÙƒÙ„ Ø§Ù„Ù…Ù†ØµØ§Øª</option>{platformFilters.slice(1).map(p=><option value={p} key={p}>{platformLabels[p as ContentPlatform]}</option>)}</select></div>
    {items.length===0?<EmptyState text="Ù„Ø§ ÙŠÙˆØ¬Ø¯ Ù…Ø­ØªÙˆÙ‰ Ù…Ø·Ø§Ø¨Ù‚ Ø¨Ø¹Ø¯." onCreate={onCreate}/>:<div className="content-grid">{items.map(item=><ContentCard key={item.id} item={item} project={projects.find(p=>p.id===item.project_id)} client={clients.find(c=>c.id===item.client_id)} onEdit={()=>onEdit(item)} onDelete={()=>onDelete(item)}/>)}</div>}
  </section>;
}

function KnowledgeView({items,allItems,query,filter,favoriteOnly,onQuery,onFilter,onFavoriteOnly,onCreate,onEdit,onDelete}:{items:KnowledgeItem[];allItems:KnowledgeItem[];query:string;filter:KnowledgeFilter;favoriteOnly:boolean;onQuery:(v:string)=>void;onFilter:(v:KnowledgeFilter)=>void;onFavoriteOnly:(v:boolean)=>void;onCreate:()=>void;onEdit:(i:KnowledgeItem)=>void;onDelete:(i:KnowledgeItem)=>void}){
  return <section className="panel projects-panel knowledge-panel"><Toolbar title="Ù…ÙƒØªØ¨Ø© Ø§Ù„Ù…Ø¹Ø±ÙØ©" count={allItems.length} query={query} placeholder="Ø§Ø¨Ø­Ø« ÙÙŠ Ø§Ù„Ø¹Ù†Ø§ÙˆÙŠÙ† ÙˆØ§Ù„Ù…Ø­ØªÙˆÙ‰ ÙˆØ§Ù„ÙˆØ³ÙˆÙ…â€¦" onQuery={onQuery} onCreate={onCreate}/><div className="task-summary enhanced"><span>Ø§Ù„Ù…Ù„Ø§Ø­Ø¸Ø§Øª <b>{allItems.filter(i=>i.type==="Note").length}</b></span><span>Ø§Ù„Ø£ÙÙƒØ§Ø± <b>{allItems.filter(i=>i.type==="Idea").length}</b></span><span>Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹ <b>{allItems.filter(i=>i.type==="Reference").length}</b></span><span>Ø§Ù„Ù…ÙØ¶Ù„Ø© <b>{allItems.filter(i=>i.is_favorite).length}</b></span></div><div className="knowledge-controls"><div className="filter-tabs">{knowledgeFilters.map(f=><button key={f} className={filter===f?"active":""} onClick={()=>onFilter(f)}>{f==="All"?"Ø§Ù„ÙƒÙ„":knowledgeTypeLabels[f]}</button>)}</div><button className={`favorite-filter ${favoriteOnly?"active":""}`} onClick={()=>onFavoriteOnly(!favoriteOnly)}><Star size={15}/> Ø§Ù„Ù…ÙØ¶Ù„Ø© ÙÙ‚Ø·</button></div>{items.length?<div className="knowledge-grid">{items.map(i=><KnowledgeCard key={i.id} item={i} onEdit={()=>onEdit(i)} onDelete={()=>onDelete(i)}/>)}</div>:<EmptyState text="Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¹Ù†Ø§ØµØ± Ù…Ø¹Ø±ÙØ© Ù…Ø·Ø§Ø¨Ù‚Ø©." onCreate={onCreate}/>}</section>;
}

function KnowledgeCard({item,onEdit,onDelete}:{item:KnowledgeItem;onEdit:()=>void;onDelete:()=>void}){const[open,setOpen]=useState(false);const icon=item.type==="Idea"?<Lightbulb size={16}/>:item.type==="Reference"?<Library size={16}/>:<FileText size={16}/>;return <article className="knowledge-card"><div className="project-card-top"><span className={`knowledge-type type-${item.type.toLowerCase()}`}>{icon}{knowledgeTypeLabels[item.type]}</span><div className="knowledge-actions">{item.is_favorite&&<Star className="favorite-star" size={17}/>}<CardMenu open={open} setOpen={setOpen} onEdit={onEdit} onDelete={onDelete}/></div></div><button className="knowledge-card-body" onClick={onEdit}><h3>{item.title}</h3><p>{item.content||"Ø¹Ù†ØµØ± Ù…Ø¹Ø±ÙØ© Ø¬Ø¯ÙŠØ¯"}</p></button>{item.tags&&<div className="content-hashtags"><Hash size={13}/>{item.tags}</div>}<footer><span><Clock3 size={14}/>{new Intl.DateTimeFormat("ar-SA",{day:"numeric",month:"short",year:"numeric"}).format(new Date(item.updated_at))}</span></footer></article>}

function KnowledgeModal({state,onClose,onSave}:{state:Exclude<KnowledgeModalState,null>;onClose:()=>void;onSave:(i:KnowledgeInput,c?:KnowledgeItem)=>Promise<boolean>}){const item=state.item;const[saving,setSaving]=useState(false);async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setSaving(true);const f=new FormData(e.currentTarget);const input:KnowledgeInput={title:String(f.get("title")||"").trim(),content:nullableText(f.get("content")),type:String(f.get("type")) as KnowledgeType,tags:nullableText(f.get("tags")),is_favorite:f.get("is_favorite")==="on"};if(!await onSave(input,item??undefined))setSaving(false)}return <Modal title={state.mode==="create"?"Ø¥Ø¶Ø§ÙØ© Ø¹Ù†ØµØ± Ù…Ø¹Ø±ÙØ©":"ØªØ¹Ø¯ÙŠÙ„ Ø¹Ù†ØµØ± Ø§Ù„Ù…Ø¹Ø±ÙØ©"} kicker="KNOWLEDGE BASE" onClose={onClose}><form className="project-form" onSubmit={submit}><Field name="title" label="Ø§Ù„Ø¹Ù†ÙˆØ§Ù† *" defaultValue={item?.title} required full maxLength={180}/><Select name="type" label="Ø§Ù„Ù†ÙˆØ¹" defaultValue={item?.type||"Note"} options={knowledgeTypeLabels}/><label className="checkbox-field"><input name="is_favorite" type="checkbox" defaultChecked={item?.is_favorite??false}/><span><Star size={15}/> Ø¥Ø¶Ø§ÙØ© Ø¥Ù„Ù‰ Ø§Ù„Ù…ÙØ¶Ù„Ø©</span></label><label className="full"><span>Ø§Ù„Ù…Ø­ØªÙˆÙ‰</span><textarea name="content" rows={12} defaultValue={item?.content??""}/></label><Field name="tags" label="Ø§Ù„ÙˆØ³ÙˆÙ… â€” Ø§ÙØµÙ„ Ø¨ÙŠÙ†Ù‡Ø§ Ø¨ÙÙˆØ§ØµÙ„" defaultValue={item?.tags} full/><Actions saving={saving} onClose={onClose}/></form></Modal>}

function ContentCard({item,project,client,onEdit,onDelete}:{item:ContentItem;project?:Project;client?:Client;onEdit:()=>void;onDelete:()=>void}){
  const [open,setOpen]=useState(false);
  return <article className="content-card"><div className="project-card-top"><span className={`status-pill content-${item.status.toLowerCase()}`}>{contentStatusLabels[item.status]}</span><CardMenu open={open} setOpen={setOpen} onEdit={onEdit} onDelete={onDelete}/></div><button className="content-card-body" onClick={onEdit}><div className="content-platform"><Film size={15}/>{platformLabels[item.platform]}</div><h3>{item.title}</h3><p>{item.hook||item.script||"ÙÙƒØ±Ø© Ù…Ø­ØªÙˆÙ‰ Ø¬Ø¯ÙŠØ¯Ø©"}</p></button><div className="content-links">{project&&<span><FolderKanban size={13}/>{project.name}</span>}{client&&<span><Users size={13}/>{client.name}</span>}</div>{item.hashtags&&<div className="content-hashtags"><Hash size={13}/>{item.hashtags}</div>}<footer><span><CalendarDays size={14}/>{formatDate(item.publish_date)}</span>{item.cta&&<span><Send size={14}/> CTA</span>}</footer></article>;
}

function ContentModal({state,projects,clients,onClose,onSave}:{state:Exclude<ContentModalState,null>;projects:Project[];clients:Client[];onClose:()=>void;onSave:(i:ContentInput,c?:ContentItem)=>Promise<boolean>}){
  const item=state.item; const[saving,setSaving]=useState(false);
  async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setSaving(true);const f=new FormData(e.currentTarget);const input:ContentInput={title:String(f.get("title")||"").trim(),hook:nullableText(f.get("hook")),script:nullableText(f.get("script")),cta:nullableText(f.get("cta")),hashtags:nullableText(f.get("hashtags")),platform:String(f.get("platform")) as ContentPlatform,status:String(f.get("status")) as ContentStatus,publish_date:dateValue(f.get("publish_date")),project_id:nullableText(f.get("project_id")),client_id:nullableText(f.get("client_id")),notes:nullableText(f.get("notes"))};if(!await onSave(input,item??undefined))setSaving(false);}
  return <Modal title={state.mode==="create"?"Ø¥Ù†Ø´Ø§Ø¡ Ù…Ø­ØªÙˆÙ‰ Ø¬Ø¯ÙŠØ¯":"ØªØ¹Ø¯ÙŠÙ„ Ø§Ù„Ù…Ø­ØªÙˆÙ‰"} kicker="CONTENT STUDIO" onClose={onClose}><form className="project-form" onSubmit={submit}><Field name="title" label="Ø¹Ù†ÙˆØ§Ù† Ø§Ù„Ù…Ø­ØªÙˆÙ‰ *" defaultValue={item?.title} required full maxLength={180}/><Select name="status" label="Ù…Ø±Ø­Ù„Ø© Ø§Ù„Ø¥Ù†ØªØ§Ø¬" defaultValue={item?.status||"Idea"} options={contentStatusLabels}/><Select name="platform" label="Ø§Ù„Ù…Ù†ØµØ©" defaultValue={item?.platform||"TikTok"} options={platformLabels}/><label><span>Ø§Ù„Ù…Ø´Ø±ÙˆØ¹ Ø§Ù„Ù…Ø±ØªØ¨Ø·</span><select name="project_id" defaultValue={item?.project_id??""}><option value="">Ø¨Ø¯ÙˆÙ† Ù…Ø´Ø±ÙˆØ¹</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label><span>Ø§Ù„Ø¹Ù…ÙŠÙ„ Ø§Ù„Ù…Ø±ØªØ¨Ø·</span><select name="client_id" defaultValue={item?.client_id??""}><option value="">Ø¨Ø¯ÙˆÙ† Ø¹Ù…ÙŠÙ„</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><Field name="publish_date" label="Ù…ÙˆØ¹Ø¯ Ø§Ù„Ù†Ø´Ø±" type="date" defaultValue={item?.publish_date}/><label className="full"><span>Hook</span><textarea name="hook" rows={2} defaultValue={item?.hook??""}/></label><label className="full"><span>Script</span><textarea name="script" rows={8} defaultValue={item?.script??""}/></label><Field name="cta" label="CTA" defaultValue={item?.cta} full/><Field name="hashtags" label="Hashtags" defaultValue={item?.hashtags} full/><label className="full"><span>Ù…Ù„Ø§Ø­Ø¸Ø§Øª Ø§Ù„Ø¥Ù†ØªØ§Ø¬</span><textarea name="notes" rows={4} defaultValue={item?.notes??""}/></label><Actions saving={saving} onClose={onClose}/></form></Modal>;
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
  const steps=["Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„Ø£Ø³Ø§Ø³ÙŠØ©","Ø§Ù„Ø¬Ø¯ÙˆÙ„ ÙˆØ§Ù„ØªÙ†ÙÙŠØ°","Ø§Ù„Ù…ÙŠØ²Ø§Ù†ÙŠØ© ÙˆØ§Ù„Ù‡ÙˆÙŠØ©","Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©"];
  const projectTypeLabels:Record<ProjectType,string>={Villa:"ÙÙŠÙ„Ø§","Residential Building":"Ù…Ø¨Ù†Ù‰ Ø³ÙƒÙ†ÙŠ",Commercial:"ØªØ¬Ø§Ø±ÙŠ",Office:"Ù…ÙƒØªØ¨",Interior:"ØªØµÙ…ÙŠÙ… Ø¯Ø§Ø®Ù„ÙŠ",Other:"Ø£Ø®Ø±Ù‰"};
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
  return <Modal title={state.mode==="create"?"Ø¥Ù†Ø´Ø§Ø¡ Ù…Ø´Ø±ÙˆØ¹ Ø¬Ø¯ÙŠØ¯":"ØªØ¹Ø¯ÙŠÙ„ Ø§Ù„Ù…Ø´Ø±ÙˆØ¹"} kicker="PROJECT WIZARD Â· v1.1.1" onClose={onClose}>
    <div className="wizard-progress">{steps.map((label,index)=><button type="button" key={label} className={index===step?"active":index<step?"done":""} onClick={()=>index<=step&&setStep(index)}><b>{index+1}</b><span>{label}</span></button>)}</div>
    <form className="project-form wizard-form" onSubmit={submit}>
      {step===0&&<>
        <label className="full"><span>Ø§Ø³Ù… Ø§Ù„Ù…Ø´Ø±ÙˆØ¹ *</span><input value={form.name} onChange={e=>update("name",e.target.value)} required maxLength={120}/></label>
        <label><span>Ø±Ù‚Ù… Ø§Ù„Ù…Ø´Ø±ÙˆØ¹</span><input value={form.project_number} onChange={e=>update("project_number",e.target.value)} placeholder="YR-2026-001"/></label>
        <label><span>Ù†ÙˆØ¹ Ø§Ù„Ù…Ø´Ø±ÙˆØ¹</span><select value={form.project_type} onChange={e=>update("project_type",e.target.value)}>{Object.entries(projectTypeLabels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
        <label><span>Ø§Ù„Ø¹Ù…ÙŠÙ„ Ø§Ù„Ù…Ø±ØªØ¨Ø·</span><select value={form.client_id} onChange={e=>update("client_id",e.target.value)}><option value="">Ø¨Ø¯ÙˆÙ† Ø¹Ù…ÙŠÙ„</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}{c.company?` â€” ${c.company}`:""}</option>)}</select></label>
        {!form.client_id&&<label><span>Ø§Ø³Ù… Ø¹Ù…ÙŠÙ„ ÙŠØ¯ÙˆÙŠ</span><input value={form.client_name} onChange={e=>update("client_name",e.target.value)}/></label>}
        <label><span>Ø§Ù„Ù…ÙˆÙ‚Ø¹ / Ø§Ù„Ù…Ø¯ÙŠÙ†Ø©</span><input value={form.location} onChange={e=>update("location",e.target.value)} placeholder="Ø¬Ø¯Ø©ØŒ Ø§Ù„Ù…Ù…Ù„ÙƒØ© Ø§Ù„Ø¹Ø±Ø¨ÙŠØ© Ø§Ù„Ø³Ø¹ÙˆØ¯ÙŠØ©"/></label>
        <label><span>Ø§Ù„Ù…Ø³Ø§Ø­Ø© Ø£Ùˆ Ø§Ù„Ù…Ø¬Ø§Ù„</span><input value={form.area} onChange={e=>update("area",e.target.value)} placeholder="450 Ù…Â²"/></label>
        <label className="full"><span>ÙˆØµÙ Ø§Ù„Ù…Ø´Ø±ÙˆØ¹</span><textarea rows={5} value={form.description} onChange={e=>update("description",e.target.value)}/></label>
      </>}
      {step===1&&<>
        <label><span>Ø§Ù„Ø­Ø§Ù„Ø©</span><select value={form.status} onChange={e=>update("status",e.target.value)}>{Object.entries(projectStatusLabels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
        <label><span>Ø§Ù„Ø£ÙˆÙ„ÙˆÙŠØ©</span><select value={form.priority} onChange={e=>update("priority",e.target.value)}>{Object.entries(priorityLabels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
        <label className="full"><span>Ø§Ù„Ù…Ø±Ø­Ù„Ø© Ø§Ù„ØªØµÙ…ÙŠÙ…ÙŠØ©</span><select value={form.design_phase} onChange={e=>update("design_phase",e.target.value)}>{Object.entries(phaseLabels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
        <label><span>ØªØ§Ø±ÙŠØ® Ø§Ù„Ø¨Ø¯Ø§ÙŠØ©</span><input type="date" value={form.start_date} onChange={e=>update("start_date",e.target.value)}/></label>
        <label><span>Ù…ÙˆØ¹Ø¯ Ø§Ù„ØªØ³Ù„ÙŠÙ…</span><input type="date" min={form.start_date||undefined} value={form.due_date} onChange={e=>update("due_date",e.target.value)}/></label>
        <label className="full"><span>Ù†Ø³Ø¨Ø© Ø§Ù„ØªÙ‚Ø¯Ù…: {form.progress}%</span><input type="range" min="0" max="100" value={form.progress} onChange={e=>update("progress",e.target.value)}/></label>
      </>}
      {step===2&&<>
        <label><span>Ø§Ù„Ù…ÙŠØ²Ø§Ù†ÙŠØ©</span><input type="number" min="0" step="0.01" value={form.budget} onChange={e=>update("budget",e.target.value)} placeholder="0.00"/></label>
        <label><span>Ø§Ù„Ø¹Ù…Ù„Ø©</span><select value={form.currency} onChange={e=>update("currency",e.target.value)}><option value="SAR">SAR</option><option value="USD">USD</option><option value="EGP">EGP</option><option value="AED">AED</option></select></label>
        <label><span>Ù„ÙˆÙ† Ø§Ù„Ù…Ø´Ø±ÙˆØ¹</span><input type="color" value={form.color} onChange={e=>update("color",e.target.value)}/></label>
        <label><span>Ø£ÙŠÙ‚ÙˆÙ†Ø© Ø§Ù„Ù…Ø´Ø±ÙˆØ¹</span><select value={form.icon} onChange={e=>update("icon",e.target.value)}><option value="building">Ù…Ø¨Ù†Ù‰</option><option value="home">Ù…Ù†Ø²Ù„</option><option value="briefcase">Ø£Ø¹Ù…Ø§Ù„</option><option value="palette">ØªØµÙ…ÙŠÙ…</option></select></label>
        <div className="project-identity-preview full" style={{borderInlineStartColor:form.color}}><span>Ù…Ø¹Ø§ÙŠÙ†Ø© Ø¨Ø·Ø§Ù‚Ø© Ø§Ù„Ù…Ø´Ø±ÙˆØ¹</span><b>{form.name||"Ø§Ø³Ù… Ø§Ù„Ù…Ø´Ø±ÙˆØ¹"}</b><small>{projectTypeLabels[form.project_type as ProjectType]} Â· {form.currency} {form.budget||"0"}</small></div>
      </>}
      {step===3&&<div className="project-review full">
        <div><span>Ø§Ù„Ù…Ø´Ø±ÙˆØ¹</span><b>{form.name}</b><small>{form.project_number||"Ø³ÙŠØªÙ… Ø§Ù„Ø¹Ù…Ù„ Ø¨Ø¯ÙˆÙ† Ø±Ù‚Ù… Ù…Ø´Ø±ÙˆØ¹"}</small></div>
        <div><span>Ø§Ù„Ø¹Ù…ÙŠÙ„</span><b>{clients.find(c=>c.id===form.client_id)?.name||form.client_name||"ØºÙŠØ± Ù…Ø­Ø¯Ø¯"}</b><small>{form.location||"Ø§Ù„Ù…ÙˆÙ‚Ø¹ ØºÙŠØ± Ù…Ø­Ø¯Ø¯"}</small></div>
        <div><span>Ø§Ù„ØªÙ†ÙÙŠØ°</span><b>{phaseLabels[form.design_phase as DesignPhase]}</b><small>{projectStatusLabels[form.status as ProjectStatus]} Â· {priorityLabels[form.priority as PriorityLevel]}</small></div>
        <div><span>Ø§Ù„Ø¬Ø¯ÙˆÙ„</span><b>{formatDate(form.start_date)} â† {formatDate(form.due_date)}</b><small>Ø§Ù„ØªÙ‚Ø¯Ù… Ø§Ù„Ù…Ø¨Ø¯Ø¦ÙŠ {form.progress}%</small></div>
        <div><span>Ø§Ù„Ù…ÙŠØ²Ø§Ù†ÙŠØ©</span><b>{form.currency} {form.budget||"0"}</b><small>ÙŠÙ…ÙƒÙ† ØªØ¹Ø¯ÙŠÙ„Ù‡Ø§ Ù„Ø§Ø­Ù‚Ù‹Ø§ Ù…Ù† Ù…Ø³Ø§Ø­Ø© Ø§Ù„Ù…Ø´Ø±ÙˆØ¹</small></div>
      </div>}
      <div className="form-actions full wizard-actions"><button type="button" onClick={step===0?onClose:()=>setStep(v=>v-1)}>{step===0?"Ø¥Ù„ØºØ§Ø¡":"Ø§Ù„Ø³Ø§Ø¨Ù‚"}</button><button className="primary" disabled={saving||!canContinue}>{saving?"Ø¬Ø§Ø±Ù Ø§Ù„Ø­ÙØ¸â€¦":step===steps.length-1?(state.mode==="create"?"Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ù…Ø´Ø±ÙˆØ¹":"Ø­ÙØ¸ Ø§Ù„ØªØ¹Ø¯ÙŠÙ„Ø§Øª"):"Ø§Ù„ØªØ§Ù„ÙŠ"}</button></div>
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
    ? `ÙŠØ­ØªØ§Ø¬ Ø§Ù„Ù…Ø´Ø±ÙˆØ¹ Ø¥Ù„Ù‰ ØªØ¯Ø®Ù„ Ø§Ù„Ø¢Ù†: ØªÙˆØ¬Ø¯ ${overdue} ${overdue===1?"Ù…Ù‡Ù…Ø© Ù…ØªØ£Ø®Ø±Ø©":"Ù…Ù‡Ø§Ù… Ù…ØªØ£Ø®Ø±Ø©"}. Ø§Ø¨Ø¯Ø£ Ø¨Ø¥Ø¹Ø§Ø¯Ø© ØªØ±ØªÙŠØ¨ Ø§Ù„Ø£ÙˆÙ„ÙˆÙŠØ§Øª Ù‚Ø¨Ù„ Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„Ø£Ø¹Ù…Ø§Ù„ Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø©.`
    : daysUntilDue!==null&&daysUntilDue>=0&&daysUntilDue<=7&&completed<tasks.length
      ? `Ù…ÙˆØ¹Ø¯ Ø§Ù„ØªØ³Ù„ÙŠÙ… Ø®Ù„Ø§Ù„ ${daysUntilDue} ${daysUntilDue===1?"ÙŠÙˆÙ…":"Ø£ÙŠØ§Ù…"}. Ø±Ø§Ø¬Ø¹ Ø§Ù„Ù…Ù‡Ø§Ù… Ø§Ù„Ù…ÙØªÙˆØ­Ø© ÙˆØ«Ø¨Ù‘Øª Ù…Ø³Ø¤ÙˆÙ„ÙŠØ© ÙƒÙ„ Ø®Ø·ÙˆØ©.`
      : tasks.length===0
        ? "Ø§Ù„Ù…Ø´Ø±ÙˆØ¹ Ø¬Ø§Ù‡Ø² Ù„Ù„Ø¨Ø¯Ø¡ØŒ Ù„ÙƒÙ†Ù‡ Ù„Ø§ ÙŠØ­ØªÙˆÙŠ Ø¹Ù„Ù‰ Ù…Ù‡Ø§Ù… Ø¨Ø¹Ø¯. Ø£Ù†Ø´Ø¦ Ø£ÙˆÙ„ Ù…Ù‡Ù…Ø© Ù„ØªØ­ÙˆÙŠÙ„ Ø§Ù„Ø®Ø·Ø© Ø¥Ù„Ù‰ ØªÙ†ÙÙŠØ° Ù‚Ø§Ø¨Ù„ Ù„Ù„Ù‚ÙŠØ§Ø³."
        : `Ø§Ù„Ù…Ø´Ø±ÙˆØ¹ Ù…Ø³ØªÙ‚Ø± Ø­Ø§Ù„ÙŠÙ‹Ø§ØŒ ÙˆØ§Ù„ØªÙ‚Ø¯Ù… Ø§Ù„Ù…Ø­Ø³ÙˆØ¨ Ù…Ù† Ø§Ù„Ù…Ù‡Ø§Ù… ${taskProgress}%. Ø§Ù„Ø£ÙˆÙ„ÙˆÙŠØ© Ø§Ù„ØªØ§Ù„ÙŠØ© Ù‡ÙŠ Ø§Ù„Ø­ÙØ§Ø¸ Ø¹Ù„Ù‰ ØªØ­Ø¯ÙŠØ« Ø§Ù„ØªÙ†ÙÙŠØ° ÙŠÙˆÙ…ÙŠÙ‹Ø§.`;
  const tabs:{id:WorkspaceTab;label:string;icon:ReactNode;count?:number}[]=[
    {id:"overview",label:"Ù†Ø¸Ø±Ø© Ø¹Ø§Ù…Ø©",icon:<LayoutDashboard size={16}/>},
    {id:"tasks",label:"Ø§Ù„Ù…Ù‡Ø§Ù…",icon:<ClipboardList size={16}/>,count:tasks.length},
    {id:"files",label:"Ø§Ù„Ù…Ù„ÙØ§Øª",icon:<FileText size={16}/>},
    {id:"notes",label:"Ø§Ù„Ù…Ù„Ø§Ø­Ø¸Ø§Øª",icon:<BookOpen size={16}/>},
    {id:"timeline",label:"Ø§Ù„Ø®Ø· Ø§Ù„Ø²Ù…Ù†ÙŠ",icon:<CalendarDays size={16}/>},
    {id:"finance",label:"Ø§Ù„Ù…Ø§Ù„ÙŠØ©",icon:<Wallet size={16}/>,count:financeItems.length},
    {id:"activity",label:"Ø§Ù„Ù†Ø´Ø§Ø·",icon:<Activity size={16}/>,count:activityEvents.length},
  ];
  const phases:DesignPhase[]=["Concept","Schematic","Design Development","Construction Documents","Site Supervision","Handover"];
  const currentPhase=Math.max(0,phases.indexOf(project.design_phase||"Concept"));
  const taskColumns:TaskStatus[]=["To Do","In Progress","Review","Done"];
  return <div className="modal-backdrop project-workspace-backdrop" onMouseDown={onClose}><section className="project-workspace project-workspace-v2" onMouseDown={e=>e.stopPropagation()}>
    <header className="project-workspace-head"><div><span className="section-kicker">PROJECT WORKSPACE Â· v3.0</span><div className="workspace-title-row"><span className={`status-dot ${projectStatusClass(project.status)}`}/><h2>{project.name}</h2><span className="workspace-status">{projectStatusLabels[project.status]}</span></div><p>{project.description||project.notes||project.location||project.area||"Ù…Ø³Ø§Ø­Ø© ØªÙ†ÙÙŠØ° Ù…ÙˆØ­Ø¯Ø© Ù„Ù„Ù…Ø´Ø±ÙˆØ¹."}</p></div><div className="project-workspace-actions"><button onClick={onEdit}><Pencil size={16}/> ØªØ¹Ø¯ÙŠÙ„</button><button className="primary compact" onClick={onCreateTask}><Plus size={16}/> Ù…Ù‡Ù…Ø© Ø¬Ø¯ÙŠØ¯Ø©</button><button className="icon-button" onClick={onClose}><X size={20}/></button></div></header>
    <div className="executive-brief"><div className="executive-brief-icon"><Brain size={22}/></div><div><span className="section-kicker">EXECUTIVE BRIEF</span><strong>{brief}</strong></div><button onClick={()=>setTab("tasks")}>ÙØªØ­ Ø§Ù„ØªÙ†ÙÙŠØ° <ChevronLeft size={16}/></button></div>
    <div className="project-workspace-kpis"><Metric icon={<FolderKanban/>} label="Ø­Ø§Ù„Ø© Ø§Ù„Ù…Ø´Ø±ÙˆØ¹" value={projectStatusLabels[project.status]} detail={priorityLabels[project.priority]}/><Metric icon={<ClipboardList/>} label="Ø§Ù„Ù…Ù‡Ø§Ù…" value={`${completed}/${tasks.length}`} detail={overdue?`${overdue} Ù…ØªØ£Ø®Ø±Ø©`:"Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…Ù‡Ø§Ù… Ù…ØªØ£Ø®Ø±Ø©"} danger={overdue>0}/><Metric icon={<Activity/>} label="ØªÙ‚Ø¯Ù… Ø§Ù„ØªÙ†ÙÙŠØ°" value={`${taskProgress}%`} detail={tasks.length?"Ù…Ø­Ø³ÙˆØ¨ Ù…Ù† Ø§Ù„Ù…Ù‡Ø§Ù…":"Ø§Ù„ØªÙ‚Ø¯Ù… Ø§Ù„Ù…Ø³Ø¬Ù„"}/><Metric icon={<Wallet/>} label="ØµØ§ÙÙŠ Ø§Ù„Ù…Ø´Ø±ÙˆØ¹" value={new Intl.NumberFormat("en-US",{maximumFractionDigits:0}).format(income-expenses)} detail={financeItems[0]?.currency||project.currency||"SAR"}/></div>
    <nav className="project-workspace-tabs" aria-label="Ø£Ù‚Ø³Ø§Ù… Ù…Ø³Ø§Ø­Ø© Ø§Ù„Ù…Ø´Ø±ÙˆØ¹">{tabs.map(item=><button key={item.id} className={tab===item.id?"active":""} onClick={()=>setTab(item.id)}>{item.icon}<span>{item.label}</span>{item.count!==undefined&&item.count>0?<em>{item.count}</em>:null}</button>)}</nav>

    {tab==="overview"&&<div className="project-workspace-grid workspace-overview-v2">
      <article className="project-overview-card"><span className="section-kicker">PROJECT PROFILE</span><h3>Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø´Ø±ÙˆØ¹</h3><dl><div><dt>Ø§Ù„Ø¹Ù…ÙŠÙ„</dt><dd>{client?.name||project.client_name||"ØºÙŠØ± Ù…Ø­Ø¯Ø¯"}</dd></div><div><dt>Ø±Ù‚Ù… Ø§Ù„Ù…Ø´Ø±ÙˆØ¹</dt><dd>{project.project_number||"ØºÙŠØ± Ù…Ø­Ø¯Ø¯"}</dd></div><div><dt>Ø§Ù„Ù†ÙˆØ¹</dt><dd>{project.project_type||"ØºÙŠØ± Ù…Ø­Ø¯Ø¯"}</dd></div><div><dt>Ø§Ù„Ù…ÙˆÙ‚Ø¹</dt><dd>{project.location||"ØºÙŠØ± Ù…Ø­Ø¯Ø¯"}</dd></div><div><dt>Ø§Ù„Ù…Ø³Ø§Ø­Ø© / Ø§Ù„Ù…Ø¬Ø§Ù„</dt><dd>{project.area||"ØºÙŠØ± Ù…Ø­Ø¯Ø¯"}</dd></div><div><dt>Ø§Ù„Ù…Ø±Ø­Ù„Ø© Ø§Ù„Ø­Ø§Ù„ÙŠØ©</dt><dd>{project.design_phase||"ØºÙŠØ± Ù…Ø­Ø¯Ø¯"}</dd></div><div><dt>Ø§Ù„Ù…ÙŠØ²Ø§Ù†ÙŠØ©</dt><dd>{project.budget==null?"ØºÙŠØ± Ù…Ø­Ø¯Ø¯Ø©":`${project.currency} ${new Intl.NumberFormat("en-US").format(project.budget)}`}</dd></div><div><dt>Ø§Ù„ØªØ³Ù„ÙŠÙ…</dt><dd>{formatDate(project.due_date)}</dd></div></dl><div className="card-progress-head"><span>Ø§Ù„ØªÙ‚Ø¯Ù… Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ</span><b>{taskProgress}%</b></div><div className="progress"><i style={{width:`${taskProgress}%`}}/></div></article>
      <article className="project-overview-card architecture-phase-card"><span className="section-kicker">ARCHITECTURE MODE</span><h3>Ù…Ø±Ø§Ø­Ù„ Ø§Ù„Ù…Ø´Ø±ÙˆØ¹ Ø§Ù„Ù…Ø¹Ù…Ø§Ø±ÙŠ</h3><div className="phase-track">{phases.map((phase,index)=><div key={phase} className={`${index<currentPhase?"done":""} ${index===currentPhase?"current":""}`}><i>{index<currentPhase?<CheckCircle2 size={17}/>:index===currentPhase?<Clock3 size={17}/>:<span>{index+1}</span>}</i><div><b>{phaseLabels[phase]}</b><small>{index<currentPhase?"Ù…ÙƒØªÙ…Ù„Ø©":index===currentPhase?"Ø§Ù„Ù…Ø±Ø­Ù„Ø© Ø§Ù„Ø­Ø§Ù„ÙŠØ©":"Ù‚Ø§Ø¯Ù…Ø©"}</small></div></div>)}</div></article>
      <article className="project-overview-card workspace-recent-card"><span className="section-kicker">NEXT ACTIONS</span><h3>Ø§Ù„Ø®Ø·ÙˆØ§Øª Ø§Ù„ØªØ§Ù„ÙŠØ©</h3>{tasks.filter(t=>t.status!=="Done").length?<div className="workspace-task-list">{tasks.filter(t=>t.status!=="Done").sort((a,b)=>(a.due_date||"9999").localeCompare(b.due_date||"9999")).slice(0,5).map(t=><div key={t.id}><span className={`status-dot ${taskStatusClass(t.status)}`}/><div><b>{t.title}</b><small>{taskStatusLabels[t.status]} Â· {formatDate(t.due_date)}</small></div><strong>{priorityLabels[t.priority]}</strong></div>)}</div>:<EmptyState compact text="Ù„Ø§ ØªÙˆØ¬Ø¯ Ø®Ø·ÙˆØ§Øª Ù…ÙØªÙˆØ­Ø©." onCreate={onCreateTask}/>}</article>
    </div>}

    {tab==="tasks"&&<section className="workspace-tab-panel"><div className="workspace-panel-head"><div><span className="section-kicker">TASK BOARD</span><h3>Ù„ÙˆØ­Ø© ØªÙ†ÙÙŠØ° Ø§Ù„Ù…Ø´Ø±ÙˆØ¹</h3></div><button className="primary compact" onClick={onCreateTask}><Plus size={16}/> Ù…Ù‡Ù…Ø© Ø¬Ø¯ÙŠØ¯Ø©</button></div><div className="project-kanban">{taskColumns.map(status=><div className="project-kanban-column" key={status}><header><span>{taskStatusLabels[status]}</span><em>{tasks.filter(t=>t.status===status).length}</em></header>{tasks.filter(t=>t.status===status).map(t=><article key={t.id}><div className="kanban-priority"><span className={`priority-badge ${t.priority.toLowerCase()}`}>{priorityLabels[t.priority]}</span><b>{t.progress}%</b></div><h4>{t.title}</h4>{t.description&&<p>{t.description}</p>}<footer><span><CalendarDays size={14}/>{formatDate(t.due_date)}</span><div className="mini-progress"><i style={{width:`${t.progress}%`}}/></div></footer></article>)}{tasks.filter(t=>t.status===status).length===0&&<div className="kanban-empty">Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…Ù‡Ø§Ù…</div>}</div>)}</div></section>}

    {tab==="timeline"&&<section className="workspace-tab-panel"><div className="workspace-panel-head"><div><span className="section-kicker">PROJECT TIMELINE</span><h3>Ø§Ù„Ù…Ø­Ø·Ø§Øª Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©</h3></div></div><div className="workspace-timeline"><div className="done"><i><CheckCircle2 size={18}/></i><div><b>Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ù…Ø´Ø±ÙˆØ¹</b><small>{formatDate(project.created_at)}</small></div></div>{phases.map((phase,index)=><div key={phase} className={index<currentPhase?"done":index===currentPhase?"current":""}><i>{index<currentPhase?<CheckCircle2 size={18}/>:<span/>}</i><div><b>{phaseLabels[phase]}</b><small>{index<currentPhase?"Ù…Ø±Ø­Ù„Ø© Ù…ÙƒØªÙ…Ù„Ø©":index===currentPhase?"Ù‚ÙŠØ¯ Ø§Ù„ØªÙ†ÙÙŠØ°":"Ø¨Ø§Ù†ØªØ¸Ø§Ø± Ø§Ù„Ø¨Ø¯Ø¡"}</small></div></div>)}<div className={project.status==="Completed"?"done":""}><i>{project.status==="Completed"?<CheckCircle2 size={18}/>:<span/>}</i><div><b>Ø§Ù„ØªØ³Ù„ÙŠÙ… Ø§Ù„Ù†Ù‡Ø§Ø¦ÙŠ</b><small>{formatDate(project.due_date)}</small></div></div></div></section>}

    {tab==="finance"&&<section className="workspace-tab-panel"><div className="workspace-panel-head"><div><span className="section-kicker">PROJECT FINANCE</span><h3>Ø§Ù„Ù…Ù„Ø®Øµ Ø§Ù„Ù…Ø§Ù„ÙŠ</h3></div></div><div className="workspace-finance-summary"><Metric icon={<ArrowUpDown/>} label="Ø§Ù„Ø¯Ø®Ù„" value={new Intl.NumberFormat("en-US").format(income)} detail={project.currency}/><Metric icon={<Wallet/>} label="Ø§Ù„Ù…ØµØ±ÙˆÙØ§Øª" value={new Intl.NumberFormat("en-US").format(expenses)} detail={project.currency}/><Metric icon={<Activity/>} label="Ø§Ù„ØµØ§ÙÙŠ" value={new Intl.NumberFormat("en-US").format(income-expenses)} detail={project.currency}/></div>{financeItems.length?<div className="workspace-finance-list">{financeItems.map(item=><div key={item.id}><span className={item.type==="Income"?"finance-in":"finance-out"}>{item.type==="Income"?"Ø¯Ø®Ù„":"Ù…ØµØ±ÙˆÙ"}</span><div><b>{item.description}</b><small>{formatDate(item.transaction_date)} Â· {item.status}</small></div><strong>{item.currency} {new Intl.NumberFormat("en-US").format(item.amount)}</strong></div>)}</div>:<EmptyState text="Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…Ø¹Ø§Ù…Ù„Ø§Øª Ù…Ø§Ù„ÙŠØ© Ù…Ø±ØªØ¨Ø·Ø© Ø¨Ù‡Ø°Ø§ Ø§Ù„Ù…Ø´Ø±ÙˆØ¹."/>}</section>}

    {tab==="activity"&&<section className="workspace-tab-panel"><div className="workspace-panel-head"><div><span className="section-kicker">ACTIVITY STREAM</span><h3>Ø¢Ø®Ø± Ù†Ø´Ø§Ø·Ø§Øª Ø§Ù„Ù…Ø´Ø±ÙˆØ¹</h3></div></div>{activityEvents.length?<div className="workspace-activity-list">{activityEvents.slice(0,20).map(event=><div key={event.id}><i><Activity size={16}/></i><div><b>{event.title}</b><small>{event.description||event.module} Â· {new Intl.DateTimeFormat("ar-SA",{dateStyle:"medium",timeStyle:"short"}).format(new Date(event.created_at))}</small></div></div>)}</div>:<EmptyState text="Ù„Ø§ ÙŠÙˆØ¬Ø¯ Ù†Ø´Ø§Ø· Ù…Ø³Ø¬Ù„ Ù„Ù„Ù…Ø´Ø±ÙˆØ¹ Ø¨Ø¹Ø¯."/>}</section>}

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
    } catch(cause) { setMessage(cause instanceof Error?cause.message:"ØªØ¹Ø°Ø± ØªØ­Ù…ÙŠÙ„ Ø³Ø¬Ù„ Ø§Ù„Ù…Ø´Ø±ÙˆØ¹."); }
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
    } catch(cause) { setMessage(cause instanceof Error?cause.message:"ØªØ¹Ø°Ø± Ø­ÙØ¸ Ø§Ù„Ù…Ù„Ø§Ø­Ø¸Ø©."); }
    finally { setSaving(false); }
  }
  async function changeStatus(note:ProjectNote,status:"open"|"done"|"archived") {
    try { await setProjectNoteStatus(note,status);await refresh(); }
    catch(cause) { setMessage(cause instanceof Error?cause.message:"ØªØ¹Ø°Ø± ØªØ­Ø¯ÙŠØ« Ø§Ù„Ø­Ø§Ù„Ø©."); }
  }
  async function convert(note:ProjectNote) {
    try { await convertProjectNoteToTask(note);await refresh(); }
    catch(cause) { setMessage(cause instanceof Error?cause.message:"ØªØ¹Ø°Ø± ØªØ­ÙˆÙŠÙ„ Ø§Ù„Ù…Ù„Ø§Ø­Ø¸Ø© Ø¥Ù„Ù‰ Ù…Ù‡Ù…Ø©."); }
  }
  async function remove(note:ProjectNote) {
    if(!window.confirm(`Ø­Ø°Ù Â«${note.title}Â»ØŸ`))return;
    try { await deleteProjectNote(note);await refresh(); }
    catch(cause) { setMessage(cause instanceof Error?cause.message:"ØªØ¹Ø°Ø± Ø­Ø°Ù Ø§Ù„Ù…Ù„Ø§Ø­Ø¸Ø©."); }
  }
  const typeLabels:Record<ProjectNoteType,string>={decision:"Ù‚Ø±Ø§Ø±",meeting:"Ø§Ø¬ØªÙ…Ø§Ø¹",review:"Ù…Ø±Ø§Ø¬Ø¹Ø©",general:"Ù…Ù„Ø§Ø­Ø¸Ø©"};
  const fileName=(id:string|null)=>files.find(file=>file.id===id)?.name;
  return <section className="workspace-tab-panel project-notes-panel">
    <div className="workspace-panel-head">
      <div><span className="section-kicker">DECISION LOG</span><h3>Ù…Ù„Ø§Ø­Ø¸Ø§Øª ÙˆÙ‚Ø±Ø§Ø±Ø§Øª Ø§Ù„Ù…Ø´Ø±ÙˆØ¹</h3><p>Ø³Ø¬Ù„ Ø§Ù„Ù‚Ø±Ø§Ø±Ø§Øª ÙˆØ§Ù„Ø§Ø¬ØªÙ…Ø§Ø¹Ø§Øª ÙˆØ§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø§ØªØŒ Ø«Ù… Ø­ÙˆÙ‘Ù„Ù‡Ø§ Ø¥Ù„Ù‰ Ù…Ù‡Ø§Ù… Ù‚Ø§Ø¨Ù„Ø© Ù„Ù„ØªÙ†ÙÙŠØ°.</p></div>
      <button className="primary compact" onClick={()=>setCreating(value=>!value)}><Plus size={16}/>{creating?"Ø¥ØºÙ„Ø§Ù‚":"Ø¥Ø¶Ø§ÙØ© Ø³Ø¬Ù„"}</button>
    </div>
    {creating&&<form className="project-note-form" onSubmit={submit}>
      <label><span>Ø§Ù„Ù†ÙˆØ¹</span><select name="type" defaultValue="general"><option value="decision">Ù‚Ø±Ø§Ø±</option><option value="meeting">Ø§Ø¬ØªÙ…Ø§Ø¹</option><option value="review">Ù…Ø±Ø§Ø¬Ø¹Ø©</option><option value="general">Ù…Ù„Ø§Ø­Ø¸Ø©</option></select></label>
      <label className="note-title"><span>Ø§Ù„Ø¹Ù†ÙˆØ§Ù† *</span><input name="title" required maxLength={180}/></label>
      <label><span>Ø§Ù„Ù…Ø³Ø¤ÙˆÙ„</span><input name="assigned_to"/></label>
      <label><span>ØªØ§Ø±ÙŠØ® Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø©</span><input name="follow_up_date" type="date"/></label>
      <label className="note-file"><span>Ù…Ù„Ù Ù…Ø±ØªØ¨Ø·</span><select name="project_file_id"><option value="">Ø¨Ø¯ÙˆÙ† Ù…Ù„Ù</option>{files.map(file=><option key={file.id} value={file.id}>{file.name}</option>)}</select></label>
      <label className="note-content"><span>Ø§Ù„ØªÙØ§ØµÙŠÙ„</span><textarea name="content" rows={4}/></label>
      <div className="form-actions note-actions"><button type="button" onClick={()=>setCreating(false)}>Ø¥Ù„ØºØ§Ø¡</button><button className="primary" disabled={saving}>{saving?"Ø¬Ø§Ø±Ù Ø§Ù„Ø­ÙØ¸â€¦":"Ø­ÙØ¸ Ø§Ù„Ø³Ø¬Ù„"}</button></div>
    </form>}
    {message&&<div className="project-files-message">{message}</div>}
    {loading?<div className="project-files-loading">Ø¬Ø§Ø±Ù ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ø³Ø¬Ù„â€¦</div>:notes.length===0
      ?<div className="project-files-empty"><BookOpen size={34}/><h4>Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…Ù„Ø§Ø­Ø¸Ø§Øª Ø£Ùˆ Ù‚Ø±Ø§Ø±Ø§Øª</h4><p>Ø£Ø¶Ù Ø£ÙˆÙ„ Ù‚Ø±Ø§Ø± Ø£Ùˆ Ø§Ø¬ØªÙ…Ø§Ø¹ Ø£Ùˆ Ù…Ø±Ø§Ø¬Ø¹Ø© Ù„Ù„Ù…Ø´Ø±ÙˆØ¹.</p></div>
      :<div className="project-note-list">{notes.map(note=><article key={note.id} className={`note-${note.status}`}>
        <header><span className={`note-type ${note.type}`}>{typeLabels[note.type]}</span><em>{note.status==="open"?"Ù…ÙØªÙˆØ­":note.status==="done"?"Ù…Ù†ÙØ°":"Ù…Ø¤Ø±Ø´Ù"}</em></header>
        <h4>{note.title}</h4>{note.content&&<p>{note.content}</p>}
        <footer><span>{note.assigned_to||"Ø¯ÙˆÙ† Ù…Ø³Ø¤ÙˆÙ„"}</span><span>{note.follow_up_date?formatDate(note.follow_up_date):"Ø¯ÙˆÙ† Ù…ÙˆØ¹Ø¯"}</span>{fileName(note.project_file_id)&&<span>ðŸ“Ž {fileName(note.project_file_id)}</span>}</footer>
        <div className="project-note-buttons">
          {note.status==="open"&&<><button onClick={()=>void convert(note)}>ØªØ­ÙˆÙŠÙ„ Ø¥Ù„Ù‰ Ù…Ù‡Ù…Ø©</button><button onClick={()=>void changeStatus(note,"done")}>ØªØ¹Ù„ÙŠÙ… ÙƒÙ…Ù†ÙØ°</button></>}
          {note.status==="done"&&<button onClick={()=>void changeStatus(note,"open")}>Ø¥Ø¹Ø§Ø¯Ø© ÙØªØ­</button>}
          <button onClick={()=>void changeStatus(note,"archived")}>Ø£Ø±Ø´ÙØ©</button>
          <button className="delete" aria-label={`Ø­Ø°Ù ${note.title}`} onClick={()=>void remove(note)}><Trash2 size={15}/></button>
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
    catch(cause) { setMessage(cause instanceof Error?cause.message:"ØªØ¹Ø°Ø± ØªØ­Ù…ÙŠÙ„ Ù…Ù„ÙØ§Øª Ø§Ù„Ù…Ø´Ø±ÙˆØ¹."); }
    finally { setLoading(false); }
  },[projectId]);

  useEffect(()=>{ void refreshFiles(); },[refreshFiles]);

  async function onUpload(event:React.ChangeEvent<HTMLInputElement>) {
    const selected=event.target.files?.[0];
    event.target.value="";
    if(!selected)return;
    setUploading(true);setMessage("");
    try { await uploadProjectFile(projectId,selected); await refreshFiles(); }
    catch(cause) { setMessage(cause instanceof Error?cause.message:"ØªØ¹Ø°Ø± Ø±ÙØ¹ Ø§Ù„Ù…Ù„Ù."); }
    finally { setUploading(false); }
  }
  async function onDownload(file:ProjectFile) {
    try { window.location.assign(await createProjectFileDownloadUrl(file)); }
    catch(cause) { setMessage(cause instanceof Error?cause.message:"ØªØ¹Ø°Ø± ØªÙ†Ø²ÙŠÙ„ Ø§Ù„Ù…Ù„Ù."); }
  }
  async function onDelete(file:ProjectFile) {
    if(!window.confirm(`Ø­Ø°Ù Ø§Ù„Ù…Ù„Ù Â«${file.name}Â» Ù†Ù‡Ø§Ø¦ÙŠÙ‹Ø§ØŸ`))return;
    try { await deleteProjectFile(file); await refreshFiles(); }
    catch(cause) { setMessage(cause instanceof Error?cause.message:"ØªØ¹Ø°Ø± Ø­Ø°Ù Ø§Ù„Ù…Ù„Ù."); }
  }
  const categoryLabels:Record<ProjectFile["category"],string>={
    drawing:"Ù…Ø®Ø·Ø·",document:"Ù…Ø³ØªÙ†Ø¯",image:"ØµÙˆØ±Ø©",model:"Ù†Ù…ÙˆØ°Ø¬",other:"Ù…Ù„Ù",
  };
  const formatSize=(bytes:number)=>bytes>=1048576?`${(bytes/1048576).toFixed(1)} MB`:`${Math.max(1,Math.round(bytes/1024))} KB`;

  return <section className="workspace-tab-panel project-files-panel">
    <div className="workspace-panel-head">
      <div><span className="section-kicker">DOCUMENT CONTROL</span><h3>Ù…Ø±ÙƒØ² Ù…Ù„ÙØ§Øª Ø§Ù„Ù…Ø´Ø±ÙˆØ¹</h3><p>Ø§Ø±ÙØ¹ Ø§Ù„Ù…Ø³ØªÙ†Ø¯Ø§Øª ÙˆØ§Ù„Ù…Ø®Ø·Ø·Ø§Øª ÙˆØ§Ù„Ù†Ù…Ø§Ø°Ø¬ ÙˆØ§Ø­ÙØ¸Ù‡Ø§ Ø¯Ø§Ø®Ù„ Ø§Ù„Ù…Ø´Ø±ÙˆØ¹.</p></div>
      <label className={`project-file-upload primary compact ${uploading?"disabled":""}`}>
        <Plus size={16}/>{uploading?"Ø¬Ø§Ø±Ù Ø§Ù„Ø±ÙØ¹â€¦":"Ø±ÙØ¹ Ù…Ù„Ù"}
        <input type="file" disabled={uploading} onChange={(event)=>void onUpload(event)} accept=".pdf,.dwg,.dxf,.ifc,.rvt,.nwd,.nwc,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*"/>
      </label>
    </div>
    <div className="project-files-meta"><span>PDF Â· DWG Â· IFC Â· Office Â· Images</span><em>Ø§Ù„Ø­Ø¯ Ø§Ù„Ø£Ù‚ØµÙ‰ 100 MB Ù„Ù„Ù…Ù„Ù</em></div>
    {message&&<div className="project-files-message">{message}</div>}
    {loading?<div className="project-files-loading">Ø¬Ø§Ø±Ù ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ù…Ù„ÙØ§Øªâ€¦</div>:files.length===0
      ?<div className="project-files-empty"><FileText size={34}/><h4>Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…Ù„ÙØ§Øª ÙÙŠ Ø§Ù„Ù…Ø´Ø±ÙˆØ¹</h4><p>Ø§Ø³ØªØ®Ø¯Ù… Ø²Ø± Â«Ø±ÙØ¹ Ù…Ù„ÙÂ» Ù„Ø¥Ø¶Ø§ÙØ© Ø£ÙˆÙ„ Ù…Ø³ØªÙ†Ø¯.</p></div>
      :<div className="project-files-list">{files.map(file=><article key={file.id}>
        <span className="project-file-icon"><FileText size={20}/></span>
        <div><strong>{file.name}</strong><small>{categoryLabels[file.category]} Â· {formatSize(file.file_size)} Â· {new Intl.DateTimeFormat("ar-SA",{dateStyle:"medium"}).format(new Date(file.created_at))}</small></div>
        <button onClick={()=>void onDownload(file)}>ØªÙ†Ø²ÙŠÙ„</button>
        <button className="delete" aria-label={`Ø­Ø°Ù ${file.name}`} onClick={()=>void onDelete(file)}><Trash2 size={16}/></button>
      </article>)}</div>}
  </section>;
}
function TaskModal({ state, projects, onClose, onSave }: { state:Exclude<TaskModalState,null>; projects:Project[]; onClose:()=>void; onSave:(i:TaskInput,t?:Task)=>Promise<boolean> }) { const t=state.task; const [saving,setSaving]=useState(false); async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setSaving(true);const f=new FormData(e.currentTarget);const status=String(f.get("status")) as TaskStatus;const input:TaskInput={project_id:String(f.get("project_id")),title:String(f.get("title")||"").trim(),description:nullableText(f.get("description")),status,priority:String(f.get("priority")) as PriorityLevel,progress:status==="Done"?100:clamp(Number(f.get("progress")||0)),due_date:dateValue(f.get("due_date"))};if(!await onSave(input,t??undefined))setSaving(false);} return <Modal title={state.mode==="create"?"Ø¥Ù†Ø´Ø§Ø¡ Ù…Ù‡Ù…Ø© Ø¬Ø¯ÙŠØ¯Ø©":"ØªØ¹Ø¯ÙŠÙ„ Ø§Ù„Ù…Ù‡Ù…Ø©"} kicker="TASK ENGINE" onClose={onClose}><form className="project-form" onSubmit={submit}><label className="full"><span>Ø§Ù„Ù…Ø´Ø±ÙˆØ¹ *</span><select name="project_id" defaultValue={t?.project_id||projects[0]?.id} required>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><Field name="title" label="Ø¹Ù†ÙˆØ§Ù† Ø§Ù„Ù…Ù‡Ù…Ø© *" defaultValue={t?.title} required full maxLength={160}/><Select name="status" label="Ø§Ù„Ø­Ø§Ù„Ø©" defaultValue={t?.status||"To Do"} options={taskStatusLabels}/><Select name="priority" label="Ø§Ù„Ø£ÙˆÙ„ÙˆÙŠØ©" defaultValue={t?.priority||"Medium"} options={priorityLabels}/><Field name="progress" label="Ù†Ø³Ø¨Ø© Ø§Ù„ØªÙ‚Ø¯Ù…" type="number" defaultValue={t?.progress??0} min={0} max={100}/><Field name="due_date" label="Ù…ÙˆØ¹Ø¯ Ø§Ù„Ø§Ø³ØªØ­Ù‚Ø§Ù‚" type="date" defaultValue={t?.due_date}/><label className="full"><span>Ø§Ù„ÙˆØµÙ</span><textarea name="description" rows={5} defaultValue={t?.description??""}/></label><Actions saving={saving} onClose={onClose}/></form></Modal>; }

function Modal({ title, kicker, onClose, children }: { title:string; kicker:string; onClose:()=>void; children:ReactNode }) { return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal" onMouseDown={(e)=>e.stopPropagation()}><div className="modal-head"><div><span className="section-kicker">{kicker}</span><h2>{title}</h2></div><button className="icon-button" onClick={onClose}><X size={20}/></button></div>{children}</div></div>; }
function Field({ name,label,defaultValue,type="text",required,full,min,max,maxLength }: { name:string;label:string;defaultValue?:string|number|null;type?:string;required?:boolean;full?:boolean;min?:number;max?:number;maxLength?:number }) { return <label className={full?"full":""}><span>{label}</span><input name={name} type={type} defaultValue={defaultValue??""} required={required} min={min} max={max} maxLength={maxLength}/></label>; }
function Select<T extends string>({ name,label,defaultValue,options }: { name:string;label:string;defaultValue:T;options:Record<T,string> }) { return <label><span>{label}</span><select name={name} defaultValue={defaultValue}>{Object.entries(options).map(([v,l])=><option key={v} value={v}>{String(l)}</option>)}</select></label>; }
function Actions({ saving,onClose }: { saving:boolean;onClose:()=>void }) { return <div className="form-actions full"><button type="button" onClick={onClose}>Ø¥Ù„ØºØ§Ø¡</button><button className="primary" disabled={saving}>{saving?"Ø¬Ø§Ø±Ù Ø§Ù„Ø­ÙØ¸â€¦":"Ø­ÙØ¸"}</button></div>; }

function ConfirmDelete({ title,text,onCancel,onConfirm }: { title:string;text:string;onCancel:()=>void;onConfirm:()=>void }) { return <div className="modal-backdrop"><div className="confirm-modal"><div className="warning-icon"><AlertTriangle/></div><h2>{title}</h2><p>{text}</p><div className="form-actions"><button onClick={onCancel}>Ø¥Ù„ØºØ§Ø¡</button><button className="delete-button" onClick={onConfirm}>Ø­Ø°Ù Ù†Ù‡Ø§Ø¦ÙŠ</button></div></div></div>; }
function Metric({ icon,label,value,detail,danger }: { icon:ReactNode;label:string;value:string|number;detail:string;danger?:boolean }) { return <div className={`metric-card ${danger?"danger":""}`}><span>{icon}</span><div><small>{label}</small><strong>{value}</strong><em>{detail}</em></div></div>; }
function EmptyState({ text="Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¨ÙŠØ§Ù†Ø§Øª Ø¨Ø¹Ø¯.",compact,onCreate }: { text?:string;compact?:boolean;onCreate?:()=>void }) { return <div className={`empty-state ${compact?"compact":""}`}><span><ClipboardList/></span><h3>{text}</h3>{onCreate&&<button className="primary compact" onClick={onCreate}><Plus size={16}/> Ø¥Ø¶Ø§ÙØ© Ø§Ù„Ø¢Ù†</button>}</div>; }

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
    setMessage("Ø¬Ø§Ø±Ù Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† Ø§ØªØµØ§Ù„ Ø§Ù„Ù…ØµØ§Ø¯Ù‚Ø©â€¦");
    try{
      await verifyAuthEndpoint();
      const{error}=await supabase.auth.signInWithOtp({
        email:email.trim(),
        options:{emailRedirectTo:window.location.origin}
      });
      if(error) throw error;
      setMessageTone("success");
      setMessage("ØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ø±Ø§Ø¨Ø· Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø§Ù„Ø¢Ù…Ù† Ø¥Ù„Ù‰ Ø¨Ø±ÙŠØ¯Ùƒ. ØªØ­Ù‚Ù‚ Ù…Ù† ØµÙ†Ø¯ÙˆÙ‚ Ø§Ù„ÙˆØ§Ø±Ø¯ ÙˆØ§Ù„Ø±Ø³Ø§Ø¦Ù„ ØºÙŠØ± Ø§Ù„Ù…Ø±ØºÙˆØ¨ ÙÙŠÙ‡Ø§.");
    }catch(error){
      console.error("BASOUL authentication diagnostics",{
        error,
        online:navigator.onLine,
        origin:window.location.origin,
        supabaseHost:(()=>{try{return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL||"").host}catch{return "invalid"}})()
      });
      const raw=error instanceof Error?error.message:String(error);
      setMessageTone("error");
      if(raw==="AUTH_CONFIG_MISSING") setMessage("Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Supabase ØºÙŠØ± Ù…ÙƒØªÙ…Ù„Ø© ÙÙŠ Ø¨ÙŠØ¦Ø© Ø§Ù„Ù†Ø´Ø±. Ø±Ø§Ø¬Ø¹ Ù…ØªØºÙŠØ±Ø§Øª Vercel Ø«Ù… Ø£Ø¹Ø¯ Ø§Ù„Ù†Ø´Ø±.");
      else if(raw==="BROWSER_OFFLINE") setMessage("Ø§Ù„Ø¬Ù‡Ø§Ø² ØºÙŠØ± Ù…ØªØµÙ„ Ø¨Ø§Ù„Ø¥Ù†ØªØ±Ù†Øª. ØªØ­Ù‚Ù‚ Ù…Ù† Ø§Ù„Ø§ØªØµØ§Ù„ Ø«Ù… Ø£Ø¹Ø¯ Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø©.");
      else if(error instanceof DOMException&&error.name==="AbortError") setMessage("Ø§Ù†ØªÙ‡Øª Ù…Ù‡Ù„Ø© Ø§Ù„Ø§ØªØµØ§Ù„ Ø¨Ø®Ø¯Ù…Ø© Ø§Ù„Ù…ØµØ§Ø¯Ù‚Ø©. Ø¬Ø±Ù‘Ø¨ Ø´Ø¨ÙƒØ© Ø£Ø®Ø±Ù‰ Ø£Ùˆ ØªØ­Ù‚Ù‚ Ù…Ù† Ø­Ø¸Ø± Ù†Ø·Ø§Ù‚ supabase.co.");
      else if(error instanceof TypeError||raw.toLowerCase().includes("failed to fetch")) setMessage("ØªØ¹Ø°Ø± Ø§Ù„ÙˆØµÙˆÙ„ Ø¥Ù„Ù‰ Ø®Ø¯Ù…Ø© Supabase Ù…Ù† Ù‡Ø°Ù‡ Ø§Ù„Ø´Ø¨ÙƒØ©. Ø¬Ø±Ù‘Ø¨ Ø´Ø¨ÙƒØ© Ø§Ù„Ù‡Ø§ØªÙ Ø£Ùˆ Ø§Ø³Ù…Ø­ Ù„Ù„Ù†Ø·Ø§Ù‚ *.supabase.co ÙÙŠ Ø§Ù„Ø¬Ø¯Ø§Ø± Ø§Ù„Ù†Ø§Ø±ÙŠ. [AUTH-NETWORK]");
      else if(raw.startsWith("AUTH_HEALTH_")) setMessage(`Ø®Ø¯Ù…Ø© Ø§Ù„Ù…ØµØ§Ø¯Ù‚Ø© Ø£Ø¹Ø§Ø¯Øª Ø­Ø§Ù„Ø© ØºÙŠØ± Ù…ØªÙˆÙ‚Ø¹Ø© (${raw.replace("AUTH_HEALTH_","")}). [AUTH-HEALTH]`);
      else setMessage(`${raw} [AUTH-OTP]`);
    }finally{
      setBusy(false);
    }
  }

  return <div className="auth-page"><div className="auth-card"><div className="logo-mark auth-logo"><Brain/></div><span className="section-kicker">PERSONAL OPERATING SYSTEM</span><h1>BASOUL</h1><p>Ø³Ø¬Ù‘Ù„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ù„Ù„ÙˆØµÙˆÙ„ Ø¥Ù„Ù‰ Ù…Ø´Ø§Ø±ÙŠØ¹Ùƒ ÙˆÙ…Ù‡Ø§Ù…Ùƒ.</p><form onSubmit={submit}><label><span>Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ</span><input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required autoComplete="email" inputMode="email"/></label><button className="primary" disabled={busy}>{busy?"Ø¬Ø§Ø±Ù Ø§Ù„ØªØ­Ù‚Ù‚ ÙˆØ§Ù„Ø¥Ø±Ø³Ø§Ù„â€¦":"Ø¥Ø±Ø³Ø§Ù„ Ø±Ø§Ø¨Ø· Ø§Ù„Ø¯Ø®ÙˆÙ„"}</button></form>{message&&<div className={`auth-message ${messageTone}`} role="status" aria-live="polite">{message}</div>}<small className="auth-diagnostic-note">{APP_INFO.fullLabel}</small></div></div>
}
function LoadingScreen(){return <div className="center-screen"><div className="loader"><Brain size={38}/><span>Ø¬Ø§Ø±Ù ØªØ´ØºÙŠÙ„ BASOULâ€¦</span></div></div>}

const clamp=(n:number)=>Math.max(0,Math.min(100,Number.isFinite(n)?n:0));
const nullableText=(v:FormDataEntryValue|null)=>{const s=String(v??"").trim();return s||null};
const dateValue=(v:FormDataEntryValue|null)=>String(v||"")||null;
const projectName=(projects:Project[],id:string)=>projects.find(p=>p.id===id)?.name||"Ù…Ø´Ø±ÙˆØ¹ ØºÙŠØ± Ù…ØªØ§Ø­";
const formatDate=(v:string|null)=>v?new Intl.DateTimeFormat("ar-SA",{day:"numeric",month:"short",year:"numeric"}).format(new Date(`${v}T00:00:00`)):"ØºÙŠØ± Ù…Ø­Ø¯Ø¯";
const projectStatusClass=(s:ProjectStatus)=>s.toLowerCase().replaceAll(" ","-");
const taskStatusClass=(s:TaskStatus)=>s.toLowerCase().replaceAll(" ","-");
const isOverdue=(t:Task)=>Boolean(t.status!=="Done"&&t.due_date&&t.due_date<new Date().toISOString().slice(0,10));
