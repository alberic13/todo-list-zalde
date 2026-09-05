import { Elysia, t } from "elysia";
import { AuthService } from "../services/auth.service";
import { authPlugin } from "../middlewares/auth.middleware";
import { successResponse, errorResponse } from "../utils/response";

export const authController = new Elysia({ prefix: "/api/auth" })
  .use(authPlugin)
  // POST /api/auth/register
  .post(
    "/register",
    async ({ body, set }) => {
      try {
        const user = await AuthService.register(body.name, body.email, body.password);
        set.status = 201;
        return successResponse(
          {
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              isVerified: user.isVerified,
            },
            needVerification: true,
            email: user.email,
            ...((user as any).devCode && { devCode: (user as any).devCode }),
          },
          user.message || "Kode verifikasi 6-digit telah dikirim ke email Anda."
        );
      } catch (err: any) {
        set.status = 400;
        return errorResponse(err.message || "Registration failed");
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 2, maxLength: 255 }),
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 6 }),
      }),
      detail: {
        tags: ["Auth"],
        summary: "Register new user",
      },
    }
  )
  // POST /api/auth/verify-email
  .post(
    "/verify-email",
    async ({ body, jwt, set }) => {
      try {
        const user = await AuthService.verifyEmail(body.email, body.code);
        const token = await jwt.sign({
          id: user.id,
          email: user.email,
          name: user.name,
        });

        return successResponse({ user, token }, "Email berhasil diverifikasi");
      } catch (err: any) {
        set.status = 400;
        return errorResponse(err.message || "Verifikasi email gagal");
      }
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        code: t.String({ minLength: 6, maxLength: 6 }),
      }),
      detail: {
        tags: ["Auth"],
        summary: "Verify email with 6-digit OTP",
      },
    }
  )
  // POST /api/auth/resend-verification
  .post(
    "/resend-verification",
    async ({ body, set }) => {
      try {
        const result = await AuthService.resendVerificationOtp(body.email);
        return successResponse(result, result.message);
      } catch (err: any) {
        set.status = 400;
        return errorResponse(err.message || "Gagal mengirim ulang kode verifikasi");
      }
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
      }),
      detail: {
        tags: ["Auth"],
        summary: "Resend verification OTP code",
      },
    }
  )
  // POST /api/auth/login
  .post(
    "/login",
    async ({ body, jwt, set }) => {
      const user = await AuthService.verifyCredentials(body.email, body.password);
      if (!user) {
        set.status = 401;
        return errorResponse("Invalid email or password");
      }

      if (!user.isVerified) {
        set.status = 403;
        return errorResponse(
          "Akun belum aktif. Masukkan kode verifikasi 6-digit yang dikirim ke email Anda.",
          {
            needVerification: true,
            email: user.email,
          }
        );
      }

      const token = await jwt.sign({
        id: user.id,
        email: user.email,
        name: user.name,
      });

      return successResponse({ user, token }, "Login successful");
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 1 }),
      }),
      detail: {
        tags: ["Auth"],
        summary: "Login user",
      },
    }
  )
  // POST /api/auth/google
  .post(
    "/google",
    async ({ body, jwt, set }) => {
      try {
        const user = await AuthService.loginWithGoogle(body.credential);
        
        const token = await jwt.sign({
          id: user.id,
          email: user.email,
          name: user.name,
        });

        return successResponse({ user, token }, "Google Login successful");
      } catch (err: any) {
        set.status = 401;
        return errorResponse(err.message || "Google Login failed");
      }
    },
    {
      body: t.Object({
        credential: t.String(),
      }),
      detail: {
        tags: ["Auth"],
        summary: "Login with Google",
      },
    }
  )
  // GET /api/auth/me
  .get(
    "/me",
    async ({ user, set }) => {
      if (!user) {
        set.status = 401;
        return errorResponse("Unauthorized", { code: "UNAUTHORIZED" });
      }

      const profile = await AuthService.findById(user.id);
      if (!profile) {
        set.status = 404;
        return errorResponse("User not found");
      }

      return successResponse(profile, "User profile retrieved");
    },
    {
      detail: {
        tags: ["Auth"],
        summary: "Get current user profile",
      },
    }
  )
  // PATCH /api/auth/profile
  .patch(
    "/profile",
    async ({ user, body, set }) => {
      if (!user) {
        set.status = 401;
        return errorResponse("Unauthorized", { code: "UNAUTHORIZED" });
      }

      try {
        const updated = await AuthService.updateProfile(user.id, {
          name: body.name,
          phoneNumber: body.phoneNumber,
        });

        return successResponse(updated, "Profile updated successfully");
      } catch (err: any) {
        set.status = 400;
        return errorResponse(err.message || "Failed to update profile");
      }
    },
    {
      body: t.Object({
        name: t.Optional(t.String({ minLength: 2, maxLength: 255 })),
        phoneNumber: t.Optional(t.String({ maxLength: 50 })),
      }),
      detail: {
        tags: ["Auth"],
        summary: "Update user profile",
      },
    }
  )
  // POST /api/auth/forgot-password
  .post(
    "/forgot-password",
    async ({ body, set }) => {
      try {
        const result = await AuthService.requestPasswordReset(body.email);
        return successResponse(result, result.message);
      } catch (err: any) {
        set.status = 400;
        return errorResponse(err.message || "Gagal memproses permintaan reset kata sandi");
      }
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
      }),
      detail: {
        tags: ["Auth"],
        summary: "Request password reset verification code",
      },
    }
  )
  // POST /api/auth/reset-password
  .post(
    "/reset-password",
    async ({ body, set }) => {
      try {
        const result = await AuthService.resetPassword(body.token, body.newPassword);
        return successResponse(result, result.message);
      } catch (err: any) {
        set.status = 400;
        return errorResponse(err.message || "Gagal mengatur ulang kata sandi");
      }
    },
    {
      body: t.Object({
        token: t.String({ minLength: 1 }),
        newPassword: t.String({ minLength: 6 }),
      }),
      detail: {
        tags: ["Auth"],
        summary: "Reset password using verification code",
      },
    }
  );

