import type { Metadata } from "next";
import "../globals.css";
import { siteIcons } from "@/lib/routes";

export const metadata: Metadata = { icons: siteIcons };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body className="font-sans">{children}</body>
    </html>
  );
}
