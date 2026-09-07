import { eq } from "drizzle-orm";
import { db } from "../config/db";
import { users } from "../models/schema";
import { env } from "../config/env";
import { validateEmailDomain } from "../utils/emailValidator";
import { EmailVerificationService } from "./emailVerification.service";
import { PasswordResetService } from "./passwordReset.service";
import { GoogleAuthService } from "./googleAuth.service";

export class AuthService {
  static async findByEmail(email: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);
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
          message:
            "Akun sudah pernah didaftarkan tapi belum aktif. Kode verifikasi baru telah dikirim ke email Anda.",
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

    // Delegasikan pembuatan dan pengiriman OTP ke EmailVerificationService
    const code = await EmailVerificationService.createAndSendOtp(
      newUser.id,
      cleanEmail,
      newUser.name
    );

    const isSimulated = process.env.NODE_ENV === "test" || !env.GMAIL_USER;

    return {
      ...newUser,
      needVerification: true,
      message: "Kode verifikasi 6-digit telah dikirim ke email Anda.",
      ...(isSimulated && { devCode: code }),
    };
  }

  /**
   * Verifikasi kode OTP 6-digit (Delegated to EmailVerificationService)
   */
  static verifyEmail(email: string, code: string) {
    return EmailVerificationService.verifyEmail(email, code);
  }

  /**
   * Kirim ulang kode OTP aktivasi (Delegated to EmailVerificationService)
   */
  static resendVerificationOtp(email: string) {
    return EmailVerificationService.resendVerificationOtp(email);
  }

  /**
   * Verifikasi kredensial email & password dengan Argon2id
   */
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

  /**
   * Update profil pengguna
   */
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

  /**
   * Autentikasi Google OAuth (Delegated to GoogleAuthService)
   */
  static loginWithGoogle(token: string) {
    return GoogleAuthService.loginWithGoogle(token);
  }

  /**
   * Permintaan reset kata sandi (Delegated to PasswordResetService)
   */
  static requestPasswordReset(email: string) {
    return PasswordResetService.requestPasswordReset(email);
  }

  /**
   * Konfirmasi reset kata sandi baru (Delegated to PasswordResetService)
   */
  static resetPassword(token: string, newPassword: string) {
    return PasswordResetService.resetPassword(token, newPassword);
  }
}
