"use client";

import {
  AlertTriangle,
  Bell,
  CalendarClock,
  CheckCheck,
  Inbox,
  Package,
  Receipt,
} from "lucide-react";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  type Appointment,
  format12h,
  formatCurrency,
  type Invoice,
  lowInventory,
} from "@/lib/dashboard-content";
import { type Notification, useClinicStore } from "@/lib/store";
import { cn } from "@/lib/utils";

function timeStringToMinutes(t: string) {
  const [h, m] = t.split(":").map((n) => Number.parseInt(n, 10));
  return h * 60 + m;
}

function nowMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function daysBetween(isoStart: string, isoEnd: string) {
  const a = new Date(`${isoStart}T00:00:00`).getTime();
  const b = new Date(`${isoEnd}T00:00:00`).getTime();
  return Math.floor((b - a) / (1000 * 60 * 60 * 24));
}

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
}

function buildNotifications(opts: {
  appointments: Appointment[];
  invoices: Invoice[];
  noShows: Appointment[];
}): Notification[] {
  const out: Notification[] = [];
  const now = nowMinutes();

  for (const apt of opts.appointments) {
    const start = timeStringToMinutes(apt.startTime);
    const diff = start - now;
    if (
      diff >= 0 &&
      diff <= 60 &&
      apt.status !== "completed" &&
      apt.status !== "cancelled" &&
      apt.status !== "no-show"
    ) {
      out.push({
        id: `apt-soon-${apt.id}`,
        title: `${apt.patient} in ${diff <= 0 ? "now" : `${diff} min`}`,
        description: `${format12h(apt.startTime)} · ${apt.doctor} · ${apt.reason}`,
        tone: "info",
        createdAt: new Date().toISOString(),
        read: false,
      });
    }
  }

  const today = todayIso();
  for (const inv of opts.invoices) {
    if (inv.status !== "unpaid" || !inv.createdAt) continue;
    const age = daysBetween(inv.createdAt, today);
    if (age > 7) {
      out.push({
        id: `inv-overdue-${inv.id}`,
        title: `${inv.number} overdue`,
        description: `${inv.patient} · ${formatCurrency(inv.total)} · ${age} days unpaid`,
        tone: "warning",
        createdAt: new Date().toISOString(),
        read: false,
      });
    }
  }

  for (const apt of opts.noShows) {
    out.push({
      id: `no-show-${apt.id}`,
      title: `${apt.patient} marked no-show`,
      description: `${format12h(apt.startTime)} · ${apt.doctor}`,
      tone: "warning",
      createdAt: new Date().toISOString(),
      read: false,
    });
  }

  for (const item of lowInventory) {
    if (item.remaining < item.threshold) {
      out.push({
        id: `inv-low-${item.id}`,
        title: `${item.name} running low`,
        description: `${item.remaining} units left (re-order at ${item.threshold})`,
        tone: "warning",
        createdAt: new Date().toISOString(),
        read: false,
      });
    }
  }

  return out;
}

const toneStyles: Record<
  Notification["tone"],
  { icon: typeof Bell; iconCls: string; ringCls: string }
> = {
  info: {
    icon: CalendarClock,
    iconCls: "text-sky-600 dark:text-sky-300",
    ringCls: "bg-sky-500/10 ring-sky-500/30 dark:bg-sky-500/15",
  },
  warning: {
    icon: AlertTriangle,
    iconCls: "text-amber-600 dark:text-amber-300",
    ringCls: "bg-amber-500/12 ring-amber-500/30 dark:bg-amber-500/15",
  },
  success: {
    icon: CheckCheck,
    iconCls: "text-emerald-600 dark:text-emerald-300",
    ringCls: "bg-emerald-500/12 ring-emerald-500/30 dark:bg-emerald-500/15",
  },
};

const sourceIcon = (id: string) => {
  if (id.startsWith("apt-soon-")) return CalendarClock;
  if (id.startsWith("inv-overdue-")) return Receipt;
  if (id.startsWith("no-show-")) return AlertTriangle;
  if (id.startsWith("inv-low-")) return Package;
  return Bell;
};

export function NotificationsBell() {
  const appointments = useClinicStore((s) => s.appointments);
  const invoices = useClinicStore((s) => s.invoices);
  const readIds = useClinicStore((s) => s.notificationsRead);
  const markRead = useClinicStore((s) => s.markNotificationsRead);

  const noShows = useMemo(
    () => appointments.filter((a) => a.status === "no-show"),
    [appointments],
  );

  const notifications = useMemo(
    () =>
      buildNotifications({ appointments, invoices, noShows }).map((n) => ({
        ...n,
        read: readIds.includes(n.id),
      })),
    [appointments, invoices, noShows, readIds],
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  function handleMarkAll() {
    const ids = notifications.filter((n) => !n.read).map((n) => n.id);
    if (ids.length) markRead(ids);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Notifications"
          className="relative size-9 rounded-md text-muted-foreground hover:text-foreground"
        >
          <Bell className="size-5" />
          {unreadCount > 0 ? (
            <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-brand-coral text-[10px] font-semibold text-white ring-2 ring-background">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[360px] gap-0 overflow-hidden border border-border bg-popover p-0 ring-0 shadow-xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">
              Notifications
            </span>
            <span className="text-[11px] text-muted-foreground">
              {unreadCount === 0
                ? "All caught up"
                : `${unreadCount} unread`}
            </span>
          </div>
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={handleMarkAll}
              className="text-[11px] font-medium text-brand transition-colors hover:text-brand/80"
            >
              Mark all read
            </button>
          ) : null}
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
              <span className="flex size-10 items-center justify-center rounded-full bg-brand/10 text-brand">
                <Inbox className="size-5" />
              </span>
              <p className="text-sm font-medium text-foreground">
                You're all set
              </p>
              <p className="text-xs text-muted-foreground">
                No new alerts right now.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {notifications.map((n) => {
                const Icon = sourceIcon(n.id);
                const tone = toneStyles[n.tone];
                return (
                  <li
                    key={n.id}
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 text-sm",
                      n.read ? "opacity-70" : "",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ring-1",
                        tone.ringCls,
                        tone.iconCls,
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate font-medium text-foreground">
                        {n.title}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {n.description}
                      </span>
                    </div>
                    {!n.read ? (
                      <span
                        aria-hidden
                        className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-coral"
                      />
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
