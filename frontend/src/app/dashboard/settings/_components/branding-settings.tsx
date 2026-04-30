"use client";

import { Stethoscope } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateClinic } from "@/services/clinic.service";
import { useClinicStore } from "@/stores/clinic-store";

const DEFAULT_COLOR = "#2d5843";

const PALETTE = [
  "#2d5843", "#1e40af", "#7c3aed", "#be185d",
  "#b45309", "#047857", "#0e7490", "#64748b",
];

const fieldClass =
  "h-10 rounded-lg border-border bg-card text-sm focus-visible:ring-brand/40";

export function BrandingSettings() {
  const clinicProfile = useClinicStore((s) => s.clinicProfile);
  const session = useClinicStore((s) => s.session);
  const updateClinicProfile = useClinicStore((s) => s.updateClinicProfile);

  const [logoUrl, setLogoUrl] = useState(clinicProfile?.logoUrl ?? "");
  const [brandColor, setBrandColor] = useState(clinicProfile?.brandColor ?? DEFAULT_COLOR);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (clinicProfile) {
      setLogoUrl(clinicProfile.logoUrl ?? "");
      setBrandColor(clinicProfile.brandColor ?? DEFAULT_COLOR);
    }
  }, [clinicProfile]);

  const clinicName = clinicProfile?.name ?? session?.clinic?.name ?? "Your Clinic";
  const clinicPhone = clinicProfile?.phone ?? "";
  const clinicAddress = [clinicProfile?.address, clinicProfile?.city].filter(Boolean).join(", ");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateClinic({
        logoUrl: logoUrl.trim() || null,
        brandColor: brandColor || null,
      });
      if (res.ok) {
        updateClinicProfile({ logoUrl: logoUrl.trim() || null, brandColor: brandColor || null });
        toast.success("Branding saved");
      } else {
        toast.error("Something went wrong");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-6">
      <section className="rounded-xl border border-border bg-card p-6 shadow-card-soft dark:shadow-none">
        <h3 className="mb-1 text-sm font-semibold text-foreground">Clinic logo</h3>
        <p className="mb-5 text-xs text-muted-foreground">
          Paste a public URL to your clinic logo. It will appear on prescriptions, invoices, and your public booking page.
        </p>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="logo-url" className="text-sm font-medium text-foreground">
            Logo URL
          </Label>
          <Input
            id="logo-url"
            type="url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://example.com/logo.png"
            className={fieldClass}
          />
          <p className="text-[11px] text-muted-foreground">
            Recommended: square PNG or SVG, at least 128×128 px.
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-6 shadow-card-soft dark:shadow-none">
        <h3 className="mb-1 text-sm font-semibold text-foreground">Brand color</h3>
        <p className="mb-5 text-xs text-muted-foreground">
          Used for accents on prescriptions, invoices, and the public booking page.
        </p>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setBrandColor(c)}
                className="size-8 rounded-lg border-2 transition-all"
                style={{
                  backgroundColor: c,
                  borderColor: brandColor === c ? "white" : "transparent",
                  boxShadow: brandColor === c ? `0 0 0 2px ${c}` : undefined,
                }}
                aria-label={c}
              />
            ))}
            <label className="flex size-8 cursor-pointer items-center justify-center rounded-lg border border-border bg-muted text-[10px] text-muted-foreground hover:bg-muted/70" title="Custom color">
              <span className="pointer-events-none">+</span>
              <input
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="sr-only"
              />
            </label>
          </div>
          <p className="text-[11px] text-muted-foreground">Selected: <span className="font-mono">{brandColor}</span></p>
        </div>
      </section>

      {/* Preview */}
      <section className="rounded-xl border border-border bg-card p-6 shadow-card-soft dark:shadow-none">
        <h3 className="mb-4 text-sm font-semibold text-foreground">Preview</h3>
        <div className="rounded-xl border border-border bg-background p-5">
          <div className="flex items-start gap-3">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt="Clinic logo"
                className="size-12 rounded-xl object-contain"
                style={{ background: brandColor + "1a" }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <span
                className="flex size-12 items-center justify-center rounded-xl text-white"
                style={{ backgroundColor: brandColor }}
              >
                <Stethoscope className="size-6" />
              </span>
            )}
            <div>
              <p className="text-base font-bold tracking-tight text-foreground">{clinicName}</p>
              {clinicAddress && <p className="text-xs text-muted-foreground">{clinicAddress}{clinicPhone ? ` · ${clinicPhone}` : ""}</p>}
              {!clinicAddress && clinicPhone && <p className="text-xs text-muted-foreground">{clinicPhone}</p>}
            </div>
          </div>
        </div>
      </section>

      <div>
        <Button
          type="submit"
          disabled={saving}
          className="h-9 rounded-md bg-brand px-4 text-sm font-medium text-brand-foreground shadow-brand hover:bg-brand/90 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save branding"}
        </Button>
      </div>
    </form>
  );
}
