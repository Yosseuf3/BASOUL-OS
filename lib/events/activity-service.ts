import { supabase } from "@/lib/supabase";
import type { ActivityAction, ActivityModule, NotificationPriority } from "@/lib/types";
import {selectedOrganization} from '@/lib/organizations/workspace-selection';

type ActivityInput = {
  userId: string; module: ActivityModule; action: ActivityAction; title: string;
  entityId?: string | null; description?: string | null; metadata?: Record<string, unknown>;
};

type RuleResult = { priority: NotificationPriority; message: string | null } | null;

function notificationRule(input: ActivityInput): RuleResult {
  if (input.action === "deleted") return { priority: "medium", message: input.description ?? "تم حذف عنصر من النظام." };
  if (input.module === "tasks" && input.action === "completed") return { priority: "info", message: input.description ?? "اكتملت مهمة." };
  if (input.module === "finance" && input.action === "paid") return { priority: "info", message: input.description ?? "تم تسجيل دفعة." };
  if (input.module === "content" && input.action === "published") return { priority: "info", message: input.description ?? "تم نشر محتوى." };
  if (input.action === "created") return { priority: "info", message: input.description ?? null };
  return null;
}

export async function recordActivity(input: ActivityInput): Promise<string | null> {
  const organizationId=selectedOrganization(input.userId);
  if(!organizationId) return 'Organization context required';
  const { data, error } = await supabase.from("activity_events").insert({
    user_id: input.userId, organization_id:organizationId, module: input.module, action: input.action,
    entity_id: input.entityId ?? null, title: input.title, description: input.description ?? null,
    metadata: input.metadata ?? {},
  }).select("id").single();
  if (error) return error.message;

  const rule = notificationRule(input);
  if (!rule) return null;
  const { error: notificationError } = await supabase.from("notifications").insert({
    user_id: input.userId, organization_id:organizationId, activity_event_id: data.id, module: input.module,
    priority: rule.priority, title: input.title, message: rule.message,
    entity_id: input.entityId ?? null,
  });
  return notificationError?.message ?? null;
}
