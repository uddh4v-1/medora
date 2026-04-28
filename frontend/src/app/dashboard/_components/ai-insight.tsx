"use client";

import { Sparkles } from "lucide-react";

import { useI18n } from "@/lib/i18n/provider";

export function AiInsight() {
  const { t } = useI18n();
  return (
    <section className="relative flex h-full flex-col gap-1.5 overflow-hidden rounded-xl border border-brand/20 bg-gradient-to-br from-brand/8 via-brand/4 to-transparent p-5 dark:border-brand/30 dark:from-brand/15 dark:via-brand/8">
      <div className="flex items-center gap-2">
        <Sparkles className="size-3.5 text-brand-coral" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-coral">
          {t("ai.eyebrow")}
        </span>
      </div>
      <p className="text-xs leading-relaxed text-foreground/85">{t("ai.body")}</p>
    </section>
  );
}
