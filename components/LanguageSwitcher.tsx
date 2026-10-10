"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n";

type Props = { locale: Locale; label: string; ariaLabel: string };

export function LanguageSwitcher({ locale, label, ariaLabel }: Props) {
  const pathname = usePathname();
  const other: Locale = locale === "fa" ? "en" : "fa";
  // Keep the same checkpoint when switching language: /fa/achaemenid/ → /en/achaemenid/
  const segments = pathname.split("/");
  segments[1] = other;
  const href = segments.join("/");

  return (
    <Link
      href={href}
      hrefLang={other}
      lang={other}
      aria-label={ariaLabel}
      className="rounded-full border border-line px-4 py-1.5 text-sm transition-colors hover:border-gold hover:text-gold focus-visible:outline-2 focus-visible:outline-gold"
    >
      {label}
    </Link>
  );
}
