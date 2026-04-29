"use client";

import { Plus, Trash2, X } from "lucide-react";
import { useId, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatCurrency,
  type InvoiceItem,
} from "@/lib/dashboard-content";
import { useClinicStore } from "@/stores/clinic-store";

type InvoiceLine = {
  id: string;
  description: string;
  price: number;
  quantity: number;
};

export type NewInvoiceInput = {
  patientId: string;
  patientName: string;
  doctorId: string;
  total: number;
  subtotal: number;
  discount: number;
  gstAmount: number;
  items: InvoiceItem[];
  doctor: string;
};

const fieldClass =
  "h-10 rounded-lg border-border bg-card text-sm focus-visible:ring-brand/40";

const emptyLine = (): InvoiceLine => ({
  id: crypto.randomUUID(),
  description: "",
  price: 0,
  quantity: 1,
});

const defaultLine: InvoiceLine = {
  id: "default",
  description: "Consultation",
  price: 600,
  quantity: 1,
};

export function NewInvoiceDialog({
  onCreate,
  defaultPatientId,
  trigger,
  lockPatient,
}: {
  onCreate: (input: NewInvoiceInput) => void;
  defaultPatientId?: string;
  trigger?: React.ReactNode;
  lockPatient?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [patientId, setPatientId] = useState<string>(defaultPatientId ?? "");
  const [doctorId, setDoctorId] = useState("");
  const [items, setItems] = useState<InvoiceLine[]>([defaultLine]);
  const [discount, setDiscount] = useState(0);
  const [gstPercent, setGstPercent] = useState(0);

  const fieldIdPrefix = useId();

  const { subtotal, gstAmount, total } = useMemo(() => {
    const sub = items.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0,
    );
    const gst = (sub * gstPercent) / 100;
    return {
      subtotal: sub,
      gstAmount: gst,
      total: Math.max(0, sub + gst - discount),
    };
  }, [items, discount, gstPercent]);

  function updateItem(id: string, patch: Partial<Omit<InvoiceLine, "id">>) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  function addItem() {
    setItems((prev) => [...prev, emptyLine()]);
  }

  function removeItem(id: string) {
    setItems((prev) =>
      prev.length === 1 ? prev : prev.filter((item) => item.id !== id),
    );
  }

  function resetForm() {
    setPatientId(defaultPatientId ?? "");
    setDoctorId("");
    setItems([defaultLine]);
    setDiscount(0);
    setGstPercent(0);
  }

  const patients = useClinicStore((s) => s.patients);
  const teamMembers = useClinicStore((s) => s.teamMembers);
  const doctors = useMemo(
    () => teamMembers.filter((m) => m.role === "Doctor"),
    [teamMembers],
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!patientId) return;
    const patient = patients.find((p) => p.id === patientId);
    if (!patient) return;
    const doctor = doctors.find((d) => d.id === doctorId);
    onCreate({
      patientId,
      patientName: patient.name,
      doctorId,
      total,
      subtotal,
      discount,
      gstAmount,
      items: items.map((it) => ({
        id: it.id,
        label: `${it.description}${it.quantity > 1 ? ` × ${it.quantity}` : ""}`,
        amount: it.price * it.quantity,
      })),
      doctor: doctor?.name ?? "",
    });
    resetForm();
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetForm();
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="h-9 gap-1.5 rounded-lg bg-brand px-3 text-sm font-medium text-brand-foreground shadow-brand hover:bg-brand/90">
            <Plus className="size-4" />
            New invoice
          </Button>
        )}
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden p-0 sm:max-w-xl"
      >
        <form className="flex flex-col" onSubmit={handleSubmit}>
          <div className="flex items-center justify-between gap-3 px-6 pt-6 pb-2">
            <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">
              New invoice
            </DialogTitle>
            <DialogClose asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="size-7 text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X className="size-4" />
              </Button>
            </DialogClose>
          </div>

          <div className="flex flex-col gap-5 px-6 py-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor={`${fieldIdPrefix}-patient`}
                  className="text-sm font-medium text-foreground"
                >
                  Patient
                </Label>
                <Select
                  value={patientId}
                  onValueChange={setPatientId}
                  disabled={patients.length === 0 || lockPatient}
                >
                  <SelectTrigger
                    id={`${fieldIdPrefix}-patient`}
                    className="h-10! w-full rounded-lg border-border bg-card text-sm"
                  >
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="font-medium text-foreground">
                            {p.name}
                          </span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground">{p.phone}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor={`${fieldIdPrefix}-doctor`}
                  className="text-sm font-medium text-foreground"
                >
                  Doctor
                </Label>
                <Select value={doctorId} onValueChange={setDoctorId}>
                  <SelectTrigger
                    id={`${fieldIdPrefix}-doctor`}
                    className="h-10! w-full rounded-lg border-border bg-card text-sm"
                  >
                    <SelectValue placeholder="Select doctor (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium text-foreground">
                Items
              </Label>
              <div className="flex flex-col gap-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[minmax(0,1fr)_96px_72px_auto] items-center gap-2"
                  >
                    <Input
                      aria-label="Item description"
                      value={item.description}
                      onChange={(e) =>
                        updateItem(item.id, { description: e.target.value })
                      }
                      placeholder="Item"
                      className={fieldClass}
                    />
                    <Input
                      aria-label="Price"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.01"
                      value={item.price}
                      onChange={(e) =>
                        updateItem(item.id, {
                          price: Number(e.target.value) || 0,
                        })
                      }
                      className={fieldClass}
                    />
                    <Input
                      aria-label="Quantity"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      step={1}
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(item.id, {
                          quantity: Math.max(
                            1,
                            Math.floor(Number(e.target.value) || 1),
                          ),
                        })
                      }
                      className={fieldClass}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Remove item"
                      onClick={() => removeItem(item.id)}
                      disabled={items.length === 1}
                      className="size-9 text-muted-foreground hover:text-destructive disabled:opacity-40"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-brand transition-colors hover:text-brand/80"
              >
                <Plus className="size-4" />
                Add item
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor={`${fieldIdPrefix}-discount`}
                  className="text-sm font-medium text-foreground"
                >
                  Discount (₹)
                </Label>
                <Input
                  id={`${fieldIdPrefix}-discount`}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                  className={fieldClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor={`${fieldIdPrefix}-gst`}
                  className="text-sm font-medium text-foreground"
                >
                  GST %
                </Label>
                <Input
                  id={`${fieldIdPrefix}-gst`}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={100}
                  step="0.01"
                  value={gstPercent}
                  onChange={(e) => setGstPercent(Number(e.target.value) || 0)}
                  className={fieldClass}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="text-foreground">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>GST</span>
                <span className="text-foreground">
                  {formatCurrency(gstAmount)}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between border-t border-border/60 pt-2 text-base font-semibold text-foreground">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          <div className="px-6 pt-1 pb-6">
            <Button
              type="submit"
              disabled={!patientId}
              className="h-11 w-full rounded-lg bg-brand text-sm font-semibold text-brand-foreground shadow-brand hover:bg-brand/90 disabled:opacity-50"
            >
              Create invoice
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
