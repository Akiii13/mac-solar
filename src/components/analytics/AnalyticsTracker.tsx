"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const TRACKED = new Set(["/", "/assessment", "/thank-you"]);

function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback for iOS < 15.4
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
      recordExit();
    };
  }, [pathname]);

  return null;
}
