import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Feature } from "@/lib/site-content";

export function FeatureCard({ icon: Icon, title, description }: Feature) {
  return (
    <Card className="rounded-2xl border-0 bg-card p-2 ring-1 ring-border shadow-card-soft transition-all hover:ring-foreground/20 dark:shadow-none">
      <CardHeader className="px-5 pt-4">
        <span className="mb-3 flex size-9 items-center justify-center rounded-lg bg-brand/10 text-brand ring-1 ring-brand/20">
          <Icon className="size-[18px]" />
        </span>
        <CardTitle className="text-[15px] font-semibold text-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-0">
        <CardDescription className="text-sm leading-relaxed text-muted-foreground">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  );
}
