export type ProjectStatus = "Planning" | "Active" | "On Hold" | "Completed";
export type ProjectType = "Villa" | "Residential Building" | "Commercial" | "Office" | "Interior" | "Other";
export type DesignPhase = "Concept" | "Schematic" | "Design Development" | "Construction Documents" | "Site Supervision" | "Handover";
export type PriorityLevel = "Low" | "Medium" | "High" | "Critical";
export type TaskStatus = "To Do" | "In Progress" | "Review" | "Done";
export type ClientStatus = "Lead" | "Active" | "Inactive" | "Completed";

export type Project = {
  id: string; user_id: string; name: string; status: ProjectStatus; priority: PriorityLevel;
  progress: number; client_name: string | null; client_id: string | null; area: string | null;
  project_number: string | null; project_type: ProjectType | null; location: string | null; description: string | null;
  budget: number | null; currency: string; design_phase: DesignPhase | null; color: string | null; icon: string | null;
  start_date: string | null; due_date: string | null; notes: string | null;
  created_at: string; updated_at: string;
};
export type ProjectInput = Omit<Project, "id" | "user_id" | "created_at" | "updated_at">;

export type Task = {
  id: string; user_id: string; project_id: string; title: string; description: string | null;
  status: TaskStatus; priority: PriorityLevel; progress: number; due_date: string | null;
  created_at: string; updated_at: string;
};
export type TaskInput = Omit<Task, "id" | "user_id" | "created_at" | "updated_at">;

export type Client = {
  id: string; user_id: string; name: string; company: string | null; status: ClientStatus;
  email: string | null; phone: string | null; source: string | null; next_follow_up: string | null;
  notes: string | null; created_at: string; updated_at: string;
};
export type ClientInput = Omit<Client, "id" | "user_id" | "created_at" | "updated_at">;

export type ContentStatus = "Idea" | "Draft" | "Recording" | "Editing" | "Scheduled" | "Published";
export type ContentPlatform = "TikTok" | "Instagram" | "YouTube" | "Facebook" | "LinkedIn" | "X";

export type ContentItem = {
  id: string; user_id: string; project_id: string | null; client_id: string | null;
  title: string; hook: string | null; script: string | null; cta: string | null;
  hashtags: string | null; platform: ContentPlatform; status: ContentStatus;
  publish_date: string | null; notes: string | null; created_at: string; updated_at: string;
};
export type ContentInput = Omit<ContentItem, "id" | "user_id" | "created_at" | "updated_at">;


export type KnowledgeType = "Note" | "Idea" | "Reference" | "Template";
export type KnowledgeItem = {
  id: string; user_id: string; title: string; content: string | null; type: KnowledgeType;
  tags: string | null; is_favorite: boolean; created_at: string; updated_at: string;
};
export type KnowledgeInput = Omit<KnowledgeItem, "id" | "user_id" | "created_at" | "updated_at">;


export type FinanceTransactionType = "Income" | "Expense";
export type FinanceStatus = "Pending" | "Paid" | "Cancelled";
export type FinanceTransaction = {
  id: string; user_id: string; project_id: string | null; client_id: string | null;
  type: FinanceTransactionType; category: string; description: string; amount: number; currency: string;
  status: FinanceStatus; transaction_date: string; notes: string | null; created_at: string; updated_at: string;
};
export type FinanceTransactionInput = Omit<FinanceTransaction, "id" | "user_id" | "created_at" | "updated_at">;


export type ActivityModule = "projects" | "tasks" | "clients" | "content" | "knowledge" | "finance" | "system";
export type ActivityAction = "created" | "updated" | "deleted" | "completed" | "paid" | "published";
export type ActivityEvent = {
  id: string; user_id: string; module: ActivityModule; action: ActivityAction;
  entity_id: string | null; title: string; description: string | null; metadata: Record<string, unknown>;
  created_at: string;
};

export type NotificationPriority = "info" | "medium" | "high";
export type Notification = {
  id: string; user_id: string; activity_event_id: string | null; module: ActivityModule;
  priority: NotificationPriority; title: string; message: string | null; entity_id: string | null;
  is_read: boolean; read_at: string | null; created_at: string;
};
