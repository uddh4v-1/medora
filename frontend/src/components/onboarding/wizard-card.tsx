import { cn } from "@/lib/utils";

type Props = React.ComponentProps<"section"> & {
  title?: string;
  description?: string;
};

// Used inside the wizard main pane to wrap a logical block of form fields.
// Pages can stack multiple WizardCards. Matches the soft-ringed Card primitive
// used elsewhere in the app, but exposes a built-in title/description block.
export function WizardCard({
  title,
  description,
  className,
  children,
  ...rest
}: Props) {
  return (
    <section
      {...rest}
      className={cn(
        "rounded-xl bg-card p-6 ring-1 ring-foreground/10 shadow-card-soft",
        className,
      )}
    >
      {(title || description) && (
        <header className="mb-5">
          {title && (
            <h3 className="font-heading text-[15px] font-semibold text-foreground">
              {title}
            </h3>
          )}
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </header>
      )}
      {children}
    </section>
  );
}
