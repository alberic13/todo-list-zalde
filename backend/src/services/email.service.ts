import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../config/env";
import {
  renderPasswordResetHtml,
  type PasswordResetTemplateParams,
} from "../templates/email/passwordResetTemplate";
import {
  renderVerificationOtpHtml,
  type VerificationOtpTemplateParams,
} from "../templates/email/verificationOtpTemplate";
import {
  renderDailyReminderHtml,
  type ReminderTaskItem,
} from "../templates/email/dailyReminderTemplate";

export type { ReminderTaskItem };

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
   * Core send email method (Gmail SMTP primary, simulation fallback in dev/test)
   */
  static async sendEmail({
    to,
    subject,
    html,
  }: SendEmailOptions): Promise<{
    success: boolean;
    id?: string;
    simulated?: boolean;
    provider?: string;
  }> {
    // 1. Primary: Gmail SMTP
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
  }: PasswordResetTemplateParams & { to: string }) {
    const subject = `🔐 Kode Reset Kata Sandi Anda: ${code} - Todolist-App`;
    const html = renderPasswordResetHtml({ name, code, resetUrl });
    return this.sendEmail({ to, subject, html });
  }

  /**
   * Account Activation / Email Verification with 6-digit OTP code
   */
  static async sendVerificationOtpEmail({
    to,
    name,
    code,
  }: VerificationOtpTemplateParams & { to: string }) {
    const subject = `✨ Kode Verifikasi Akun: ${code} - Todolist-App`;
    const html = renderVerificationOtpHtml({ name, code });
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
    dueTodayTasks: ReminderTaskItem[];
    overdueTasks: ReminderTaskItem[];
    upcomingTasks?: ReminderTaskItem[];
  }) {
    const totalPending = dueTodayTasks.length + overdueTasks.length + upcomingTasks.length;
    const subject = `📋 Agenda Tugas: ${totalPending} Tugas Memerlukan Perhatian (${dateFormatted}) - Todolist-App`;
    const dashboardUrl = `${env.FRONTEND_URL}/dashboard`;

    const html = renderDailyReminderHtml({
      name,
      dateFormatted,
      dueTodayTasks,
      overdueTasks,
      upcomingTasks,
      dashboardUrl,
    });

    return this.sendEmail({ to, subject, html });
  }
}
