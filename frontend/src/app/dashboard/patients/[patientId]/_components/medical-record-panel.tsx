"use client";

import {
  AlertTriangle,
  FileImage,
  FileText,
  HeartPulse,
  Notebook,
  Plus,
  X,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  type Attachment,
  type Patient,
  type PatientNote,
  type VitalsEntry,
} from "@/lib/dashboard-content";
import { useClinicStore } from "@/lib/store";
import { currentUser } from "@/lib/dashboard-content";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
}

function newId(prefix: string) {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${prefix}-${Date.now()}`;
}

function Chip({
  children,
  onRemove,
  tone = "neutral",
}: {
  children: React.ReactNode;
  onRemove?: () => void;
  tone?: "neutral" | "warning" | "info";
}) {
  const toneCls =
    tone === "warning"
      ? "bg-amber-500/12 text-amber-700 ring-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/30"
      : tone === "info"
        ? "bg-sky-500/12 text-sky-700 ring-sky-500/25 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-400/30"
        : "bg-muted text-foreground/80 ring-border";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-medium ring-1",
        toneCls,
      )}
    >
      {children}
      {onRemove ? (
        <button
          type="button"
          aria-label="Remove"
          onClick={onRemove}
          className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-foreground/10"
        >
          <X className="size-3" />
        </button>
      ) : null}
    </span>
  );
}

function SectionCard({
  title,
  icon: Icon,
  description,
  action,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-card-soft dark:shadow-none">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
            <Icon className="size-4" />
          </span>
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            {description ? (
              <p className="text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

function Sparkline({
  values,
  width = 96,
  height = 24,
  color = "currentColor",
}: {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
}) {
  if (values.length === 0) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = values.length > 1 ? width / (values.length - 1) : 0;
  const points = values
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
    >
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

const ATTACHMENT_ICON: Record<Attachment["type"], typeof FileText> = {
  lab: FileText,
  imaging: FileImage,
  report: FileText,
  other: FileText,
};

export function MedicalRecordPanel({ patient }: { patient: Patient }) {
  const updatePatient = useClinicStore((s) => s.updatePatient);

  const allergies = patient.allergies ?? [];
  const conditions = patient.conditions ?? [];
  const vitals = patient.vitals ?? [];
  const attachments = patient.attachments ?? [];
  const notes = patient.notes ?? [];

  const [allergyDraft, setAllergyDraft] = useState("");
  const [conditionDraft, setConditionDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [attachmentDraft, setAttachmentDraft] = useState("");
  const [vitalsDraft, setVitalsDraft] = useState({
    bp: "",
    weightKg: "",
    bloodSugar: "",
    pulse: "",
  });

  function addAllergy() {
    const v = allergyDraft.trim();
    if (!v) return;
    updatePatient(patient.id, { allergies: [...allergies, v] });
    setAllergyDraft("");
    toast.success("Allergy added", { description: v });
  }
  function removeAllergy(value: string) {
    updatePatient(patient.id, {
      allergies: allergies.filter((a) => a !== value),
    });
    toast.success("Allergy removed");
  }
  function addCondition() {
    const v = conditionDraft.trim();
    if (!v) return;
    updatePatient(patient.id, { conditions: [...conditions, v] });
    setConditionDraft("");
    toast.success("Condition added", { description: v });
  }
  function removeCondition(value: string) {
    updatePatient(patient.id, {
      conditions: conditions.filter((c) => c !== value),
    });
    toast.success("Condition removed");
  }
  function addVitals() {
    const { bp, weightKg, bloodSugar, pulse } = vitalsDraft;
    if (!bp.trim() && !weightKg && !bloodSugar && !pulse) return;
    const entry: VitalsEntry = {
      id: newId("vit"),
      date: todayIso(),
      bp: bp.trim() || "—",
      weightKg: weightKg ? Number(weightKg) : null,
      bloodSugar: bloodSugar ? Number(bloodSugar) : null,
      pulse: pulse ? Number(pulse) : null,
    };
    updatePatient(patient.id, {
      vitals: [...vitals, entry].sort((a, b) => a.date.localeCompare(b.date)),
    });
    setVitalsDraft({ bp: "", weightKg: "", bloodSugar: "", pulse: "" });
    toast.success("Vitals saved", { description: entry.date });
  }
  function addAttachment() {
    const v = attachmentDraft.trim();
    if (!v) return;
    const entry: Attachment = {
      id: newId("att"),
      name: v,
      type: "other",
      uploadedAt: todayIso(),
    };
    updatePatient(patient.id, { attachments: [entry, ...attachments] });
    setAttachmentDraft("");
    toast.success("Attachment added", { description: v });
  }
  function addNote() {
    const v = noteDraft.trim();
    if (!v) return;
    const entry: PatientNote = {
      id: newId("note"),
      body: v,
      author: currentUser.name,
      createdAt: todayIso(),
    };
    updatePatient(patient.id, { notes: [entry, ...notes] });
    setNoteDraft("");
    toast.success("Note added to chart");
  }

  const weightSeries = vitals
    .map((v) => v.weightKg)
    .filter((v): v is number => typeof v === "number");
  const sugarSeries = vitals
    .map((v) => v.bloodSugar)
    .filter((v): v is number => typeof v === "number");

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <SectionCard
        title="Allergies"
        icon={AlertTriangle}
        description="Things to avoid prescribing."
      >
        <div className="flex flex-wrap gap-1.5">
          {allergies.length === 0 ? (
            <span className="text-xs text-muted-foreground">
              No known allergies.
            </span>
          ) : (
            allergies.map((a) => (
              <Chip key={a} tone="warning" onRemove={() => removeAllergy(a)}>
                {a}
              </Chip>
            ))
          )}
        </div>
        <div className="flex gap-2">
          <Input
            value={allergyDraft}
            onChange={(e) => setAllergyDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addAllergy();
              }
            }}
            placeholder="Add allergy..."
            className="h-9 rounded-lg bg-card text-sm"
          />
          <Button
            type="button"
            onClick={addAllergy}
            disabled={!allergyDraft.trim()}
            size="sm"
            className="h-9 gap-1 rounded-lg bg-brand px-3 text-xs text-brand-foreground hover:bg-brand/90 disabled:opacity-50"
          >
            <Plus className="size-3.5" />
            Add
          </Button>
        </div>
      </SectionCard>

      <SectionCard
        title="Chronic conditions"
        icon={HeartPulse}
        description="Long-term diagnoses on file."
      >
        <div className="flex flex-wrap gap-1.5">
          {conditions.length === 0 ? (
            <span className="text-xs text-muted-foreground">
              No conditions recorded.
            </span>
          ) : (
            conditions.map((c) => (
              <Chip key={c} tone="info" onRemove={() => removeCondition(c)}>
                {c}
              </Chip>
            ))
          )}
        </div>
        <div className="flex gap-2">
          <Input
            value={conditionDraft}
            onChange={(e) => setConditionDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCondition();
              }
            }}
            placeholder="Add condition..."
            className="h-9 rounded-lg bg-card text-sm"
          />
          <Button
            type="button"
            onClick={addCondition}
            disabled={!conditionDraft.trim()}
            size="sm"
            className="h-9 gap-1 rounded-lg bg-brand px-3 text-xs text-brand-foreground hover:bg-brand/90 disabled:opacity-50"
          >
            <Plus className="size-3.5" />
            Add
          </Button>
        </div>
      </SectionCard>

      <SectionCard
        title="Vitals timeline"
        icon={HeartPulse}
        description="BP, weight, blood sugar, pulse over time."
      >
        {vitals.length === 0 ? (
          <p className="text-xs text-muted-foreground">No vitals recorded.</p>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/30 p-3 text-xs">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Weight (kg)
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    {weightSeries.at(-1) ?? "—"}
                  </div>
                </div>
                <Sparkline values={weightSeries} color="var(--brand)" />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Blood sugar
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    {sugarSeries.at(-1) ?? "—"}
                  </div>
                </div>
                <Sparkline values={sugarSeries} color="var(--brand-coral)" />
              </div>
            </div>
            <ul className="flex flex-col divide-y divide-border/60 rounded-lg border border-border bg-card text-sm">
              {[...vitals]
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((v) => (
                  <li
                    key={v.id}
                    className="grid grid-cols-[100px_1fr_1fr_1fr_1fr] items-center gap-2 px-3 py-2 text-xs"
                  >
                    <span className="text-muted-foreground">{v.date}</span>
                    <span>
                      <span className="text-[10px] text-muted-foreground">
                        BP{" "}
                      </span>
                      <span className="font-medium text-foreground">
                        {v.bp}
                      </span>
                    </span>
                    <span>
                      <span className="text-[10px] text-muted-foreground">
                        Wt{" "}
                      </span>
                      <span className="font-medium text-foreground">
                        {v.weightKg ?? "—"}
                      </span>
                    </span>
                    <span>
                      <span className="text-[10px] text-muted-foreground">
                        Sugar{" "}
                      </span>
                      <span className="font-medium text-foreground">
                        {v.bloodSugar ?? "—"}
                      </span>
                    </span>
                    <span>
                      <span className="text-[10px] text-muted-foreground">
                        Pulse{" "}
                      </span>
                      <span className="font-medium text-foreground">
                        {v.pulse ?? "—"}
                      </span>
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Input
            value={vitalsDraft.bp}
            onChange={(e) =>
              setVitalsDraft((p) => ({ ...p, bp: e.target.value }))
            }
            placeholder="BP (e.g. 130/85)"
            className="h-9 rounded-lg bg-card text-sm"
          />
          <Input
            value={vitalsDraft.weightKg}
            onChange={(e) =>
              setVitalsDraft((p) => ({ ...p, weightKg: e.target.value }))
            }
            placeholder="Weight kg"
            inputMode="decimal"
            className="h-9 rounded-lg bg-card text-sm"
          />
          <Input
            value={vitalsDraft.bloodSugar}
            onChange={(e) =>
              setVitalsDraft((p) => ({ ...p, bloodSugar: e.target.value }))
            }
            placeholder="Sugar"
            inputMode="decimal"
            className="h-9 rounded-lg bg-card text-sm"
          />
          <Input
            value={vitalsDraft.pulse}
            onChange={(e) =>
              setVitalsDraft((p) => ({ ...p, pulse: e.target.value }))
            }
            placeholder="Pulse"
            inputMode="numeric"
            className="h-9 rounded-lg bg-card text-sm"
          />
        </div>
        <Button
          type="button"
          onClick={addVitals}
          size="sm"
          className="h-9 w-fit gap-1 self-start rounded-lg bg-brand px-3 text-xs text-brand-foreground hover:bg-brand/90"
        >
          <Plus className="size-3.5" />
          Record vitals
        </Button>
      </SectionCard>

      <SectionCard
        title="Attachments"
        icon={FileImage}
        description="Lab reports, X-rays, scans."
      >
        {attachments.length === 0 ? (
          <p className="text-xs text-muted-foreground">No attachments yet.</p>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {attachments.map((a) => {
              const Icon = ATTACHMENT_ICON[a.type];
              return (
                <li key={a.id}>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[12px] font-medium text-foreground/80 ring-1 ring-border">
                    <Icon className="size-3.5" />
                    {a.name}
                    <span className="text-[10px] text-muted-foreground">
                      · {a.uploadedAt}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        <div className="flex gap-2">
          <Input
            value={attachmentDraft}
            onChange={(e) => setAttachmentDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addAttachment();
              }
            }}
            placeholder="File name (e.g. CBC report)"
            className="h-9 rounded-lg bg-card text-sm"
          />
          <Button
            type="button"
            onClick={addAttachment}
            disabled={!attachmentDraft.trim()}
            size="sm"
            className="h-9 gap-1 rounded-lg bg-brand px-3 text-xs text-brand-foreground hover:bg-brand/90 disabled:opacity-50"
          >
            <Plus className="size-3.5" />
            Add
          </Button>
        </div>
      </SectionCard>

      <SectionCard
        title="Notes"
        icon={Notebook}
        description="Free-form clinical notes."
      >
        <div className="flex flex-col gap-2">
          <textarea
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            rows={2}
            placeholder="Add a note..."
            className="min-h-[60px] resize-none rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-brand/40"
          />
          <Button
            type="button"
            onClick={addNote}
            disabled={!noteDraft.trim()}
            size="sm"
            className="h-9 w-fit gap-1 rounded-lg bg-brand px-3 text-xs text-brand-foreground hover:bg-brand/90 disabled:opacity-50"
          >
            <Plus className="size-3.5" />
            Add note
          </Button>
        </div>
        {notes.length === 0 ? null : (
          <ul className="flex flex-col gap-2">
            {notes.map((n) => (
              <li
                key={n.id}
                className="flex flex-col gap-0.5 rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs"
              >
                <p className="text-foreground/90">{n.body}</p>
                <span className="text-[10px] text-muted-foreground">
                  {n.author} · {n.createdAt}
                </span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
