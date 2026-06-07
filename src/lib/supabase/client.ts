import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// Module-level singleton — ensures only one Supabase browser client (and one
// WebSocket connection) exists for the entire lifetime of the app. Without
// this, every createClient() call returns a brand-new instance.
let _client: SupabaseClient | undefined;

export function createClient() {
  if (_client) return _client;
  _client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return _client;
}
