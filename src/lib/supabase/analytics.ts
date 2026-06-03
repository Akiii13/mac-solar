import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client — bypasses RLS.
 * Only use in server-side API routes and server components.
 * Never import this from any client ("use client") file.
 */
export function createAnalyticsClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
