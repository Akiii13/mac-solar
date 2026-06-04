"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const TRACKED = new Set(["/", "/assessment", "/thank-you"]);

const ASSESSMENT_STEP_KEY = "mac_assessment_step";

function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getSessionId(): string {
  const KEY = "mac_sid";
  try {
    const existing = sessionStorage.getItem(KEY);
    if (existing) return existing;
    const id = generateUUID();
    sessionStorage.setItem(KEY, id);
    return id;
  } catch {
    return generateUUID();
  }
}

function getExitStep(pathname: string): number | undefined {
  if (pathname !== "/assessment") return undefined;
  try {
    const stored = sessionStorage.getItem(ASSESSMENT_STEP_KEY);
    if (!stored) return undefined;
    const n = parseInt(stored, 10);
    return n >= 1 && n <= 5 ? n : undefined;
  } catch {
    return undefined;
  }
}

export default function AnalyticsTracker() {
  const pathname     = usePathname();
  const viewIdRef    = useRef<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const startRef     = useRef<number>(Date.now());
  const recordedRef  = useRef(false);

  useEffect(() => {
    if (!TRACKED.has(pathname)) return;

    viewIdRef.current   = null;
    recordedRef.current = false;
    startRef.current    = Date.now();

    // Set synchronously so recordExit always has a fallback, even if the tab
    // closes before getSession() resolves.
    sessionIdRef.current = getSessionId();

    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) return;

      fetch("/api/analytics/view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page: pathname, sessionId: sessionIdRef.current }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((d: { id: string } | null) => {
          if (d?.id) viewIdRef.current = d.id;
        })
        .catch(() => {});
    });

    const recordExit = () => {
      if (recordedRef.current) return;
      // Need at least a sessionId to send anything useful
      if (!viewIdRef.current && !sessionIdRef.current) return;
      recordedRef.current = true;

      const durationSec = Math.round((Date.now() - startRef.current) / 1000);
      const exitStep    = getExitStep(pathname);

      const payload: Record<string, unknown> = { durationSec };
      if (exitStep !== undefined) payload.exitStep = exitStep;

      if (viewIdRef.current) {
        // Fast path: row ID is known
        payload.id = viewIdRef.current;
      } else {
        // Fallback: server will look up by sessionId + page
        payload.sessionId = sessionIdRef.current;
        payload.page      = pathname;
      }

      const body = JSON.stringify(payload);
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/analytics/exit",
          new Blob([body], { type: "application/json" })
        );
      } else {
        fetch("/api/analytics/exit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        }).catch(() => {});
      }
    };

    window.addEventListener("beforeunload", recordExit);
    return () => {
      window.removeEventListener("beforeunload", recordExit);
      recordExit();
    };
  }, [pathname]);

  return null;
}
