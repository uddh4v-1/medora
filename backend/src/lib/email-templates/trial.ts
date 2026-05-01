function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const BASE_STYLE = `font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f4f4f5;margin:0;padding:32px 16px`;
const CARD = `background:#fff;border-radius:12px;max-width:560px;margin:0 auto;padding:40px 36px;box-shadow:0 1px 3px rgba(0,0,0,.08)`;
const LOGO = `font-size:20px;font-weight:700;color:#0f172a;letter-spacing:-.5px`;
const H1 = `font-size:22px;font-weight:700;color:#0f172a;margin:24px 0 8px`;
const P = `font-size:15px;color:#475569;line-height:1.6;margin:0 0 16px`;
const BTN = `display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600;margin:8px 0 24px`;
const FOOTER = `font-size:12px;color:#94a3b8;margin-top:32px;text-align:center`;

// ── Trial ending soon ─────────────────────────────────────────────────────────

export type TrialEndingInput = {
  clinicName: string;
  ownerName: string;
  daysRemaining: number;
  upgradeUrl: string;
};

export function trialEndingPlainText(i: TrialEndingInput): string {
  const day = i.daysRemaining === 1 ? "1 day" : `${i.daysRemaining} days`;
  return [
    `Hi ${i.ownerName},`,
    "",
    `Your Medora free trial for ${i.clinicName} ends in ${day}.`,
    "",
    `After it expires you will lose access to your dashboard, patient records, and all clinic data until you upgrade.`,
    "",
    `Upgrade now to keep everything running without interruption:`,
    i.upgradeUrl,
    "",
    `If you have questions, reply to this email — we're happy to help.`,
    "",
    `— The Medora Team`,
  ].join("\n");
}

export function trialEndingHtml(i: TrialEndingInput): string {
  const day = i.daysRemaining === 1 ? "1 day" : `${i.daysRemaining} days`;
  const urgentColor = i.daysRemaining <= 1 ? "#ef4444" : i.daysRemaining <= 3 ? "#f59e0b" : "#3b82f6";
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="${BASE_STYLE}">
<div style="${CARD}">
  <div style="${LOGO}">Medora</div>
  <h1 style="${H1}">Your trial ends in <span style="color:${urgentColor}">${esc(day)}</span></h1>
  <p style="${P}">Hi ${esc(i.ownerName)},</p>
  <p style="${P}">Your free trial for <strong>${esc(i.clinicName)}</strong> is expiring soon. After it ends, you will lose access to your dashboard, patient records, and all clinic data.</p>
  <p style="${P}">Upgrade now to keep everything running without interruption:</p>
  <a href="${esc(i.upgradeUrl)}" style="${BTN}">View plans &amp; upgrade</a>
  <p style="${P}">Questions? Just reply to this email — we're happy to help.</p>
  <div style="${FOOTER}">Medora · You're receiving this because your clinic is on a free trial.</div>
</div>
</body></html>`;
}

// ── Trial expired ─────────────────────────────────────────────────────────────

export type TrialExpiredInput = {
  clinicName: string;
  ownerName: string;
  upgradeUrl: string;
};

export function trialExpiredPlainText(i: TrialExpiredInput): string {
  return [
    `Hi ${i.ownerName},`,
    "",
    `Your Medora free trial for ${i.clinicName} has expired.`,
    "",
    `Your data is safe and will be retained for 30 days. Upgrade now to restore full access:`,
    i.upgradeUrl,
    "",
    `— The Medora Team`,
  ].join("\n");
}

export function trialExpiredHtml(i: TrialExpiredInput): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="${BASE_STYLE}">
<div style="${CARD}">
  <div style="${LOGO}">Medora</div>
  <h1 style="${H1};color:#ef4444">Your trial has expired</h1>
  <p style="${P}">Hi ${esc(i.ownerName)},</p>
  <p style="${P}">Your free trial for <strong>${esc(i.clinicName)}</strong> has ended and access to your dashboard has been paused.</p>
  <p style="${P}">Your data is safe and will be retained for <strong>30 days</strong>. Upgrade to restore full access immediately:</p>
  <a href="${esc(i.upgradeUrl)}" style="${BTN}">Restore access now</a>
  <p style="${P}">Need help choosing a plan? Reply to this email.</p>
  <div style="${FOOTER}">Medora · Your data is kept for 30 days after trial expiry.</div>
</div>
</body></html>`;
}
