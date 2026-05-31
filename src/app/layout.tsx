import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MAC Solar | Free Energy Assessment",
  description:
    "Get a free solar panel assessment for your home. MAC Solar Installation Services — Cebu's trusted solar energy partner.",
  keywords: "solar panels, solar energy, Cebu, Philippines, installation",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
