import { Check, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

function parsePrice(priceStr: string): number {
  return parseFloat(priceStr.replace(/[₹,]/g, "")) || 0;
}

function formatPrice(price: number): string {
  return `₹${Math.round(price).toLocaleString("en-IN")}`;
}

export type PricingCardProps = {
  name: string;
  price: string;
  annualPrice: string | null;
  discountPct?: number | null;
  cadence: string;
  features: string[];
  cta: string;
  ctaVariant: "primary" | "outline";
  highlighted: boolean;
  planId: string | null;
  // Set by parent at render time
  annual: boolean;
  onCta?: () => void;
  loading?: boolean;
  disabled?: boolean;
};

export function PricingCard({
  name,
  price,
  annualPrice,
  discountPct,
  cadence,
  features,
  cta,
  ctaVariant,
  highlighted,
  annual,
  onCta,
  loading = false,
  disabled = false,
}: PricingCardProps) {
  const monthlyPrice = parsePrice(price);
  const annualMonthlyPrice = annualPrice ? parsePrice(annualPrice) : null;
  
  // For annual: calculate original yearly (12 × monthly) and discounted yearly (12 × annual monthly)
  const originalYearlyPrice = annual && annualMonthlyPrice != null ? formatPrice(monthlyPrice * 12) : null;
  const displayYearlyPrice = annual && annualMonthlyPrice != null ? formatPrice(annualMonthlyPrice * 12) : null;
  const displayCadence = annual ? "/year" : cadence;
  const displayPrice = annual && annualMonthlyPrice != null ? displayYearlyPrice : price;
  
  return (
    <Card
      className={cn(
        "relative flex flex-col rounded-2xl border-0 bg-card p-2 transition-all",
        highlighted
          ? "ring-2 ring-brand shadow-brand-glow"
          : "ring-1 ring-border shadow-card-soft hover:ring-foreground/20 dark:shadow-none"
      )}
    >
      <CardHeader className="px-5 pt-5">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {name}
        </CardTitle>
        <div className="mt-3 flex flex-col gap-2">
          <div className="flex items-baseline gap-2">
            {originalYearlyPrice && (
              <span className="text-sm text-muted-foreground line-through">{originalYearlyPrice}</span>
            )}
            <span className="text-3xl font-semibold text-foreground">
              {displayPrice}
            </span>
            {annual && discountPct && discountPct > 0 && (
              <span className="rounded-full bg-brand/10 px-2 py-1 text-xs font-semibold text-brand">
                Save {discountPct}%
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">{displayCadence}</span>
            {annual && annualPrice && (
              <span className="rounded-md bg-brand/10 px-2 py-1 text-xs font-medium text-brand">
                {annualPrice}/month billed annually
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-5 px-5 pb-5">
        <ul className="flex flex-col gap-2.5">
          {features.map((item) => (
            <li
              key={item}
              className="flex items-center gap-2 text-sm text-foreground"
            >
              <Check className="size-4 text-brand" />
              {item}
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-2">
          {ctaVariant === "primary" ? (
            <Button
              onClick={onCta}
              disabled={disabled || loading}
              className="h-10 w-full rounded-lg bg-brand text-sm font-medium text-brand-foreground shadow-brand hover:bg-brand/90 disabled:opacity-60"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : cta}
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={onCta}
              disabled={disabled || loading}
              className="h-10 w-full rounded-lg border-border bg-card text-sm text-foreground hover:bg-accent hover:text-foreground disabled:opacity-60"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : cta}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
