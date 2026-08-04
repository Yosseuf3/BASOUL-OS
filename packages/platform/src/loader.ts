import { PLATFORM_REGISTRY, type PlatformModuleDefinition, type PlatformModuleId } from "./registry";

export type ModuleLoaderContext = { capabilities: ReadonlySet<string> };

export function loadPlatformModules(context: ModuleLoaderContext): PlatformModuleDefinition[] {
  return PLATFORM_REGISTRY.filter((module) => context.capabilities.has(module.capability));
}

export function canLoadPlatformModule(id: PlatformModuleId, context: ModuleLoaderContext) {
  return loadPlatformModules(context).some((module) => module.id === id);
}
