import type { Locale } from "./locales";
import { messages } from "./messages";

const FALLBACK: Locale = "en";

/**
 * `{{name}}` style interpolation. Falls back to English if a key is missing.
 */
export function getMessage(
  locale: Locale,
  key: string,
  vars?: Record<string, string | number>,
): string {
  let raw =
    messages[locale][key] ?? messages[FALLBACK][key] ?? key;
  if (!vars) return raw;
  return raw.replace(/\{\{(\w+)\}\}/g, (_, k: string) =>
    String(vars[k] ?? ""),
  );
}
