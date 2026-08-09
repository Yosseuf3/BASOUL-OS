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
import { AdministrationView } from "@/features/administration/administration-view";
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

type View = "dashboard" | "projects" | "tasks" | "clients" | "content" | "knowledge" | "finance" | "activity" | "notifications" | "architecture" | "administration";
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
…19102 tokens truncated…ectNote(note);await refresh(); }
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
      console.error("YOSSEUF OS authentication diagnostics",{
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

  return <div className="auth-page"><div className="auth-card"><div className="logo-mark auth-logo"><Brain/></div><span className="section-kicker">PERSONAL OPERATING SYSTEM</span><h1>YOSSEUF OS</h1><p>Ø³Ø¬Ù‘Ù„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ù„Ù„ÙˆØµÙˆÙ„ Ø¥Ù„Ù‰ Ù…Ø´Ø§Ø±ÙŠØ¹Ùƒ ÙˆÙ…Ù‡Ø§Ù…Ùƒ.</p><form onSubmit={submit}><label><span>Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ</span><input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required autoComplete="email" inputMode="email"/></label><button className="primary" disabled={busy}>{busy?"Ø¬Ø§Ø±Ù Ø§Ù„ØªØ­Ù‚Ù‚ ÙˆØ§Ù„Ø¥Ø±Ø³Ø§Ù„â€¦":"Ø¥Ø±Ø³Ø§Ù„ Ø±Ø§Ø¨Ø· Ø§Ù„Ø¯Ø®ÙˆÙ„"}</button></form>{message&&<div className={`auth-message ${messageTone}`} role="status" aria-live="polite">{message}</div>}<small className="auth-diagnostic-note">{APP_INFO.fullLabel}</small></div></div>
}
function LoadingScreen(){return <div className="center-screen"><div className="loader"><Brain size={38}/><span>Ø¬Ø§Ø±Ù ØªØ´ØºÙŠÙ„ YOSSEUF OSâ€¦</span></div></div>}

const clamp=(n:number)=>Math.max(0,Math.min(100,Number.isFinite(n)?n:0));
const nullableText=(v:FormDataEntryValue|null)=>{const s=String(v??"").trim();return s||null};
const dateValue=(v:FormDataEntryValue|null)=>String(v||"")||null;
const projectName=(projects:Project[],id:string)=>projects.find(p=>p.id===id)?.name||"Ù…Ø´Ø±ÙˆØ¹ ØºÙŠØ± Ù…ØªØ§Ø­";
const formatDate=(v:string|null)=>v?new Intl.DateTimeFormat("ar-SA",{day:"numeric",month:"short",year:"numeric"}).format(new Date(`${v}T00:00:00`)):"ØºÙŠØ± Ù…Ø­Ø¯Ø¯";
const projectStatusClass=(s:ProjectStatus)=>s.toLowerCase().replaceAll(" ","-");
const taskStatusClass=(s:TaskStatus)=>s.toLowerCase().replaceAll(" ","-");
const isOverdue=(t:Task)=>Boolean(t.status!=="Done"&&t.due_date&&t.due_date<new Date().toISOString().slice(0,10));

