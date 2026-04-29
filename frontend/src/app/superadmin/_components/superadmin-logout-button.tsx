"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { postLogout } from "@/services/auth.service";

export function SuperAdminLogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await postLogout();
    router.replace("/login");
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
    >
      <LogOut className="size-3.5" />
      {loading ? "Logging out…" : "Logout"}
    </button>
  );
}
