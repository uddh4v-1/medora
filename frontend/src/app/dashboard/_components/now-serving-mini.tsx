"use client";

import { ArrowRight, Stethoscope } from "lucide-react";
import Link from "next/link";

import type { Visit } from "@/lib/dashboard-content";
import { useI18n } from "@/lib/i18n/provider";

function avatarInitial(name: string) {
  const trimmed = name.trim();
  return trimmed ? trimmed[0]!.toUpperCase() : "?";
}

export function NowServingMini({
  visit,
  waiting,
}: {
  visit: Visit | null;
  waiting: number;
}) {
  const { t } = useI18n();
  return (
    <section className="relative flex h-full flex-col gap-4 overflow-hidden rounded-xl bg-brand p-5 text-brand-foreground shadow-brand-lg">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-12 -right-10 size-32 rounded-full bg-white/8 blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-14 -left-8 size-28 rounded-full bg-white/5 blur-2xl"
      />

      <div className="flex items-center gap-2">
        <span className="flex size-5 items-center justify-center rounded-md bg-white/15">
          <Stethoscope className="size-3" />
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-foreground/80">
          {t("now.eyebrow")}
        </span>
      </div>

      <div className="flex min-h-[68px] flex-col gap-2">
        {visit ? (
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-white/15 text-base font-semibold text-brand-foreground ring-1 ring-white/20">
              {avatarInitial(visit.patient)}
            </span>
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-base font-semibold text-brand-foreground">
                {visit.patient}
              </span>
              <span className="truncate text-xs text-brand-foreground/80">
                {visit.reason || visit.title} · {visit.doctor}
              </span>
            </div>
          </div>
        ) : (
          <span aria-hidden className="block h-1 w-10 rounded-full bg-white/40" />
        )}
      </div>

      <div className="mt-auto flex items-end justify-between gap-3 border-t border-white/10 pt-3">
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-foreground/70">
            {t("now.waiting")}
          </span>
          <span className="text-2xl font-semibold tracking-tight text-brand-foreground">
            {waiting}
          </span>
        </div>
        <Link
          href="/dashboard/queue"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-semibold text-brand shadow-sm transition-colors hover:bg-white/90"
        >
          {t("now.manageQueue")}
          <ArrowRight className="size-3" />
        </Link>
      </div>
    </section>
  );
}
