import type { SupabaseClient } from "@supabase/supabase-js";
import { platformModule, platformResource, type PlatformModuleId } from "@yosseuf/platform";

export async function listPlatformModuleRows(input: {
  database: SupabaseClient;
  moduleId: PlatformModuleId;
  organizationId: string;
  limit?: number;
}) {
  const definition = platformModule(input.moduleId);
  const resource = platformResource(input.moduleId);
  if (!resource) throw new Error(`${definition.label} is a gateway, not a business resource.`);
  const limit = Math.min(Math.max(input.limit ?? 100, 1), 200);
  return input.database.from(resource).select("*").eq("organization_id", input.organizationId).order("updated_at", { ascending: false }).limit(limit);
}
