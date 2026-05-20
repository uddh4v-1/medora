"use client";

import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  type Patient,
  type Prescription,
  type Visit,
} from "@/lib/dashboard-content";
import { cn } from "@/lib/utils";

type Props = {
  patient: Patient;
  visits: Visit[];
  prescriptions: Prescription[];
};

function formatRelative(iso: string) {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const sec = Math.max(1, Math.round((now - then) / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} min${min === 1 ? "" : "s"} ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hr${hr === 1 ? "" : "s"} ago`;
  const d = Math.round(hr / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

function buildDummySummary({
  patient,
  visits,
  prescriptions,
}: Props): string[] {
  const lines: string[] = [];

  const demoBits: string[] = [];
  if (patient.age != null) demoBits.push(`${patient.age}-year-old`);
  if (patient.gender) demoBits.push(patient.gender.toLowerCase());
  const demo = demoBits.length > 0 ? demoBits.join(" ") : "patient";

  const conditions = patient.conditions ?? [];
  const allergies = patient.allergies ?? [];
  const vitals = patient.vitals ?? [];

  // Opening line — demographics + key conditions
  const conditionsText =
    conditions.length > 0
      ? ` with a documented history of ${conditions.join(", ").toLowerCase()}`
      : "";
  lines.push(`${patient.name} is a ${demo}${conditionsText}.`);

  // Allergies
  if (allergies.length > 0) {
    lines.push(
      `Known allergies: ${allergies.join(", ")}. Confirm before any new prescription.`,
    );
  }

  // Vitals trend
  if (vitals.length > 0) {
    const latest = vitals[vitals.length - 1]!;
    const first = vitals[0]!;
    const trendParts: string[] = [];
    if (latest.bp) trendParts.push(`BP ${latest.bp}`);
    if (latest.bloodSugar != null)
      trendParts.push(`fasting sugar ${latest.bloodSugar} mg/dL`);
    if (latest.weightKg != null) trendParts.push(`weight ${latest.weightKg} kg`);
    if (latest.pulse != null) trendParts.push(`pulse ${latest.pulse}`);

    const trendLine = `Most recent readings on ${latest.date}: ${trendParts.join(", ")}.`;
    lines.push(trendLine);

    if (
      vitals.length >= 2 &&
      first.bloodSugar != null &&
      latest.bloodSugar != null
    ) {
      const delta = latest.bloodSugar - first.bloodSugar;
      if (Math.abs(delta) >= 5) {
        lines.push(
          delta < 0
            ? `Fasting sugar trending down ${Math.abs(delta)} mg/dL since ${first.date} — current management is helping.`
            : `Fasting sugar trending up ${delta} mg/dL since ${first.date} — consider revisiting medication or diet.`,
        );
      }
    }
  }

  // Visits & prescriptions
  if (visits.length > 0) {
    const recentReasons = [
      ...new Set(visits.slice(0, 5).map((v) => v.reason.toLowerCase())),
    ];
    if (recentReasons.length > 0) {
      lines.push(
        `Recent visits centered on: ${recentReasons.join("; ")}.`,
      );
    }
  }

  if (prescriptions.length > 0) {
    const latestRx = prescriptions[0]!;
    const meds = (latestRx.medications ?? [])
      .slice(0, 3)
      .map((m) => m.name)
      .filter(Boolean);
    if (meds.length > 0) {
      lines.push(
        `Currently on: ${meds.join(", ")} (last prescribed ${latestRx.date} for ${latestRx.diagnosis.toLowerCase()}).`,
      );
    }
  }

  // Closing focus
  const focusBits: string[] = [];
  if (conditions.some((c) => c.toLowerCase().includes("diabetes"))) {
    focusBits.push("glycemic control");
  }
  if (conditions.some((c) => c.toLowerCase().includes("hypertension"))) {
    focusBits.push("blood pressure");
  }
  if (focusBits.length > 0) {
    lines.push(`Focus areas this visit: ${focusBits.join(", ")}.`);
  } else {
    lines.push(
      `No active chronic concerns flagged. Proceed with routine assessment.`,
    );
  }

  return lines;
}

export function AiHistorySummary(props: Props) {
  const [summary, setSummary] = useState<string[] | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const dataSignature = useMemo(
    () =>
      `${props.patient.id}|${props.visits.length}|${props.prescriptions.length}|${
        (props.patient.vitals ?? []).length
      }`,
    [props],
  );

  async function handleGenerate() {
    setLoading(true);
    // Simulate an LLM call. Replace with real backend call later.
    await new Promise((r) => setTimeout(r, 1200));
    setSummary(buildDummySummary(props));
    setGeneratedAt(new Date().toISOString());
    setLoading(false);
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-card-soft dark:shadow-none">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
            <Sparkles className="size-4.5" />
          </span>
          <div className="flex flex-col">
            <h2 className="text-sm font-semibold text-foreground">
              AI history summary
            </h2>
            <p className="text-xs text-muted-foreground">
              A quick read of past visits, vitals, allergies and treatments.
            </p>
          </div>
        </div>

        <Button
          variant={summary ? "outline" : "default"}
          size="sm"
          onClick={handleGenerate}
          disabled={loading}
          className={cn(
            "h-8 gap-1.5 rounded-md text-xs font-medium",
            !summary &&
              "bg-brand text-brand-foreground shadow-brand hover:bg-brand/90",
          )}
        >
          {loading ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Generating…
            </>
          ) : summary ? (
            <>
              <RefreshCw className="size-3.5" />
              Refresh
            </>
          ) : (
            <>
              <Sparkles className="size-3.5" />
              Generate summary
            </>
          )}
        </Button>
      </div>

      <div className="mt-4">
        {summary ? (
          <div className="flex flex-col gap-2.5 text-sm leading-relaxed text-foreground/85">
            {summary.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
            {generatedAt && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                Generated {formatRelative(generatedAt)} · based on{" "}
                {(props.patient.vitals ?? []).length} vitals,{" "}
                {props.visits.length} visits, {props.prescriptions.length}{" "}
                prescriptions
                <span className="hidden">{dataSignature}</span>
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-5 text-center">
            <p className="text-xs text-muted-foreground">
              Click <span className="font-medium text-foreground">Generate
              summary</span> to get an AI-written overview of this patient.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
