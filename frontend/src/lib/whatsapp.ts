/**
 * Click-to-WhatsApp (wa.me) — opens WhatsApp with a pre-filled draft.
 * Normalize phone to digits for wa.me (country code required; defaults India +91 for 10-digit local numbers).
 */
export function digitsForWhatsApp(phone: string): string | null {
  const d = phone.replace(/\D/g, "");
  if (!d) return null;
  if (d.length === 10) return `91${d}`;
  if (d.length === 11 && d.startsWith("0")) return `91${d.slice(1)}`;
  if (d.length === 12 && d.startsWith("91")) return d;
  if (d.length >= 10 && d.length <= 15) return d;
  return null;
}

export function buildVisitReminderText(args: {
  patientName: string;
  clinicName: string;
  visitDateLabel: string;
  timeLabel: string;
  doctor: string;
  reason: string;
}): string {
  const { patientName, clinicName, visitDateLabel, timeLabel, doctor, reason } =
    args;
  return [
    `Hi ${patientName},`,
    "",
    `This is a reminder from *${clinicName}* regarding your next visit.`,
    "",
    `📅 ${visitDateLabel}`,
    `⏰ ${timeLabel}`,
    `👨‍⚕️ ${doctor}`,
    `📋 ${reason || "Consultation"}`,
    "",
    "Please reply on WhatsApp to confirm or reschedule.",
    "",
    "Thank you.",
  ].join("\n");
}

export function whatsAppUrl(phoneDigits: string, text: string): string {
  return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(text)}`;
}

/** One line per medicine — matches demo `Medication` shape without importing dashboard-content. */
export type PrescriptionMedLine = {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string;
};

/**
 * Draft WhatsApp body for sending a prescription summary (PDF/print link optional).
 * WhatsApp does not attach files via wa.me — patients get text + optional link to your print page.
 */
export function buildPrescriptionWhatsAppText(args: {
  patientName: string;
  clinicName: string;
  rxNumber: string;
  dateLabel: string;
  doctor: string;
  diagnosis: string;
  medications: PrescriptionMedLine[];
  notes: string;
  /** Full URL to `/print/rx/...` — shown as "View / print" in the message */
  printUrl?: string;
}): string {
  const {
    patientName,
    clinicName,
    rxNumber,
    dateLabel,
    doctor,
    diagnosis,
    medications,
    notes,
    printUrl,
  } = args;
  const first = patientName.trim().split(/\s+/)[0] ?? patientName;
  const lines: string[] = [
    `Hi ${first},`,
    "",
    `Here is your prescription from *${clinicName}*.`,
    "",
    `*Prescription:* ${rxNumber}`,
    `*Date:* ${dateLabel}`,
    `*Doctor:* ${doctor}`,
    `*Diagnosis:* ${diagnosis || "—"}`,
    "",
    "*Medicines:*",
  ];
  medications.forEach((m, i) => {
    const nit = m.notes?.trim();
    lines.push(
      `${i + 1}. *${m.name}* — ${m.dosage} — ${m.frequency} — ${m.duration}${
        nit ? ` (${nit})` : ""
      }`,
    );
  });
  if (medications.length === 0) lines.push("—");
  if (notes.trim()) {
    lines.push("");
    lines.push(`*Notes:* ${notes.trim()}`);
  }
  if (printUrl) {
    lines.push("");
    lines.push(`📄 View / print: ${printUrl}`);
  }
  lines.push("");
  lines.push(`Thank you,`);
  lines.push(`*${clinicName}*`);
  return lines.join("\n");
}

export function buildClinicOutreachText(args: {
  patientName: string;
  clinicName: string;
  clinicPhone: string;
}): string {
  return [
    `Hi ${args.patientName},`,
    "",
    `This is *${args.clinicName}*. We may use WhatsApp for visit reminders and follow-ups.`,
    "",
    `Clinic line: ${args.clinicPhone}`,
    "",
    "Reply here if you need to confirm or change an appointment.",
    "",
    "Thank you.",
  ].join("\n");
}
