"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export const PALETTE_STORAGE_KEY = "medora-palette";

export const PALETTES = [
  {
    id: "medora-minimal",
    label: "Medora Minimal",
    description: "Calm clinical emerald — the original Medora look.",
    swatch: "#2d5843",
  },
  {
    id: "bold-wikipedia",
    label: "Bold Wikipedia",
    description: "Sharp, square-cornered indigo with serif accents.",
    swatch: "oklch(0.5296 0.1863 258.1459)",
  },
  {
    id: "modern-minimal",
    label: "Modern Minimal",
    description: "Bright blue, soft radii, Source Serif 4 typography.",
    swatch: "oklch(0.6231 0.1880 259.8145)",
  },
  {
    id: "blue-yellow",
    label: "Blue Yellow",
    description: "Bright yellow primary on teal accents, Poppins + Playfair.",
    swatch: "oklch(0.8535 0.1744 88.7734)",
  },
  {
    id: "warm-terracotta",
    label: "Warm Terracotta",
    description: "Editorial warm orange + muted teal, Outfit + Merriweather.",
    swatch: "oklch(0.6716 0.1368 48.5130)",
  },
  {
    id: "crimson-pop",
    label: "Crimson Pop",
    description: "Crimson-pink primary, deep navy secondary, super-rounded.",
    swatch: "oklch(0.5608 0.1952 2.7932)",
  },
] as const;

export type PaletteId = (typeof PALETTES)[number]["id"];

const PALETTE_IDS = PALETTES.map((p) => p.id) as PaletteId[];
const DEFAULT_PALETTE: PaletteId = "medora-minimal";

function isPaletteId(v: unknown): v is PaletteId {
  return typeof v === "string" && (PALETTE_IDS as string[]).includes(v);
}

function readInitialPalette(): PaletteId {
  if (typeof window === "undefined") return DEFAULT_PALETTE;
  try {
    const stored = window.localStorage.getItem(PALETTE_STORAGE_KEY);
    if (isPaletteId(stored)) return stored;
  } catch {
    /* localStorage unavailable */
  }
  return DEFAULT_PALETTE;
}

type PaletteContextValue = {
  palette: PaletteId;
  setPalette: (next: PaletteId) => void;
};

const PaletteContext = createContext<PaletteContextValue | null>(null);

export function PaletteProvider({ children }: { children: React.ReactNode }) {
  const [palette, setPaletteState] = useState<PaletteId>(readInitialPalette);

  useEffect(() => {
    document.documentElement.dataset.palette = palette;
  }, [palette]);

  const setPalette = useCallback((next: PaletteId) => {
    setPaletteState(next);
    try {
      window.localStorage.setItem(PALETTE_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <PaletteContext.Provider value={{ palette, setPalette }}>
      {children}
    </PaletteContext.Provider>
  );
}

export function usePalette() {
  const ctx = useContext(PaletteContext);
  if (!ctx) {
    throw new Error("usePalette must be used within PaletteProvider");
  }
  return ctx;
}

/**
 * Inline script that runs before React hydrates and sets data-palette on
 * <html> so the right palette tokens apply on first paint.
 */
export const PALETTE_INIT_SCRIPT = `
(function(){try{var p=localStorage.getItem(${JSON.stringify(PALETTE_STORAGE_KEY)});var allowed=${JSON.stringify(PALETTE_IDS)};if(p&&allowed.indexOf(p)>-1){document.documentElement.setAttribute("data-palette",p);}else{document.documentElement.setAttribute("data-palette",${JSON.stringify(DEFAULT_PALETTE)});}}catch(e){}})();
`.trim();
