import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Plan } from "@/lib/site-content";
import { cn } from "@/lib/utils";

export function PricingCard({
  name,
  price,
  annualPrice,
  cadence,
  features,
  cta,
  ctaVariant,
  highlighted,
  annual,
}: Plan & { annual: boolean }) {
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
        <div className="mt-3 flex items-baseline gap-1">
          <span className="text-3xl font-semibold text-foreground">
            {annual ? annualPrice : price}
          </span>
          <span className="text-sm text-muted-foreground">{cadence}</span>
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
            <Button className="h-10 w-full rounded-lg bg-brand text-sm font-medium text-brand-foreground shadow-brand hover:bg-brand/90">
              {cta}
            </Button>
          ) : (
            <Button
              variant="outline"
              className="h-10 w-full rounded-lg border-border bg-card text-sm text-foreground hover:bg-accent hover:text-foreground"
            >
              {cta}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
