"use client";

import { ArrowLeft, Eye, EyeOff, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

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
    maintenanceWarning,
    onSubmit,
  } = useLoginForm();

  const [showPassword, setShowPassword] = useState(false);

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

        {maintenanceWarning && (
          <div className="mt-6 flex items-start gap-2 rounded-lg border border-amber-400/40 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <span>{maintenanceWarning}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-5">
          {/* Email */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="text-foreground">
              {t("common.email")}
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder={t("auth.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 rounded-lg border-border bg-card px-3 text-sm shadow-sm"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-foreground">
                {t("common.password")}
              </Label>
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
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 rounded-lg border-border bg-card pr-10 pl-3 text-sm shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

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

          <p className="text-center text-xs text-muted-foreground">
            New here?{" "}
            <Link
              href="/signup"
              className="font-medium text-foreground transition-colors hover:text-brand"
            >
              Register your clinic
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
