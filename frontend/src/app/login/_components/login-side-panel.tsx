import { Stethoscope } from "lucide-react";
import Link from "next/link";

import { siteConfig } from "@/lib/site-content";

export function LoginSidePanel() {
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
          A calmer clinic day
        </p>
        <h2 className="mt-4 text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl">
          Token 07
          <br />
          is being seen.
        </h2>
        <p className="mt-5 max-w-sm text-sm leading-relaxed text-brand-foreground/70">
          Log in to see today&apos;s queue, open patient files, write
          prescriptions, and share them over WhatsApp.
        </p>
      </div>

      <p className="font-mono text-[11px] text-brand-foreground/55">
        Demo credentials → admin@clinic.in / admin123
      </p>
    </aside>
  );
}
