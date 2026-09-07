import { Elysia } from "elysia";
import { AuthService } from "../services/auth.service";
import { successResponse, errorResponse } from "../utils/response";
import { forgotPasswordBodySchema, resetPasswordBodySchema } from "./auth.schema";

export const passwordController = new Elysia()
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
      body: forgotPasswordBodySchema,
      detail: { tags: ["Auth"], summary: "Request password reset verification code" },
    }
  )
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
      body: resetPasswordBodySchema,
      detail: { tags: ["Auth"], summary: "Reset password using verification code" },
    }
  );
