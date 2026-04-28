import Link from "next/link";

import { Button } from "@/components/ui/button";
import { navLinks } from "@/lib/site-content";

import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader() {
  return (
    <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5">
      <Logo />

      <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-9 text-sm text-muted-foreground md:flex">
        {navLinks.map((link) => {
          const isHash = link.href.startsWith("#");
          if (isHash) {
            return (
              <a
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            );
          }
          return (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-1.5">
        <ThemeToggle />
        <Button
          asChild
          variant="ghost"
          className="h-9 px-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Link href="/login">Sign in</Link>
        </Button>
        <Button
          asChild
          className="h-9 rounded-lg bg-brand px-4 text-sm text-brand-foreground shadow-brand hover:bg-brand/90"
        >
          <Link href="/signup">Get started</Link>
        </Button>
      </div>
    </header>
  );
}
