"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";

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
import { type Gender, type Patient } from "@/lib/dashboard-content";
import { useClinicStore } from "@/stores/clinic-store";
import { createPatient } from "@/services/patients.service";
import { toast } from "sonner";
import { isValidEmail, isValidIndianPhone } from "@/lib/validation";

const fieldClass =
  "h-11 rounded-lg border-border bg-card text-sm focus-visible:ring-brand/40";

export function NewPatientDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<Gender>("Male");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  const addPatient = useClinicStore((s) => s.addPatient);
  const [saving, setSaving] = useState(false);

  function reset() {
    setName("");
    setPhone("");
    setAge("");
    setGender("Male");
    setEmail("");
    setAddress("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || saving) return;
    if (name.trim().length < 2) { toast.error("Name must be at least 2 characters"); return; }
    if (phone.trim() && !isValidIndianPhone(phone)) { toast.error("Enter a valid 10-digit Indian phone number"); return; }
    if (email.trim() && !isValidEmail(email)) { toast.error("Enter a valid email address"); return; }
    const ageNum = age ? parseInt(age, 10) : null;
    if (age && (isNaN(ageNum!) || ageNum! < 0 || ageNum! > 120)) { toast.error("Age must be between 0 and 120"); return; }
    setSaving(true);
    const res = await createPatient({
      name: name.trim(),
      phone: phone.trim(),
      age: age ? Number.parseInt(age, 10) : null,
      gender,
      email: email.trim() || undefined,
      address: address.trim() || undefined,
    });
    setSaving(false);
    if (!res.ok) {
      toast.error("Failed to add patient");
      return;
    }
    const newPatient: Patient = {
      id: res.data.id,
      name: res.data.name,
      phone: res.data.phone,
      age: res.data.age,
      gender: (res.data.gender as Patient["gender"]) ?? null,
      email: res.data.email ?? undefined,
      address: res.data.address ?? undefined,
      nextVisitDate: res.data.nextVisitDate,
    };
    addPatient(newPatient);
    reset();
    setOpen(false);
    toast.success("Patient added", { description: newPatient.name });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button className="h-9 gap-1.5 rounded-lg bg-brand px-3 text-sm font-medium text-brand-foreground shadow-brand hover:bg-brand/90">
          <Plus className="size-4" />
          Add patient
        </Button>
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden p-0 sm:max-w-lg"
      >
        <form className="flex flex-col" onSubmit={handleSubmit}>
          <div className="flex items-center justify-between gap-3 px-6 pt-6 pb-2">
            <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">
              New patient
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

          <div className="flex flex-col gap-4 px-6 py-5">
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="patient-name"
                className="text-sm font-medium text-foreground"
              >
                Full name
              </Label>
              <Input
                id="patient-name"
                autoFocus
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={fieldClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="patient-phone"
                  className="text-sm font-medium text-foreground"
                >
                  Phone
                </Label>
                <Input
                  id="patient-phone"
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={fieldClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="patient-age"
                  className="text-sm font-medium text-foreground"
                >
                  Age
                </Label>
                <Input
                  id="patient-age"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={150}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className={fieldClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="patient-gender"
                  className="text-sm font-medium text-foreground"
                >
                  Gender
                </Label>
                <Select
                  value={gender}
                  onValueChange={(v) => setGender(v as Gender)}
                >
                  <SelectTrigger
                    id="patient-gender"
                    className="h-11! w-full rounded-lg border-border bg-card text-sm"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="patient-email"
                  className="text-sm font-medium text-foreground"
                >
                  Email
                </Label>
                <Input
                  id="patient-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={fieldClass}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="patient-address"
                className="text-sm font-medium text-foreground"
              >
                Address
              </Label>
              <Input
                id="patient-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={fieldClass}
              />
            </div>
          </div>

          <div className="px-6 pt-1 pb-6">
            <Button
              type="submit"
              disabled={saving}
              className="h-11 w-full rounded-lg bg-brand text-sm font-semibold text-brand-foreground shadow-brand hover:bg-brand/90 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save patient"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
