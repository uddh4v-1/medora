"use client";

import { Pencil, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";

import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { PublicLinkCard } from "@/components/onboarding/public-link-card";
import { WizardCard } from "@/components/onboarding/wizard-card";
import { WizardFooter } from "@/components/onboarding/wizard-footer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DAY_LABEL,
  WEEK_DAYS,
  type WorkingHours,
  useOnboardingStore,
} from "@/stores/onboarding-store";

function summarizeHours(hours: WorkingHours) {
  const groups: { days: string[]; range: string }[] = [];
  for (const day of WEEK_DAYS) {
    const h = hours[day];
    if (!h) {
      const last = groups[groups.length - 1];
      if (last && last.range === "Closed") last.days.push(DAY_LABEL[day]);
      else groups.push({ days: [DAY_LABEL[day]], range: "Closed" });
      continue;
    }
    const range = `${h.open} – ${h.close}`;
    const last = groups[groups.length - 1];
    if (last && last.range === range) last.days.push(DAY_LABEL[day]);
    else groups.push({ days: [DAY_LABEL[day]], range });
  }
  return groups;
}

export default function ReviewPage() {
  const router = useRouter();
  const state = useOnboardingStore(
    useShallow((s) => ({
      clinicName: s.clinicName,
      ownerName: s.ownerName,
      ownerEmail: s.ownerEmail,
      clinicPhone: s.clinicPhone,
      address: s.address,
      gst: s.gst,
      slug: s.slug,
      logoDataUrl: s.logoDataUrl,
      workingHours: s.workingHours,
      slotMinutes: s.slotMinutes,
      teamMode: s.teamMode,
      invitees: s.invitees,
      doctorServices: s.doctorServices,
    })),
  );
  const publish = useOnboardingStore((s) => s.publish);
  const [publishing, setPublishing] = useState(false);

  const hourGroups = summarizeHours(state.workingHours);
  const teamSize =
    1 + state.invitees.filter((i) => i.role === "DOCTOR").length;
  const receptionistCount = state.invitees.filter(
    (i) => i.role === "RECEPTIONIST",
  ).length;

  function handlePublish() {
    setPublishing(true);
    window.setTimeout(() => {
      publish();
      toast.success("Your clinic is live", {
        description: "Time to share your booking link.",
      });
      router.push("/onboarding/done");
    }, 700);
  }

  return (
    <OnboardingShell step="review">
      <header className="mb-7">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-brand">
          Step 5 of 5
        </p>
        <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Almost there. Anything off?
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tap a card to edit. Publishing turns on your public booking page.
        </p>
      </header>

      <div className="flex flex-col gap-4">
        <ReviewCard
          title="Clinic"
          editHref="/onboarding/profile"
          icon={
            state.logoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={state.logoDataUrl}
                alt=""
                className="size-10 rounded-md object-cover ring-1 ring-border"
              />
            ) : (
              <span className="flex size-10 items-center justify-center rounded-md bg-muted text-sm font-semibold text-muted-foreground ring-1 ring-border">
                {(state.clinicName || "C").slice(0, 1).toUpperCase()}
              </span>
            )
          }
        >
          <div className="flex flex-col gap-1 text-sm">
            <p className="font-medium text-foreground">
              {state.clinicName || "—"}
            </p>
            <p className="text-muted-foreground">
              {state.clinicPhone ? `+91 ${state.clinicPhone}` : "—"} ·{" "}
              {state.ownerEmail}
            </p>
            <p className="text-muted-foreground">
              {state.address || "No address yet"}
            </p>
            {state.gst && (
              <p className="font-mono text-[12px] text-muted-foreground">
                GST {state.gst}
              </p>
            )}
          </div>
        </ReviewCard>

        <ReviewCard title="Hours" editHref="/onboarding/profile">
          <div className="flex flex-col gap-1 text-sm">
            {hourGroups.map((g, idx) => (
              <p key={idx}>
                <span className="font-medium text-foreground">
                  {g.days.length === 1
                    ? g.days[0]
                    : `${g.days[0]} – ${g.days[g.days.length - 1]}`}
                </span>{" "}
                <span
                  className={cn(
                    "text-muted-foreground",
                    g.range === "Closed" && "italic",
                  )}
                >
                  {g.range}
                </span>
              </p>
            ))}
            <p className="mt-1 text-xs text-muted-foreground">
              Default slot length: {state.slotMinutes} min
            </p>
          </div>
        </ReviewCard>

        <ReviewCard
          title={`Team (${teamSize}${
            receptionistCount > 0 ? ` + ${receptionistCount} reception` : ""
          })`}
          editHref="/onboarding/team"
        >
          <ul className="flex flex-col gap-1.5 text-sm">
            <li className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-brand" />
              <span className="font-medium text-foreground">
                {state.ownerName || "You"}
              </span>
              <span className="text-muted-foreground">· Owner / Doctor</span>
            </li>
            {state.invitees.map((inv) => (
              <li key={inv.id} className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-muted-foreground/50" />
                <span className="font-medium text-foreground">
                  {inv.name || inv.email}
                </span>
                <span className="text-muted-foreground">
                  ·{" "}
                  {inv.role === "DOCTOR"
                    ? `Doctor${inv.specialty ? ` · ${inv.specialty}` : ""}`
                    : "Receptionist"}
                </span>
                <span className="ml-auto text-[11px] font-medium text-brand-coral">
                  invited
                </span>
              </li>
            ))}
          </ul>
        </ReviewCard>

        <ReviewCard
          title="Doctor services"
          editHref="/onboarding/services"
          icon={
            <span className="flex size-10 items-center justify-center rounded-md bg-brand/10 text-brand ring-1 ring-brand/20">
              <Sparkles className="size-4" />
            </span>
          }
        >
          <ul className="flex flex-col gap-1.5 text-sm">
            {state.doctorServices.map((d) => (
              <li
                key={d.doctorId}
                className="flex flex-wrap items-center gap-2"
              >
                <span className="font-medium text-foreground">
                  {d.doctorName}
                </span>
                <span className="text-muted-foreground">· {d.specialty}</span>
                <span className="text-muted-foreground">
                  · ₹{d.fee.toLocaleString("en-IN")} / consult
                </span>
                <span className="ml-auto text-[11px] font-medium text-muted-foreground">
                  {d.useClinicHours
                    ? "Clinic hours"
                    : "Custom hours"}{" "}
                  · {d.slotMinutes}m
                </span>
              </li>
            ))}
          </ul>
        </ReviewCard>

        <WizardCard
          title="Your public booking page"
          description="This is the URL you'll share with patients."
        >
          <PublicLinkCard slug={state.slug} variant="hero" />
        </WizardCard>
      </div>

      <WizardFooter
        backHref="/onboarding/services"
        primaryLabel="Publish & go live"
        primaryLoading={publishing}
        onPrimary={handlePublish}
        secondary={{
          label: "I'll publish later",
          onClick: () => router.push("/dashboard"),
        }}
      />
    </OnboardingShell>
  );
}

function ReviewCard({
  title,
  editHref,
  icon,
  children,
}: {
  title: string;
  editHref: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="group/review flex items-start gap-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10 shadow-card-soft transition-shadow hover:shadow-brand">
      {icon && <div className="mt-0.5 shrink-0">{icon}</div>}
      <div className="flex-1">
        <header className="mb-2 flex items-center justify-between gap-2">
          <h3 className="font-heading text-[14px] font-semibold text-foreground">
            {title}
          </h3>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Link href={editHref}>
              <Pencil className="size-3.5" />
              Edit
            </Link>
          </Button>
        </header>
        {children}
      </div>
    </section>
  );
}
