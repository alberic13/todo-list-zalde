export interface VerificationOtpTemplateParams {
  name: string;
  code: string;
}

export function renderVerificationOtpHtml({
  name,
  code,
}: VerificationOtpTemplateParams): string {
  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verifikasi Akun</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px -5px rgba(15, 23, 42, 0.06);">
          <!-- Top Accent Bar -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #10b981, #3b82f6, #6366f1);"></td>
          </tr>

          <!-- Header / Logo (Mac dots + Todolist-App) -->
          <tr>
            <td style="padding: 32px 36px 18px 36px; text-align: center;">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center" style="margin: 0 auto;">
                <tr>
                  <td style="vertical-align: middle; padding-right: 12px;">
                    <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: #f43f5e; margin-right: 4px;"></span>
                    <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: #f5bd4f; margin-right: 4px;"></span>
                    <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: #61c554;"></span>
                  </td>
                  <td style="border-left: 1px solid #cbd5e1; padding-left: 12px; vertical-align: middle; text-align: left;">
                    <div style="color: #0f172a; font-size: 18px; font-weight: 900; letter-spacing: -0.3px; line-height: 1.15;">Todolist-App</div>
                    <div style="color: #64748b; font-size: 11px; font-weight: 500; line-height: 1.2;">Smart Productivity Suite</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 10px 36px 32px 36px;">
              <h1 style="color: #0f172a; font-size: 20px; font-weight: 800; margin: 0 0 12px 0; text-align: center; letter-spacing: -0.3px;">
                Verifikasi Alamat Email Anda
              </h1>
              <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
                Halo <strong style="color: #0f172a;">${name}</strong>, selamat datang di Todolist-App. Masukkan kode 6-digit berikut pada form pendaftaran untuk mengaktifkan akun Anda:
              </p>

              <!-- OTP Code Display Card -->
              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
                <span style="color: #15803d; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 8px;">
                  Kode Verifikasi (OTP)
                </span>
                <div style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #0f172a; font-family: monospace;">
                  ${code}
                </div>
                <span style="color: #64748b; font-size: 12px; display: block; margin-top: 8px;">
                  Berlaku selama 15 menit
                </span>
              </div>

              <!-- Info & Security -->
              <div style="background-color: #fffbeb; border-left: 3px solid #f59e0b; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                <p style="color: #92400e; font-size: 12px; line-height: 1.5; margin: 0;">
                  <strong>Perhatian:</strong> Jangan berikan kode ini kepada siapapun. Tim Todolist-App tidak pernah meminta kode OTP akun Anda.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 36px 32px 36px; border-top: 1px solid #f1f5f9; text-align: center;">
              <p style="color: #64748b; font-size: 11px; margin: 0;">
                © 2026 Todolist-App Smart Productivity Suite. Seluruh hak cipta dilindungi.<br>
                Jika Anda tidak merasa mendaftar di Todolist-App, abaikan email ini.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
