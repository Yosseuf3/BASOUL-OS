export type WorkspaceId = "executive" | "operations" | "engineering" | "knowledge";
export type WorkspaceDefinition = {
  id: WorkspaceId;
  label: string;
  shortLabel: string;
  description: string;
  enabled: boolean;
};

export type QuickCreateTarget = "project" | "task" | "client" | "finance" | "knowledge" | "content";
