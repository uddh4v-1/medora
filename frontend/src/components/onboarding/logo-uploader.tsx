"use client";

import { ImageIcon, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
};

const MAX_SIZE_MB = 2;

// Square 1:1 logo dropzone. We store the file as a base64 data URL on the
// onboarding store so it survives a refresh — when the upload endpoint is
// ready, swap in `FormData` + S3/R2 instead.
export function LogoUploader({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("That doesn't look like an image.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Logo is too big — keep it under ${MAX_SIZE_MB}MB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      onChange(typeof reader.result === "string" ? reader.result : null);
    };
    reader.readAsDataURL(file);
  }

  function onDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className="flex items-start gap-4">
      <label
        htmlFor="logo-input"
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          "group relative flex size-24 cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-muted/60 ring-1 ring-border transition-colors hover:ring-brand/40",
          dragOver && "ring-brand bg-brand/5",
        )}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt="Clinic logo"
            className="size-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <ImageIcon className="size-5" />
            <span className="text-[10px] font-medium uppercase tracking-wide">
              Logo
            </span>
          </div>
        )}
        <input
          ref={inputRef}
          id="logo-input"
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
      </label>

      <div className="flex flex-1 flex-col gap-1.5">
        <p className="text-sm font-medium text-foreground">Clinic logo</p>
        <p className="text-xs text-muted-foreground">
          Square is best — 256×256 or larger. PNG, JPG or SVG, under{" "}
          {MAX_SIZE_MB}MB.
        </p>
        <div className="mt-1 flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            className="h-8 gap-1.5"
          >
            <Upload className="size-3.5" />
            {value ? "Replace" : "Upload"}
          </Button>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(null)}
              className="h-8 gap-1.5 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
              Remove
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
