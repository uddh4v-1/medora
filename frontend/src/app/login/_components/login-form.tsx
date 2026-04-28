"use client";

import { ArrowLeft, MailCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n/provider";
import { useClinicStore } from "@/lib/store";
import { toast } from "sonner";

export function LoginForm() {
  const { t } = useI18n();
  const router = useRouter();
  const signIn = useClinicStore((s) => s.signIn);
  const [email, setEmail] = useState("admin@clinic.in");
  const [password, setPassword] = useState("adminadmin");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    signIn({
      email: email.trim(),
      role: "Owner",
      signedInAt: new Date().toISOString(),
    });
    toast.success(t("auth.welcomeToast"), { description: email.trim() });
    router.push("/dashboard");
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-background px-6 py-10 lg:px-16">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 self-start text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        {t("auth.backToHome")}
      </Link>

      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {t("auth.loginTitle")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("auth.welcomeBackShort")}
          </p>
        </header>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="text-foreground">
              {t("common.email")}
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="admin@clinic.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 rounded-lg border-border bg-card px-3 text-sm shadow-sm"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-foreground">
                {t("common.password")}
              </Label>
              <ForgotPasswordDialog defaultEmail={email} t={t} />
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 rounded-lg border-border bg-card px-3 text-sm shadow-sm"
            />
          </div>

          <Button
            type="submit"
            className="mt-2 h-11 w-full rounded-lg bg-brand text-sm font-medium text-brand-foreground shadow-brand hover:bg-brand/90"
          >
            {t("auth.loginCta")}
          </Button>
        </form>

        <div className="mt-8 space-y-1 font-mono text-[11px] leading-relaxed text-muted-foreground">
          <p>
            {t("auth.try")}{" "}
            <span className="text-foreground/80">
              doctor@clinic.in / doctor123
            </span>
          </p>
          <p>
            {t("auth.staff")}{" "}
            <span className="text-foreground/80">
              staff@clinic.in / staff123
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

function ForgotPasswordDialog({
  defaultEmail,
  t,
}: {
  defaultEmail: string;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(defaultEmail);
  const [status, setStatus] = useState<"idle" | "sent">("idle");

  function reset() {
    setEmail(defaultEmail);
    setStatus("idle");
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("sent");
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
        <button
          type="button"
          className="text-[11px] font-medium text-brand transition-colors hover:text-brand/80"
        >
          {t("auth.forgotPassword")}
        </button>
      </DialogTrigger>
      <DialogContent showCloseButton className="gap-3 p-6 sm:max-w-md">
        {status === "idle" ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <DialogTitle>{t("auth.resetDialogTitle")}</DialogTitle>
              <DialogDescription>
                {t("auth.resetDialogBody")}
              </DialogDescription>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="reset-email" className="text-sm font-medium">
                {t("common.email")}
              </Label>
              <Input
                id="reset-email"
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 rounded-lg border-border bg-card px-3 text-sm"
              />
            </div>
            <Button
              type="submit"
              className="mt-1 h-10 w-full rounded-lg bg-brand text-sm font-semibold text-brand-foreground shadow-brand hover:bg-brand/90"
            >
              {t("auth.sendResetLink")}
            </Button>
          </form>
        ) : (
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-brand/10 text-brand">
              <MailCheck className="size-5" />
            </span>
            <DialogTitle>{t("auth.checkInbox")}</DialogTitle>
            <DialogDescription>
              {t("auth.inboxMessage", { email })}
            </DialogDescription>
            <Button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-2 h-10 w-full rounded-lg bg-brand text-sm font-semibold text-brand-foreground shadow-brand hover:bg-brand/90"
            >
              {t("auth.gotIt")}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
