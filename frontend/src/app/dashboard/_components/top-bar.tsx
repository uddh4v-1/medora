"use client";

import { LogOut, Menu, Stethoscope } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  dashboardNav,
} from "@/lib/dashboard-content";
import { siteConfig } from "@/lib/site-content";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

import { useDashboardSession } from "../_hooks/use-dashboard-session";

import { CommandPalette } from "./command-palette";
import { NotificationsBell } from "./notifications-bell";

export function DashboardTopBar() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const {
    clinicName,
    displayName,
    initials,
    roleLabel,
    session,
  } = useDashboardSession();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border bg-background/85 px-4 backdrop-blur-sm md:px-6">
      <div className="flex items-center gap-2.5 md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("common.openNav")}
              className="size-9 rounded-md text-foreground"
            >
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="bg-sidebar p-0"
            showCloseButton={false}
          >
            <SheetTitle className="sr-only">{t("common.navigation")}</SheetTitle>
            <div className="flex items-center gap-2.5 px-5 pt-5 pb-4">
              <span className="flex size-9 items-center justify-center rounded-lg bg-brand text-brand-foreground shadow-brand">
                <Stethoscope className="size-[18px]" />
              </span>
              <div className="flex flex-col leading-tight">
                <span className="text-[15px] font-semibold text-sidebar-foreground">
                  {siteConfig.name}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {clinicName}
                </span>
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
                  <SheetClose asChild key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex h-10 items-center gap-2.5 rounded-md px-3 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-brand"
                          : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                      )}
                    >
                      <Icon className="size-4" />
                      {t(item.i18nKey)}
                    </Link>
                  </SheetClose>
                );
              })}
            </nav>

            <div className="flex items-center gap-2.5 border-t border-sidebar-border px-4 py-3">
              <span className="flex size-9 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-foreground">
                {initials}
              </span>
              <div className="flex flex-1 flex-col leading-tight">
                <span className="text-[13px] font-medium text-sidebar-foreground">
                  {displayName}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {session?.email ?? roleLabel}
                </span>
              </div>
              <SheetClose asChild>
                <Link
                  href="/login"
                  aria-label={t("common.logOut")}
                  className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                >
                  <LogOut className="size-4" />
                </Link>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-foreground"
        >
          <span className="flex size-7 items-center justify-center rounded-md bg-brand text-brand-foreground">
            <Stethoscope className="size-3.5" />
          </span>
          {siteConfig.name}
        </Link>
      </div>
      <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-1.5 sm:max-w-md md:max-w-lg">
        <CommandPalette />
        <NotificationsBell />
      </div>
    </div>
  );
}
