export type ProjectStatus = "Planning" | "Active" | "On Hold" | "Completed";
export type PriorityLevel = "Low" | "Medium" | "High" | "Critical";

export type Project = {
  id: string;
  name: string;
  status: ProjectStatus;
  priority: PriorityLevel;
  progress: number;
  client_name: string | null;
  project_number: string | null;
  location: string | null;
  design_phase: string | null;
  due_date: string | null;
  updated_at: string;
};

export type Task = {
  id: string;
  project_id: string;
  title: string;
  status: "To Do" | "In Progress" | "Review" | "Done";
  priority: PriorityLevel;
  progress: number;
  due_date: string | null;
};

export type Notification = {
  id: string;
  title: string;
  message: string | null;
  priority: "info" | "medium" | "high";
  is_read: boolean;
  created_at: string;
};

export type ArchitecturalDrawing = {
  id: string;
  project_id: string;
  name: string;
  revision: string;
  format: "pdf" | "image";
  status: "uploaded" | "reviewed" | "archived";
  page_count: number | null;
  created_at: string;
};

export type ArchitecturalFinding = {
  id: string;
  review_id: string;
  drawing_id: string;
  code: string;
  title: string;
  description: string;
  recommendation: string;
  severity: "info" | "opportunity" | "warning" | "critical";
  status: "open" | "accepted" | "rejected" | "resolved" | "converted_to_task";
  confidence_score: number;
  evidence?: Array<{ source: string; observation: string; value?: string | number | boolean | null }>;
  analysis_run_id?: string | null;
  task_id: string | null;
};

export type ArchitecturalReview = {
  id: string;
  drawing_id: string;
  project_id: string;
  status: "draft" | "ready" | "completed";
  plan_health: number;
  created_at: string;
  architectural_review_findings: ArchitecturalFinding[];
};

export type MobileWorkspaceData = {
  projects: Project[];
  tasks: Task[];
  notifications: Notification[];
  drawings: ArchitecturalDrawing[];
  reviews: ArchitecturalReview[];
};
