export const locales = ["fa", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fa";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function dirOf(locale: Locale): "rtl" | "ltr" {
  return locale === "fa" ? "rtl" : "ltr";
}

/** Text that exists in every supported language. */
export type Localized = Record<Locale, string>;

const dictionaries = {
  fa: {
    siteTitle: "ایرانیوم",
    tagline: "تاریخ ایران، از زبان راوی",
    welcomeTitle: "به سفری در تاریخ ایران خوش آمدید",
    welcomeBody: "یک ایستگاه را روی خط زمان پایین صفحه انتخاب کنید تا راوی داستانش را برایتان بگوید.",
    timeline: "خط زمان",
    previous: "ایستگاه قبلی",
    next: "ایستگاه بعدی",
    switchLanguage: "English",
    switchLanguageLabel: "Switch to English",
    ravi: "راوی",
    raviComingSoon: "راوی به‌زودی داستان این دوره را تعریف خواهد کرد.",
  },
  en: {
    siteTitle: "Iraneum",
    tagline: "The history of Iran, told by Ravi",
    welcomeTitle: "Welcome to a journey through Iranian history",
    welcomeBody: "Pick a checkpoint on the timeline below and Ravi, the narrator, will tell you its story.",
    timeline: "Timeline",
    previous: "Previous checkpoint",
    next: "Next checkpoint",
    switchLanguage: "فارسی",
    switchLanguageLabel: "تغییر زبان به فارسی",
    ravi: "Ravi",
    raviComingSoon: "Ravi will soon tell the story of this era.",
  },
} satisfies Record<Locale, Record<string, string>>;

export type Dictionary = (typeof dictionaries)[Locale];

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
