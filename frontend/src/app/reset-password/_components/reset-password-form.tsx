"use client";

import { ArrowLeft, Check, Circle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n/provider";
import { analyzePasswordRequirements, meetsStrongPassword } from "@/lib/password-rules";
import { cn } from "@/lib/utils";
import { postResetPassword } from "@/services/auth.service";

export function ResetPasswordForm() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const req = useMemo(() => analyzePasswordRequirements(password), [password]);
  const strong = useMemo(() => meetsStrongPassword(password), [password]);
  const passwordsMatch =
    password.length > 0 && confirm.length > 0 && password === confirm;
  const confirmTypedMismatch = confirm.length > 0 && password !== confirm;
  const canSubmit = strong && passwordsMatch;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token.trim()) return;
    if (!strong) return;
    if (!passwordsMatch) {
      toast.error(t("auth.confirmPasswordMismatch"));
      return;
    }
    setSaving(true);
    try {
      const { ok, data } = await postResetPassword({
        token: token.trim(),
        newPassword: password,
      });
      if (ok) {
        toast.success(t("auth.passwordUpdated"), {
          description: data.message ?? t("auth.passwordUpdatedDesc"),
        });
        router.push("/login");
        return;
      }
      toast.error(data.error ?? t("auth.resetInvalidOrExpired"));
    } catch {
      toast.error(t("auth.resetInvalidOrExpired"));
    } finally {
      setSaving(false);
    }
  }

  if (!token) {
    return (
      <div className="relative flex min-h-screen flex-col bg-background px-6 py-10 lg:px-16">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 self-start text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          {t("auth.backToLogin")}
        </Link>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
          <p className="text-center text-sm leading-relaxed text-muted-foreground">
            {t("auth.resetMissingToken")}
          </p>
          <Button
            asChild
            className="mt-8 h-11 w-full rounded-lg bg-brand text-sm font-medium text-brand-foreground shadow-brand"
          >
            <Link href="/login">{t("auth.backToLogin")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-background px-6 py-10 lg:px-16">
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 self-start text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        {t("auth.backToLogin")}
      </Link>

      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
        <header>
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            {t("auth.resetPageEyebrow")}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            {t("auth.resetTitle")}
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {t("auth.resetDesc")}
          </p>
        </header>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="new-pw" className="text-foreground">
              {t("auth.resetChoosePassword")}
            </Label>
            <Input
              id="new-pw"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 rounded-lg border-border bg-card px-3 text-sm shadow-sm"
            />
            <div
              className="rounded-lg border border-border bg-muted/30 px-3 py-2.5"
              aria-live="polite"
            >
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {t("auth.passwordRequirementsTitle")}
              </p>
              <ul className="space-y-1.5">
                {(
                  [
                    ["length", req.length, "auth.passwordReqLength"] as const,
                    ["upper", req.upper, "auth.passwordReqUpper"] as const,
                    ["lower", req.lower, "auth.passwordReqLower"] as const,
                    ["digit", req.digit, "auth.passwordReqDigit"] as const,
                    ["symbol", req.symbol, "auth.passwordReqSymbol"] as const,
                  ] as const
                ).map(([key, met, msgKey]) => (
                  <li
                    key={key}
                    className={cn(
                      "flex items-center gap-2 text-xs",
                      met ? "text-emerald-600 dark:text-emerald-500" : "text-muted-foreground",
                    )}
                  >
                    {met ? (
                      <Check className="size-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
                    ) : (
                      <Circle className="size-3.5 shrink-0 opacity-40" aria-hidden />
                    )}
                    {t(msgKey)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirm-pw" className="text-foreground">
              {t("auth.confirmPassword")}
            </Label>
            <Input
              id="confirm-pw"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={cn(
                "h-11 rounded-lg border-border bg-card px-3 text-sm shadow-sm",
                confirmTypedMismatch && "border-destructive/80 focus-visible:ring-destructive/30",
                passwordsMatch && "border-emerald-600/50 focus-visible:ring-emerald-600/30",
              )}
            />
            {confirmTypedMismatch && (
              <p className="text-xs text-destructive" role="status">
                {t("auth.passwordsMatchNo")}
              </p>
            )}
            {passwordsMatch && (
              <p className="text-xs text-emerald-600 dark:text-emerald-500" role="status">
                {t("auth.passwordsMatchYes")}
              </p>
            )}
          </div>
          <Button
            type="submit"
            disabled={saving || !canSubmit}
            className="mt-1 h-11 w-full rounded-lg bg-brand text-sm font-medium text-brand-foreground shadow-brand hover:bg-brand/90 disabled:opacity-60"
          >
            {saving ? t("auth.resetSaving") : t("auth.resetSubmit")}
          </Button>
        </form>
      </div>
    </div>
  );
}
