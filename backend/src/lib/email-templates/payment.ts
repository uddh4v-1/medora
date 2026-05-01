function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const BASE_STYLE = `font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f4f4f5;margin:0;padding:32px 16px`;
const CARD = `background:#fff;border-radius:12px;max-width:560px;margin:0 auto;padding:40px 36px;box-shadow:0 1px 3px rgba(0,0,0,.08)`;
const LOGO = `font-size:20px;font-weight:700;color:#0f172a;letter-spacing:-.5px`;
const H1 = `font-size:22px;font-weight:700;color:#0f172a;margin:24px 0 8px`;
const P = `font-size:15px;color:#475569;line-height:1.6;margin:0 0 16px`;
const BTN = `display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600;margin:8px 0 24px`;
const ROW = `display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:14px`;
const FOOTER = `font-size:12px;color:#94a3b8;margin-top:32px;text-align:center`;

export type PaymentConfirmedInput = {
  clinicName: string;
  ownerName: string;
  plan: string;
  amountRupees: number;
  periodEnd: string;
  dashboardUrl: string;
};

export function paymentConfirmedPlainText(i: PaymentConfirmedInput): string {
  return [
    `Hi ${i.ownerName},`,
    "",
    `Payment confirmed! Your ${i.plan} plan for ${i.clinicName} is now active.`,
    "",
    `Amount paid: ₹${i.amountRupees.toLocaleString("en-IN")}`,
    `Plan: ${i.plan}`,
    `Next renewal: ${i.periodEnd}`,
    "",
    `Go to your dashboard:`,
    i.dashboardUrl,
    "",
    `Thank you for choosing Medora.`,
    "",
    `— The Medora Team`,
  ].join("\n");
}

export function paymentConfirmedHtml(i: PaymentConfirmedInput): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="${BASE_STYLE}">
<div style="${CARD}">
  <div style="${LOGO}">Medora</div>
  <h1 style="${H1}">Payment confirmed ✓</h1>
  <p style="${P}">Hi ${esc(i.ownerName)}, your <strong>${esc(i.plan)}</strong> plan for <strong>${esc(i.clinicName)}</strong> is now active.</p>
  <div style="background:#f8fafc;border-radius:8px;padding:16px 20px;margin:20px 0">
    <div style="${ROW}"><span style="color:#64748b">Plan</span><strong style="color:#0f172a">${esc(i.plan)}</strong></div>
    <div style="${ROW}"><span style="color:#64748b">Amount paid</span><strong style="color:#0f172a">₹${i.amountRupees.toLocaleString("en-IN")}</strong></div>
    <div style="${ROW};border-bottom:none"><span style="color:#64748b">Next renewal</span><strong style="color:#0f172a">${esc(i.periodEnd)}</strong></div>
  </div>
  <a href="${esc(i.dashboardUrl)}" style="${BTN}">Go to dashboard</a>
  <p style="${P}">Thank you for choosing Medora. If you have any questions, just reply to this email.</p>
  <div style="${FOOTER}">Medora · Keep this email as your payment receipt.</div>
</div>
</body></html>`;
}
