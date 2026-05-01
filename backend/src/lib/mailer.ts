import nodemailer from "nodemailer";
import { getEnv } from "@/config/env";

function normalizePassword(raw: string | undefined): string {
  return raw ? raw.replace(/\s+/g, "").trim() : "";
}

function buildTransporter(): nodemailer.Transporter | null {
  const env = getEnv();
  const mailFrom = env.MAIL_FROM?.trim();
  const gmail = env.USE_GMAIL_SMTP === true;
  const host = env.SMTP_HOST?.trim();

  if (!mailFrom || (!gmail && !host)) return null;

  if (gmail) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: { user: env.SMTP_USER!.trim(), pass: normalizePassword(env.SMTP_PASSWORD) },
    });
  }

  const port = Number(env.SMTP_PORT ?? 587);
  const user = env.SMTP_USER?.trim() ?? "";
  const pass = normalizePassword(env.SMTP_PASSWORD);
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
  });
}

export type MailOptions = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export async function sendMail(opts: MailOptions): Promise<void> {
  const env = getEnv();
  const transporter = buildTransporter();

  if (!transporter) {
    console.warn(`[mailer] No SMTP configured — skipping email to ${opts.to}. Subject: ${opts.subject}`);
    return;
  }

  const info = await transporter.sendMail({
    from: env.MAIL_FROM!,
    ...opts,
  });
  console.info("[mailer] Sent", { messageId: info.messageId, to: opts.to, subject: opts.subject });
}
