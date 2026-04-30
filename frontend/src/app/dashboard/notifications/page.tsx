"use client";

import { CalendarClock, CalendarRange, Loader2, Megaphone, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Patient } from "@/lib/dashboard-content";
import type { NotificationAudience } from "@/lib/notification-segments";
import {
  endOfWeekSunday,
  segmentPatients,
  startOfWeekMonday,
  toIsoDate,
} from "@/lib/notification-segments";
import type { OutreachKind } from "@/stores/clinic-store";
import { useClinicStore } from "@/stores/clinic-store";
import { useI18n } from "@/lib/i18n/provider";
import {
  getBroadcasts,
  postBroadcast,
  type BroadcastRecord,
} from "@/services/notifications.service";

function fmtShort(iso: string, bcp47: string) {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(bcp47, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

const PREVIEW_NAMES = 6;

const audienceMeta: Record<
  NotificationAudience,
  {
    icon: typeof Users;
    accent: string;
  }
> = {
  this_week: { icon: CalendarRange, accent: "text-brand" },
  closest_upcoming: { icon: CalendarClock, accent: "text-brand-coral" },
  all: { icon: Users, accent: "text-foreground" },
};

export default function NotificationsPage() {
  const { t, bcp47 } = useI18n();
  const patients = useClinicStore((s) => s.patients);

  const [audience, setAudience] = useState<NotificationAudience>("this_week");
  const [kind, setKind] = useState<OutreachKind>("visit_reminder");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<BroadcastRecord[]>([]);

  useEffect(() => {
    getBroadcasts().then((res) => {
      if (res.ok) setHistory(res.data.broadcasts);
    });
  }, []);

  const now = useMemo(() => new Date(), []);
  const weekLo = toIsoDate(startOfWeekMonday(now));
  const weekHi = toIsoDate(endOfWeekSunday(now));

  const recipients = useMemo(
    () => segmentPatients(patients, audience, now),
    [patients, audience, now],
  );

  const canSend =
    title.trim().length > 0 &&
    body.trim().length > 0 &&
    recipients.length > 0;

  function audienceLabel(a: NotificationAudience) {
    if (a === "this_week") return t("notifications.audWeek");
    if (a === "closest_upcoming") return t("notifications.audClosest");
    return t("notifications.audAll");
  }

  function kindLabel(k: OutreachKind) {
    if (k === "visit_reminder") return t("notifications.kindVisit");
    if (k === "festival_offer") return t("notifications.kindFestival");
    return t("notifications.kindCustom");
  }

  async function handleSend() {
    if (!canSend) return;
    setSending(true);
    const res = await postBroadcast({
      audience,
      kind,
      title: title.trim(),
      body: body.trim(),
      recipientCount: recipients.length,
      patientIds: recipients.map((r) => r.id),
    });
    setSending(false);
    if (!res.ok) {
      toast.error("Failed to send broadcast");
      return;
    }
    setHistory((prev) => [res.data.broadcast, ...prev]);
    toast.success(t("notifications.toastSent"), {
      description: t("notifications.toastSentDesc", { count: recipients.length }),
    });
    setTitle("");
    setBody("");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-6 md:px-8 md:py-8">
      <header>
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-brand">
          {t("notifications.eyebrow")}
        </p>
        <h1 className="mt-1 font-heading text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          {t("notifications.title")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {t("notifications.subtitle")}
        </p>
      </header>

      <Card className="border-border/80 shadow-card-soft">
        <CardHeader className="border-b border-border/60 bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <Megaphone className="size-4" />
            </span>
            <div>
              <CardTitle className="text-base">
                {t("notifications.composeTitle")}
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t("notifications.kindLabel")}
            </p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  "visit_reminder",
                  "festival_offer",
                  "custom",
                ] satisfies OutreachKind[]
              ).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={cn(
                    "h-9 rounded-md px-4 text-sm font-medium transition-colors",
                    kind === k
                      ? "bg-brand text-brand-foreground shadow-brand"
                      : "bg-muted text-foreground hover:bg-muted/90",
                  )}
                >
                  {kindLabel(k)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t("notifications.audienceLabel")}
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              {(
                [
                  ["this_week", t("notifications.segmentWeekHelp")],
                  ["closest_upcoming", t("notifications.segmentClosestHelp")],
                  ["all", t("notifications.segmentAllHelp")],
                ] satisfies [NotificationAudience, string][]
              ).map(([key, hint]) => {
                const Icon = audienceMeta[key].icon;
                const active = audience === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setAudience(key)}
                    aria-pressed={active}
                    className={cn(
                      "flex flex-col items-start gap-2 rounded-xl border px-4 py-3 text-left transition-all",
                      active
                        ? "border-brand bg-brand/5 shadow-brand ring-1 ring-brand"
                        : "border-border bg-card hover:border-border/90",
                    )}
                  >
                    <span className={cn("flex items-center gap-2 text-sm font-semibold", audienceMeta[key].accent)}>
                      <Icon className="size-4" />
                      {audienceLabel(key)}
                    </span>
                    <span className="text-[11px] leading-relaxed text-muted-foreground">
                      {hint}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {audience === "this_week" && (
            <p className="text-[12px] text-muted-foreground">
              <span className="font-medium text-foreground">
                {t("notifications.weekWindow")}
              </span>{" "}
              {fmtShort(weekLo, bcp47)} → {fmtShort(weekHi, bcp47)} (
              {weekLo} – {weekHi})
            </p>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="broadcast-title">{t("notifications.titlePlaceholder")}</Label>
              <Input
                id="broadcast-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Reminder — visit tomorrow"
                className="h-11"
              />
            </div>
            <div className="hidden md:block" />
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <Label htmlFor="broadcast-body">{t("notifications.bodyPlaceholder")}</Label>
              <textarea
                id="broadcast-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={t("notifications.bodyPlaceholder")}
                rows={4}
                className="w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm leading-relaxed outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              />
            </div>
          </div>

          <RecipientPreview
            recipients={recipients}
            bcp47={bcp47}
            t={t}
          />

          <div className="flex flex-wrap items-center gap-3 border-t border-border/60 pt-4">
            <Button
              type="button"
              disabled={!canSend || sending}
              onClick={handleSend}
              className="h-11 min-w-[160px] gap-2 bg-brand text-brand-foreground shadow-brand hover:bg-brand/90"
            >
              {sending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  …
                </>
              ) : (
                t("notifications.send")
              )}
            </Button>
            <Badge variant="secondary" className="font-mono text-xs">
              {t("notifications.previewCount", { count: recipients.length })}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("notifications.historyTitle")}
          </CardTitle>
          <CardDescription>
            {history.length === 0
              ? t("notifications.historyEmpty")
              : `${history.length} sent`}
          </CardDescription>
        </CardHeader>
        {history.length > 0 && (
          <CardContent className="pt-0">
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="bg-muted/50 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2.5">{t("notifications.colWhen")}</th>
                    <th className="px-3 py-2.5">{t("notifications.colAudience")}</th>
                    <th className="px-3 py-2.5">{t("notifications.colKind")}</th>
                    <th className="px-3 py-2.5">{t("notifications.colTitle")}</th>
                    <th className="px-3 py-2.5 text-right">
                      {t("notifications.colRecipients")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {history.map((row) => (
                    <tr key={row.id} className="bg-card">
                      <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[12px] text-muted-foreground">
                        {new Date(row.sentAt).toLocaleString(bcp47, {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-3 py-2.5">
                        {audienceLabel(row.audience as NotificationAudience)}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {kindLabel(row.kind as OutreachKind)}
                      </td>
                      <td className="max-w-[200px] truncate px-3 py-2.5 font-medium">
                        {row.title}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {row.recipientCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

function RecipientPreview({
  recipients,
  bcp47,
  t,
}: {
  recipients: Patient[];
  bcp47: string;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  if (recipients.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
        {t("notifications.previewCountZero")}
      </div>
    );
  }

  const preview = recipients.slice(0, PREVIEW_NAMES);
  const rest = recipients.length - preview.length;

  return (
    <div className="rounded-lg border border-border bg-muted/20 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {t("notifications.previewNames")}
      </p>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-foreground">
        {preview.map((p) => (
          <li key={p.id} className="flex items-baseline gap-2">
            <span className="font-medium">{p.name}</span>
            {p.nextVisitDate && (
              <span className="text-xs text-muted-foreground">
                · {fmtShort(p.nextVisitDate, bcp47)}
              </span>
            )}
          </li>
        ))}
      </ul>
      {rest > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          + {t("notifications.moreNames", { count: rest })}
        </p>
      )}
    </div>
  );
}
