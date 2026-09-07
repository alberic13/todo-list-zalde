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

  /**
   * Account Activation / Email Verification with 6-digit OTP code
   */
  static async sendVerificationOtpEmail({
    to,
    name,
    code,
  }: {
    to: string;
    name: string;
    code: string;
  }) {
    const subject = `✨ Kode Verifikasi Akun: ${code} - Zalde Todo AI`;

    const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verifikasi Akun</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0b0f19; min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; background-color: #111827; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 20px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
          <!-- Header -->
          <tr>
            <td style="padding: 36px 36px 20px 36px; text-align: center;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center">
                <tr>
                  <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); width: 44px; height: 44px; border-radius: 12px; text-align: center; vertical-align: middle; color: #ffffff; font-weight: bold; font-size: 20px;">
                    ✓
                  </td>
                  <td style="padding-left: 14px; text-align: left;">
                    <span style="font-size: 18px; font-weight: 800; letter-spacing: -0.02em; color: #ffffff; display: block;">Zalde Todo</span>
                    <span style="font-size: 11px; font-weight: 600; color: #34d399; text-transform: uppercase; letter-spacing: 0.08em;">Aktivasi Akun</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 10px 36px 32px 36px;">
              <h1 style="color: #ffffff; font-size: 20px; font-weight: 700; margin: 0 0 12px 0; text-align: center;">
                Verifikasi Alamat Email Anda
              </h1>
              <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
                Halo <strong>${name}</strong>, selamat datang di Zalde Todo AI. Masukkan kode 6-digit berikut pada form pendaftaran untuk mengaktifkan akun Anda:
              </p>

              <!-- OTP Code Display Card -->
              <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
                <span style="color: #6ee7b7; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 8px;">
                  Kode Verifikasi (OTP)
                </span>
                <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #ffffff; font-family: monospace; text-shadow: 0 2px 10px rgba(16, 185, 129, 0.3);">
                  ${code}
                </div>
                <span style="color: #94a3b8; font-size: 12px; display: block; margin-top: 8px;">
                  Berlaku selama 15 menit
                </span>
              </div>

              <!-- Info & Security -->
              <div style="background: rgba(245, 158, 11, 0.08); border-left: 3px solid #f59e0b; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                <p style="color: #fde68a; font-size: 12px; line-height: 1.5; margin: 0;">
                  <strong>Perhatian:</strong> Jangan berikan kode ini kepada siapapun. Tim Zalde Todo tidak pernah meminta kode OTP akun Anda.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 36px 32px 36px; border-top: 1px solid rgba(255, 255, 255, 0.05); text-align: center;">
              <p style="color: #475569; font-size: 11px; margin: 0;">
                © 2026 Zalde Todo AI Productivity Suite. Seluruh hak cipta dilindungi.<br>
                Jika Anda tidak merasa mendaftar di Zalde Todo, abaikan email ini.
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

  /**
   * Daily Task Reminder Email (Triggered by 12 AM WIB Cron)
   */
  static async sendDailyTaskReminderEmail({
    to,
    name,
    dateFormatted,
    dueTodayTasks,
    overdueTasks,
  }: {
    to: string;
    name: string;
    dateFormatted: string;
    dueTodayTasks: Array<{
      id: string;
      title: string;
      priority: string;
      categoryName?: string | null;
      categoryColor?: string | null;
      dueDateFormatted?: string | null;
      completedSubtasks?: number;
      totalSubtasks?: number;
    }>;
    overdueTasks: Array<{
      id: string;
      title: string;
      priority: string;
      categoryName?: string | null;
      categoryColor?: string | null;
      dueDateFormatted?: string | null;
      completedSubtasks?: number;
      totalSubtasks?: number;
    }>;
  }) {
    const totalPending = dueTodayTasks.length + overdueTasks.length;
    const subject = `📋 Agenda Tugas Hari Ini: ${totalPending} Tugas Menunggu (${dateFormatted}) - Zalde Todo`;

    const renderPriorityBadge = (p: string) => {
      switch (p) {
        case "urgent":
          return `<span style="display:inline-block; font-size:10px; font-weight:700; color:#ef4444; background:rgba(239,68,68,0.12); border:1px solid rgba(239,68,68,0.25); border-radius:6px; padding:2px 7px;">🔴 Urgent</span>`;
        case "high":
          return `<span style="display:inline-block; font-size:10px; font-weight:700; color:#f59e0b; background:rgba(245,158,11,0.12); border:1px solid rgba(245,158,11,0.25); border-radius:6px; padding:2px 7px;">🟠 Tinggi</span>`;
        case "medium":
          return `<span style="display:inline-block; font-size:10px; font-weight:700; color:#38bdf8; background:rgba(56,189,248,0.12); border:1px solid rgba(56,189,248,0.25); border-radius:6px; padding:2px 7px;">🔵 Sedang</span>`;
        default:
          return `<span style="display:inline-block; font-size:10px; font-weight:700; color:#94a3b8; background:rgba(148,163,184,0.12); border:1px solid rgba(148,163,184,0.25); border-radius:6px; padding:2px 7px;">⚪ Rendah</span>`;
      }
    };

    const renderTaskRows = (taskList: typeof dueTodayTasks, isOverdueList = false) => {
      if (taskList.length === 0) return "";
      return taskList
        .map((t) => {
          const catHtml = t.categoryName
            ? `<span style="display:inline-block; font-size:10px; font-weight:600; color:${t.categoryColor || '#818cf8'}; background:rgba(255,255,255,0.06); border:1px solid ${t.categoryColor || '#818cf8'}40; border-radius:6px; padding:2px 6px; margin-left:6px;">${t.categoryName}</span>`
            : "";
          const subtaskHtml =
            t.totalSubtasks && t.totalSubtasks > 0
              ? `<span style="display:inline-block; font-size:10px; font-weight:600; color:#94a3b8; margin-left:6px;">☑ ${t.completedSubtasks || 0}/${t.totalSubtasks}</span>`
              : "";
          const borderStyle = isOverdueList
            ? "border-left: 3px solid #ef4444; background: rgba(239, 68, 68, 0.05);"
            : "border-left: 3px solid #6366f1; background: rgba(255, 255, 255, 0.02);";

          return `
            <div style="border: 1px solid rgba(255, 255, 255, 0.08); ${borderStyle} border-radius: 12px; padding: 12px 14px; margin-bottom: 10px;">
              <div style="font-size: 13px; font-weight: 700; color: #ffffff; margin-bottom: 6px;">
                ${t.title}
              </div>
              <div style="font-size: 11px;">
                ${renderPriorityBadge(t.priority)}
                ${catHtml}
                ${subtaskHtml}
                ${t.dueDateFormatted ? `<span style="color:#94a3b8; font-size:10px; margin-left:6px;">📅 ${t.dueDateFormatted}</span>` : ""}
              </div>
            </div>
          `;
        })
        .join("");
    };

    const dashboardUrl = `${env.FRONTEND_URL}/dashboard`;

    const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pengingat Tugas Harian</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0b0f19; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background: linear-gradient(145deg, #111827 0%, #0f172a 100%); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); overflow: hidden;">
          
          <!-- Top Accent Bar -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #6366f1, #3b82f6, #10b981);"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding: 32px 36px 16px 36px; text-align: center;">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center">
                <tr>
                  <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); width: 42px; height: 42px; border-radius: 12px; text-align: center; vertical-align: middle; box-shadow: 0 8px 16px -4px rgba(79, 70, 229, 0.4);">
                    <span style="color: #ffffff; font-size: 20px; font-weight: bold; line-height: 42px; display: inline-block;">✓</span>
                  </td>
                  <td style="padding-left: 12px; text-align: left;">
                    <div style="color: #ffffff; font-size: 17px; font-weight: 800; letter-spacing: -0.5px;">Zalde Todo <span style="background: linear-gradient(90deg, #818cf8, #c084fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">AI</span></div>
                    <div style="color: #64748b; font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.8px;">Pengingat Harian Otomatis</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Greeting & Intro -->
          <tr>
            <td style="padding: 10px 36px 20px 36px;">
              <h1 style="color: #ffffff; font-size: 20px; font-weight: 700; margin: 0 0 8px 0; text-align: center;">
                Agenda Hari Ini (${dateFormatted})
              </h1>
              <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 0 0 20px 0; text-align: center;">
                Halo <strong style="color: #f8fafc;">${name}</strong>, berikut rangkuman tugas yang memerlukan perhatian Anda hari ini agar produktivitas tetap terjaga:
              </p>

              <!-- Statistics Pills Bar -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="background: rgba(99, 102, 241, 0.12); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 12px; padding: 10px 18px; text-align: center; margin-right: 8px;">
                          <div style="font-size: 11px; color: #818cf8; font-weight: 600; text-transform: uppercase;">Jatuh Tempo Hari Ini</div>
                          <div style="font-size: 20px; font-weight: 800; color: #ffffff; margin-top: 2px;">${dueTodayTasks.length}</div>
                        </td>
                        <td style="width: 12px;"></td>
                        <td style="background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 10px 18px; text-align: center;">
                          <div style="font-size: 11px; color: #f87171; font-weight: 600; text-transform: uppercase;">Perlu Segera / Overdue</div>
                          <div style="font-size: 20px; font-weight: 800; color: #ffffff; margin-top: 2px;">${overdueTasks.length}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Section 1: Overdue Tasks (if any) -->
              ${
                overdueTasks.length > 0
                  ? `
                <div style="margin-bottom: 24px;">
                  <div style="color: #f87171; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
                    ⚠️ Tugas Terlambat (${overdueTasks.length})
                  </div>
                  ${renderTaskRows(overdueTasks, true)}
                </div>
              `
                  : ""
              }

              <!-- Section 2: Tasks Due Today -->
              ${
                dueTodayTasks.length > 0
                  ? `
                <div style="margin-bottom: 24px;">
                  <div style="color: #818cf8; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">
                    🎯 Target Selesai Hari Ini (${dueTodayTasks.length})
                  </div>
                  ${renderTaskRows(dueTodayTasks, false)}
                </div>
              `
                  : ""
              }

              <!-- Action Button Link -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
                <tr>
                  <td align="center">
                    <a href="${dashboardUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 600; padding: 12px 28px; border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.4); text-align: center;">
                      Buka Todo List di Dashboard →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 36px 28px 36px; border-top: 1px solid rgba(255, 255, 255, 0.05); text-align: center;">
              <p style="color: #475569; font-size: 11px; margin: 0; line-height: 1.5;">
                © 2026 Zalde Todo AI Productivity Suite. Seluruh hak cipta dilindungi.<br>
                Pengingat harian dikirim otomatis setiap jam 00:00 WIB sesuai jadwal Vercel Cron.
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

