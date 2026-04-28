"use client";

import { Check, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  slug: string;
  className?: string;
  variant?: "soft" | "hero";
};

export function PublicLinkCard({ slug, className, variant = "soft" }: Props) {
  const [copied, setCopied] = useState(false);
  const url = `https://medora.app/book/${slug || "your-clinic"}`;
  const previewHref = `/book/${slug || ""}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied");
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Couldn't copy — copy it manually.");
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl p-4 ring-1",
        variant === "hero"
          ? "bg-gradient-to-br from-brand-coral/10 via-card to-brand/8 ring-brand-coral/30 shadow-card-soft"
          : "bg-muted/40 ring-border",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Your booking link
        </span>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <code className="flex-1 overflow-x-auto whitespace-nowrap rounded-md bg-background px-3 py-2 font-mono text-[13px] text-foreground ring-1 ring-border">
          {url}
        </code>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copy}
            className="h-9 gap-1.5"
          >
            {copied ? (
              <Check className="size-3.5 text-brand" />
            ) : (
              <Copy className="size-3.5" />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-9 gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <a href={previewHref} target="_blank" rel="noreferrer">
              <ExternalLink className="size-3.5" />
              Preview
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
