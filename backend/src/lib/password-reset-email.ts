import nodemailer from "nodemailer";

import {
  passwordResetHtml,
  passwordResetPlainText,
} from "@/lib/email-templates/password-reset";
import { getEnv } from "@/config/env";

/** Port 465 uses implicit TLS; 587/25 use STARTTLS (nodemailer default). */
function smtpSecure(port: number): boolean {
  return port === 465;
}

/** Google App Passwords are often copied with spaces; SMTP expects 16 chars without spaces. */
function normalizeSmtpPassword(raw: string | undefined): string {
  if (raw === undefined) return "";
  return raw.replace(/\s+/g, "").trim();
}

/**
 * Sends a password-reset email when SMTP is configured:
 * - `USE_GMAIL_SMTP=true` + `SMTP_USER` + `SMTP_PASSWORD` (Google App Password) + `MAIL_FROM`, or
 * - `SMTP_HOST` + `MAIL_FROM` (+ optional SMTP auth).
 *
 * Otherwise logs the link only.
 */
export async function sendPasswordResetEmail(payload: {
  to: string;
  resetUrl: string;
}): Promise<void> {
  const env = getEnv();
  const gmail = env.USE_GMAIL_SMTP === true;
  const mailFrom = env.MAIL_FROM?.trim();
  const host = env.SMTP_HOST?.trim();

  const canSend =
    mailFrom &&
    (gmail || Boolean(host));

  if (!canSend) {
    console.warn(
      "[password-reset] No email sent — set USE_GMAIL_SMTP=true (+ Gmail credentials) or SMTP_HOST + MAIL_FROM in backend/.env. Link:",
    );
    console.info(payload.resetUrl);
    return;
  }

  let transporter: nodemailer.Transporter;
  if (gmail) {
    const pass = normalizeSmtpPassword(env.SMTP_PASSWORD);
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: env.SMTP_USER!.trim(),
        pass,
      },
    });
  } else {
    const port = Number(env.SMTP_PORT ?? 587);
    const user = env.SMTP_USER?.trim() ?? "";
    const pass = normalizeSmtpPassword(env.SMTP_PASSWORD);
    const auth =
      user.length > 0 && pass.length > 0 ? { user, pass } : undefined;

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
    console.error(
      "[password-reset] SMTP connection/auth failed (check USE_GMAIL_SMTP, SMTP_USER, App Password, 2FA):",
      e,
    );
    throw e;
  }

  try {
    const ttl = Number(env.PASSWORD_RESET_TTL_MINUTES ?? 60);
    const tmpl = {
      resetUrl: payload.resetUrl,
      ttlMinutes: Number.isFinite(ttl) ? ttl : 60,
      brandName: "Medora",
    };

    const info = await transporter.sendMail({
      from: mailFrom!,
      to: payload.to,
      subject: "Medora — reset your password",
      text: passwordResetPlainText(tmpl),
      html: passwordResetHtml(tmpl),
    });
    console.info(
      "[password-reset] Mail queued/sent",
      { messageId: info.messageId, to: payload.to },
    );
  } catch (e) {
    console.error("[password-reset] sendMail failed:", e);
    throw e;
  }
}
