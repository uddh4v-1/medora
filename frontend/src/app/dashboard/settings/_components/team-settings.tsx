"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { type TeamMember } from "@/lib/dashboard-content";
import { useI18n } from "@/lib/i18n/provider";
import { useClinicStore } from "@/stores/clinic-store";
import { createTeamMember, deleteTeamMember } from "@/services/team.service";

import {
  AddStaffDialog,
  type NewTeamMemberInput,
} from "./add-staff-dialog";

const GRID =
  "grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,2fr)_minmax(0,1.5fr)_44px] items-center gap-4 px-5";

export function TeamSettings() {
  const { t } = useI18n();
  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null);
  const [saving, setSaving] = useState(false);

  const members = useClinicStore((s) => s.teamMembers);
  const addTeamMember = useClinicStore((s) => s.addTeamMember);
  const removeTeamMember = useClinicStore((s) => s.removeTeamMember);

  async function handleAdd(input: NewTeamMemberInput) {
    setSaving(true);
    const res = await createTeamMember({
      name: input.name,
      email: input.email,
      password: input.password,
      role: input.role as "Doctor" | "Receptionist",
      specialty: input.specialty || undefined,
      fee: input.fee,
    });
    setSaving(false);
    if (!res.ok) {
      const msg = (res.data as { error?: string })?.error ?? "Failed to add staff";
      toast.error(msg);
      return;
    }
    const newMember: TeamMember = {
      id: res.data.id,
      name: res.data.name,
      role: res.data.role,
      email: res.data.email,
      specialty: res.data.specialty,
      fee: res.data.fee,
    };
    addTeamMember(newMember);
    toast.success(t("team.toastAdded"), { description: newMember.name });
  }

  async function confirmRemove() {
    if (!removeTarget) return;
    const name = removeTarget.name;
    const res = await deleteTeamMember(removeTarget.id);
    setRemoveTarget(null);
    if (!res.ok) {
      toast.error("Failed to remove team member");
      return;
    }
    removeTeamMember(removeTarget.id);
    toast.success(t("team.toastRemoved"), { description: name });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <AddStaffDialog onCreate={handleAdd} />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card-soft dark:shadow-none">
        <div
          className={`${GRID} bg-muted/40 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground`}
        >
          <span>{t("team.nameCol")}</span>
          <span>{t("team.roleCol")}</span>
          <span>{t("team.emailCol")}</span>
          <span>{t("team.specialtyCol")}</span>
          <span aria-hidden />
        </div>
        <ul className="divide-y divide-border/60">
          {members.map((member) => {
            const isOwner = member.role === "Owner";
            return (
              <li
                key={member.id}
                className={`${GRID} py-3.5 text-sm transition-colors hover:bg-muted/20`}
              >
                <span className="truncate font-semibold text-foreground">
                  {member.name}
                </span>
                <span className="truncate text-muted-foreground">
                  {t(`team.role.${member.role}`)}
                </span>
                <span className="truncate text-muted-foreground">
                  {member.email}
                </span>
                <span className="truncate text-muted-foreground">
                  {member.specialty ?? "—"}
                </span>
                <span className="justify-self-end">
                  {isOwner ? null : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setRemoveTarget(member)}
                      aria-label={t("team.removeMemberAria", { name: member.name })}
                      className="size-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <AlertDialog
        open={removeTarget != null}
        onOpenChange={(o) => {
          if (!o) setRemoveTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("team.removeTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("team.removeDesc", { name: removeTarget?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction type="button" onClick={confirmRemove} disabled={saving}>
              {t("common.remove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
