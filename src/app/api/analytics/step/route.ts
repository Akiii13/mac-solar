import { NextRequest, NextResponse } from "next/server";
import { createAnalyticsClient } from "@/lib/supabase/analytics";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();

    if (!body || typeof body !== "object") {
      return new NextResponse(null, { status: 204 });
    }

    const raw = body as Record<string, unknown>;

    if (typeof raw.sessionId !== "string" || !UUID_RE.test(raw.sessionId)) {
      return new NextResponse(null, { status: 204 });
    }

    if (
      typeof raw.exitStep !== "number" ||
      !Number.isInteger(raw.exitStep) ||
      raw.exitStep < 1 ||
      raw.exitStep > 5
    ) {
      return new NextResponse(null, { status: 204 });
    }

    const supabase = createAnalyticsClient();

    // Update exit_step immediately as the user advances through the form.
    // This is fire-and-forget from the client so we don't need to return the row.
    await supabase
      .from("page_views")
      .update({ exit_step: raw.exitStep })
      .eq("session_id", raw.sessionId)
      .eq("page", "/assessment");
  } catch {
    // Swallow all errors — this endpoint is best-effort
  }

  return new NextResponse(null, { status: 204 });
}
