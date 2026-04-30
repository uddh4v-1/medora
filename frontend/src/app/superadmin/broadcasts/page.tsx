"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Megaphone, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listBroadcasts, sendBroadcast } from "@/services/superadmin.service";
import type { BroadcastItem } from "@/services/types/superadmin.types";

const SEGMENTS = [
  { value: "all", label: "All clinic owners" },
  { value: "trial", label: "On trial" },
  { value: "active", label: "Active (paid)" },
  { value: "cancelled", label: "Cancelled" },
  { value: "starter", label: "Starter plan" },
  { value: "pro", label: "Pro plan" },
];

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });
}

export default function BroadcastsPage() {
  const [history, setHistory] = useState<BroadcastItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [segment, setSegment] = useState("all");

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    const res = await listBroadcasts({ limit: 50 });
    if (res.ok) setHistory(res.data.items);
    setLoading(false);
  }, []);

  useEffect(() => { void fetchHistory(); }, [fetchHistory]);

  async function handleSend() {
    if (!subject.trim() || !body.trim()) { toast.error("Subject and body are required"); return; }
    if (subject.trim().length > 200) { toast.error("Subject must be 200 characters or fewer"); return; }
    if (body.trim().length > 10000) { toast.error("Message body must be 10,000 characters or fewer"); return; }
    setSending(true);
    const res = await sendBroadcast({ subject: subject.trim(), body: body.trim(), segment });
    if (res.ok) {
      toast.success(`Sent to ${res.data.delivered} recipient${res.data.delivered !== 1 ? "s" : ""}`);
      setSubject(""); setBody(""); setSegment("all");
      void fetchHistory();
    } else {
      toast.error("Failed to send broadcast");
    }
    setSending(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Megaphone className="size-5 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Broadcast Messaging</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Send emails to clinic owners by segment</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Compose */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="mb-4 text-sm font-semibold text-foreground">Compose Message</p>
          <div className="flex flex-col gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Audience segment</label>
              <Select value={segment} onValueChange={setSegment}>
                <SelectTrigger className="h-9 w-full rounded-lg border-border bg-background text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{SEGMENTS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Subject</label>
              <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. New feature announcement" className="h-9 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Message body</label>
              <textarea
                value={body} onChange={e => setBody(e.target.value)}
                placeholder="Write your message here…"
                rows={6}
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <Button onClick={handleSend} disabled={sending} className="h-9 w-full gap-2">
              {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              {sending ? "Sending…" : "Send Broadcast"}
            </Button>
          </div>
        </div>

        {/* History */}
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-5 py-3.5">
            <p className="text-sm font-semibold text-foreground">Sent History</p>
          </div>
          {loading ? (
            <div className="divide-y divide-border/60">{Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-5 py-3.5"><div className="h-3 animate-pulse rounded bg-muted w-3/4 mb-1.5" /><div className="h-2.5 animate-pulse rounded bg-muted w-1/2" /></div>
            ))}</div>
          ) : history.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No broadcasts sent yet.</p>
          ) : (
            <ul className="divide-y divide-border/60 max-h-120 overflow-y-auto">
              {history.map((b) => (
                <li key={b.id} className="px-5 py-3 text-xs">
                  <p className="font-medium text-foreground truncate">{b.subject}</p>
                  <div className="mt-0.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="rounded-full bg-muted px-1.5 py-0.5 capitalize">{b.segment}</span>
                    <span>{b.recipientCount} sent</span>
                    <span>{b.sentAt ? fmt(b.sentAt) : "—"}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
