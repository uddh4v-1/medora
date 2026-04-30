"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { type ExportType, downloadClinicExport } from "@/services/clinic.service";

type ExportItem = {
  type: ExportType;
  label: string;
  description: string;
};

const EXPORTS: ExportItem[] = [
  { type: "patients", label: "Patients", description: "Name, phone, email, age, gender, address and visit dates" },
  { type: "appointments", label: "Appointments", description: "All scheduled and completed appointments with doctor and patient details" },
  { type: "prescriptions", label: "Prescriptions", description: "Prescription history including medicines, dosage and diagnosis" },
  { type: "invoices", label: "Invoices", description: "Billing records with line items, totals, discount and GST" },
];

export function DataExportSettings() {
  const [loading, setLoading] = useState<ExportType | "all" | null>(null);

  async function handleDownload(type: ExportType) {
    setLoading(type);
    const result = await downloadClinicExport(type);
    setLoading(null);
    if (result.ok) {
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} exported successfully`);
    } else {
      toast.error(result.error ?? "Export failed");
    }
  }

  async function handleDownloadAll() {
    setLoading("all");
    for (const item of EXPORTS) {
      const result = await downloadClinicExport(item.type);
      if (!result.ok) {
        toast.error(`Failed to export ${item.label}: ${result.error ?? "Unknown error"}`);
        setLoading(null);
        return;
      }
      // small gap between downloads so browser doesn't block multiple save dialogs
      await new Promise((r) => setTimeout(r, 400));
    }
    setLoading(null);
    toast.success("All data exported successfully");
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl border border-border bg-card p-6 shadow-card-soft dark:shadow-none">
        <div className="flex flex-col gap-1.5">
          <h3 className="text-base font-semibold text-foreground">Export Your Clinic Data</h3>
          <p className="text-sm text-muted-foreground">
            Download all your clinic data as CSV files that can be opened in Excel or Google Sheets.
            Each file contains one category of data.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {EXPORTS.map((item) => (
            <div
              key={item.type}
              className="flex items-center justify-between rounded-lg border border-border bg-background p-4"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <FileSpreadsheet className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                disabled={loading !== null}
                onClick={() => handleDownload(item.type)}
              >
                {loading === item.type ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Download className="size-3" />
                )}
                Download CSV
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/50 dark:bg-amber-950/20">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
              Download All Data
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Downloads all four CSV files (patients, appointments, prescriptions, invoices) one by one.
              Your browser may ask you to allow multiple downloads.
            </p>
          </div>
          <Button
            size="sm"
            className="shrink-0 gap-1.5 text-xs"
            disabled={loading !== null}
            onClick={handleDownloadAll}
          >
            {loading === "all" ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Download className="size-3" />
            )}
            Download All
          </Button>
        </div>
      </div>
    </div>
  );
}
