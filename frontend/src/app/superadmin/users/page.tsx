"use client";

import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  KeyRound,
  Loader2,
  MailCheck,
  Search,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  forcePasswordReset,
  listUsers,
  setUserStatus,
  verifyUserEmail,
} from "@/services/superadmin.service";
import type { UserListItem } from "@/services/types/superadmin.types";

const ROLE_COLORS: Record<string, string> = {
  Owner: "bg-brand/10 text-brand",
  Doctor: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  Receptionist: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
};

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${ROLE_COLORS[role] ?? "bg-muted text-muted-foreground"}`}>
      {role}
    </span>
  );
}

function StatusBadge({ status }: { status: "active" | "suspended" }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${status === "active" ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-destructive/10 text-destructive"}`}>
      {status}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function UsersPage() {
  const [items, setItems] = useState<UserListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "Owner" | "Doctor" | "Receptionist">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all");

  const [toggling, setToggling] = useState<string | null>(null);
  const [resetting, setResetting] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const res = await listUsers({
      page,
      limit: 20,
      search: search.trim() || undefined,
      role: roleFilter === "all" ? undefined : roleFilter,
      status: statusFilter === "all" ? undefined : statusFilter,
    });
    if (res.ok) {
      setItems(res.data.items);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    }
    setLoading(false);
  }, [page, search, roleFilter, statusFilter]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  async function handleToggleStatus(user: UserListItem) {
    setToggling(user.id);
    const next = user.status === "active" ? "suspended" : "active";
    const res = await setUserStatus(user.id, next);
    if (res.ok) {
      setItems((prev) => prev.map((u) => u.id === user.id ? { ...u, status: next } : u));
      toast.success(next === "suspended" ? `${user.name} suspended` : `${user.name} reactivated`);
    } else {
      toast.error("Failed to update status");
    }
    setToggling(null);
  }

  async function handleForceReset(user: UserListItem) {
    setResetting(user.id);
    const res = await forcePasswordReset(user.id);
    if (res.ok) {
      toast.success(`Password reset email sent to ${user.email}`);
    } else {
      toast.error("Failed to send reset email");
    }
    setResetting(null);
  }

  async function handleVerifyEmail(user: UserListItem) {
    setVerifying(user.id);
    const res = await verifyUserEmail(user.id);
    if (res.ok) {
      setItems((prev) => prev.map((u) => u.id === user.id ? { ...u, emailVerified: true } : u));
      toast.success(`${user.email} marked as verified`);
    } else {
      toast.error("Failed to verify email");
    }
    setVerifying(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Users</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {total.toLocaleString()} clinic staff member{total !== 1 ? "s" : ""} across all clinics
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="h-9 w-60 rounded-lg bg-card pl-8 text-sm"
          />
        </div>

        <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v as typeof roleFilter); setPage(1); }}>
          <SelectTrigger className="h-9 w-40 rounded-lg border-border bg-card text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="Owner">Owner</SelectItem>
            <SelectItem value="Doctor">Doctor</SelectItem>
            <SelectItem value="Receptionist">Receptionist</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as typeof statusFilter); setPage(1); }}>
          <SelectTrigger className="h-9 w-40 rounded-lg border-border bg-card text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_minmax(0,0.9fr)_minmax(0,0.7fr)_minmax(0,0.7fr)_minmax(0,1.8fr)] items-center gap-3 border-b border-border bg-muted/40 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          <span>User</span>
          <span>Clinic</span>
          <span>Role</span>
          <span>Status</span>
          <span>Email</span>
          <span>Joined</span>
        </div>

        {loading ? (
          <div className="divide-y divide-border/60">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="grid grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_minmax(0,0.9fr)_minmax(0,0.7fr)_minmax(0,0.7fr)_minmax(0,1.8fr)] gap-3 px-4 py-3.5">
                {Array.from({ length: 6 }).map((_, j) => (
                  <div key={j} className="h-3 animate-pulse rounded bg-muted" style={{ width: `${50 + j * 9}%` }} />
                ))}
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="px-4 py-14 text-center text-sm text-muted-foreground">No users found.</div>
        ) : (
          <ul className="divide-y divide-border/60">
            {items.map((user) => (
              <li
                key={user.id}
                className="grid grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_minmax(0,0.9fr)_minmax(0,0.7fr)_minmax(0,0.7fr)_minmax(0,1.8fr)] items-center gap-3 px-4 py-3 text-xs"
              >
                {/* User */}
                <div className="flex flex-col gap-0.5 overflow-hidden">
                  <span className="truncate font-medium text-foreground">{user.name || "—"}</span>
                  <span className="truncate text-[11px] text-muted-foreground">{user.email}</span>
                </div>

                {/* Clinic */}
                <div className="overflow-hidden">
                  {user.clinic ? (
                    <span className="truncate text-muted-foreground">{user.clinic.name}</span>
                  ) : (
                    <span className="text-muted-foreground/40 italic">No clinic</span>
                  )}
                </div>

                {/* Role */}
                <RoleBadge role={user.role} />

                {/* Status */}
                <StatusBadge status={user.status} />

                {/* Email verified */}
                <div className="flex items-center">
                  {user.emailVerified ? (
                    <CheckCircle2 className="size-3.5 text-green-500" aria-label="Verified" />
                  ) : (
                    <span className="text-[10px] font-medium text-amber-500">Unverified</span>
                  )}
                </div>

                {/* Joined + Actions */}
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{formatDate(user.createdAt)}</span>

                  <div className="ml-auto flex items-center gap-1">
                    {/* Suspend / Activate */}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={toggling === user.id}
                      onClick={() => handleToggleStatus(user)}
                      className={`h-7 px-2 text-[11px] font-medium ${
                        user.status === "active"
                          ? "border-amber-300 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                          : "border-green-300 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20"
                      }`}
                    >
                      {toggling === user.id ? <Loader2 className="size-3 animate-spin" /> : user.status === "active" ? "Suspend" : "Activate"}
                    </Button>

                    {/* Force password reset */}
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={resetting === user.id}
                      onClick={() => handleForceReset(user)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                      title="Send password reset email"
                    >
                      {resetting === user.id ? <Loader2 className="size-3 animate-spin" /> : <KeyRound className="size-3" />}
                    </Button>

                    {/* Verify email */}
                    {!user.emailVerified && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={verifying === user.id}
                        onClick={() => handleVerifyEmail(user)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-green-600"
                        title="Mark email as verified"
                      >
                        {verifying === user.id ? <Loader2 className="size-3 animate-spin" /> : <MailCheck className="size-3" />}
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {page} of {totalPages}</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon-sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="size-8">
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="icon-sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="size-8">
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
