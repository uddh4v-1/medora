"use client";

import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

function formatDisplay(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

function shiftDay(date: Date, delta: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + delta);
  return next;
}

export function DateStepper({
  value,
  onChange,
}: {
  value: Date;
  onChange: (d: Date) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-9 rounded-lg border-border bg-card text-foreground/80 hover:bg-accent"
        onClick={() => onChange(shiftDay(value, -1))}
        aria-label="Previous day"
      >
        <ChevronLeft className="size-4" />
      </Button>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-9 gap-2 rounded-lg border-border bg-card px-3 text-sm font-normal text-foreground hover:bg-accent"
          >
            <CalendarIcon className="size-4 text-muted-foreground" />
            {formatDisplay(value)}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-auto rounded-xl p-0"
        >
          <Calendar
            mode="single"
            selected={value}
            onSelect={(next) => {
              if (next) {
                onChange(next);
                setOpen(false);
              }
            }}
            captionLayout="dropdown"
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-9 rounded-lg border-border bg-card text-foreground/80 hover:bg-accent"
        onClick={() => onChange(shiftDay(value, 1))}
        aria-label="Next day"
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
