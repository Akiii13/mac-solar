"use server";

import { createAnalyticsClient } from "@/lib/supabase/analytics";
import type { ActivityActionType, ActivityEntry } from "@/lib/types";

/**
 * Write one row to admin_activity_log.
 * Best-effort — failures are swallowed so they never block the main action.
 */
export async function logActivity(
  action_type: ActivityActionType,
  target_email: string | null,
  details: string | null,
  assessment_id?: string | null
): Promise<void> {
  try {
    const supabase = createAnalyticsClient();
    await supabase.from("admin_activity_log").insert({
      action_type,
      target_email: target_email ?? null,
      details:      details      ?? null,
      assessment_id: assessment_id ?? null,
    });
  } catch {
    // Intentionally swallowed — logging should never break the UI action
  }
}

/**
 * Fetch the most recent activity entries (newest first).
 */
export async function getActivityLog(limit = 100): Promise<ActivityEntry[]> {
  try {
    const supabase = createAnalyticsClient();
    const { data } = await supabase
      .from("admin_activity_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data ?? []) as ActivityEntry[];
  } catch {
    return [];
  }
}
