import type { Metadata } from "next";
import "./globals.css";
import AnalyticsTracker from "@/components/analytics/AnalyticsTracker";

// ─── IMPORTANT ──────────────────────────────────────────────────────────────
// Replace "https://yourdomain.com" with your real production URL.
// Add a 1200×630 image at /public/og-image.jpg for the social preview image.
// ────────────────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "MAC Solar | Free Energy Assessment",
  description: "Get a free solar panel assessment for your home. MAC Solar Installation Services — Leyte's trusted solar energy partner. Serving Region 8, Eastern Visayas.",
  keywords: "solar panels, solar energy, Leyte, Eastern Visayas, Region 8, Philippines, installation",

  // Controls how your page looks when shared on Facebook, Messenger, and Viber.
  openGraph: {
    title: "MAC Solar | Free Energy Assessment",
    description: "Get a free solar panel assessment for your home. MAC Solar Installation Services — Leyte's trusted solar energy partner. Serving Region 8, Eastern Visayas.",
    url: "https://mac-solar.vercel.app",
    siteName: "MAC Solar",
    locale: "en_PH",
    type: "website",
    images: [
      {
        url: "https://mac-solar.vercel.app/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "MAC Solar Installation Services — Leyte's trusted solar energy partner. Serving Region 8, Eastern Visayas.",
      },
    ],
  },

  // Controls how your page looks when shared on Twitter/X.
  twitter: {
    card: "summary_large_image",
    title: "MAC Solar | Free Energy Assessment",
    description: "Get a free solar panel assessment for your home. MAC Solar Installation Services — Leyte's trusted solar energy partner. Serving Region 8, Eastern Visayas.",
    images: ["https://mac-solar.vercel.app/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-body antialiased">
        <AnalyticsTracker />
        {children}
      </body>
    </html>
  );
}
