import { eq, and, gt, desc } from "drizzle-orm";
import { db } from "../config/db";
import { users, passwordResetTokens, emailVerificationTokens } from "../models/schema";
import { OAuth2Client } from "google-auth-library";
import { EmailService } from "./email.service";
import { env } from "../config/env";
import { validateEmailDomain } from "../utils/emailValidator";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export class AuthService {
  static async findByEmail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).limit(1);
    return user || null;
  }

  static async findById(id: string) {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        phoneNumber: users.phoneNumber,
        isVerified: users.isVerified,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return user || null;
  }

  static async register(name: string, email: string, password: string) {
    const cleanEmail = email.toLowerCase().trim();

    // Validasi Lapis 1: Cek DNS MX dan filter domain palsu / disposable email
    const validation = await validateEmailDomain(cleanEmail);
    if (!validation.valid) {
      throw new Error(validation.message || "Domain email tidak valid");
    }

    const existing = await this.findByEmail(cleanEmail);
    if (existing) {
      // Jika akun sudah terdaftar tapi belum diverifikasi, kirim ulang OTP
      if (!existing.isVerified) {
        const resendResult = await this.resendVerificationOtp(cleanEmail);
        return {
          id: existing.id,
          email: existing.email,
          name: existing.name,
          isVerified: false,
          needVerification: true,
          message: "Akun sudah pernah didaftarkan tapi belum aktif. Kode verifikasi baru telah dikirim ke email Anda.",
          ...((resendResult as any)?.devCode && { devCode: (resendResult as any).devCode }),
        };
      }
      throw new Error("Email already registered");
    }

    const passwordHash = await Bun.password.hash(password, {
      algorithm: "argon2id",
      memoryCost: 65536,
      timeCost: 2,
    });

    const [newUser] = await db
      .insert(users)
      .values({
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
        isVerified: false,
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        phoneNumber: users.phoneNumber,
        isVerified: users.isVerified,
        createdAt: users.createdAt,
      });

    // Generate 6-digit numeric OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await db.insert(emailVerificationTokens).values({
      userId: newUser.id,
      token: code,
      expiresAt,
    });

    // Kirim email via Gmail SMTP
    try {
      await EmailService.sendVerificationOtpEmail({
        to: cleanEmail,
        name: newUser.name,
        code,
      });
    } catch (err: any) {
      console.error("[Email Verification Send Warning]:", err.message);
    }

    const isSimulated = process.env.NODE_ENV === "test" || !env.GMAIL_USER;

    return {
      ...newUser,
      needVerification: true,
      message: "Kode verifikasi 6-digit telah dikirim ke email Anda.",
      ...(isSimulated && { devCode: code }),
    };
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

    const user = await this.findByEmail(cleanEmail);
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
    const user = await this.findByEmail(cleanEmail);

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

    // Generate kode baru
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await db.insert(emailVerificationTokens).values({
      userId: user.id,
      token: code,
      expiresAt,
    });

    try {
      await EmailService.sendVerificationOtpEmail({
        to: cleanEmail,
        name: user.name,
        code,
      });
    } catch (err: any) {
      console.error("[Email Verification Resend Warning]:", err.message);
    }

    const isSimulated = isTest || !env.GMAIL_USER;

    return {
      message: "Kode verifikasi baru berhasil dikirim ke email Anda.",
      ...(isSimulated && { devCode: code }),
    };
  }

  static async verifyCredentials(email: string, password: string) {
    const user = await this.findByEmail(email);
    if (!user) {
      return null;
    }

    const isMatch = await Bun.password.verify(password, user.passwordHash);
    if (!isMatch) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phoneNumber: user.phoneNumber,
      isVerified: user.isVerified,
    };
  }

  static async updateProfile(userId: string, data: { name?: string; phoneNumber?: string }) {
    const [updatedUser] = await db
      .update(users)
      .set({
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.phoneNumber !== undefined && { phoneNumber: data.phoneNumber.trim() }),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        phoneNumber: users.phoneNumber,
        isVerified: users.isVerified,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    return updatedUser;
  }

  static async loginWithGoogle(token: string) {
    if (!token) {
      throw new Error("Token Google wajib diisi");
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      throw new Error("GOOGLE_CLIENT_ID is not configured");
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new Error("Invalid Google token payload");
    }

    const email = payload.email.toLowerCase().trim();
    let user = await this.findByEmail(email);

    if (!user) {
      const dummyPassword = crypto.randomUUID() + crypto.randomUUID();
      const passwordHash = await Bun.password.hash(dummyPassword, {
        algorithm: "argon2id",
        memoryCost: 65536,
        timeCost: 2,
      });

      const [newUser] = await db
        .insert(users)
        .values({
          name: payload.name || "Google User",
          email,
          passwordHash,
          isVerified: true, // Google accounts are verified by default
        })
        .returning({
          id: users.id,
          email: users.email,
          name: users.name,
          phoneNumber: users.phoneNumber,
          isVerified: users.isVerified,
        });
      
      user = newUser as any;
    } else if (!user.isVerified) {
      const [updated] = await db
        .update(users)
        .set({ isVerified: true, updatedAt: new Date() })
        .where(eq(users.id, user.id))
        .returning();
      user = updated;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phoneNumber: user.phoneNumber,
      isVerified: true,
    };
  }

  /**
   * Generate 6-digit OTP & send reset email via Resend
   */
  static async requestPasswordReset(email: string) {
    const cleanEmail = email.toLowerCase().trim();
    const user = await this.findByEmail(cleanEmail);

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

