/** Inline CSS only — safest across common mail clients */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type EmailVerificationTemplateInput = {
  verifyUrl: string;
  ttlMinutes: number;
  brandName?: string;
};

export function emailVerificationPlainText(input: EmailVerificationTemplateInput): string {
  const brand = input.brandName ?? "Medora";
  const { verifyUrl, ttlMinutes } = input;
  return [
    `${brand} — verify your email`,
    "",
    `Thank you for registering with ${brand}. Please verify your email address.`,
    "",
    `Use this secure link once; it expires in roughly ${ttlMinutes} minutes:`,
    verifyUrl,
    "",
    `If you did not create a ${brand} account, you can ignore this email.`,
    "",
    `${brand}`,
  ].join("\n");
}

export function emailVerificationHtml(input: EmailVerificationTemplateInput): string {
  const brand = escapeHtml(input.brandName ?? "Medora");
  const url = escapeHtml(input.verifyUrl);
  const ttl = Math.round(Math.max(1, input.ttlMinutes));

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<meta http-equiv="X-UA-Compatible" content="IE=edge"/>
<title>${brand} — verify email</title>
<!--[if mso]><style type="text/css">body,table,td,a{font-family:'Segoe UI',Roboto,Helvetica,sans-serif!important;}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f6f8f6;-webkit-font-smoothing:antialiased;">
  <span style="display:none!important;color:transparent;height:0;max-height:0;opacity:0;overflow:hidden;mso-hide:all;">Verify your ${brand} email address using the secure link inside.</span>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f6f8f6;padding:28px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;background-color:#ffffff;border-radius:14px;border:1px solid #e6ece7;overflow:hidden;">
          <tr>
            <td style="padding:28px 32px 10px;text-align:center;background-color:#2d5843;background-image:linear-gradient(135deg,#274d3b 0%,#2d5843 55%,#3a6c52 100%);">
              <p style="margin:0;font-size:13px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.9);">${brand}</p>
              <h1 style="margin:14px 0 0;font-size:23px;line-height:1.25;color:#ffffff;font-weight:600;letter-spacing:-0.03em;">Verify your email</h1>
            </td>
          </tr>

          <tr>
            <td style="padding:26px 32px 8px;color:#1f2f28;font-size:16px;line-height:1.6;">
              <p style="margin:0 0 16px;">Thanks for signing up with ${brand}!</p>
              <p style="margin:0 0 26px;color:#5e7468;font-size:15px;line-height:1.55;">
                Please verify your email address to activate your account.
                For security, this link expires in about <strong style="color:#1f2f28;">${ttl}&nbsp;minutes</strong>.
              </p>

              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 22px;">
                <tr>
                  <td style="border-radius:10px;background-color:#2d5843;text-align:center;">
                    <a href="${url}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 32px;color:#f8fbf9;text-decoration:none;font-size:16px;font-weight:600;line-height:1.25;background-color:#2d5843;border-radius:10px;">
                      Verify email address
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 22px;color:#6f8378;font-size:13px;line-height:1.5;">Button not working? Copy and paste this link into your browser:</p>
              <p style="margin:0 0 26px;font-size:12px;line-height:1.65;word-break:break-all;color:#2d5843;background-color:#f8faf8;border-radius:10px;padding:13px 15px;border:1px solid #e6ece7;">${url}</p>

              <hr style="border:none;border-top:1px solid #e6ece7;margin:0 0 18px;border-radius:0;"/>
              <p style="margin:0;color:#809388;font-size:13px;line-height:1.55;">
                Didn&apos;t create a ${brand} account? You can safely ignore this email.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:14px 32px 28px;text-align:center;background-color:#fbfcfb;border-top:1px solid #eef3ef;">
              <p style="margin:0;font-size:12px;color:#8a9c92;">
                Sent by <strong style="font-weight:600;color:#5d7267;">${brand}</strong> · Secure account setup
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
