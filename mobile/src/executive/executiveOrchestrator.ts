import { buildExecutiveSnapshot, type ExecutiveSnapshot } from "../decision/executive";
import type { MobileWorkspaceData } from "../types/domain";

export type MobileExecutiveReport = ExecutiveSnapshot & {
  generatedAt: string;
  engine: "ExecutiveOrchestrator";
};

export class MobileExecutiveOrchestrator {
  analyze(data: MobileWorkspaceData): MobileExecutiveReport {
    return {
      ...buildExecutiveSnapshot(data),
      generatedAt: new Date().toISOString(),
      engine: "ExecutiveOrchestrator",
    };
  }
}

export const mobileExecutiveOrchestrator = new MobileExecutiveOrchestrator();
