"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { useI18n } from "@/lib/i18n/provider";
import { useClinicStore } from "@/stores/clinic-store";
import { postLogin } from "@/services/auth.service";
import { getApiBaseUrl } from "@/services/api";

/**
 * Login form state + submission — keeps `login-form.tsx` focused on layout.
 */
export function useLoginForm() {
  const { t } = useI18n();
  const router = useRouter();
  const signIn = useClinicStore((s) => s.signIn);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [maintenanceWarning, setMaintenanceWarning] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${getApiBaseUrl()}/api/config`, { credentials: "include" })
      .then((r) => r.json())
      .then((d: { maintenanceMode?: boolean; bannerMessage?: string | null }) => {
        if (d.maintenanceMode) {
          setMaintenanceWarning(d.bannerMessage ?? "The platform is currently under maintenance.");
        }
      })
      .catch(() => undefined);
  }, []);

  const onSubmit = useCallback(
  async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email.trim() || !password.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const { ok, data } = await postLogin({
        email,
        password,
        rememberMe,
      });

      // ❌ If request failed
      if (!ok || !data?.user) {
        if (data?.code === "MAINTENANCE_MODE") {
          toast.error("Platform is under maintenance. Please try again later.");
        } else {
          toast.error(data?.error ?? t("auth.loginFailed"));
        }
        return;
      }

      // ✅ Store user in global state
      signIn({
        email: data.user.email,
        role: data.user.role,
        signedInAt: data.signedInAt ?? new Date().toISOString(),
        userId: data.user.id,
        name: data.user.name ?? "",
        clinic: data.user.clinic ?? null,
      });

      toast.success(t("auth.welcomeToast"), {
        description: data.user.email,
      });

      // ✅ Force navigation AFTER state update
      setTimeout(() => {
        router.replace("/dashboard");
      }, 50);
    } catch (error: unknown) {
      const offline =
        axios.isAxiosError(error) &&
        (error.code === "ERR_NETWORK" ||
          error.message === "Network Error");

      toast.error(
        offline ? t("auth.networkUnreachable") : t("auth.loginFailed")
      );
    } finally {
      setIsSubmitting(false);
    }
  },
  [
    email,
    password,
    rememberMe,
    isSubmitting,
    router,
    signIn,
    t,
  ]
);

  return {
    t,
    email,
    setEmail,
    password,
    setPassword,
    rememberMe,
    setRememberMe,
    isSubmitting,
    maintenanceWarning,
    onSubmit,
  };
}
