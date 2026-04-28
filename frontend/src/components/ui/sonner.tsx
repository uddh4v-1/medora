"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

export function Toaster({ ...props }: ToasterProps) {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-right"
      closeButton
      richColors
      duration={4_000}
      toastOptions={{
        classNames: {
          toast:
            "group border border-border bg-popover text-popover-foreground shadow-lg",
        },
      }}
      {...props}
    />
  );
}
