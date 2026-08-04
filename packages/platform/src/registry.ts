export type PlatformModuleId =
  | "crm"
  | "projects"
  | "tasks"
  | "finance"
  | "knowledge"
  | "documents"
  | "notifications"
  | "ai-core"
  | "digital-human";

export type PlatformModuleDefinition = {
  id: PlatformModuleId;
  label: string;
  route: string;
  capability: string;
  status: "active" | "gateway";
  legacyResource?: string;
};

export const PLATFORM_RESOURCE_MAP = {
  crm: "clients",
  projects: "projects",
  tasks: "tasks",
  finance: "finance_transactions",
  knowledge: "knowledge_items",
  documents: "content_items",
  notifications: "notifications",
} as const satisfies Partial<Record<PlatformModuleId, string>>;

export const PLATFORM_REGISTRY: readonly PlatformModuleDefinition[] = [
  { id: "crm", label: "CRM", route: "/?view=clients", capability: "crm.read", status: "active", legacyResource: "clients" },
  { id: "projects", label: "Projects", route: "/?view=projects", capability: "projects.read", status: "active", legacyResource: "projects" },
  { id: "tasks", label: "Tasks", route: "/?view=tasks", capability: "tasks.read", status: "active", legacyResource: "tasks" },
  { id: "finance", label: "Finance", route: "/?view=finance", capability: "finance.read", status: "active", legacyResource: "finance_transactions" },
  { id: "knowledge", label: "Knowledge", route: "/?view=knowledge", capability: "knowledge.read", status: "active", legacyResource: "knowledge_items" },
  { id: "documents", label: "Documents", route: "/?view=content", capability: "documents.read", status: "active", legacyResource: "content_items" },
  { id: "notifications", label: "Notifications", route: "/?view=notifications", capability: "notifications.read", status: "active", legacyResource: "notifications" },
  { id: "ai-core", label: "AI Core", route: "/api/platform/gateways/ai-core", capability: "ai.invoke", status: "gateway" },
  { id: "digital-human", label: "Digital Human", route: "/api/platform/gateways/digital-human", capability: "digital-human.invoke", status: "gateway" },
] as const;

export function platformModule(id: PlatformModuleId) {
  const definition = PLATFORM_REGISTRY.find((candidate) => candidate.id === id);
  if (!definition) throw new Error(`Unknown platform module: ${id}`);
  return definition;
}

export function isPlatformModuleId(value: string): value is PlatformModuleId {
  return PLATFORM_REGISTRY.some((definition) => definition.id === value);
}

export function platformResource(id: PlatformModuleId) {
  return PLATFORM_RESOURCE_MAP[id as keyof typeof PLATFORM_RESOURCE_MAP];
}
