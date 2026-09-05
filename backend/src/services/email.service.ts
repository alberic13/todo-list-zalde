import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../config/env";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export class EmailService {
  private static transporter: Transporter | null = null;

  private static getTransporter(): Transporter | null {
    if (!this.transporter && env.GMAIL_USER && env.GMAIL_APP_PASSWORD) {
      this.transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: env.GMAIL_USER,
          pass: env.GMAIL_APP_PASSWORD,
        },
      });
    }
    return this.transporter;
  }

  /**
   * Core send email method (Gmail SMTP primary, Resend secondary, simulation fallback)
   */
  static async sendEmail({ to, subject, html }: SendEmailOptions): Promise<{ success: boolean; id?: string; simulated?: boolean; provider?: string }> {
    // 1. Primary: Gmail SMTP (No custom domain required, can send to ANY recipient!)
    const transporter = this.getTransporter();
    if (transporter) {
      try {
        const info = await transporter.sendMail({
          from: env.EMAIL_FROM || `"Zalde Todo AI" <${env.GMAIL_USER}>`,
          to,
          subject,
          html,
        });
        console.log(`[Gmail SMTP Success] Message sent to ${to}: ${info.messageId}`);
        return { success: true, id: info.messageId, provider: "gmail" };
      } catch (err: any) {
        console.error("[Gmail SMTP Error]", err);
        throw new Error(`Gagal mengirim email via Gmail SMTP: ${err.message || err}`);
      }
    }

    // Fallback: Simulated log in development/testing if no GMAIL credentials configured
    console.log("------------------------------------------------------------");
    console.log(`📨 [SIMULATED EMAIL - NO ACTIVE GMAIL CONFIG]`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log("------------------------------------------------------------");
    return { success: true, simulated: true };
  }

  /**
   * Password Reset Email with 6-digit OTP code + direct 1-click link
   */
  static async sendPasswordResetEmail({
    to,
    name,
    code,
    resetUrl,
  }: {
    to: string;
    name: string;
    code: string;
    resetUrl: string;
  }) {
    const subject = `🔐 Kode Reset Kata Sandi Anda: ${code} - Zalde Todo`;

    const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Kata Sandi</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0b0f19; padding: 40px 10px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background: linear-gradient(145deg, #111827 0%, #0f172a 100%); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); overflow: hidden;">
          
          <!-- Top Accent Bar -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #6366f1, #a855f7, #ec4899);"></td>
          </tr>

          <!-- Header / Logo -->
          <tr>
            <td style="padding: 36px 36px 20px 36px; text-align: center;">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center">
                <tr>
                  <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); width: 44px; height: 44px; border-radius: 14px; text-align: center; vertical-align: middle; box-shadow: 0 10px 20px -5px rgba(79, 70, 229, 0.4);">
                    <span style="color: #ffffff; font-size: 22px; font-weight: bold; line-height: 44px; display: inline-block;">✓</span>
                  </td>
                  <td style="padding-left: 12px; text-align: left;">
                    <div style="color: #ffffff; font-size: 18px; font-weight: 800; letter-spacing: -0.5px;">Zalde Todo <span style="background: linear-gradient(90deg, #818cf8, #c084fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">AI</span></div>
                    <div style="color: #64748b; font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.8px;">Productivity Suite</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 10px 36px 20px 36px;">
              <h1 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 12px 0; text-align: center;">Permintaan Reset Kata Sandi</h1>
              <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
                Halo <strong style="color: #f8fafc;">${name}</strong>, kami menerima permintaan untuk mengatur ulang kata sandi akun Anda. Masukkan kode verifikasi 6 digit di bawah ini atau klik tombol konfirmasi:
              </p>

              <!-- 6-Digit OTP Code Box -->
              <div style="background-color: #1e293b; border: 1px solid rgba(99, 102, 241, 0.25); border-radius: 16px; padding: 20px; text-align: center; margin: 0 0 24px 0;">
                <div style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin-bottom: 8px;">Kode Verifikasi Anda</div>
                <div style="color: #818cf8; font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; line-height: 1;">
                  ${code}
                </div>
                <div style="color: #64748b; font-size: 11px; margin-top: 8px;">Berlaku selama 15 menit</div>
              </div>

              <!-- Action Button Link -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 0 0 24px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 14px 32px; border-radius: 14px; box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.4); text-align: center;">
                      Atur Ulang Kata Sandi Sekarang →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Safety Warning -->
              <div style="background-color: rgba(239, 68, 68, 0.08); border-left: 3px solid #ef4444; border-radius: 0 8px 8px 0; padding: 12px 14px; margin: 0 0 20px 0;">
                <p style="color: #fca5a5; font-size: 12px; line-height: 1.5; margin: 0;">
                  <strong>Penting:</strong> Jika Anda tidak meminta reset kata sandi, abaikan email ini dengan aman. Akun Anda tetap terlindungi dan kata sandi tidak akan berubah.
                </p>
              </div>

              <p style="color: #475569; font-size: 12px; line-height: 1.5; margin: 0; word-break: break-all;">
                Jika tombol di atas tidak dapat diklik, salin tautan berikut ke browser:<br>
                <a href="${resetUrl}" style="color: #6366f1; text-decoration: underline;">${resetUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 36px 32px 36px; border-top: 1px solid rgba(255, 255, 255, 0.05); text-align: center;">
              <p style="color: #475569; font-size: 11px; margin: 0;">
                © 2026 Zalde Todo AI Productivity Suite. Seluruh hak cipta dilindungi.<br>
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

    return this.sendEmail({ to, subject, html });
  }
}
