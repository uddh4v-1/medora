import { Sparkles, Stethoscope } from "lucide-react";
import Link from "next/link";

import { siteConfig } from "@/lib/site-content";

const benefits = [
  "14-day free trial — no card needed",
  "Setup takes about 5 minutes",
  "Cancel anytime, your data stays yours",
];

export function SignupSidePanel() {
  return (
    <aside className="relative hidden flex-col justify-between bg-brand p-10 text-brand-foreground lg:flex">
      <Link
        href="/"
        className="flex items-center gap-2.5 text-brand-foreground"
      >
        <span className="flex size-8 items-center justify-center rounded-lg bg-white/10 text-brand-foreground">
          <Stethoscope className="size-[18px]" />
        </span>
        <span className="text-[15px] font-semibold">{siteConfig.name}</span>
      </Link>

      <div className="max-w-md">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-brand-foreground/60">
          Welcome to Medora
        </p>
        <h2 className="mt-4 text-balance text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl">
          Your calmer
          <br />
          clinic day
          <span className="text-brand-coral">.</span>
        </h2>
        <p className="mt-5 max-w-sm text-sm leading-relaxed text-brand-foreground/75">
          Appointments, prescriptions, billing and a public booking page —
          the whole front desk, on one screen.
        </p>

        <ul className="mt-8 space-y-3">
          {benefits.map((b) => (
            <li
              key={b}
              className="flex items-center gap-3 text-sm text-brand-foreground/85"
            >
              <span className="flex size-6 items-center justify-center rounded-full bg-brand-foreground/10">
                <Sparkles className="size-3 text-brand-foreground" />
              </span>
              {b}
            </li>
          ))}
        </ul>
      </div>

      <p className="font-mono text-[11px] text-brand-foreground/55">
        Already on Medora?{" "}
        <Link
          href="/login"
          className="text-brand-foreground/80 transition-colors hover:text-brand-foreground"
        >
          Log in →
        </Link>
      </p>
    </aside>
  );
}
