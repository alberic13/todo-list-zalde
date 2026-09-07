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
          from: env.EMAIL_FROM || `"Todolist-App" <${env.GMAIL_USER}>`,
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
    const subject = `🔐 Kode Reset Kata Sandi Anda: ${code} - Todolist-App`;

    const html = `
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
    const subject = `✨ Kode Verifikasi Akun: ${code} - Todolist-App`;

    const html = `
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

    return this.sendEmail({ to, subject, html });
  }

  /**
   * Daily Task Reminder Email (Triggered by 12 AM WIB Cron, covers Due Today, Overdue, and H-3 Upcoming)
   */
  static async sendDailyTaskReminderEmail({
    to,
    name,
    dateFormatted,
    dueTodayTasks,
    overdueTasks,
    upcomingTasks = [],
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
    upcomingTasks?: Array<{
      id: string;
      title: string;
      priority: string;
      categoryName?: string | null;
      categoryColor?: string | null;
      dueDateFormatted?: string | null;
      daysRemaining?: number;
      completedSubtasks?: number;
      totalSubtasks?: number;
    }>;
  }) {
    const totalPending = dueTodayTasks.length + overdueTasks.length + upcomingTasks.length;
    const subject = `📋 Agenda Tugas: ${totalPending} Tugas Memerlukan Perhatian (${dateFormatted}) - Todolist-App`;

    const getPriorityDotColor = (p: string) => {
      switch (p) {
        case "urgent":
          return "#f43f5e";
        case "high":
          return "#f59e0b";
        case "medium":
          return "#0ea5e9";
        default:
          return "#94a3b8";
      }
    };

    const renderTaskRows = (
      taskList: typeof dueTodayTasks | typeof upcomingTasks,
      variant: "overdue" | "today" | "upcoming" = "today"
    ) => {
      if (taskList.length === 0) return "";
      return taskList
        .map((t) => {
          const catHtml = t.categoryName
            ? `<span style="display:inline-block; font-size:10px; font-weight:600; color:${t.categoryColor || '#4f46e5'}; background:${t.categoryColor ? t.categoryColor + '15' : '#eef2ff'}; border:1px solid ${t.categoryColor ? t.categoryColor + '40' : '#c7d2fe'}; border-radius:6px; padding:1px 6px; margin-left:6px; vertical-align:middle;">${t.categoryName}</span>`
            : "";
          const subtaskHtml =
            t.totalSubtasks && t.totalSubtasks > 0
              ? `<span style="display:inline-block; background-color:#f8fafc; border:1px solid #e2e8f0; color:#475569; border-radius:8px; padding:2px 7px; font-size:10.5px; font-weight:700; margin-left:6px; vertical-align:middle;">☑ ${t.completedSubtasks || 0}/${t.totalSubtasks}</span>`
              : "";

          let dueDateHtml = "";
          if (variant === "overdue") {
            dueDateHtml = `<span style="display:inline-block; background-color:#fef2f2; border:1px solid #fecaca; color:#dc2626; border-radius:8px; padding:2px 7px; font-size:10.5px; font-weight:700; margin-left:6px; vertical-align:middle;">📅 Lewat deadline</span>`;
          } else if (variant === "today") {
            dueDateHtml = `<span style="display:inline-block; background-color:#eff6ff; border:1px solid #bfdbfe; color:#2563eb; border-radius:8px; padding:2px 7px; font-size:10.5px; font-weight:700; margin-left:6px; vertical-align:middle;">📅 Hari Ini</span>`;
          } else if (variant === "upcoming") {
            const days = (t as any).daysRemaining;
            const text = days ? (days === 1 ? "Besok" : `${days} hari lagi`) : (t.dueDateFormatted || "Mendekati");
            dueDateHtml = `<span style="display:inline-block; background-color:#fffbeb; border:1px solid #fde68a; color:#b45309; border-radius:8px; padding:2px 7px; font-size:10.5px; font-weight:600; margin-left:6px; vertical-align:middle;">📅 ${text}</span>`;
          }

          return `
            <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 10px 14px; margin-bottom: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="width: 14px; vertical-align: middle; color: #cbd5e1; font-size: 13px; font-family: monospace; line-height: 1;">
                    ⠿
                  </td>
                  <td style="width: 16px; vertical-align: middle; text-align: center;">
                    <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${getPriorityDotColor(t.priority)}; vertical-align: middle;"></span>
                  </td>
                  <td style="vertical-align: middle; padding: 0 8px; text-align: left;">
                    <span style="font-size: 13px; font-weight: 700; color: #0f172a; line-height: 1.3; vertical-align: middle;">
                      ${t.title}
                    </span>
                    ${catHtml}
                  </td>
                  <td style="vertical-align: middle; text-align: right; white-space: nowrap;">
                    ${subtaskHtml}
                    ${dueDateHtml}
                    <span style="color: #94a3b8; font-size: 14px; font-weight: bold; margin-left: 6px; vertical-align: middle; line-height: 1;">⋮</span>
                  </td>
                </tr>
              </table>
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
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; box-shadow: 0 10px 30px -5px rgba(15, 23, 42, 0.06); overflow: hidden;">
          
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

          <!-- Greeting & Intro -->
          <tr>
            <td style="padding: 6px 36px 20px 36px;">
              <h1 style="color: #0f172a; font-size: 20px; font-weight: 800; margin: 0 0 8px 0; text-align: center; letter-spacing: -0.3px;">
                Agenda Hari Ini (${dateFormatted})
              </h1>
              <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 0 0 20px 0; text-align: center;">
                Halo <strong style="color: #0f172a;">${name}</strong>, berikut rangkuman tugas yang memerlukan perhatian Anda agar produktivitas tetap terjaga:
              </p>

              <!-- Statistics Pills Bar -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 22px;">
                <tr>
                  <td align="center">
                    <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="background-color: #eef2ff; border: 1px solid #c7d2fe; border-radius: 12px; padding: 10px 16px; text-align: center;">
                          <div style="font-size: 10px; color: #4f46e5; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Hari Ini</div>
                          <div style="font-size: 18px; font-weight: 900; color: #1e1b4b; margin-top: 2px;">${dueTodayTasks.length}</div>
                        </td>
                        <td style="width: 8px;"></td>
                        <td style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 10px 16px; text-align: center;">
                          <div style="font-size: 10px; color: #dc2626; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Overdue</div>
                          <div style="font-size: 18px; font-weight: 900; color: #7f1d1d; margin-top: 2px;">${overdueTasks.length}</div>
                        </td>
                        <td style="width: 8px;"></td>
                        <td style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 10px 16px; text-align: center;">
                          <div style="font-size: 10px; color: #d97706; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">H-3 Menjelang</div>
                          <div style="font-size: 18px; font-weight: 900; color: #78350f; margin-top: 2px;">${upcomingTasks.length}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Kanban Board Container for Tasks -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 18px; padding: 16px 14px; margin-bottom: 24px;">
                <!-- Section 1: Overdue Tasks (if any) -->
                ${
                  overdueTasks.length > 0
                    ? `
                  <div style="margin-bottom: 16px;">
                    <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 8px;">
                      <tr>
                        <td style="vertical-align: middle;">
                          <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: #ef4444; margin-right: 6px;"></span>
                        </td>
                        <td style="vertical-align: middle; font-size: 11px; font-weight: 800; color: #dc2626; text-transform: uppercase; letter-spacing: 0.5px;">
                          LEWAT DEADLINE
                        </td>
                        <td style="padding-left: 6px; vertical-align: middle;">
                          <span style="background-color: #fee2e2; color: #b91c1c; font-size: 10px; font-weight: 800; border-radius: 10px; padding: 1px 7px;">${overdueTasks.length}</span>
                        </td>
                      </tr>
                    </table>
                    ${renderTaskRows(overdueTasks, "overdue")}
                  </div>
                `
                    : ""
                }

                <!-- Section 2: Tasks Due Today (if any) -->
                ${
                  dueTodayTasks.length > 0
                    ? `
                  <div style="margin-bottom: 16px;">
                    <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 8px;">
                      <tr>
                        <td style="vertical-align: middle;">
                          <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: #6366f1; margin-right: 6px;"></span>
                        </td>
                        <td style="vertical-align: middle; font-size: 11px; font-weight: 800; color: #4338ca; text-transform: uppercase; letter-spacing: 0.5px;">
                          TARGET HARI INI
                        </td>
                        <td style="padding-left: 6px; vertical-align: middle;">
                          <span style="background-color: #e0e7ff; color: #3730a3; font-size: 10px; font-weight: 800; border-radius: 10px; padding: 1px 7px;">${dueTodayTasks.length}</span>
                        </td>
                      </tr>
                    </table>
                    ${renderTaskRows(dueTodayTasks, "today")}
                  </div>
                `
                    : ""
                }

                <!-- Section 3: Tasks Due Within 3 Days (H-3 Upcoming) -->
                ${
                  upcomingTasks.length > 0
                    ? `
                  <div style="margin-bottom: 4px;">
                    <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 8px;">
                      <tr>
                        <td style="vertical-align: middle;">
                          <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: #f59e0b; margin-right: 6px;"></span>
                        </td>
                        <td style="vertical-align: middle; font-size: 11px; font-weight: 800; color: #b45309; text-transform: uppercase; letter-spacing: 0.5px;">
                          MENDEKATI BATAS WAKTU H-3
                        </td>
                        <td style="padding-left: 6px; vertical-align: middle;">
                          <span style="background-color: #fef3c7; color: #92400e; font-size: 10px; font-weight: 800; border-radius: 10px; padding: 1px 7px;">${upcomingTasks.length}</span>
                        </td>
                      </tr>
                    </table>
                    ${renderTaskRows(upcomingTasks, "upcoming")}
                  </div>
                `
                    : ""
                }
              </div>

              <!-- Action Button Link -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0 10px 0;">
                <tr>
                  <td align="center">
                    <a href="${dashboardUrl}" target="_blank" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 13px 32px; border-radius: 12px; box-shadow: 0 4px 14px rgba(15, 23, 42, 0.15); text-align: center;">
                      Buka Todo List di Dashboard →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 36px 28px 36px; border-top: 1px solid #f1f5f9; text-align: center;">
              <p style="color: #64748b; font-size: 11px; margin: 0; line-height: 1.5;">
                © 2026 Todolist-App Smart Productivity Suite. Seluruh hak cipta dilindungi.<br>
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

