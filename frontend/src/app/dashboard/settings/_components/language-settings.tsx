"use client";

import { Check, Globe } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/locales";
import { useI18n } from "@/lib/i18n/provider";

const localeConfig: { id: Locale; nameKey: string }[] = [
  { id: "en", nameKey: "language.english" },
  { id: "hi", nameKey: "language.hindi" },
  { id: "mr", nameKey: "language.marathi" },
];

export function LanguageSettings() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className="mb-6 rounded-xl border border-border bg-card p-6 shadow-card-soft dark:shadow-none">
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="flex flex-col gap-1.5">
          <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <span className="flex size-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <Globe className="size-4" />
            </span>
            {t("language.title")}
          </h3>
          <p className="max-w-xl text-sm text-muted-foreground sm:pl-10">
            {t("language.description")}
          </p>
        </div>
      </div>

      <div
        className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3"
        role="radiogroup"
        aria-label={t("language.title")}
      >
        {localeConfig.map(({ id, nameKey }) => {
          const isActive = locale === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => setLocale(id)}
              className={cn(
                "group relative flex flex-col items-stretch gap-2 rounded-xl border p-4 text-left transition-all",
                isActive
                  ? "border-brand bg-brand/5 shadow-brand"
                  : "border-border bg-background hover:border-brand/40 hover:bg-muted/40",
              )}
            >
              <div className="flex w-full items-start justify-between gap-2">
                <span
                  className={cn(
                    "text-sm font-semibold",
                    isActive ? "text-brand" : "text-foreground",
                  )}
                >
                  {t(nameKey)}
                </span>
                {isActive ? (
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground">
                    <Check className="size-3" />
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
