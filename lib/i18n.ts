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
    toggleTheme: "تغییر پوستهٔ روشن و تیره",
    openMenu: "باز کردن منو",
    closeMenu: "بستن منو",
    menu: "منو",
    home: "صفحهٔ نخست",
    allEras: "همهٔ دوره‌ها",
    about: "درباره",
    references: "منابع",
    contact: "تماس و بازخورد",
    play: "پخش",
    pause: "مکث",
    previousScene: "رویداد قبلی",
    nextScene: "رویداد بعدی",
    generalReferences: "منابع عمومی",
    noReferencesYet: "منابع این دوره به‌زودی افزوده می‌شوند.",
    openStory: "شنیدن داستان",
    events: "رویداد",
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
    toggleTheme: "Toggle light and dark theme",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    menu: "Menu",
    home: "Home",
    allEras: "All eras",
    about: "About",
    references: "References",
    contact: "Contact & feedback",
    play: "Play",
    pause: "Pause",
    previousScene: "Previous event",
    nextScene: "Next event",
    generalReferences: "General references",
    noReferencesYet: "References for this era will be added soon.",
    openStory: "Hear the story",
    events: "events",
  },
} satisfies Record<Locale, Record<string, string>>;

export type Dictionary = (typeof dictionaries)[Locale];

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
