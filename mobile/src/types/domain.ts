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

export type MobileWorkspaceData = {
  projects: Project[];
  tasks: Task[];
  notifications: Notification[];
};
