"use client";

import { Plus, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  DAY_LABEL,
  WEEK_DAYS,
  type WeekDay,
  type WorkingHours,
} from "@/lib/onboarding-store";

type Props = {
  value: WorkingHours;
  onChange: (next: WorkingHours) => void;
  className?: string;
};

// 7 rows, one per weekday. A null value means "Closed". A small "Copy Mon to
// all weekdays" link sits above the grid for the common case.
export function WorkingHoursGrid({ value, onChange, className }: Props) {
  function setDay(day: WeekDay, hours: WorkingHours[WeekDay]) {
    onChange({ ...value, [day]: hours });
  }

  function copyMondayToWeekdays() {
    const mon = value.mon;
    if (!mon) return;
    onChange({
      ...value,
      tue: { ...mon },
      wed: { ...mon },
      thu: { ...mon },
      fri: { ...mon },
    });
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Hours
        </p>
        <button
          type="button"
          onClick={copyMondayToWeekdays}
          disabled={!value.mon}
          className="text-[11px] font-medium text-brand transition-colors hover:text-brand/80 disabled:opacity-50"
        >
          Copy Mon to all weekdays
        </button>
      </div>

      <div className="flex flex-col divide-y divide-border/70 overflow-hidden rounded-lg ring-1 ring-border">
        {WEEK_DAYS.map((day) => {
          const hours = value[day];
          return (
            <div
              key={day}
              className="grid grid-cols-[60px_1fr_auto] items-center gap-3 bg-card px-3 py-2.5"
            >
              <span className="text-sm font-medium text-foreground">
                {DAY_LABEL[day]}
              </span>

              {hours ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={hours.open}
                    onChange={(e) =>
                      setDay(day, { ...hours, open: e.target.value })
                    }
                    className="h-8 w-[110px]"
                    aria-label={`${DAY_LABEL[day]} open`}
                  />
                  <span className="text-xs text-muted-foreground">→</span>
                  <Input
                    type="time"
                    value={hours.close}
                    onChange={(e) =>
                      setDay(day, { ...hours, close: e.target.value })
                    }
                    className="h-8 w-[110px]"
                    aria-label={`${DAY_LABEL[day]} close`}
                  />
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">Closed</span>
              )}

              {hours ? (
                <button
                  type="button"
                  onClick={() => setDay(day, null)}
                  className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                  aria-label={`Close ${DAY_LABEL[day]}`}
                >
                  <X className="size-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setDay(day, { open: "09:00", close: "18:00" })}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-brand transition-colors hover:bg-brand/10"
                >
                  <Plus className="size-3" />
                  Open
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
