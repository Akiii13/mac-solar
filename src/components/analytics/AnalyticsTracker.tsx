"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const TRACKED = new Set(["/", "/assessment", "/thank-you"]);

function getSessionId(): string {
  const KEY = "mac_sid";
  try {
    const existing = sessionStorage.getItem(KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    sessionStorage.setItem(KEY, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

export default function AnalyticsTracker() {
  const pathname    = usePathname();
  const viewIdRef   = useRef<string | null>(null);
  const startRef    = useRef<number>(Date.now());
  const recordedRef = useRef(false);

  useEffect(() => {
    if (!TRACKED.has(pathname)) return;

    viewIdRef.current   = null;
    recordedRef.current = false;
    startRef.current    = Date.now();

    const sessionId = getSessionId();

    fetch("/api/analytics/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page: pathname, sessionId }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { id: string } | null) => {
        if (d?.id) viewIdRef.current = d.id;
      })
      .catch(() => {});

    const recordExit = () => {
      if (recordedRef.current || !viewIdRef.current) return;
      recordedRef.current = true;
      const durationSec = Math.round((Date.now() - startRef.current) / 1000);
      const payload = JSON.stringify({ id: viewIdRef.current, durationSec });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/analytics/exit",
          new Blob([payload], { type: "application/json" })
        );
      } else {
        fetch("/api/analytics/exit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    };

    window.addEventListener("beforeunload", recordExit);
    return () => {
      window.removeEventListener("beforeunload", recordExit);
      recordExit(); // fires on SPA navigation (pathname change)
    };
  }, [pathname]);

  return null;
}
