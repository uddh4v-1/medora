"use client";

import {
  ArrowLeft,
  FileText,
  Phone,
  Receipt,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useMemo } from "react";

import { WhatsappClinicOutreachButton } from "@/components/whatsapp-visit-reminder-button";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  type Invoice,
  nextInvoiceNumber,
  nextPrescriptionNumber,
  type Prescription,
} from "@/lib/dashboard-content";
import { useClinicStore, useHydrated } from "@/lib/store";
import { toast } from "sonner";

import {
  type NewInvoiceInput,
  NewInvoiceDialog,
} from "../../../billing/_components/new-invoice-dialog";
import {
  type NewPrescriptionInput,
  NewPrescriptionDialog,
} from "../../../prescriptions/_components/new-prescription-dialog";
import { BillsList } from "./bills-list";
import { MedicalRecordPanel } from "./medical-record-panel";
import { PrescriptionsList } from "./prescriptions-list";
import { VisitsList } from "./visits-list";

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
}

function avatarInitial(name: string) {
  const trimmed = name.trim();
  return trimmed ? trimmed[0]!.toUpperCase() : "?";
}

export function PatientDetailView({ patientId }: { patientId: string }) {
  const hydrated = useHydrated();
  const patient = useClinicStore((s) =>
    s.patients.find((p) => p.id === patientId),
  );
  const allVisits = useClinicStore((s) => s.visits);
  const allPrescriptions = useClinicStore((s) => s.prescriptions);
  const allInvoices = useClinicStore((s) => s.invoices);
  const addPrescription = useClinicStore((s) => s.addPrescription);
  const addInvoice = useClinicStore((s) => s.addInvoice);

  const visits = useMemo(
    () => (patient ? allVisits.filter((v) => v.patient === patient.name) : []),
    [allVisits, patient],
  );
  const rxList = useMemo(
    () =>
      patient
        ? allPrescriptions.filter((rx) => rx.patient === patient.name)
        : [],
    [allPrescriptions, patient],
  );
  const billList = useMemo(
    () =>
      patient ? allInvoices.filter((inv) => inv.patient === patient.name) : [],
    [allInvoices, patient],
  );

  if (hydrated && !patient) notFound();
  if (!patient) return null;

  function handleAddRx(input: NewPrescriptionInput) {
    const newRx: Prescription = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `rx-${Date.now()}`,
      number: nextPrescriptionNumber(allPrescriptions),
      patient: input.patientName,
      doctor: input.doctorName,
      date: todayIso(),
      diagnosis: input.diagnosis,
      medications: input.medications,
      notes: input.notes,
    };
    addPrescription(newRx);
    toast.success("Prescription created", { description: newRx.number });
  }

  function handleAddBill(input: NewInvoiceInput) {
    const newInv: Invoice = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `inv-${Date.now()}`,
      number: nextInvoiceNumber(allInvoices),
      patient: input.patientName,
      total: input.total,
      status: "unpaid",
      createdAt: todayIso(),
      items: input.items,
      discount: input.discount,
      gst: input.gstAmount,
      doctor: input.doctor,
    };
    addInvoice(newInv);
    toast.success("Invoice created", { description: newInv.number });
  }

  return (
    <div className="flex flex-col gap-5 px-6 py-6 md:px-8">
      <Link
        href="/dashboard/patients"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Patients
      </Link>

      <section className="flex flex-col items-start justify-between gap-4 rounded-xl border border-border bg-card p-5 shadow-card-soft md:flex-row md:items-center dark:shadow-none">
        <div className="flex items-center gap-4">
          <span
            aria-hidden
            className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-xl font-semibold text-brand"
          >
            {avatarInitial(patient.name)}
          </span>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {patient.name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-muted-foreground">
              {patient.phone ? (
                <span className="inline-flex items-center gap-1">
                  <Phone className="size-3.5" />
                  {patient.phone}
                </span>
              ) : null}
              {patient.age != null ? (
                <>
                  {patient.phone ? <span aria-hidden>·</span> : null}
                  <span>{patient.age} yrs</span>
                </>
              ) : null}
              {patient.gender ? (
                <>
                  {patient.phone || patient.age != null ? (
                    <span aria-hidden>·</span>
                  ) : null}
                  <span>{patient.gender}</span>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <WhatsappClinicOutreachButton patientName={patient.name} />
          <NewPrescriptionDialog
            onCreate={handleAddRx}
            defaultPatientId={patient.id}
            lockPatient
            trigger={
              <Button className="h-9 gap-1.5 rounded-full bg-brand px-4 text-sm font-medium text-brand-foreground shadow-brand hover:bg-brand/90">
                <FileText className="size-4" />
                New Rx
              </Button>
            }
          />
          <NewInvoiceDialog
            onCreate={handleAddBill}
            defaultPatientId={patient.id}
            lockPatient
            trigger={
              <Button
                variant="outline"
                className="h-9 gap-1.5 rounded-full border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-muted"
              >
                <Receipt className="size-4" />
                New bill
              </Button>
            }
          />
        </div>
      </section>

      <Tabs defaultValue="record" className="gap-4">
        <TabsList>
          <TabsTrigger value="record">Medical record</TabsTrigger>
          <TabsTrigger value="visits">Visits ({visits.length})</TabsTrigger>
          <TabsTrigger value="prescriptions">
            Prescriptions ({rxList.length})
          </TabsTrigger>
          <TabsTrigger value="bills">Bills ({billList.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="record">
          <MedicalRecordPanel patient={patient} />
        </TabsContent>

        <TabsContent value="visits">
          <VisitsList visits={visits} />
        </TabsContent>

        <TabsContent value="prescriptions">
          <PrescriptionsList prescriptions={rxList} />
        </TabsContent>

        <TabsContent value="bills">
          <BillsList bills={billList} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
