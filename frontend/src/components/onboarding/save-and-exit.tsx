"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function SaveAndExit() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function handleConfirm() {
    setOpen(false);
    toast.success("Saved", {
      description: "Pick this up anytime from your dashboard.",
    });
    router.push("/dashboard");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Save & exit
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col gap-1">
          <DialogTitle>Pause onboarding?</DialogTitle>
          <DialogDescription>
            We&apos;ll keep your progress. You can finish setting up anytime
            from a banner on your dashboard.
          </DialogDescription>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="h-9"
          >
            Keep going
          </Button>
          <Button
            onClick={handleConfirm}
            className="h-9 bg-brand text-brand-foreground shadow-brand hover:bg-brand/90"
          >
            Save & exit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
