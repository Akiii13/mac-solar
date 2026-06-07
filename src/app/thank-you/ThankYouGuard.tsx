"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// This component has one job: if the user didn't arrive here after completing
// the assessment, redirect them home. It checks for a "mac_submitted" flag in
// sessionStorage that your assessment form should set on successful submission.
//
// HOW TO CONNECT IT TO YOUR ASSESSMENT FORM:
// In your assessment's submit handler (wherever you call the API / server
// action after the form is complete), add this one line BEFORE redirecting:
//
//   sessionStorage.setItem("mac_submitted", "1");
//
// Then redirect to /thank-you as usual. The flag lives only for the browser
// session — it disappears when the tab is closed, so repeat visitors who
// complete the form again will pass through correctly.
//
// RACE CONDITION NOTE:
// AnalyticsTracker (in the layout) calls getSession() which is async. Even
// though its useEffect may run before ours, the .then() callback is a
// microtask that only fires after the synchronous call stack clears — meaning
// this effect's synchronous body is guaranteed to run first. We set
// "mac_guard_passed" here so AnalyticsTracker can check it in that callback
// and skip recording a view for direct-URL / bounced visitors.

export default function ThankYouGuard() {
  const router = useRouter();

  useEffect(() => {
    try {
      const submitted = sessionStorage.getItem("mac_submitted");
      if (!submitted) {
        // No submission flag — direct URL, refresh, or back-nav.
        // Do NOT set mac_guard_passed; AnalyticsTracker will see its absence
        // and skip recording a view for this non-conversion visit.
        router.replace("/");
        return;
      }
      // Valid submission: signal AnalyticsTracker to proceed with tracking.
      // Set BEFORE removing mac_submitted in case of any future ordering change.
      sessionStorage.setItem("mac_guard_passed", "1");
      // Clear the submission flag so refreshing the thank-you page redirects
      // correctly, but the current render can still track the view.
      sessionStorage.removeItem("mac_submitted");
    } catch {
      // sessionStorage unavailable (e.g. private browsing with strict
      // settings) — let the page render rather than blocking the user.
    }
  }, [router]);

  return null;
}
