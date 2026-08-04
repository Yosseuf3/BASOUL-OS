import { PLATFORM_REGISTRY, type PlatformModuleId } from "./registry";

export type PlatformNavigationItem = { id: PlatformModuleId; label: string; href: string; capability: string };

export const PLATFORM_NAVIGATION: readonly PlatformNavigationItem[] = PLATFORM_REGISTRY
  .filter((definition) => definition.status === "active")
  .map((definition) => ({ id: definition.id, label: definition.label, href: definition.route, capability: definition.capability }));

export function navigationFor(capabilities: ReadonlySet<string>) {
  return PLATFORM_NAVIGATION.filter((item) => capabilities.has(item.capability));
}
