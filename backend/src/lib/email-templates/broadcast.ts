export function broadcastHtml(p: { clinicName: string; title: string; body: string }) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${p.title}</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);">
        <tr><td style="background:#0ea5e9;padding:24px 32px;">
          <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;">${p.clinicName}</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#0f172a;">${p.title}</h1>
          <p style="margin:0;font-size:15px;line-height:1.7;color:#475569;white-space:pre-line;">${p.body}</p>
        </td></tr>
        <tr><td style="padding:16px 32px 32px;border-top:1px solid #f1f5f9;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">You are receiving this message from ${p.clinicName} via Medora. Reply to this email to contact the clinic.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function broadcastText(p: { clinicName: string; title: string; body: string }) {
  return `${p.clinicName}\n\n${p.title}\n\n${p.body}\n\n---\nYou are receiving this message from ${p.clinicName} via Medora.`;
}
