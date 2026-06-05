import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { getAnalytics } from "@/lib/analytics";
import { getActivityLog } from "@/lib/activity";
import type { Assessment } from "@/lib/types";

export const revalidate = 0;

export default async function AdminPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const [
    { data: assessments, error },
    { data: blockedRows },
    analytics,
    activityLog,
  ] = await Promise.all([
    supabase.from("assessments").select("*").order("created_at", { ascending: false }),
    supabase.from("blocked_emails").select("email"),
    getAnalytics(),
    getActivityLog(),
  ]);

  if (error) throw new Error(error.message);

  return (
    <AdminDashboard
      userEmail={user.email!}
      assessments={(assessments ?? []) as Assessment[]}
      blockedEmails={(blockedRows ?? []).map((r) => r.email as string)}
      analytics={analytics}
      activityLog={activityLog}
    />
  );
}
