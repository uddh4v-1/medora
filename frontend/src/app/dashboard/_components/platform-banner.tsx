"use client";

import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import { getApiBaseUrl } from "@/services/api";

export function PlatformBanner() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${getApiBaseUrl()}/api/config`, { credentials: "include" })
      .then((r) => r.json())
      .then((d: { bannerMessage?: string | null }) => {
        if (d.bannerMessage) setMessage(d.bannerMessage);
      })
      .catch(() => undefined);
  }, []);

  if (!message) return null;

  return (
    <div className="flex items-center gap-2 bg-blue-600 px-4 py-2 text-sm font-medium text-white">
      <Info className="size-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
