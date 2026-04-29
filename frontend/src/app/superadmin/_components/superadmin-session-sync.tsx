"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getMe } from "@/services/auth.service";

type Props = { children: React.ReactNode };

export function SuperAdminSessionSync({ children }: Props) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const { ok, data, status } = await getMe();

      if (cancelled) return;

      if (ok && data.user?.role === "SuperAdmin") {
        setReady(true);
        return;
      }

      if (status === 401 || !ok) {
        router.replace("/login");
        return;
      }

      // Authenticated but not SuperAdmin — send to clinic dashboard
      router.replace("/dashboard");
    }

    check();
    return () => { cancelled = true; };
  }, [router]);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
