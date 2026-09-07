export interface PasswordResetTemplateParams {
  name: string;
  code: string;
  resetUrl: string;
}

export function renderPasswordResetHtml({
  name,
  code,
  resetUrl,
}: PasswordResetTemplateParams): string {
  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Kata Sandi</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 40px 10px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; box-shadow: 0 10px 30px -5px rgba(15, 23, 42, 0.06); overflow: hidden;">
          
          <!-- Top Accent Bar -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #6366f1, #3b82f6, #10b981);"></td>
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

          <!-- Body Content -->
          <tr>
            <td style="padding: 10px 36px 20px 36px;">
              <h1 style="color: #0f172a; font-size: 20px; font-weight: 800; margin: 0 0 12px 0; text-align: center; letter-spacing: -0.3px;">Permintaan Reset Kata Sandi</h1>
              <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
                Halo <strong style="color: #0f172a;">${name}</strong>, kami menerima permintaan untuk mengatur ulang kata sandi akun Anda. Masukkan kode verifikasi 6 digit di bawah ini atau klik tombol konfirmasi:
              </p>

              <!-- 6-Digit OTP Code Box -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; text-align: center; margin: 0 0 24px 0;">
                <div style="color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; margin-bottom: 8px;">Kode Verifikasi Anda</div>
                <div style="color: #0f172a; font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 900; letter-spacing: 8px; line-height: 1;">
                  ${code}
                </div>
                <div style="color: #94a3b8; font-size: 11px; margin-top: 8px;">Berlaku selama 15 menit</div>
              </div>

              <!-- Action Button Link -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 0 0 24px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" target="_blank" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 13px 32px; border-radius: 12px; box-shadow: 0 4px 14px rgba(15, 23, 42, 0.15); text-align: center;">
                      Atur Ulang Kata Sandi Sekarang →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Safety Warning -->
              <div style="background-color: #fef2f2; border-left: 3px solid #ef4444; border-radius: 0 8px 8px 0; padding: 12px 14px; margin: 0 0 20px 0;">
                <p style="color: #991b1b; font-size: 12px; line-height: 1.5; margin: 0;">
                  <strong>Penting:</strong> Jika Anda tidak meminta reset kata sandi, abaikan email ini dengan aman. Akun Anda tetap terlindungi dan kata sandi tidak akan berubah.
                </p>
              </div>

              <p style="color: #94a3b8; font-size: 11.5px; line-height: 1.5; margin: 0; word-break: break-all;">
                Jika tombol di atas tidak dapat diklik, salin tautan berikut ke browser:<br>
                <a href="${resetUrl}" style="color: #4f46e5; text-decoration: underline;">${resetUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 36px 32px 36px; border-top: 1px solid #f1f5f9; text-align: center;">
              <p style="color: #64748b; font-size: 11px; margin: 0;">
                © 2026 Todolist-App Smart Productivity Suite. Seluruh hak cipta dilindungi.<br>
                Pesan ini dikirim secara otomatis oleh sistem keamanan.
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
