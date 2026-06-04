import { NextRequest, NextResponse } from "next/server";
import { createAnalyticsClient } from "@/lib/supabase/analytics";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();

    if (
      !body ||
      typeof body !== "object" ||
      typeof (body as Record<string, unknown>).id !== "string" ||
      typeof (body as Record<string, unknown>).durationSec !== "number"
    ) {
      return new NextResponse(null, { status: 204 });
    }

    const raw = body as Record<string, unknown>;
    const { id, durationSec } = raw as { id: string; durationSec: number };
    const exitStep = raw.exitStep !== undefined ? (raw.exitStep as number) : undefined;

    if (
      !UUID_RE.test(id) ||
      !Number.isInteger(durationSec) ||
      durationSec < 0 ||
      durationSec > 86400
    ) {
      return new NextResponse(null, { status: 204 });
    }

    if (
      exitStep !== undefined &&
      (!Number.isInteger(exitStep) || exitStep < 1 || exitStep > 5)
    ) {
      return new NextResponse(null, { status: 204 });
    }

    const updateData: Record<string, unknown> = { duration_sec: durationSec };
    if (exitStep !== undefined) updateData.exit_step = exitStep;

    const supabase = createAnalyticsClient();
    // .is("duration_sec", null) makes this idempotent
    await supabase
      .from("page_views")
      .update(updateData)
      .eq("id", id)
      .is("duration_sec", null);
  } catch {
    // Intentionally swallow — sendBeacon ignores the response body
  }

  return new NextResponse(null, { status: 204 });
}
