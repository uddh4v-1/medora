"use client";

import { Trash2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Invitee } from "@/stores/onboarding-store";

type Props = {
  value: Invitee;
  onChange: (next: Invitee) => void;
  onRemove?: () => void;
  className?: string;
};

export function InviteeRowEditor({
  value,
  onChange,
  onRemove,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-2 rounded-lg bg-card p-3 ring-1 ring-border md:grid-cols-[1.2fr_1.4fr_140px_140px_auto] md:items-center md:gap-2.5 md:p-2.5",
        className,
      )}
    >
      <Input
        placeholder="Full name"
        value={value.name}
        onChange={(e) => onChange({ ...value, name: e.target.value })}
        className="h-9"
        aria-label="Name"
      />
      <Input
        type="email"
        placeholder="email@clinic.in"
        value={value.email}
        onChange={(e) => onChange({ ...value, email: e.target.value })}
        className="h-9"
        aria-label="Email"
      />
      <Select
        value={value.role}
        onValueChange={(v) =>
          onChange({ ...value, role: v as Invitee["role"] })
        }
      >
        <SelectTrigger className="h-9 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="DOCTOR">Doctor</SelectItem>
          <SelectItem value="RECEPTIONIST">Receptionist</SelectItem>
        </SelectContent>
      </Select>
      <Input
        placeholder={value.role === "DOCTOR" ? "Specialty" : "—"}
        value={value.specialty ?? ""}
        onChange={(e) => onChange({ ...value, specialty: e.target.value })}
        disabled={value.role !== "DOCTOR"}
        className="h-9"
        aria-label="Specialty"
      />
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="flex size-9 items-center justify-center self-end rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-destructive md:self-center"
          aria-label="Remove invitee"
        >
          <Trash2 className="size-4" />
        </button>
      )}
    </div>
  );
}
