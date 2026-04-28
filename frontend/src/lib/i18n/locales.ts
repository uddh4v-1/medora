export const LOCALES = ["en", "hi", "mr"] as const;
export type Locale = (typeof LOCALES)[number];

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "en" || value === "hi" || value === "mr";
}

/** BCP 47 for `toLocaleDateString` / `format` */
export const localeBcp47: Record<Locale, string> = {
  en: "en-IN",
  hi: "hi-IN",
  mr: "mr-IN",
};

export const STORAGE_KEY = "medora-locale";
