"use client";

import { Plus, Stethoscope, UserPlus, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";

import { InviteeRowEditor } from "@/components/onboarding/invitee-row-editor";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { WizardCard } from "@/components/onboarding/wizard-card";
import { WizardFooter } from "@/components/onboarding/wizard-footer";
import { cn } from "@/lib/utils";
import { type Invitee, useOnboardingStore } from "@/stores/onboarding-store";

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
}

function blankInvitee(): Invitee {
  return {
    id: makeId(),
    name: "",
    email: "",
    role: "DOCTOR",
    specialty: "",
  };
}

export default function TeamPage() {
  const router = useRouter();
  const initial = useOnboardingStore(
    useShallow((s) => ({
      teamMode: s.teamMode,
      invitees: s.invitees,
    })),
  );
  const setTeam = useOnboardingStore((s) => s.setTeam);
  const publish = useOnboardingStore((s) => s.publish);

  const [mode, setMode] = useState<"solo" | "team">(initial.teamMode);
  const [invitees, setInvitees] = useState<Invitee[]>(
    initial.invitees.length > 0 ? initial.invitees : [blankInvitee()],
  );

  function patchAt(idx: number, next: Invitee) {
    setInvitees((xs) => xs.map((x, i) => (i === idx ? next : x)));
  }

  function removeAt(idx: number) {
    setInvitees((xs) => (xs.length > 1 ? xs.filter((_, i) => i !== idx) : xs));
  }

  const visibleInvitees = mode === "team" ? invitees : [];
  const hasValidRow =
    mode === "solo" ||
    invitees.some(
      (i) => i.name.trim().length > 0 && /\S+@\S+\.\S+/.test(i.email),
    );

  function handleContinue() {
    if (mode === "team" && !hasValidRow) {
      toast.error("Add at least one teammate, or pick the solo path.");
      return;
    }
    const cleaned =
      mode === "solo"
        ? []
        : invitees.filter(
            (i) => i.name.trim().length > 0 && /\S+@\S+\.\S+/.test(i.email),
          );
    setTeam({ teamMode: mode, invitees: cleaned });
    publish();
    if (cleaned.length > 0) {
      toast.success(`${cleaned.length} invite${cleaned.length === 1 ? "" : "s"} ready`, {
        description: "We'll email each a setup link shortly.",
      });
    }
    router.push("/onboarding/done");
  }

  return (
    <OnboardingShell step="team">
      <header className="mb-7">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-brand">
          Step 2 of 2
        </p>
        <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Who else works here?
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick the path that fits your clinic. You can add more people later
          from Settings.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <ModeCard
          active={mode === "solo"}
          onClick={() => setMode("solo")}
          icon={<Stethoscope className="size-5" />}
          title="It's just me"
          description="A single doctor running the show. We'll skip invites."
        />
        <ModeCard
          active={mode === "team"}
          onClick={() => setMode("team")}
          icon={<Users className="size-5" />}
          title="We're a team"
          description="Invite doctors and receptionists by email."
        />
      </div>

      {mode === "team" && (
        <WizardCard
          className="mt-5"
          title="Invite teammates"
          description="They get an email with a setup link and pick their own password."
        >
          <div className="flex flex-col gap-3">
            {visibleInvitees.map((inv, idx) => (
              <InviteeRowEditor
                key={inv.id}
                value={inv}
                onChange={(next) => patchAt(idx, next)}
                onRemove={
                  invitees.length > 1 ? () => removeAt(idx) : undefined
                }
              />
            ))}
            <button
              type="button"
              onClick={() => setInvitees((xs) => [...xs, blankInvitee()])}
              className="inline-flex h-9 items-center gap-1.5 self-start rounded-md px-2.5 text-sm font-medium text-brand transition-colors hover:bg-brand/10"
            >
              <Plus className="size-4" />
              Add another
            </button>
          </div>

          <div className="mt-5 flex items-start gap-3 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
            <UserPlus className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <p>
              We&apos;ll email each invitee a setup link when you publish.
              They set their own password — you never have to handle it.
            </p>
          </div>
        </WizardCard>
      )}

      {mode === "solo" && (
        <WizardCard
          className="mt-5"
          title="Solo clinic — got it"
          description="You'll be set up as the doctor. Set your fee and hours from Settings later."
        >
          <div className="flex items-center gap-3 rounded-lg bg-brand/5 p-4 ring-1 ring-brand/15">
            <span className="flex size-10 items-center justify-center rounded-full bg-brand/10 text-brand">
              <Stethoscope className="size-5" />
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">
                You&apos;re the doctor on call
              </p>
              <p className="text-xs text-muted-foreground">
                Hire someone? You can invite them anytime from{" "}
                <span className="font-medium">Settings → Team</span>.
              </p>
            </div>
          </div>
        </WizardCard>
      )}

      <WizardFooter
        backHref="/onboarding/profile"
        primaryLabel="Finish setup"
        primaryDisabled={!hasValidRow}
        onPrimary={handleContinue}
      />
    </OnboardingShell>
  );
}

function ModeCard({
  active,
  onClick,
  icon,
  title,
  description,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex flex-col items-start gap-3 rounded-xl bg-card p-5 text-left transition-all ring-1",
        active
          ? "ring-2 ring-brand shadow-brand"
          : "ring-foreground/10 hover:ring-foreground/20",
      )}
      aria-pressed={active}
    >
      <span
        className={cn(
          "flex size-10 items-center justify-center rounded-lg transition-colors",
          active
            ? "bg-brand text-brand-foreground"
            : "bg-muted text-foreground",
        )}
      >
        {icon}
      </span>
      <div className="flex flex-col gap-0.5">
        <h3 className="font-heading text-base font-semibold text-foreground">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <span
        className={cn(
          "ml-auto text-[11px] font-semibold uppercase tracking-wide transition-colors",
          active ? "text-brand" : "text-muted-foreground/60",
        )}
      >
        {active ? "Selected" : "Pick this"}
      </span>
    </button>
  );
}
