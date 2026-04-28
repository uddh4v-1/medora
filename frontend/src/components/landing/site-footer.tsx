import Link from "next/link";

import { footerLinks, siteConfig } from "@/lib/site-content";

export function SiteFooter() {
  return (
    <footer className="mx-auto mt-auto flex w-full max-w-7xl flex-col items-center justify-between gap-3 border-t border-border px-6 py-6 text-xs text-muted-foreground sm:flex-row">
      <p>{siteConfig.copyright}</p>
      <nav className="flex items-center gap-6">
        {footerLinks.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="transition-colors hover:text-foreground"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </footer>
  );
}
