import nodemailer from "nodemailer";

import { getEnv } from "@/config/env";
import { broadcastHtml, broadcastText } from "@/lib/email-templates/broadcast";

function smtpSecure(port: number) {
  return port === 465;
}

function normalizePassword(raw: string | undefined) {
  return raw ? raw.replace(/\s+/g, "").trim() : "";
}

export async function sendBroadcastEmails(payload: {
  clinicName: string;
  title: string;
  body: string;
  recipients: { email: string; name: string }[];
}): Promise<number> {
  const env = getEnv();
  const gmail = env.USE_GMAIL_SMTP === true;
  const mailFrom = env.MAIL_FROM?.trim();
  const host = env.SMTP_HOST?.trim();

  if (!mailFrom || (!gmail && !host)) {
    console.warn("[broadcast] SMTP not configured — emails not sent. Configure SMTP in backend/.env.");
    return 0;
  }

  let transporter: nodemailer.Transporter;
  if (gmail) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: env.SMTP_USER!.trim(), pass: normalizePassword(env.SMTP_PASSWORD) },
    });
  } else {
    const port = Number(env.SMTP_PORT ?? 587);
    const user = env.SMTP_USER?.trim() ?? "";
    const pass = normalizePassword(env.SMTP_PASSWORD);
    transporter = nodemailer.createTransport({
      host: host!,
      port,
      secure: smtpSecure(port),
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  const tmpl = { clinicName: payload.clinicName, title: payload.title, body: payload.body };
  let delivered = 0;

  for (const recipient of payload.recipients) {
    try {
      await transporter.sendMail({
        from: mailFrom!,
        to: recipient.email,
        subject: `${payload.clinicName}: ${payload.title}`,
        text: broadcastText(tmpl),
        html: broadcastHtml(tmpl),
      });
      delivered++;
    } catch (e) {
      console.error(`[broadcast] Failed to send to ${recipient.email}:`, e);
    }
  }

  return delivered;
}
