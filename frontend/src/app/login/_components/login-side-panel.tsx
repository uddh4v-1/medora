import type { ReactNode } from "react";
import { Stethoscope } from "lucide-react";
import Link from "next/link";

import { siteConfig } from "@/lib/site-content";
import { cn } from "@/lib/utils";

export type LoginSideVariant = "login" | "reset" | "forgot";

const HERO: Record<
  LoginSideVariant,
  { eyebrow: string; title: ReactNode; body: string }
> = {
  login: {
    eyebrow: "A calmer clinic day",
    title: (
      <>
        Token 07
        <br />
        is being seen.
      </>
    ),
    body: "Log in to see today’s queue, open patient files, write prescriptions, and share them over WhatsApp.",
  },
  reset: {
    eyebrow: "Password recovery",
    title: (
      <>
        Set a new password
        <br />
        you’ll remember.
      </>
    ),
    body: "Choose a strong password you haven’t used on other sites. The link we email you expires after a while for your safety.",
  },
  forgot: {
    eyebrow: "Can’t sign in?",
    title: (
      <>
        We’ll email you
        <br />a reset link.
      </>
    ),
    body: "Enter the email your clinic owner account uses. If it matches an account, you’ll receive a link to choose a new password.",
  },
};

type Props = {
  variant?: LoginSideVariant;
  className?: string;
};

export function LoginSidePanel({ variant = "login", className }: Props) {
  const h = HERO[variant];

  return (
    <aside
      className={cn(
        "relative hidden min-h-screen flex-col bg-brand p-10 text-brand-foreground lg:flex",
        className,
      )}
    >
      <div className="shrink-0">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 text-brand-foreground"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-white/10 text-brand-foreground">
            <Stethoscope className="size-[18px]" />
          </span>
          <span className="text-[15px] font-semibold">{siteConfig.name}</span>
        </Link>
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-center py-10">
        <div className="max-w-md">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-brand-foreground/60">
            {h.eyebrow}
          </p>
          <h2 className="mt-4 text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl">
            {h.title}
          </h2>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-brand-foreground/70">
            {h.body}
          </p>
        </div>
      </div>
    </aside>
  );
}
