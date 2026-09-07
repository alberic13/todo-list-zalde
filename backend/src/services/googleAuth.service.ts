import { eq } from "drizzle-orm";
import { db } from "../config/db";
import { users } from "../models/schema";
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export class GoogleAuthService {
  static async loginWithGoogle(token: string) {
    if (!token) {
      throw new Error("Token Google wajib diisi");
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      throw new Error("GOOGLE_CLIENT_ID is not configured");
    }

    let email: string;
    let name: string;

    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw new Error("Invalid Google token payload");
      }
      email = payload.email.toLowerCase().trim();
      name = payload.name || "Google User";
    } catch {
      // Fallback: Verifikasi via Google OAuth2 userinfo endpoint (jika access_token)
      const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error("Token Google tidak valid");
      }
      const data = (await res.json()) as { email?: string; name?: string };
      if (!data.email) {
        throw new Error("Email Google tidak ditemukan");
      }
      email = data.email.toLowerCase().trim();
      name = data.name || "Google User";
    }

    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    let user = existingUser;

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
          name: name || "Google User",
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
}
