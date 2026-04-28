import { Stethoscope } from "lucide-react";
import Link from "next/link";

import { siteConfig } from "@/lib/site-content";

export function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2.5 text-[15px] font-semibold text-foreground"
    >
      <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-brand-foreground shadow-brand">
        <Stethoscope className="size-[18px]" />
      </span>
      {siteConfig.name}
    </Link>
  );
}
