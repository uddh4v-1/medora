import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  contactChannels,
  contactFacts,
  contactMeta,
} from "@/lib/site-content";

export function ContactSection() {
  return (
    <section id="contact" className="mx-auto w-full max-w-6xl px-6 py-24">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-brand">
            {contactMeta.eyebrow}
          </p>
          <h2 className="mt-3 whitespace-pre-line text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            {contactMeta.title}
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            {contactMeta.description}
          </p>

          <ul className="mt-8 space-y-3">
            {contactFacts.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-3 text-sm text-muted-foreground"
              >
                <span className="flex size-7 items-center justify-center rounded-md bg-brand/10 text-brand ring-1 ring-brand/20">
                  <Icon className="size-3.5" />
                </span>
                {label}
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <Button
              asChild
              className="h-11 rounded-lg bg-brand px-5 text-sm font-medium text-brand-foreground shadow-brand-lg hover:bg-brand/90"
            >
              <Link href={contactMeta.primaryCta.href}>
                {contactMeta.primaryCta.label}
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="h-11 px-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Link href={contactMeta.secondaryCta.href}>
                {contactMeta.secondaryCta.label}
              </Link>
            </Button>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="overflow-hidden rounded-2xl bg-card shadow-card-soft ring-1 ring-border dark:shadow-none">
            <ul className="divide-y divide-border">
              {contactChannels.map(({ icon: Icon, label, value, href }) => {
                const isExternal = href.startsWith("http");
                return (
                  <li key={label}>
                    <Link
                      href={href}
                      target={isExternal ? "_blank" : undefined}
                      rel={isExternal ? "noreferrer noopener" : undefined}
                      className="group flex items-center gap-5 px-6 py-5 transition-colors hover:bg-accent/50"
                    >
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand ring-1 ring-brand/20 transition-colors group-hover:bg-brand/15">
                        <Icon className="size-[18px]" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                          {label}
                        </p>
                        <p className="mt-1 truncate text-base font-medium text-foreground">
                          {value}
                        </p>
                      </div>
                      <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
