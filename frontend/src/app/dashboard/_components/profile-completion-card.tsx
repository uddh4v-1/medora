"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight, ChevronUp, ChevronDown } from "lucide-react";
import { useClinicStore } from "@/stores/clinic-store";

type CompletionItem = {
  label: string;
  done: boolean;
  href: string;
};

export function ProfileCompletionCard() {
  const clinicProfile = useClinicStore((s) => s.clinicProfile);
  const teamMembers = useClinicStore((s) => s.teamMembers);
  const [collapsed, setCollapsed] = useState(false);

  const items: CompletionItem[] = [
    {
      label: "Add your city",
      done: !!clinicProfile?.city?.trim(),
      href: "/dashboard/settings?tab=profile",
    },
    {
      label: "Add clinic address",
      done: !!clinicProfile?.address?.trim(),
      href: "/dashboard/settings?tab=profile",
    },
    {
      label: "Add specialties",
      done: (clinicProfile?.specialties?.length ?? 0) > 0,
      href: "/dashboard/settings?tab=profile",
    },
    {
      label: "Write a clinic description",
      done: !!clinicProfile?.description?.trim(),
      href: "/dashboard/settings?tab=profile",
    },
    {
      label: "Invite a team member",
      done: teamMembers.length >= 2,
      href: "/dashboard/settings?tab=team",
    },
  ];

  const completed = items.filter((i) => i.done).length;
  const pct = Math.round((completed / items.length) * 100);

  if (pct === 100) return null;

  const pending = items.filter((i) => !i.done);

  return (
    <section className="rounded-xl border border-border bg-card shadow-card-soft dark:shadow-none">
      {/* Always-visible header row */}
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-foreground truncate">Complete your profile</span>
            <span className="text-xs text-muted-foreground tabular-nums shrink-0">{completed}/{items.length}</span>
          </div>
          <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-brand transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? <ChevronDown className="size-3.5" /> : <ChevronUp className="size-3.5" />}
        </button>
      </div>

      {/* Collapsible items list */}
      {!collapsed && (
        <ul className="flex flex-col px-2 pb-2">
          {pending.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className="group flex items-center gap-2 rounded-md py-1 px-1.5 text-xs text-foreground transition-colors hover:bg-muted"
              >
                <span className="flex size-4 shrink-0 items-center justify-center rounded-full ring-1 ring-border" />
                <span>{item.label}</span>
                <ChevronRight className="ml-auto size-3 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
