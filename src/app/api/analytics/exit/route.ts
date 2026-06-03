import { NextRequest, NextResponse } from "next/server";
import { createAnalyticsClient } from "@/lib/supabase/analytics";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

    const { id, durationSec } = body as { id: string; durationSec: number };

    if (
      !UUID_RE.test(id) ||
      !Number.isInteger(durationSec) ||
      durationSec < 0 ||
      durationSec > 86400
    ) {
      return new NextResponse(null, { status: 204 });
    }

    const supabase = createAnalyticsClient();
    // .is("duration_sec", null) makes this idempotent — won't overwrite if already set
    await supabase
      .from("page_views")
      .update({ duration_sec: durationSec })
      .eq("id", id)
      .is("duration_sec", null);
  } catch {
    // Intentionally swallow — sendBeacon ignores the response body
  }

  return new NextResponse(null, { status: 204 });
}
