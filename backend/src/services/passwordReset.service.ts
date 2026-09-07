import { eq, and, gt, desc } from "drizzle-orm";
import { db } from "../config/db";
import { users, passwordResetTokens } from "../models/schema";
import { EmailService } from "./email.service";
import { env } from "../config/env";

export class PasswordResetService {
  /**
   * Generate 6-digit OTP & send reset email
   */
  static async requestPasswordReset(email: string) {
    const cleanEmail = email.toLowerCase().trim();
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    if (!user) {
      // Return success message anyway to prevent email enumeration attacks
      return {
        message: "Jika email terdaftar, instruksi reset kata sandi telah dikirimkan.",
      };
    }

    const isTest = process.env.NODE_ENV === "test";

    // 1. Anti-Spam Cooldown: 60 seconds per email
    if (!isTest) {
      const [lastToken] = await db
        .select()
        .from(passwordResetTokens)
        .where(eq(passwordResetTokens.userId, user.id))
        .orderBy(desc(passwordResetTokens.createdAt))
        .limit(1);

      if (lastToken) {
        const elapsedSec = (Date.now() - new Date(lastToken.createdAt).getTime()) / 1000;
        if (elapsedSec < 60) {
          const remainingSec = Math.ceil(60 - elapsedSec);
          throw new Error(`Permintaan terlalu sering. Silakan tunggu ${remainingSec} detik sebelum meminta kode baru.`);
        }
      }

      // 2. Anti-Abuse Rate Limit: Max 5 requests per 15 minutes
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      const recentTokens = await db
        .select()
        .from(passwordResetTokens)
        .where(
          and(
            eq(passwordResetTokens.userId, user.id),
            gt(passwordResetTokens.createdAt, fifteenMinutesAgo)
          )
        );

      if (recentTokens.length >= 5) {
        throw new Error("Batas permintaan tercapai (maksimal 5 kali per 15 menit). Silakan coba lagi nanti.");
      }
    }

    // Invalidate previous unused tokens for this user
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(and(eq(passwordResetTokens.userId, user.id), eq(passwordResetTokens.used, false)));

    // Generate secure 6-digit numeric code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token: code,
      expiresAt,
      used: false,
    });

    const resetUrl = `${env.FRONTEND_URL}/?reset_token=${code}`;

    let emailSent = false;
    let emailErrorNotice: string | undefined;

    if (env.GMAIL_USER && !isTest) {
      try {
        const result = await EmailService.sendPasswordResetEmail({
          to: user.email,
          name: user.name,
          code,
          resetUrl,
        });
        if (result.success && !result.simulated) {
          emailSent = true;
        }
      } catch (err: any) {
        console.error("Failed to send reset email:", err);
        emailErrorNotice = `Gagal mengirim email: ${err.message || err}`;
      }
    }

    const isSimulated = isTest || !env.GMAIL_USER || !emailSent;

    return {
      message: emailSent
        ? "Kode verifikasi reset kata sandi telah dikirim ke email Anda. Cek kotak masuk atau folder spam."
        : (emailErrorNotice || "Kode verifikasi dibuat (mode simulasi pengujian)."),
      email: user.email,
      ...(isSimulated && { devCode: code }),
      warning: emailErrorNotice,
    };
  }

  /**
   * Verify token and update user password with Argon2id
   */
  static async resetPassword(token: string, newPassword: string) {
    if (!token || !token.trim()) {
      throw new Error("Kode verifikasi wajib diisi");
    }

    if (!newPassword || newPassword.length < 6) {
      throw new Error("Kata sandi baru minimal 6 karakter");
    }

    const cleanToken = token.trim();

    const [resetRecord] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, cleanToken),
          eq(passwordResetTokens.used, false),
          gt(passwordResetTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!resetRecord) {
      throw new Error("Kode verifikasi tidak valid atau telah kedaluwarsa.");
    }

    const passwordHash = await Bun.password.hash(newPassword, {
      algorithm: "argon2id",
      memoryCost: 65536,
      timeCost: 2,
    });

    // Update user password
    await db
      .update(users)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, resetRecord.userId));

    // Mark token as used
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.id, resetRecord.id));

    return {
      message: "Kata sandi berhasil diperbarui. Silakan masuk dengan kata sandi baru Anda.",
    };
  }
}
