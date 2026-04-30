"use client";

import { Link2, LogOut, Stethoscope } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { dashboardNav } from "@/lib/dashboard-content";
import { siteConfig } from "@/lib/site-content";
import { useI18n } from "@/lib/i18n/provider";
import { useClinicStore } from "@/stores/clinic-store";
import { useDashboardSession } from "../_hooks/use-dashboard-session";
import { cn } from "@/lib/utils";
import { postLogout } from "@/services/auth.service";
import { toast } from "sonner";

export function DashboardSidebar() {
  const { t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const {
    session,
    clinicName,
    clinicSlug,
    displayName,
    roleLabel,
    initials,
  } = useDashboardSession();
  const signOut = useClinicStore((s) => s.signOut);

  async function handleLogout() {
    try {
      await postLogout();
    } catch {
      // Still clear client session when the API isn’t reachable
    }
    signOut();
    toast.success(t("common.signedOut"));
    router.push("/login");
  }

  return (
    <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar md:flex md:flex-col">
      <div className="flex items-center gap-2.5 px-5 pt-5 pb-4">
        <span className="flex size-9 items-center justify-center rounded-lg bg-brand text-brand-foreground shadow-brand">
          <Stethoscope className="size-4.5" />
        </span>
        <div className="flex flex-col leading-tight">
          <span className="text-[15px] font-semibold text-sidebar-foreground">
            {siteConfig.name}
          </span>
          <span className="text-[11px] text-muted-foreground">{clinicName}</span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 pb-4">
        {dashboardNav.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-9 items-center gap-2.5 rounded-md px-3 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-brand"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )}
            >
              <Icon className="size-4" />
              {t(item.i18nKey)}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-2 border-t border-sidebar-border px-3 py-3">
        <Button
          variant="outline"
          disabled={!clinicSlug}
          onClick={() => {
            if (!clinicSlug) return;
            const url = `${window.location.origin}/book/${clinicSlug}`;
            navigator.clipboard?.writeText(url).then(() =>
              toast.success("Booking link copied"),
            );
          }}
          className="h-9 justify-start gap-2 rounded-md border-sidebar-border bg-transparent px-3 text-xs font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground disabled:opacity-40"
        >
          <Link2 className="size-3.5" />
          {t("sidebar.bookingLink")}
        </Button>

        <div className="flex items-center gap-2.5 rounded-md px-2 py-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-foreground">
            {initials}
          </span>
          <div className="flex flex-1 flex-col overflow-hidden leading-tight">
            <span className="truncate text-[13px] font-medium text-sidebar-foreground">
              {displayName}
            </span>
            <span className="truncate text-[11px] text-muted-foreground">
              {session?.email ?? roleLabel}
            </span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            aria-label={t("common.logOut")}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <LogOut className="size-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
