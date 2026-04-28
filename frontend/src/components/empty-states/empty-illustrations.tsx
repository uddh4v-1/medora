import { cn } from "@/lib/utils";

export function EmptyPatientsIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-brand", className)}
      aria-hidden
    >
      <rect
        x="32"
        y="36"
        width="136"
        height="100"
        rx="12"
        className="stroke-border fill-card"
        strokeWidth="1.5"
      />
      <path
        d="M70 64c0-5.5 4.5-10 10-10s10 4.5 10 10-4.5 10-10 10-10-4.5-10-10Z"
        className="fill-brand/15 stroke-brand/40"
        strokeWidth="1.2"
      />
      <path
        d="M60 120c6-12 20-20 32-20s26 8 32 20"
        className="stroke-brand/35"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <rect x="100" y="70" width="40" height="4" rx="2" className="fill-muted-foreground/25" />
      <rect x="100" y="80" width="32" height="3" rx="1.5" className="fill-muted-foreground/20" />
      <circle cx="156" cy="48" r="10" className="fill-brand/20 stroke-brand/30" strokeWidth="1" />
      <path d="M152 48h8M156 44v8" className="stroke-brand/60" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function EmptyQueueIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-sky-600", className)}
      aria-hidden
    >
      <rect x="40" y="32" width="120" height="100" rx="10" className="stroke-border fill-card" strokeWidth="1.5" />
      <path
        d="M64 100h72M64 80h50M64 60h64"
        className="stroke-muted-foreground/30"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <rect x="56" y="48" width="32" height="8" rx="2" className="fill-brand/15" />
      <rect x="100" y="50" width="40" height="4" rx="1" className="fill-muted-foreground/20" />
      <path
        d="M100 24v-8a8 8 0 0 1 8-8h0a8 8 0 0 1 8 8v8"
        className="stroke-brand/40"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function EmptyBillingIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-amber-600/90", className)}
      aria-hidden
    >
      <path
        d="M48 40h104a6 6 0 0 1 6 6v80a6 6 0 0 1-6 6H48a6 6 0 0 1-6-6V46a6 6 0 0 1 6-6Z"
        className="stroke-border fill-card"
        strokeWidth="1.5"
      />
      <path d="M56 64h80M56 80h64M56 96h48" className="stroke-muted-foreground/25" strokeWidth="1.2" />
      <rect x="120" y="110" width="32" height="10" rx="2" className="fill-brand/20 stroke-brand/35" strokeWidth="1" />
      <path d="M72 32V28a4 4 0 0 1 4-4h48a4 4 0 0 1 4 4v4" className="stroke-brand/30" strokeWidth="1.2" />
    </svg>
  );
}

export function EmptyPrescriptionsIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-amber-600/80", className)}
      aria-hidden
    >
      <rect x="56" y="32" width="88" height="100" rx="6" className="stroke-border fill-card" strokeWidth="1.5" />
      <path
        d="M68 50h64M68 64h64M68 78h48M68 92h56"
        className="stroke-muted-foreground/30"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <rect x="72" y="110" width="20" height="8" rx="2" className="fill-brand/25" />
      <circle cx="140" cy="48" r="6" className="fill-brand/20" />
      <path
        d="M138 48h4M140 44v8"
        className="stroke-brand/50"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function EmptyGenericIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-brand", className)}
      aria-hidden
    >
      <circle cx="100" cy="72" r="36" className="stroke-border fill-muted/30" strokeWidth="1.5" />
      <path
        d="M88 64h24M100 58v20"
        className="stroke-brand/50"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <rect x="64" y="110" width="72" height="6" rx="2" className="fill-muted-foreground/20" />
      <rect x="76" y="122" width="48" height="4" rx="1" className="fill-muted-foreground/15" />
    </svg>
  );
}
