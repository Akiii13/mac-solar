"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Single Supabase client for the entire app lifetime — created once at module
// level. Previously, createClient() was called inside useEffect, which meant
// a new browser client (and new WebSocket connection) was created on every
// page navigation.
const supabase = createClient();

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

function sendExit(body: string) {
  // Try sendBeacon first. It returns false if the browser can't queue the
  // request (e.g. data limit exceeded or page already torn down on Vercel).
  // Fall back to keepalive fetch so the request still gets through.
  let queued = false;
  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    queued = navigator.sendBeacon(
      "/api/analytics/exit",
      new Blob([body], { type: "application/json" })
    );
  }
  if (!queued) {
    fetch("/api/analytics/exit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
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

    // getSession() reads from localStorage/cookies — no network round-trip.
    // Skip tracking for logged-in admin users so they don't pollute the data.
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
      if (!viewIdRef.current && !sessionIdRef.current) return;
      recordedRef.current = true;

      const durationSec = Math.round((Date.now() - startRef.current) / 1000);
      const exitStep    = getExitStep(pathname);

      const payload: Record<string, unknown> = { durationSec };
      if (exitStep !== undefined) payload.exitStep = exitStep;

      if (viewIdRef.current) {
        // Fast path: row ID is known.
        payload.id = viewIdRef.current;
      } else {
        // Fallback: server will look up by sessionId + page.
        payload.sessionId = sessionIdRef.current;
        payload.page      = pathname;
      }

      sendExit(JSON.stringify(payload));
    };

    // beforeunload  – standard tab/window close
    // pagehide      – iOS Safari + Bfcache scenarios where beforeunload
    //                 may not fire reliably, especially behind Vercel's CDN
    window.addEventListener("beforeunload", recordExit);
    window.addEventListener("pagehide", recordExit);

    return () => {
      window.removeEventListener("beforeunload", recordExit);
      window.removeEventListener("pagehide", recordExit);
      recordExit(); // client-side navigation cleanup
    };
  }, [pathname]);

  return null;
}
