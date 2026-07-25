import type { WorkspaceDefinition, WorkspaceId } from "@/packages/types/src";

export const WORKSPACES: WorkspaceDefinition[] = [
  { id: "executive", label: "مساحة الإدارة", shortLabel: "الإدارة", description: "القرارات، الصحة، والمؤشرات", enabled: true },
  { id: "operations", label: "مساحة العمليات", shortLabel: "العمليات", description: "المشاريع، المهام، والعملاء", enabled: true },
  { id: "engineering", label: "مساحة الهندسة", shortLabel: "الهندسة", description: "الرسومات والموقع — قريبًا", enabled: false },
  { id: "knowledge", label: "مساحة المعرفة", shortLabel: "المعرفة", description: "المراجع، القوالب، والخبرة", enabled: true },
];

export const DEFAULT_WORKSPACE: WorkspaceId = "executive";
