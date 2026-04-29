"use client";

import { ArrowLeft, MailCheck } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n/provider";
import { postForgotPassword } from "@/services/auth.service";

export function ForgotPasswordPanel() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const prefill = searchParams.get("email")?.trim() ?? "";

  const [email, setEmail] = useState(prefill);
  const [status, setStatus] = useState<"idle" | "sent">("idle");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (prefill) setEmail(prefill);
  }, [prefill]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim() || sending) return;
    setSending(true);
    try {
      const { ok, data } = await postForgotPassword({
        email: email.trim().toLowerCase(),
      });
      if (ok) {
        setStatus("sent");
        return;
      }
      toast.error(data.error ?? t("auth.resetSendFailed"));
    } catch {
      toast.error(t("auth.resetSendFailed"));
    } finally {
      setSending(false);
    }
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
        {status === "idle" ? (
          <>
            <header>
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                {t("auth.forgotPageEyebrow")}
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                {t("auth.resetDialogTitle")}
              </h1>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {t("auth.resetDialogBody")}
              </p>
            </header>

            <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="forgot-email" className="text-foreground">
                  {t("common.email")}
                </Label>
                <Input
                  id="forgot-email"
                  type="email"
                  required
                  autoComplete="email"
                  autoFocus
                  placeholder={t("auth.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-lg border-border bg-card px-3 text-sm shadow-sm"
                />
              </div>
              <Button
                type="submit"
                disabled={sending}
                className="mt-1 h-11 w-full rounded-lg bg-brand text-sm font-medium text-brand-foreground shadow-brand hover:bg-brand/90 disabled:opacity-60"
              >
                {sending ? t("auth.sendingResetLink") : t("auth.sendResetLink")}
              </Button>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-brand/10 text-brand ring-1 ring-brand/20">
              <MailCheck className="size-7" strokeWidth={1.75} />
            </span>
            <h2 className="mt-6 text-2xl font-semibold tracking-tight text-foreground">
              {t("auth.checkInbox")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t("auth.inboxMessage", { email })}
            </p>
            <Button
              asChild
              className="mt-8 h-11 w-full rounded-lg bg-brand text-sm font-medium text-brand-foreground shadow-brand hover:bg-brand/90"
            >
              <Link href="/login">{t("auth.backToLogin")}</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
