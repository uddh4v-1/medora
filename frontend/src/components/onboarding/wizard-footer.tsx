"use client";

import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  backHref?: string;
  primaryLabel?: string;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  primaryType?: "submit" | "button";
  onPrimary?: () => void;
  secondary?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
};

export function WizardFooter({
  backHref,
  primaryLabel = "Continue",
  primaryDisabled,
  primaryLoading,
  primaryType = "button",
  onPrimary,
  secondary,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "mt-10 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        {backHref ? (
          <Button
            asChild
            variant="ghost"
            className="h-10 gap-1.5 px-3 text-sm text-muted-foreground hover:text-foreground"
          >
            <Link href={backHref}>
              <ArrowLeft className="size-4" />
              Back
            </Link>
          </Button>
        ) : (
          <span className="hidden h-10 sm:block" aria-hidden />
        )}
        {secondary && (
          <button
            type="button"
            onClick={secondary.onClick}
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {secondary.label}
          </button>
        )}
      </div>

      <Button
        type={primaryType}
        onClick={onPrimary}
        disabled={primaryDisabled || primaryLoading}
        className="h-11 min-w-[160px] gap-1.5 rounded-lg bg-brand px-5 text-sm font-medium text-brand-foreground shadow-brand hover:bg-brand/90"
      >
        {primaryLoading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Saving…
          </>
        ) : (
          <>
            {primaryLabel}
            <ArrowRight className="size-4" />
          </>
        )}
      </Button>
    </div>
  );
}
