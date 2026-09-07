import { eq, and, gt, desc } from "drizzle-orm";
import { db } from "../config/db";
import { users, emailVerificationTokens } from "../models/schema";
import { EmailService } from "./email.service";
import { env } from "../config/env";

export class EmailVerificationService {
  /**
   * Helper to create and send OTP token for a user
   */
  static async createAndSendOtp(userId: string, email: string, name: string) {
    // Generate 6-digit numeric OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await db.insert(emailVerificationTokens).values({
      userId,
      token: code,
      expiresAt,
    });

    try {
      await EmailService.sendVerificationOtpEmail({
        to: email,
        name,
        code,
      });
    } catch (err: any) {
      console.error("[Email Verification Send Warning]:", err.message);
    }

    return code;
  }

  /**
   * Verifikasi kode OTP 6-digit untuk mengaktifkan akun
   */
  static async verifyEmail(email: string, code: string) {
    if (!email || !code) {
      throw new Error("Email dan kode verifikasi wajib diisi");
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanCode = code.trim();

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    if (!user) {
      throw new Error("Pengguna tidak ditemukan");
    }

    if (user.isVerified) {
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        phoneNumber: user.phoneNumber,
        isVerified: true,
      };
    }

    // Cari token valid yang belum dipakai dan belum expired
    const [tokenRecord] = await db
      .select()
      .from(emailVerificationTokens)
      .where(
        and(
          eq(emailVerificationTokens.userId, user.id),
          eq(emailVerificationTokens.token, cleanCode),
          eq(emailVerificationTokens.used, false),
          gt(emailVerificationTokens.expiresAt, new Date())
        )
      )
      .orderBy(desc(emailVerificationTokens.createdAt))
      .limit(1);

    if (!tokenRecord) {
      throw new Error("Kode verifikasi tidak valid atau telah kedaluwarsa. Silakan minta kode baru.");
    }

    // Tandai token sudah digunakan
    await db
      .update(emailVerificationTokens)
      .set({ used: true })
      .where(eq(emailVerificationTokens.id, tokenRecord.id));

    // Aktifkan status user isVerified = true
    const [verifiedUser] = await db
      .update(users)
      .set({ isVerified: true, updatedAt: new Date() })
      .where(eq(users.id, user.id))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        phoneNumber: users.phoneNumber,
        isVerified: users.isVerified,
      });

    return verifiedUser;
  }

  /**
   * Kirim ulang kode OTP aktivasi dengan proteksi Anti-Spam (cooldown 60s & limit 5 req/15 min)
   */
  static async resendVerificationOtp(email: string) {
    const cleanEmail = email.toLowerCase().trim();
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    if (!user) {
      return { message: "Jika email terdaftar, kode verifikasi baru telah dikirimkan." };
    }

    if (user.isVerified) {
      throw new Error("Akun ini sudah aktif. Silakan langsung masuk.");
    }

    const isTest = process.env.NODE_ENV === "test";

    // 1. Anti-Spam Cooldown: 60 detik per email
    if (!isTest) {
      const [lastToken] = await db
        .select()
        .from(emailVerificationTokens)
        .where(eq(emailVerificationTokens.userId, user.id))
        .orderBy(desc(emailVerificationTokens.createdAt))
        .limit(1);

      if (lastToken) {
        const elapsedSec = (Date.now() - new Date(lastToken.createdAt).getTime()) / 1000;
        if (elapsedSec < 60) {
          const remainingSec = Math.ceil(60 - elapsedSec);
          throw new Error(`Permintaan terlalu sering. Tunggu ${remainingSec} detik sebelum meminta kode baru.`);
        }
      }

      // 2. Anti-Abuse Rate Limit: Maks 5 request per 15 menit
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      const recentTokens = await db
        .select()
        .from(emailVerificationTokens)
        .where(
          and(
            eq(emailVerificationTokens.userId, user.id),
            gt(emailVerificationTokens.createdAt, fifteenMinutesAgo)
          )
        );

      if (recentTokens.length >= 5) {
        throw new Error("Batas permintaan verifikasi tercapai (maksimal 5 kali per 15 menit). Coba lagi nanti.");
      }
    }

    // Invalidate token sebelumnya
    await db
      .update(emailVerificationTokens)
      .set({ used: true })
      .where(and(eq(emailVerificationTokens.userId, user.id), eq(emailVerificationTokens.used, false)));

    // Generate dan kirim kode baru
    const code = await this.createAndSendOtp(user.id, cleanEmail, user.name);

    const isSimulated = isTest || !env.GMAIL_USER;

    return {
      message: "Kode verifikasi baru berhasil dikirim ke email Anda.",
      ...(isSimulated && { devCode: code }),
    };
  }
}
