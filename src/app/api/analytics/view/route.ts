import { NextRequest, NextResponse } from "next/server";
import { createAnalyticsClient } from "@/lib/supabase/analytics";

const ALLOWED_PAGES = new Set(["/", "/assessment", "/thank-you"]);
// Matches any UUID format (not v4-specific)
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();

    if (
      !body ||
      typeof body !== "object" ||
      typeof (body as Record<string, unknown>).page !== "string" ||
      typeof (body as Record<string, unknown>).sessionId !== "string"
    ) {
      console.error("[analytics/view] Bad request body:", body);
      return NextResponse.json({ error: "Bad request" }, { status: 400 });
    }

    const { page, sessionId } = body as { page: string; sessionId: string };

    if (!ALLOWED_PAGES.has(page) || !UUID_RE.test(sessionId)) {
      console.error("[analytics/view] Invalid parameters — page:", page, "sessionId:", sessionId);
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const supabase = createAnalyticsClient();
    const { data, error } = await supabase
      .from("page_views")
      .insert({ page, session_id: sessionId })
      .select("id")
      .single();

    if (error) {
      console.error("[analytics/view] Insert failed:", error.message);
      return NextResponse.json({ error: "Insert failed" }, { status: 500 });
    }

    return NextResponse.json({ id: data.id });
  } catch (err) {
    console.error("[analytics/view] Caught error:", err);
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
