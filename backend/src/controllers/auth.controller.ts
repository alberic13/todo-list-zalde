import { Elysia } from "elysia";
import { AuthService } from "../services/auth.service";
import { authPlugin } from "../middlewares/auth.middleware";
import { successResponse, errorResponse } from "../utils/response";
import { passwordController } from "./password.controller";
import {
  registerBodySchema,
  verifyEmailBodySchema,
  resendVerificationBodySchema,
  loginBodySchema,
  googleLoginBodySchema,
  updateProfileBodySchema,
} from "./auth.schema";

// ponytail: auth core controller. password reset sub-flow delegated to passwordController.
export const authController = new Elysia({ prefix: "/api/auth" })
  .use(authPlugin)
  .use(passwordController)
  .post("/register", async ({ body, set }) => {
    try {
      const user = await AuthService.register(body.name, body.email, body.password);
      set.status = 201;
      return successResponse(
        {
          user: { id: user.id, email: user.email, name: user.name, isVerified: user.isVerified },
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
  }, { body: registerBodySchema, detail: { tags: ["Auth"], summary: "Register new user" } })
  .post("/verify-email", async ({ body, jwt, set }) => {
    try {
      const user = await AuthService.verifyEmail(body.email, body.code);
      const token = await jwt.sign({ id: user.id, email: user.email, name: user.name });
      return successResponse({ user, token }, "Email berhasil diverifikasi");
    } catch (err: any) {
      set.status = 400;
      return errorResponse(err.message || "Verifikasi email gagal");
    }
  }, { body: verifyEmailBodySchema, detail: { tags: ["Auth"], summary: "Verify email with 6-digit OTP" } })
  .post("/resend-verification", async ({ body, set }) => {
    try {
      const result = await AuthService.resendVerificationOtp(body.email);
      return successResponse(result, result.message);
    } catch (err: any) {
      set.status = 400;
      return errorResponse(err.message || "Gagal mengirim ulang kode verifikasi");
    }
  }, { body: resendVerificationBodySchema, detail: { tags: ["Auth"], summary: "Resend verification OTP code" } })
  .post("/login", async ({ body, jwt, set }) => {
    const user = await AuthService.verifyCredentials(body.email, body.password);
    if (!user) {
      set.status = 401;
      return errorResponse("Invalid email or password");
    }
    if (!user.isVerified) {
      set.status = 403;
      return errorResponse(
        "Akun belum aktif. Masukkan kode verifikasi 6-digit yang dikirim ke email Anda.",
        { needVerification: true, email: user.email }
      );
    }
    const token = await jwt.sign({ id: user.id, email: user.email, name: user.name });
    return successResponse({ user, token }, "Login successful");
  }, { body: loginBodySchema, detail: { tags: ["Auth"], summary: "Login user" } })
  .post("/google", async ({ body, jwt, set }) => {
    try {
      const user = await AuthService.loginWithGoogle(body.credential);
      const token = await jwt.sign({ id: user.id, email: user.email, name: user.name });
      return successResponse({ user, token }, "Google Login successful");
    } catch (err: any) {
      set.status = 401;
      return errorResponse(err.message || "Google Login failed");
    }
  }, { body: googleLoginBodySchema, detail: { tags: ["Auth"], summary: "Login with Google" } })
  .get("/me", async ({ user, set }) => {
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
  }, { detail: { tags: ["Auth"], summary: "Get current user profile" } })
  .patch("/profile", async ({ user, body, set }) => {
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
  }, { body: updateProfileBodySchema, detail: { tags: ["Auth"], summary: "Update user profile" } });
