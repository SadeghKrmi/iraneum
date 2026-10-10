"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import type { Locale } from "@/lib/i18n";
import { LanguageIcon } from "./icons";

type Props = { locale: Locale; label: string; ariaLabel: string };

export function LanguageSwitcher(props: Props) {
  // Search params are only known in the browser; the pre-rendered link simply omits them.
  return (
    <Suspense fallback={<SwitcherLink {...props} search="" />}>
      <SwitcherWithSearch {...props} />
    </Suspense>
  );
}

function SwitcherWithSearch(props: Props) {
  return <SwitcherLink {...props} search={useSearchParams().toString()} />;
}

function SwitcherLink({ locale, label, ariaLabel, search }: Props & { search: string }) {
  const pathname = usePathname();
  const other: Locale = locale === "fa" ? "en" : "fa";
  // Keep the same page and scene when switching language: /fa/achaemenid/?e=babylon → /en/achaemenid/?e=babylon
  const segments = pathname.split("/");
  segments[1] = other;
  const href = segments.join("/") + (search ? `?${search}` : "");

  return (
    <Link
      href={href}
      hrefLang={other}
      lang={other}
      aria-label={ariaLabel}
      className="flex h-10 items-center gap-2 rounded-full border border-line px-3 text-sm transition-colors hover:border-gold hover:text-gold focus-visible:outline-2 focus-visible:outline-gold"
    >
      <LanguageIcon className="size-4" />
      <span>{label}</span>
    </Link>
  );
}
