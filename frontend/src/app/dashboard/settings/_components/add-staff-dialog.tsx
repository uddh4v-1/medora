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
import type { TeamRole } from "@/lib/dashboard-content";
import { useI18n } from "@/lib/i18n/provider";

const fieldClass =
  "h-10 rounded-lg border-border bg-card text-sm focus-visible:ring-brand/40";

export type NewTeamMemberInput = {
  name: string;
  role: TeamRole;
  email: string;
  specialty: string;
  password: string;
  fee: number | null;
};

const ASSIGNABLE_ROLES: TeamRole[] = ["Doctor", "Receptionist"];

const DEFAULT_PASSWORD = "demo1234";

export function AddStaffDialog({
  onCreate,
}: {
  onCreate: (input: NewTeamMemberInput) => void;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState<TeamRole>("Doctor");
  const [email, setEmail] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [password, setPassword] = useState(DEFAULT_PASSWORD);
  const [fee, setFee] = useState<number | "">("");

  const isDoctor = role === "Doctor";

  function reset() {
    setName("");
    setRole("Doctor");
    setEmail("");
    setSpecialty("");
    setPassword(DEFAULT_PASSWORD);
    setFee("");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) return;
    onCreate({
      name: name.trim(),
      role,
      email: email.trim(),
      specialty: isDoctor ? specialty.trim() : "",
      password: password.trim(),
      fee: isDoctor && typeof fee === "number" ? fee : null,
    });
    reset();
    setOpen(false);
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
          {t("team.addStaff")}
        </Button>
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden p-0 sm:max-w-lg"
      >
        <form className="flex flex-col" onSubmit={handleSubmit}>
          <div className="flex items-center justify-between gap-3 px-6 pt-6 pb-2">
            <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">
              {t("team.addStaffTitle")}
            </DialogTitle>
            <DialogClose asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="size-7 text-muted-foreground hover:text-foreground"
                aria-label={t("common.close")}
              >
                <X className="size-4" />
              </Button>
            </DialogClose>
          </div>

          <div className="flex flex-col gap-4 px-6 py-5">
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="staff-role"
                className="text-sm font-medium text-foreground"
              >
                {t("common.role")}
              </Label>
              <Select
                value={role}
                onValueChange={(next) => setRole(next as TeamRole)}
              >
                <SelectTrigger
                  id="staff-role"
                  className="!h-10 w-full rounded-lg border-border bg-card text-sm"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSIGNABLE_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {t(`team.role.${r}` as "team.role.Doctor" | "team.role.Receptionist")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="staff-name"
                className="text-sm font-medium text-foreground"
              >
                {t("common.name")}
              </Label>
              <Input
                id="staff-name"
                autoFocus
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={fieldClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="staff-email"
                className="text-sm font-medium text-foreground"
              >
                {t("common.email")}
              </Label>
              <Input
                id="staff-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={fieldClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="staff-password"
                className="text-sm font-medium text-foreground"
              >
                {t("common.password")}
              </Label>
              <Input
                id="staff-password"
                type="text"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={fieldClass}
              />
            </div>

            {isDoctor ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="staff-specialty"
                    className="text-sm font-medium text-foreground"
                  >
                    {t("team.specialtyCol")}
                  </Label>
                  <Input
                    id="staff-specialty"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className={fieldClass}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="staff-fee"
                    className="text-sm font-medium text-foreground"
                  >
                    {t("team.fee")}
                  </Label>
                  <Input
                    id="staff-fee"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    value={fee}
                    onChange={(e) => {
                      const v = e.target.value;
                      setFee(v === "" ? "" : Number(v));
                    }}
                    placeholder="600"
                    className={fieldClass}
                  />
                </div>
              </div>
            ) : null}
          </div>

          <div className="px-6 pt-1 pb-6">
            <Button
              type="submit"
              className="h-11 w-full rounded-lg bg-brand text-sm font-semibold text-brand-foreground shadow-brand hover:bg-brand/90"
            >
              {t("common.add")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
