import nodemailer from "nodemailer";

import {
  emailVerificationHtml,
  emailVerificationPlainText,
} from "@/lib/email-templates/email-verification";
import { getEnv } from "@/config/env";

function smtpSecure(port: number): boolean {
  return port === 465;
}

function normalizeSmtpPassword(raw: string | undefined): string {
  if (raw === undefined) return "";
  return raw.replace(/\s+/g, "").trim();
}

export async function sendVerificationEmail(payload: {
  to: string;
  verifyUrl: string;
}): Promise<void> {
  const env = getEnv();
  const gmail = env.USE_GMAIL_SMTP === true;
  const mailFrom = env.MAIL_FROM?.trim();
  const host = env.SMTP_HOST?.trim();

  const canSend = mailFrom && (gmail || Boolean(host));

  if (!canSend) {
    console.warn(
      "[email-verification] No email sent — configure SMTP in backend/.env. Link:",
    );
    console.info(payload.verifyUrl);
    return;
  }

  let transporter: nodemailer.Transporter;
  if (gmail) {
    const pass = normalizeSmtpPassword(env.SMTP_PASSWORD);
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: env.SMTP_USER!.trim(), pass },
    });
  } else {
    const port = Number(env.SMTP_PORT ?? 587);
    const user = env.SMTP_USER?.trim() ?? "";
    const pass = normalizeSmtpPassword(env.SMTP_PASSWORD);
    const auth = user.length > 0 && pass.length > 0 ? { user, pass } : undefined;
    transporter = nodemailer.createTransport({
      host: host!,
      port,
      secure: smtpSecure(port),
      auth,
    });
  }

  try {
    await transporter.verify();
  } catch (e) {
    console.error("[email-verification] SMTP connection failed:", e);
    throw e;
  }

  const ttl = Number(env.EMAIL_VERIFICATION_TTL_MINUTES ?? 60);
  const tmpl = {
    verifyUrl: payload.verifyUrl,
    ttlMinutes: Number.isFinite(ttl) ? ttl : 60,
    brandName: "Medora",
  };

  try {
    const info = await transporter.sendMail({
      from: mailFrom!,
      to: payload.to,
      subject: "Medora — verify your email address",
      text: emailVerificationPlainText(tmpl),
      html: emailVerificationHtml(tmpl),
    });
    console.info("[email-verification] Mail sent", { messageId: info.messageId, to: payload.to });
  } catch (e) {
    console.error("[email-verification] sendMail failed:", e);
    throw e;
  }
}
