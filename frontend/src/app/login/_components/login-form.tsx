"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useLoginForm } from "../_hooks/use-login-form";

export function LoginForm() {
  const {
    t,
    email,
    setEmail,
    password,
    setPassword,
    rememberMe,
    setRememberMe,
    isSubmitting,
    onSubmit,
  } = useLoginForm();

  const textFields = [
    {
      id: "email" as const,
      type: "email" as const,
      label: t("common.email"),
      autoComplete: "email" as const,
      placeholder: t("auth.emailPlaceholder"),
      value: email,
      setValue: setEmail,
    },
    {
      id: "password" as const,
      type: "password" as const,
      label: t("common.password"),
      autoComplete: "current-password" as const,
      placeholder: "••••••••",
      value: password,
      setValue: setPassword,
      headerExtra: (
        <Link
          href={
            email.trim()
              ? `/forgot-password?email=${encodeURIComponent(email.trim())}`
              : "/forgot-password"
          }
          className="text-[11px] font-medium text-brand transition-colors hover:text-brand/80"
        >
          {t("auth.forgotPassword")}
        </Link>
      ),
    },
  ];

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

        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-5">
          {textFields.map((field) => (
            <div key={field.id} className="flex flex-col gap-2">
              {field.headerExtra ? (
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor={field.id}
                    className="text-foreground"
                  >
                    {field.label}
                  </Label>
                  {field.headerExtra}
                </div>
              ) : (
                <Label
                  htmlFor={field.id}
                  className="text-foreground"
                >
                  {field.label}
                </Label>
              )}
              <Input
                id={field.id}
                type={field.type}
                autoComplete={field.autoComplete}
                placeholder={field.placeholder}
                value={field.value}
                onChange={(e) => field.setValue(e.target.value)}
                className="h-11 rounded-lg border-border bg-card px-3 text-sm shadow-sm"
              />
            </div>
          ))}

          <div className="flex items-center gap-2.5">
            <input
              type="checkbox"
              id="remember-me"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="size-4 shrink-0 cursor-pointer rounded border border-border bg-card accent-brand"
            />
            <Label
              htmlFor="remember-me"
              className="cursor-pointer text-sm font-normal leading-none text-muted-foreground"
            >
              {t("auth.rememberMe")}
            </Label>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 h-11 w-full rounded-lg bg-brand text-sm font-medium text-brand-foreground shadow-brand hover:bg-brand/90 disabled:opacity-60"
          >
            {isSubmitting ? t("auth.signingIn") : t("auth.loginCta")}
          </Button>
        </form>
      </div>
    </div>
  );
}
