import { NextRequest, NextResponse } from "next/server";
import { createAnalyticsClient } from "@/lib/supabase/analytics";

const ALLOWED_PAGES = new Set(["/", "/assessment", "/thank-you"]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();

    if (!body || typeof body !== "object") {
      return new NextResponse(null, { status: 204 });
    }

    const raw = body as Record<string, unknown>;

    const durationSec = raw.durationSec;
    if (
      typeof durationSec !== "number" ||
      !Number.isInteger(durationSec) ||
      durationSec < 0 ||
      durationSec > 86400
    ) {
      return new NextResponse(null, { status: 204 });
    }

    const exitStep = raw.exitStep !== undefined ? (raw.exitStep as number) : undefined;
    if (
      exitStep !== undefined &&
      (!Number.isInteger(exitStep) || exitStep < 1 || exitStep > 5)
    ) {
      return new NextResponse(null, { status: 204 });
    }

    const updateData: Record<string, unknown> = { duration_sec: durationSec };
    if (exitStep !== undefined) updateData.exit_step = exitStep;

    const supabase = createAnalyticsClient();

    if (typeof raw.id === "string" && UUID_RE.test(raw.id)) {
      // Fast path: client received the row ID before the tab closed
      await supabase
        .from("page_views")
        .update(updateData)
        .eq("id", raw.id)
        .is("duration_sec", null);
    } else if (
      typeof raw.sessionId === "string" &&
      UUID_RE.test(raw.sessionId) &&
      typeof raw.page === "string" &&
      ALLOWED_PAGES.has(raw.page)
    ) {
      // Fallback: tab closed before the view response came back;
      // look up the row by sessionId + page instead
      await supabase
        .from("page_views")
        .update(updateData)
        .eq("session_id", raw.sessionId)
        .eq("page", raw.page)
        .is("duration_sec", null);
    }
    // else: nothing identifiable — silently ignore
  } catch {
    // sendBeacon ignores the response body; swallow all errors
  }

  return new NextResponse(null, { status: 204 });
}
