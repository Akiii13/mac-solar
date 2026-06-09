import type { Metadata } from "next";
import "./globals.css";
import AnalyticsTracker from "@/components/analytics/AnalyticsTracker";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://macsolar.vercel.app"
  ),
  title: "MAC Solar | Free Energy Assessment",
  description:
    "Get a free solar panel assessment for your home. MAC Solar Installation Services — Leyte's trusted solar energy partner. Serving Region 8, Eastern Visayas.",
  keywords:
    "solar panels, solar energy, Leyte, Eastern Visayas, Region 8, Philippines, installation",
  openGraph: {
    title: "MAC Solar | Free Energy Assessment",
    description:
      "Get a free solar panel assessment for your home. MAC Solar Installation Services — Leyte's trusted solar energy partner. Serving Region 8, Eastern Visayas.",
    url: "/",
    siteName: "MAC Solar",
    locale: "en_PH",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "MAC Solar Installation Services — Leyte's trusted solar energy partner. Serving Region 8, Eastern Visayas.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MAC Solar | Free Energy Assessment",
    description:
      "Get a free solar panel assessment for your home. MAC Solar Installation Services — Leyte's trusted solar energy partner. Serving Region 8, Eastern Visayas.",
    images: ["/og-image.jpg"],
  },
  other: {
    // Required by Facebook/Messenger for full link preview support.
    // Create a free app at https://developers.facebook.com if you don't have one.
    "fb:app_id": process.env.NEXT_PUBLIC_FB_APP_ID ?? "",
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
