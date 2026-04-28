"use client";

import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";

import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

import { LanguageSettings } from "./language-settings";

type ThemeOption = {
  value: "light" | "dark" | "system";
  labelKey: string;
  descKey: string;
  icon: React.ComponentType<{ className?: string }>;
};

const themeOptionDefs: ThemeOption[] = [
  { value: "light", labelKey: "appearance.light", descKey: "appearance.lightDesc", icon: Sun },
  { value: "dark", labelKey: "appearance.dark", descKey: "appearance.darkDesc", icon: Moon },
  {
    value: "system",
    labelKey: "appearance.system",
    descKey: "appearance.systemDesc",
    icon: Monitor,
  },
];

export function AppearanceSettings() {
  const { t } = useI18n();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const themeOptions = useMemo(
    () =>
      themeOptionDefs.map((d) => ({
        value: d.value,
        label: t(d.labelKey),
        description: t(d.descKey),
        icon: d.icon,
      })),
    [t],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const active = mounted ? (theme ?? "system") : "system";

  return (
    <div>
      <LanguageSettings />
      <div className="rounded-xl border border-border bg-card p-6 shadow-card-soft dark:shadow-none">
        <div className="flex flex-col gap-1.5">
          <h3 className="text-base font-semibold text-foreground">
            {t("appearance.theme")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t("appearance.themeDesc")}
          </p>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {themeOptions.map((option) => {
            const isActive = active === option.value;
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setTheme(option.value)}
                aria-pressed={isActive}
                className={cn(
                  "group relative flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition-all",
                  isActive
                    ? "border-brand bg-brand/5 shadow-brand"
                    : "border-border bg-background hover:border-brand/40 hover:bg-muted/40",
                )}
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <span
                    className={cn(
                      "flex size-9 items-center justify-center rounded-lg transition-colors",
                      isActive
                        ? "bg-brand text-brand-foreground shadow-brand"
                        : "bg-muted text-muted-foreground group-hover:bg-brand/10 group-hover:text-brand",
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  {isActive ? (
                    <span className="flex size-5 items-center justify-center rounded-full bg-brand text-brand-foreground">
                      <Check className="size-3" />
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-col gap-0.5">
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      isActive ? "text-brand" : "text-foreground",
                    )}
                  >
                    {option.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {option.description}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {mounted && active === "system" ? (
          <p className="mt-4 text-xs text-muted-foreground">
            {t("appearance.usingDevice", { theme: resolvedTheme ?? "light" })}
          </p>
        ) : null}
      </div>
    </div>
  );
}
