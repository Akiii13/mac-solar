import { createAnalyticsClient } from "@/lib/supabase/analytics";
import type { AnalyticsData, PageStat } from "@/lib/types";

const TRACKED_PAGES = ["/", "/assessment", "/thank-you"] as const;

// Thresholds for "Friction" classification
const FRICTION_MIN_DURATION_SEC = 120; // 2 minutes avg time on page
const FRICTION_MIN_EXIT_RATE = 0.4;    // 40% of sessions end on this page

const EMPTY: AnalyticsData = {
  todayVisits: 0,
  monthVisits: 0,
  avgSessionDuration: null,
  momVisitChange: null,
  momDurationChange: null,
  pageStats: [],
};

export async function getAnalytics(): Promise<AnalyticsData> {
  try {
    const supabase = createAnalyticsClient();
    const now = new Date();

    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const [{ data: thisMonthRows }, { data: lastMonthRows }] = await Promise.all([
      supabase
        .from("page_views")
        .select("id, page, session_id, duration_sec, created_at")
        .gte("created_at", thisMonthStart),
      supabase
        .from("page_views")
        .select("session_id, duration_sec")
        .gte("created_at", lastMonthStart)
        .lt("created_at", thisMonthStart),
    ]);

    const rows = thisMonthRows ?? [];
    const prevRows = lastMonthRows ?? [];

    // ── Current month stats ────────────────────────────────────────────────
    const todayVisits = new Set(
      rows.filter((r) => r.created_at >= todayStart).map((r) => r.session_id)
    ).size;

    const monthVisits = new Set(rows.map((r) => r.session_id)).size;

    const rowsWithDur = rows.filter((r) => r.duration_sec != null);
    const avgSessionDuration =
      rowsWithDur.length > 0
        ? Math.round(
            rowsWithDur.reduce((sum, r) => sum + (r.duration_sec as number), 0) /
              rowsWithDur.length
          )
        : null;

    // ── Previous month stats (for MoM) ────────────────────────────────────
    const prevMonthVisits = new Set(prevRows.map((r) => r.session_id)).size;

    const prevRowsWithDur = prevRows.filter((r) => r.duration_sec != null);
    const prevAvgDuration =
      prevRowsWithDur.length > 0
        ? prevRowsWithDur.reduce((sum, r) => sum + (r.duration_sec as number), 0) /
          prevRowsWithDur.length
        : null;

    const momVisitChange =
      prevMonthVisits > 0
        ? Math.round(((monthVisits - prevMonthVisits) / prevMonthVisits) * 100)
        : null;

    const momDurationChange =
      prevAvgDuration != null && avgSessionDuration != null
        ? Math.round(((avgSessionDuration - prevAvgDuration) / prevAvgDuration) * 100)
        : null;

    // ── Exit detection: last page per session ─────────────────────────────
    // A session "exited" from the last page it visited.
    const sessionLastPage = new Map<string, { page: string; created_at: string }>();
    for (const row of rows) {
      const existing = sessionLastPage.get(row.session_id);
      if (!existing || row.created_at > existing.created_at) {
        sessionLastPage.set(row.session_id, {
          page: row.page,
          created_at: row.created_at,
        });
      }
    }

    const exitCounts = new Map<string, number>();
    for (const { page } of sessionLastPage.values()) {
      exitCounts.set(page, (exitCounts.get(page) ?? 0) + 1);
    }

    // ── Per-page stats ────────────────────────────────────────────────────
    const pageStats: PageStat[] = TRACKED_PAGES.flatMap((page) => {
      const pageRows = rows.filter((r) => r.page === page);
      if (pageRows.length === 0) return [];

      const durRows = pageRows.filter((r) => r.duration_sec != null);
      const avgDuration =
        durRows.length > 0
          ? Math.round(
              durRows.reduce((sum, r) => sum + (r.duration_sec as number), 0) /
                durRows.length
            )
          : null;

      const exitCount = exitCounts.get(page) ?? 0;
      const exitRate = exitCount / pageRows.length;
      const isFriction =
        avgDuration != null &&
        avgDuration > FRICTION_MIN_DURATION_SEC &&
        exitRate > FRICTION_MIN_EXIT_RATE;

      return [
        {
          page,
          visits: pageRows.length,
          avgDuration,
          exitCount,
          exitRate,
          isFriction,
        },
      ];
    }).sort((a, b) => b.visits - a.visits);

    return {
      todayVisits,
      monthVisits,
      avgSessionDuration,
      momVisitChange,
      momDurationChange,
      pageStats,
    };
  } catch {
    return EMPTY;
  }
}
